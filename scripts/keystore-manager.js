#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const readline = require('readline');
const { Wallet } = require('ethers');

class KeystoreManager {
  constructor() {
    this.keystoreDir = path.join(process.cwd(), 'keystores');
    this.ensureKeystoreDir();
  }

  ensureKeystoreDir() {
    if (!fs.existsSync(this.keystoreDir)) {
      fs.mkdirSync(this.keystoreDir, { recursive: true });
    }
  }

  async getInput(prompt, hidden = false) {
    return new Promise((resolve) => {
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      if (hidden && process.stdin.isTTY) {
        process.stdout.write(prompt);
        process.stdin.setRawMode(true);
        
        let input = '';
        
        process.stdin.on('data', (char) => {
          char = char.toString();
          
          if (char === '\n' || char === '\r' || char === '\u0004') {
            process.stdin.setRawMode(false);
            rl.close();
            console.log();
            resolve(input);
          } else if (char === '\u0003') {
            process.exit(1);
          } else if (char === '\u007f') {
            if (input.length > 0) {
              input = input.slice(0, -1);
              process.stdout.write('\b \b');
            }
          } else {
            input += char;
            process.stdout.write('*');
          }
        });
      } else {
        rl.question(prompt, (answer) => {
          rl.close();
          resolve(answer);
        });
      }
    });
  }

  normalizePrivateKey(key) {
    key = key.trim();
    return key.startsWith('0x') ? key : '0x' + key;
  }

  validatePrivateKey(key) {
    const normalized = this.normalizePrivateKey(key);
    if (normalized.length !== 66) {
      throw new Error('Invalid private key length (must be 64 hex characters)');
    }
    
    if (!/^0x[0-9a-fA-F]{64}$/.test(normalized)) {
      throw new Error('Invalid private key format (must be hex)');
    }
    
    return normalized;
  }

  async createKeystore() {
    console.log('🔐 Create New Keystore\n');
    
    try {
      const privateKey = await this.getInput('Enter private key (with or without 0x): ', true);
      const validatedKey = this.validatePrivateKey(privateKey);
      
      const keystoreName = await this.getInput('Enter keystore name (e.g., "mainnet-deployer"): ');
      if (!keystoreName.trim()) {
        throw new Error('Keystore name cannot be empty');
      }
      
      const password = await this.getInput('Enter password for keystore: ', true);
      
      const confirmPassword = await this.getInput('Confirm password: ', true);
      if (password !== confirmPassword) {
        throw new Error('Passwords do not match');
      }
      
      // Create wallet and encrypt
      const wallet = new Wallet(validatedKey);
      const encryptedJson = await wallet.encrypt(password);
      
      // Save keystore
      const filename = `${keystoreName.replace(/[^a-zA-Z0-9-_]/g, '-')}.json`;
      const filepath = path.join(this.keystoreDir, filename);
      
      if (fs.existsSync(filepath)) {
        const overwrite = await this.getInput(`Keystore "${filename}" exists. Overwrite? (y/N): `);
        if (overwrite.toLowerCase() !== 'y') {
          console.log('Operation cancelled');
          return;
        }
      }
      
      fs.writeFileSync(filepath, encryptedJson);
      
      console.log(`\n✅ Keystore created successfully!`);
      console.log(`📁 File: ./keystores/${filename}`);
      console.log(`📍 Address: ${wallet.address}`);
      
    } catch (error) {
      console.error(`❌ Error: ${error.message}`);
      process.exit(1);
    }
  }

  async importKeystore() {
    console.log('📥 Import Existing Keystore\n');
    
    try {
      const keystorePath = await this.getInput('Enter path to existing keystore file: ');
      
      if (!fs.existsSync(keystorePath)) {
        throw new Error('Keystore file not found');
      }
      
      const keystoreContent = fs.readFileSync(keystorePath, 'utf8');
      
      // Validate it's a valid keystore
      try {
        JSON.parse(keystoreContent);
      } catch {
        throw new Error('Invalid keystore file format');
      }
      
      const password = await this.getInput('Enter keystore password: ', true);
      
      // Test decryption
      try {
        const wallet = await Wallet.fromEncryptedJson(keystoreContent, password);
        console.log(`✅ Keystore valid! Address: ${wallet.address}`);
      } catch {
        throw new Error('Invalid password or corrupted keystore');
      }
      
      const newName = await this.getInput('Enter new name for imported keystore: ');
      if (!newName.trim()) {
        throw new Error('Keystore name cannot be empty');
      }
      
      // Copy to keystores directory
      const filename = `${newName.replace(/[^a-zA-Z0-9-_]/g, '-')}.json`;
      const newPath = path.join(this.keystoreDir, filename);
      
      if (fs.existsSync(newPath)) {
        const overwrite = await this.getInput(`Keystore "${filename}" exists. Overwrite? (y/N): `);
        if (overwrite.toLowerCase() !== 'y') {
          console.log('Operation cancelled');
          return;
        }
      }
      
      fs.copyFileSync(keystorePath, newPath);
      
      console.log(`\n✅ Keystore imported successfully!`);
      console.log(`📁 File: ./keystores/${filename}`);
      console.log(`📍 Address: ${wallet.address}`);
      
    } catch (error) {
      console.error(`❌ Error: ${error.message}`);
      process.exit(1);
    }
  }

  listKeystores() {
    console.log('📋 Available Keystores\n');
    
    if (!fs.existsSync(this.keystoreDir)) {
      console.log('No keystores directory found');
      return;
    }
    
    const files = fs.readdirSync(this.keystoreDir).filter(f => f.endsWith('.json'));
    
    if (files.length === 0) {
      console.log('No keystores found');
      return;
    }
    
    files.forEach((file, index) => {
      const filepath = path.join(this.keystoreDir, file);
      const stats = fs.statSync(filepath);
      console.log(`${index + 1}. ${file}`);
      console.log(`   📁 ${filepath}`);
      console.log(`   📅 Created: ${stats.birthtime.toLocaleString()}`);
      console.log('');
    });
  }

  async testKeystore() {
    console.log('🧪 Test Keystore\n');
    
    try {
      const keystorePath = await this.getInput('Enter keystore path: ');
      
      if (!fs.existsSync(keystorePath)) {
        throw new Error('Keystore file not found');
      }
      
      const password = await this.getInput('Enter password: ', true);
      
      const keystoreContent = fs.readFileSync(keystorePath, 'utf8');
      const wallet = await Wallet.fromEncryptedJson(keystoreContent, password);
      
      console.log('\n✅ Keystore test successful!');
      console.log(`📍 Address: ${wallet.address}`);
      console.log(`🔑 Public Key: ${wallet.publicKey}`);
      
    } catch (error) {
      console.error(`❌ Test failed: ${error.message}`);
      process.exit(1);
    }
  }

  showHelp() {
    console.log('🔐 Ghost Writer Keystore Manager\n');
    console.log('Usage: node scripts/keystore-manager.js [command]\n');
    console.log('Commands:');
    console.log('  create    Create new keystore from private key');
    console.log('  import    Import existing keystore file');
    console.log('  list      List all available keystores');
    console.log('  test      Test keystore decryption');
    console.log('  help      Show this help message\n');
    console.log('Examples:');
    console.log('  node scripts/keystore-manager.js create');
    console.log('  node scripts/keystore-manager.js import');
    console.log('  node scripts/keystore-manager.js list');
  }
}

async function main() {
  const manager = new KeystoreManager();
  const command = process.argv[2];
  
  switch (command) {
    case 'create':
      await manager.createKeystore();
      break;
    case 'import':
      await manager.importKeystore();
      break;
    case 'list':
      manager.listKeystores();
      break;
    case 'test':
      await manager.testKeystore();
      break;
    case 'help':
    case '--help':
    case '-h':
      manager.showHelp();
      break;
    default:
      if (command) {
        console.log(`❌ Unknown command: ${command}\n`);
      }
      manager.showHelp();
      break;
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = KeystoreManager;
