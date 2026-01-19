#!/usr/bin/env node

const fs = require('fs');
const crypto = require('crypto');
const readline = require('readline');

// Mask password input
function getPassword(prompt) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    process.stdout.write(prompt);
    
    // Check if we're in a TTY environment
    if (process.stdin.isTTY) {
      process.stdin.setRawMode(true);
      
      let password = '';
      
      process.stdin.on('data', (char) => {
        char = char.toString();
        
        if (char === '\n' || char === '\r' || char === '\u0004') {
          process.stdin.setRawMode(false);
          rl.close();
          console.log();
          resolve(password);
        } else if (char === '\u0003') {
          process.exit(1);
        } else if (char === '\u007f') {
          if (password.length > 0) {
            password = password.slice(0, -1);
            process.stdout.write('\b \b');
          }
        } else {
          password += char;
          process.stdout.write('*');
        }
      });
    } else {
      // Fallback for non-TTY environments
      rl.question('', (answer) => {
        rl.close();
        resolve(answer);
      });
    }
  });
}

// Normalize private key (add 0x if missing)
function normalizePrivateKey(key) {
  key = key.trim();
  return key.startsWith('0x') ? key : '0x' + key;
}

// Create keystore from private key (no password)
function createKeystore(privateKey) {
  const key = Buffer.from(privateKey.slice(2), 'hex');
  const salt = crypto.randomBytes(32);
  const iv = crypto.randomBytes(16);
  
  const derivedKey = crypto.pbkdf2Sync('', salt, 262144, 32, 'sha256');
  const cipher = crypto.createCipheriv('aes-128-ctr', derivedKey.slice(0, 16), iv);
  
  const ciphertext = Buffer.concat([cipher.update(key), cipher.final()]);
  const mac = crypto.createHmac('sha256', derivedKey.slice(16, 32))
    .update(Buffer.concat([derivedKey.slice(16, 32), ciphertext]))
    .digest();

  return {
    version: 3,
    id: crypto.randomUUID(),
    address: crypto.createHash('sha256').update(key).digest('hex').slice(-40),
    crypto: {
      ciphertext: ciphertext.toString('hex'),
      cipherparams: { iv: iv.toString('hex') },
      cipher: 'aes-128-ctr',
      kdf: 'pbkdf2',
      kdfparams: {
        dklen: 32,
        salt: salt.toString('hex'),
        c: 262144,
        prf: 'hmac-sha256'
      },
      mac: mac.toString('hex')
    }
  };
}

async function main() {
  try {
    console.log('🔐 Universal Keystore Creator\n');
    
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    const privateKey = await getPassword('Enter private key (with or without 0x): ');
    
    const normalizedKey = normalizePrivateKey(privateKey);
    
    if (normalizedKey.length !== 66) {
      throw new Error('Invalid private key length');
    }
    
    const keystore = createKeystore(normalizedKey);
    const filename = `keystore-${keystore.id}.json`;
    
    fs.writeFileSync(filename, JSON.stringify(keystore, null, 2));
    
    console.log(`✅ Keystore created: ./${filename}`);
    console.log(`📍 Address: 0x${keystore.address}`);
    
    rl.close();
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
}

main();
