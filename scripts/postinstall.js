#!/usr/bin/env node

/**
 * Postinstall script to create wagmi/experimental compatibility shim
 * 
 * This script creates a compatibility layer for @coinbase/onchainkit which
 * expects wagmi/experimental exports, but wagmi v3 exports these from
 * the main package instead.
 */

const fs = require('fs');
const path = require('path');

const WAGMI_DIR = path.join(__dirname, '..', 'node_modules', 'wagmi');
const EXPERIMENTAL_DIR = path.join(WAGMI_DIR, 'experimental');
const WAGMI_PACKAGE_JSON = path.join(WAGMI_DIR, 'package.json');

function createShim() {
  try {
    // Check if wagmi is installed
    if (!fs.existsSync(WAGMI_DIR)) {
      console.log('⚠️  wagmi not found, skipping shim creation');
      return;
    }

    // Create experimental directory
    if (!fs.existsSync(EXPERIMENTAL_DIR)) {
      fs.mkdirSync(EXPERIMENTAL_DIR, { recursive: true });
      console.log('✓ Created wagmi/experimental directory');
    }

    // Create package.json for experimental subpath
    const experimentalPackageJson = {
      type: 'module',
      main: './index.js',
      types: './index.d.ts',
      exports: {
        '.': {
          types: './index.d.ts',
          default: './index.js'
        }
      }
    };

    fs.writeFileSync(
      path.join(EXPERIMENTAL_DIR, 'package.json'),
      JSON.stringify(experimentalPackageJson, null, 2) + '\n'
    );

    // Create index.js shim
    const indexJs = `/**
 * Compatibility shim for wagmi/experimental
 * Re-exports experimental hooks from main wagmi package (v3)
 */
export {
  useSendCalls,
  useCallsStatus,
  useCapabilities,
  useShowCallsStatus,
} from '../dist/esm/exports/index.js';
`;

    fs.writeFileSync(path.join(EXPERIMENTAL_DIR, 'index.js'), indexJs);

    // Create index.d.ts shim
    const indexDts = `/**
 * Compatibility shim for wagmi/experimental
 * Re-exports experimental hooks from main wagmi package (v3)
 */
export {
  useSendCalls,
  type UseSendCallsParameters,
  type UseSendCallsReturnType,
  useCallsStatus,
  type UseCallsStatusParameters,
  type UseCallsStatusReturnType,
  useCapabilities,
  type UseCapabilitiesParameters,
  type UseCapabilitiesReturnType,
  useShowCallsStatus,
  type UseShowCallsStatusParameters,
  type UseShowCallsStatusReturnType,
} from '../dist/types/exports/index.js';
`;

    fs.writeFileSync(path.join(EXPERIMENTAL_DIR, 'index.d.ts'), indexDts);

    // Update wagmi package.json to include experimental export
    if (fs.existsSync(WAGMI_PACKAGE_JSON)) {
      const wagmiPackage = JSON.parse(fs.readFileSync(WAGMI_PACKAGE_JSON, 'utf8'));
      
      // Only add if not already present
      if (!wagmiPackage.exports || !wagmiPackage.exports['./experimental']) {
        if (!wagmiPackage.exports) {
          wagmiPackage.exports = {};
        }
        
        // Insert before package.json export to maintain order
        const newExports = {};
        Object.keys(wagmiPackage.exports).forEach(key => {
          if (key === './package.json') {
            newExports['./experimental'] = {
              types: './experimental/index.d.ts',
              default: './experimental/index.js'
            };
          }
          newExports[key] = wagmiPackage.exports[key];
        });
        
        // If package.json wasn't found, just append
        if (!newExports['./experimental']) {
          newExports['./experimental'] = {
            types: './experimental/index.d.ts',
            default: './experimental/index.js'
          };
        }
        
        wagmiPackage.exports = newExports;
        
        fs.writeFileSync(
          WAGMI_PACKAGE_JSON,
          JSON.stringify(wagmiPackage, null, 2) + '\n'
        );
        console.log('✓ Updated wagmi package.json with experimental export');
      } else {
        console.log('✓ wagmi package.json already has experimental export');
      }
    }

    console.log('✓ wagmi/experimental shim created successfully');
  } catch (error) {
    console.error('❌ Error creating wagmi/experimental shim:', error.message);
    process.exit(1);
  }
}

// Run the script
createShim();
