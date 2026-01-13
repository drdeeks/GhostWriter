const readline = require('readline');
const { execSync } = require('child_process');
require('dotenv').config();

async function getInput(prompt) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

async function getPassword(prompt) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    process.stdout.write(prompt);
    
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

async function main() {
  console.log('🚀 Ghost Writer Deployment Helper\n');
  
  const network = process.argv[2];
  
  if (!network) {
    console.log('❌ Please specify a network:');
    console.log('   npm run deploy:baseSepolia');
    console.log('   npm run deploy:base');
    console.log('   npm run deploy:monadTestnet');
    console.log('   npm run deploy:monad');
    console.log('   npm run deploy:modeSepolia');
    console.log('   npm run deploy:mode');
    process.exit(1);
  }
  
  console.log(`📡 Deploying to: ${network}\n`);
  
  // Check if keystore or private key is configured
  const hasPrivateKey = process.env.PRIVATE_KEY;
  const hasKeystorePath = process.env.KEYSTORE_PATH;
  const hasKeystorePassword = process.env.KEYSTORE_PASSWORD;
  
  let keystorePassword = null;
  
  if (!hasPrivateKey && !hasKeystorePath) {
    console.log('⚠️  No wallet configuration found!');
    console.log('');
    console.log('Options:');
    console.log('1. Add PRIVATE_KEY to .env');
    console.log('2. Create keystore: node scripts/keystore-manager.js create');
    console.log('3. Import keystore: node scripts/keystore-manager.js import');
    console.log('');
    
    const choice = await getInput('Continue anyway? (y/N): ');
    if (choice.toLowerCase() !== 'y') {
      console.log('Deployment cancelled');
      process.exit(0);
    }
  } else if (hasKeystorePath && !hasKeystorePassword) {
    console.log('🔐 Keystore found, password required');
    keystorePassword = await getPassword('Enter keystore password: ');
  }
  
  // Show network info
  const networkInfo = {
    baseSepolia: { name: 'Base Sepolia Testnet', faucet: 'https://www.base.org/faucet' },
    base: { name: 'Base Mainnet', faucet: 'N/A (Mainnet)' },
    monadTestnet: { name: 'Monad Testnet', faucet: 'https://testnet.monad.xyz/faucet' },
    monad: { name: 'Monad Mainnet', faucet: 'N/A (Mainnet)' },
    modeSepolia: { name: 'Mode Sepolia Testnet', faucet: 'https://sepolia.mode.network/faucet' },
    mode: { name: 'Mode Mainnet', faucet: 'N/A (Mainnet)' }
  };
  
  const info = networkInfo[network];
  if (info) {
    console.log(`🌐 Network: ${info.name}`);
    console.log(`💧 Faucet: ${info.faucet}`);
    console.log('');
  }
  
  const proceed = await getInput('Proceed with deployment? (Y/n): ');
  if (proceed.toLowerCase() === 'n') {
    console.log('Deployment cancelled');
    process.exit(0);
  }
  
  try {
    console.log('🚀 Starting deployment...\n');
    const env = { ...process.env, HARDHAT_NETWORK: network };
    
    // Add keystore password to environment if provided
    if (keystorePassword) {
      env.KEYSTORE_PASSWORD = keystorePassword;
    }
    
    execSync(`hardhat run scripts/deploy.js --network ${network}`, { 
      stdio: 'inherit',
      env
    });
  } catch (error) {
    console.error('❌ Deployment failed:', error.message);
    process.exit(1);
  }
}

main().catch(console.error);
