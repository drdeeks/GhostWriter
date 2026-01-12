#!/usr/bin/env node

/**
 * Keystore Management Script for Ghost Writer
 * 
 * Provides secure keystore creation and import functionality
 * for contract deployment without exposing private keys in .env
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { Wallet } = require('ethers');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

function hideInput(prompt) {
  return new Promise((resolve) => {
    process.stdout.write(prompt);
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding('utf8');
    
    let input = '';
    process.stdin.on('data', function(char) {
      char = char + '';
      
      switch (char) {
        case '\n':
        case '\r':
        case '\u0004':
          process.stdin.setRawMode(false);
          process.stdin.pause();
          process.stdout.write('\n');
          resolve(input);
          break;
        case '\u0003':
          process.exit();
          break;
        case '\u007f': // backspace
          if (input.length > 0) {
            input = input.slice(0, -1);
            process.stdout.write('\b \b');
          }
          break;
        default:
          input += char;
          process.stdout.write('*');
          break;
      }
    });
  });
}

async function createKeystore() {
  console.log('\n🔐 Creating New Keystore\n');
  
  try {
    // Generate new wallet
    const wallet = Wallet.createRandom();
    
    console.log('Generated new wallet:');
    console.log(`Address: ${wallet.address}`);
    console.log(`\n⚠️  IMPORTANT: Save this mnemonic phrase securely!`);
    console.log(`Mnemonic: ${wallet.mnemonic.phrase}\n`);
    
    const confirm = await question('Have you saved the mnemonic phrase? (yes/no): ');
    if (confirm.toLowerCase() !== 'yes') {
      console.log('❌ Please save the mnemonic phrase before continuing.');
      process.exit(1);
    }
    
    // Get password for keystore encryption
    const password = await hideInput('Enter password for keystore encryption: ');
    const confirmPassword = await hideInput('Confirm password: ');
    
    if (password !== confirmPassword) {
      console.log('❌ Passwords do not match.');
      process.exit(1);
    }
    
    if (password.length < 8) {
      console.log('❌ Password must be at least 8 characters long.');
      process.exit(1);
    }
    
    // Create encrypted keystore
    console.log('\n🔄 Creating encrypted keystore...');
    const keystore = await wallet.encrypt(password);
    
    // Save keystore file
    const keystorePath = path.join(process.cwd(), 'keystore.json');
    fs.writeFileSync(keystorePath, keystore);
    
    console.log(`✅ Keystore created successfully!`);
    console.log(`📁 Saved to: ${keystorePath}`);
    console.log(`🔑 Address: ${wallet.address}`);
    
    // Update .env file
    updateEnvFile(keystorePath, password);
    
    console.log('\n📋 Next steps:');
    console.log('1. Add testnet ETH to your address');
    console.log('2. Run: npm run deploy:baseSepolia');
    console.log('3. Update contract addresses in .env');
    
  } catch (error) {
    console.error('❌ Error creating keystore:', error.message);
    process.exit(1);
  }
}

async function importKeystore() {
  console.log('\n📥 Import Existing Keystore\n');
  
  try {
    const choice = await question('Import from (1) private key or (2) existing keystore file? (1/2): ');
    
    if (choice === '1') {
      await importFromPrivateKey();
    } else if (choice === '2') {
      await importFromKeystoreFile();
    } else {
      console.log('❌ Invalid choice. Please select 1 or 2.');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Error importing keystore:', error.message);
    process.exit(1);
  }
}

async function importFromPrivateKey() {
  console.log('\n🔑 Import from Private Key\n');
  
  const privateKey = await hideInput('Enter your private key (0x...): ');
  
  if (!privateKey.startsWith('0x') || privateKey.length !== 66) {
    console.log('❌ Invalid private key format. Must be 64 hex characters with 0x prefix.');
    process.exit(1);
  }
  
  try {
    const wallet = new Wallet(privateKey);
    console.log(`\n✅ Wallet loaded successfully!`);
    console.log(`Address: ${wallet.address}`);
    
    const password = await hideInput('Enter password for keystore encryption: ');
    const confirmPassword = await hideInput('Confirm password: ');
    
    if (password !== confirmPassword) {
      console.log('❌ Passwords do not match.');
      process.exit(1);
    }
    
    console.log('\n🔄 Creating encrypted keystore...');
    const keystore = await wallet.encrypt(password);
    
    const keystorePath = path.join(process.cwd(), 'keystore.json');
    fs.writeFileSync(keystorePath, keystore);
    
    console.log(`✅ Keystore imported successfully!`);
    console.log(`📁 Saved to: ${keystorePath}`);
    
    updateEnvFile(keystorePath, password);
    
  } catch (error) {
    console.error('❌ Invalid private key:', error.message);
    process.exit(1);
  }
}

async function importFromKeystoreFile() {
  console.log('\n📁 Import from Keystore File\n');
  
  const filePath = await question('Enter path to keystore file: ');
  
  if (!fs.existsSync(filePath)) {
    console.log('❌ Keystore file not found.');
    process.exit(1);
  }
  
  try {
    const keystoreContent = fs.readFileSync(filePath, 'utf8');
    const password = await hideInput('Enter keystore password: ');
    
    console.log('\n🔄 Decrypting keystore...');
    const wallet = await Wallet.fromEncryptedJson(keystoreContent, password);
    
    console.log(`✅ Keystore decrypted successfully!`);
    console.log(`Address: ${wallet.address}`);
    
    // Copy to project directory
    const newKeystorePath = path.join(process.cwd(), 'keystore.json');
    fs.copyFileSync(filePath, newKeystorePath);
    
    console.log(`📁 Copied to: ${newKeystorePath}`);
    
    updateEnvFile(newKeystorePath, password);
    
  } catch (error) {
    console.error('❌ Failed to decrypt keystore:', error.message);
    process.exit(1);
  }
}

function updateEnvFile(keystorePath, password) {
  const envPath = path.join(process.cwd(), '.env');
  let envContent = '';
  
  // Read existing .env if it exists
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
  }
  
  // Remove existing keystore/private key entries
  envContent = envContent
    .split('\n')
    .filter(line => !line.startsWith('PRIVATE_KEY=') && 
                   !line.startsWith('KEYSTORE_PATH=') && 
                   !line.startsWith('KEYSTORE_PASSWORD='))
    .join('\n');
  
  // Add keystore configuration
  const keystoreConfig = `
# Keystore Configuration (Secure Deployment Method)
KEYSTORE_PATH=${path.relative(process.cwd(), keystorePath)}
KEYSTORE_PASSWORD=${password}

# Note: Remove PRIVATE_KEY if present - using keystore instead
`;
  
  envContent += keystoreConfig;
  
  fs.writeFileSync(envPath, envContent);
  
  console.log('\n✅ Updated .env file with keystore configuration');
  console.log('⚠️  Remember to add .env to .gitignore to keep your password secure!');
}

async function showHelp() {
  console.log(`
🔐 Ghost Writer Keystore Manager

Usage: npm run keystore [command]

Commands:
  create    Create a new keystore with generated wallet
  import    Import existing private key or keystore file
  help      Show this help message

Examples:
  npm run create-keystore     # Create new keystore
  npm run import-keystore     # Import existing wallet

Security Notes:
- Keystores encrypt your private key with a password
- More secure than storing private keys in .env files
- Password is still stored in .env (add .env to .gitignore!)
- For maximum security, use hardware wallets in production

Deployment Methods:
1. Private Key (simple):   PRIVATE_KEY=0x...
2. Keystore (secure):      KEYSTORE_PATH=./keystore.json + KEYSTORE_PASSWORD=...
3. Hardware Wallet (best): Use Ledger/Trezor with Hardhat plugins
`);
}

async function main() {
  const command = process.argv[2];
  
  console.log('👻 Ghost Writer Keystore Manager\n');
  
  switch (command) {
    case 'create':
      await createKeystore();
      break;
    case 'import':
      await importKeystore();
      break;
    case 'help':
    case '--help':
    case '-h':
      await showHelp();
      break;
    default:
      console.log('Available commands: create, import, help');
      console.log('Run with --help for detailed usage information');
      break;
  }
  
  rl.close();
}

// Handle cleanup
process.on('SIGINT', () => {
  console.log('\n\n👋 Goodbye!');
  rl.close();
  process.exit(0);
});

main().catch(console.error);
