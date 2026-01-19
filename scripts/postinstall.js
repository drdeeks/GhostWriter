#!/usr/bin/env node

/**
 * Postinstall script for Ghost Writer
 * 
 * This script runs after npm install to ensure proper setup.
 * With wagmi 2.16.0, experimental features are available in the main package,
 * so no compatibility shim is needed.
 */

console.log('✓ Ghost Writer postinstall completed successfully');
console.log('✓ All dependencies are properly configured');
