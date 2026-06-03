# 🔐 Ghost Writer Keystore Management & Deployment

This directory contains encrypted keystore files for secure contract deployment and management. Keystores provide enhanced security by encrypting private keys with a password.

## 📚 Table of Contents
- [Keystore Basics](#-keystore-basics)
- [Keystore Management](#-keystore-management)
- [Deployment Guide](#-deployment-guide)
  - [Base Sepolia (Testnet)](#base-sepolia-testnet)
  - [Base Mainnet](#base-mainnet)
  - [Monad Testnet](#monad-testnet)
  - [Monad Mainnet (Chain 143)](#monad-mainnet-chain-143)
- [Security Best Practices](#-security-best-practices)
- [Troubleshooting](#-troubleshooting)

---

## 🔐 Keystore Basics

Keystores are JSON files that securely store encrypted private keys. They require a password to decrypt and use the key.

**Advantages over raw private keys:**
- ✅ Encrypted at rest
- ✅ Password-protected
- ✅ Prevent accidental exposure
- ✅ Enable secure key rotation
- ✅ Support multiple deployment identities

**File format:**
```json
{
  "address": "0x...",
  "crypto": {
    "cipher": "aes-128-ctr",
    "ciphertext": "...",
    "cipherparams": {"iv": "..."},
    "kdf": "scrypt",
    "kdfparams": {
      "dklen": 32,
      "n": 262144,
      "p": 1,
      "r": 8,
      "salt": "..."
    },
    "mac": "..."
  },
  "id": "...",
  "version": 3
}
```

---

## 🔑 Keystore Management

### Create New Keystore
```bash
node scripts/keystore-manager.js create
```
**Steps:**
1. Enter private key (with or without 0x prefix)
2. Name your keystore (e.g., "mainnet-deployer")
3. Set a strong password (minimum 16 characters recommended)
4. Confirm password

### Import Existing Keystore
```bash
node scripts/keystore-manager.js import
```
**Steps:**
1. Enter path to existing keystore file
2. Enter password to verify
3. Set new name for imported keystore

### List Available Keystores
```bash
node scripts/keystore-manager.js list
```
**Output:**
- Keystore filename
- File path
- Creation date

### Test Keystore Decryption
```bash
node scripts/keystore-manager.js test
```
**Steps:**
1. Enter keystore path
2. Enter password
3. Verifies decryption and displays address

---

## 🚀 Deployment Guide

### Environment Setup
1. Create `.env` file from template:
```bash
cp env.example .env
```

2. Configure keystore in `.env`:
```ini
# Keystore configuration
KEYSTORE_PATH=./keystores/mainnet-deployer.json
KEYSTORE_PASSWORD=your_strong_password_here

# Network configuration
NEXT_PUBLIC_CHAIN_ID=8453  # Change based on target network
```

### Base Sepolia (Testnet)
```bash
# Deploy contracts
npm run deploy:baseSepolia

# Register story template signer (CRITICAL)
npx hardhat run scripts/set-signer.js --network baseSepolia
```

### Base Mainnet
```bash
# Deploy contracts
npm run deploy:base

# Register story template signer (CRITICAL)
npx hardhat run scripts/set-signer.js --network base
```

### Monad Testnet
```bash
# Deploy contracts
npm run deploy:monadTestnet

# Register story template signer (CRITICAL)
npx hardhat run scripts/set-signer.js --network monadTestnet
```

### Monad Mainnet (Chain 143)
```bash
# Deploy contracts
npm run deploy:monad

# Register story template signer (CRITICAL)
npx hardhat run scripts/set-signer.js --network monad
```

**Monad Network Configuration:**
- Chain ID: `143`
- RPC URL: `https://rpc.monad.xyz`
- Explorer: `https://explorer.monad.xyz`
- Faucet: N/A (Mainnet)

**Monad Deployment Notes:**
1. Ensure your keystore account has sufficient MONAD tokens for gas
2. Monad uses EVM-compatible tooling (Hardhat, ethers.js)
3. Contract verification may require Monad-specific API keys
4. Network parameters are already configured in `hardhat.config.js`:
```javascript
monad: {
  url: "https://rpc.monad.xyz",
  accounts: accounts,
  chainId: 143,
}
```

---

## 🔒 Security Best Practices

### Keystore Security
1. **Never commit keystore files** - They're already in `.gitignore`
2. **Use strong passwords** - Minimum 16 characters with:
   - Uppercase letters
   - Lowercase letters
   - Numbers
   - Special characters
3. **Store passwords securely** - Use a password manager or secure vault
4. **Rotate keys periodically** - Especially after sensitive operations
5. **Backup keystores** - Store encrypted backups in secure locations
6. **Limit access** - Restrict keystore file permissions (`chmod 600 *.json`)

### Deployment Security
1. **Use separate keys** for different environments:
   - Testnet deployer
   - Mainnet deployer
   - Story template signer
2. **Never reuse keys** across different projects
3. **Monitor deployments** - Track contract deployments and transactions
4. **Verify contracts** - Always verify contracts on block explorers
5. **Use multisig** for production deployments when possible

### Network-Specific Security
| Network       | Chain ID | Security Considerations                          |
|---------------|----------|--------------------------------------------------|
| Base Sepolia  | 84532    | Use testnet funds only                          |
| Base Mainnet  | 8453     | High-value transactions, use hardware wallets   |
| Monad Testnet | 10143    | Use testnet funds only                          |
| Monad Mainnet | 143      | High-value transactions, use hardware wallets   |

---

## 🛠 Troubleshooting

### Keystore Issues
| Error                          | Solution                                                                 |
|--------------------------------|--------------------------------------------------------------------------|
| Invalid keystore password      | Double-check password (case-sensitive), verify keystore file path       |
| Keystore file not found        | Verify `KEYSTORE_PATH` in `.env`, check file exists in specified location |
| Invalid account                | Ensure keystore contains valid private key, verify network configuration |
| Decryption failed              | Verify password, check keystore file integrity                          |

### Deployment Issues
| Error                          | Solution                                                                 |
| Insufficient funds             | Get testnet ETH from faucet or fund mainnet account                     |
| Gas required exceeds allowance | Increase account balance, check gas price settings                      |
| Network connection failed      | Verify RPC URL, check internet connection, test with `curl`             |
| Contract verification failed   | Ensure `BASESCAN_API_KEY` is set, wait a minute before verifying        |
| Invalid private key            | Verify keystore contains valid key, check key format (64 hex chars)     |

### Monad-Specific Issues
| Error                          | Solution                                                                 |
| Invalid chain ID               | Ensure `NEXT_PUBLIC_CHAIN_ID=143` for Monad mainnet                    |
| RPC connection refused         | Verify Monad RPC URL, check network status at https://status.monad.xyz |
| Gas estimation failed          | Check account balance, verify contract code, try manual gas limits      |
| Transaction reverted            | Check contract logic, verify constructor parameters, test on testnet   |

### Common Solutions
1. **Reset deployment state:**
```bash
rm -rf artifacts/ cache/ deployment.json
```

2. **Clean install dependencies:**
```bash
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
```

3. **Verify network configuration:**
```bash
npx hardhat console --network monad
> await ethers.provider.getNetwork()
```

---

## 📋 Deployment Checklist

### Pre-Deployment
- [ ] Keystore created/imported and tested
- [ ] `.env` file configured with keystore path and password
- [ ] Network selected (Base Sepolia, Base Mainnet, Monad Testnet, Monad Mainnet)
- [ ] Account funded with sufficient native tokens (ETH for Base, MONAD for Monad)
- [ ] OnchainKit project ID and API key configured
- [ ] Story template signer private key configured (or ready for auto-generation)

### Deployment
- [ ] Contracts deployed successfully
- [ ] Contract addresses saved to `.env` and `deployment.json`
- [ ] Story template signer registered on-chain
- [ ] Keystore password and auto-generated keys securely saved
- [ ] Contracts verified on block explorer

### Post-Deployment
- [ ] Application tested on target network
- [ ] Admin dashboard accessible
- [ ] Story creation functionality verified
- [ ] NFT minting functionality verified
- [ ] Keystore backups securely stored
- [ ] Deployment documentation updated

---

## 🔄 Keystore Rotation Procedure

1. **Create new keystore** for the role (deployer, signer, etc.)
2. **Fund the new account** with native tokens for gas
3. **Update `.env`** with new keystore path and password
4. **Test the new keystore** with a small deployment or transaction
5. **Migrate critical functions** to the new keystore:
   - Update contract ownership
   - Update admin roles
   - Update signer addresses
6. **Securely archive** the old keystore
7. **Update documentation** with new keystore information
8. **Monitor** the new keystore for any issues

---

## 📞 Support

For additional help:
- Monad Documentation: https://docs.monad.xyz
- Base Documentation: https://docs.base.org
- Hardhat Documentation: https://hardhat.org/docs
- OpenZeppelin Documentation: https://docs.openzeppelin.com

**Note:** Always test deployments on testnet before deploying to mainnet!