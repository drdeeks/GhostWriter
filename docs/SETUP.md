# Setup & Deployment Guide

This guide provides detailed instructions for setting up your local development environment, deploying the smart contracts, and launching the frontend application.

## 🚀 Local Development

Follow these steps to get your local environment up and running.

### 1. Prerequisites

- **Node.js**: v18 or higher. [Download here](https://nodejs.org/).
- **Yarn**: A package manager for JavaScript. [Installation guide](https://classic.yarnpkg.com/en/docs/install).
- **Foundry**: A smart contract development toolchain. [Installation guide](https://getfoundry.sh/).

### 2. Clone the Repository
```bash
git clone https://github.com/drdeeks/GhostWriter.git
cd GhostWriter
```

### 3. Install Dependencies
```bash
npm install --legacy-peer-deps
```
*Note: `--legacy-peer-deps` is required to bypass peer dependency conflicts with some of the project's dependencies.*

### 4. Configure Environment Variables
Copy the example environment file:
```bash
cp env.example .env
```
Then, edit the `.env` file to include the required variables. At a minimum, you will need:
- `PRIVATE_KEY`: The private key of the wallet you will use for deployment.
- `NEXT_PUBLIC_ONCHAINKIT_PROJECT_ID`: Your Project ID from [WalletConnect Cloud](https://cloud.walletconnect.com/).

For a full list of variables, see [ENVIRONMENT.md](ENVIRONMENT.md).

### 5. Run a Local Blockchain
Start a local Hardhat node in a separate terminal:
```bash
npm run node
```
This will start a local blockchain instance on `http://localhost:8545`.

### 6. Deploy Smart Contracts
Deploy the contracts to your local node:
```bash
npm run deploy:localhost
```
After deployment, the script will output the addresses of the deployed contracts. Copy these addresses into your `.env` file:
```
NEXT_PUBLIC_NFT_CONTRACT_ADDRESS=0x...
NEXT_PUBLIC_STORY_MANAGER_ADDRESS=0x...
NEXT_PUBLIC_LIQUIDITY_POOL_ADDRESS=0x...
```

### 7. Run the Application
Start the Next.js development server:
```bash
npm run dev
```
The application will be available at `http://localhost:3000`.

---

## 🚢 Deployment

### Required Services
- **RPC Provider**: A reliable RPC URL for your target network (e.g., from Infura, Alchemy, or a public provider).
- **AI Provider**: An OpenAI API key is necessary for dynamic story generation and moderation.
- **WalletConnect**: A Project ID from [WalletConnect Cloud](https://cloud.walletconnect.com/).

### Testnet (Base Sepolia)
1.  **Configure `.env`**: Set `NEXT_PUBLIC_CHAIN_ID` to `84532` and provide a `BASE_SEPOLIA_RPC_URL`.
2.  **Deploy Contracts**:
    ```bash
    npm run deploy:baseSepolia
    ```
3.  **Update `.env`**: Add the deployed contract addresses to your `.env` file.
4.  **Deploy Frontend**: Deploy the application to your preferred hosting provider (e.g., Vercel, Netlify).

### Mainnet (Base)
The process is identical to the testnet deployment, with the following changes:
1.  **Configure `.env`**: Set `NEXT_PUBLIC_CHAIN_ID` to `8453` and provide a `BASE_RPC_URL`.
2.  **Deploy Contracts**:
    ```bash
    npm run deploy:base
    ```
3.  **Verify Contracts**:
    ```bash
    npm run verify
    ```
    This will verify your contracts on Basescan.
4.  **Deploy Frontend**: Deploy to your production domain.

**A security audit is highly recommended before deploying to a mainnet environment.**
