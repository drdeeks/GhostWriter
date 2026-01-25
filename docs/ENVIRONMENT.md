# Environment Variables Guide

This document provides a comprehensive reference for all the environment variables used in the Ghost Writer application.

## ⚙️ Core Configuration

These variables are essential for the basic operation of the application.

- **`NODE_ENV`**: The application environment. Set to `development` for local development and `production` for live deployments.
- **`NEXT_PUBLIC_CHAIN_ID`**: The chain ID of the target blockchain network.
  - `84532`: Base Sepolia (testnet)
  - `8453`: Base Mainnet (production)
- **`NEXT_PUBLIC_BASE_URL`**: The public URL of the application. For local development, this should be `http://localhost:3000`.

## 🔗 Smart Contract Addresses

These variables hold the addresses of the deployed smart contracts. They are automatically populated after running the deployment scripts.

- **`NEXT_PUBLIC_NFT_CONTRACT_ADDRESS`**: The address of the `GhostWriterNFT.sol` contract.
- **`NEXT_PUBLIC_STORY_MANAGER_ADDRESS`**: The address of the `StoryManager.sol` contract.
- **`NEXT_PUBLIC_LIQUIDITY_POOL_ADDRESS`**: The address of the `LiquidityPool.sol` contract.
- **`NEXT_PUBLIC_PRICE_ORACLE_ADDRESS`**: The address of the `PriceOracle.sol` contract.
- **`NEXT_PUBLIC_TOKEN_ADDRESS`**: The address of the `GhostWriterToken.sol` contract.

## 🖥️ Blockchain & Services

- **`BASE_RPC_URL`**: The RPC endpoint for Base Mainnet.
- **`BASE_SEPOLIA_RPC_URL`**: The RPC endpoint for Base Sepolia.
- **`BASESCAN_API_KEY`**: (Optional) Your Basescan API key, used for contract verification with `npm run verify`.
- **`COINMARKETCAP_API_KEY`**: (Optional) Your CoinMarketCap API key, used by the gas reporter during contract tests.

## 🤖 AI & Farcaster

- **`OPENAI_API_KEY`**: (Optional) Your OpenAI API key. Required for enabling AI-powered story generation and word moderation.
- **`STORY_TEMPLATE_SIGNER_PRIVATE_KEY`**: The private key of the wallet used to sign story template approvals. This is a server-side variable.
- **`STORY_TEMPLATE_SIGNER_ADDRESS`**: The public address corresponding to the signer private key.
- **`NEXT_PUBLIC_FARCASTER_MINIAPP_ID`**: (Optional) The ID for your Farcaster Mini App.

## 튜닝 AI Story Generation (Optional)

You can fine-tune the AI's story generation with the following variables:

- **`OPENAI_MODEL`**: The OpenAI model to use. Defaults to `gpt-4o-mini`.
- **`OPENAI_TEMPERATURE`**: The sampling temperature for the AI model. Defaults to `0.9`.
- **`OPENAI_MAX_TOKENS`**: The maximum number of tokens to generate. Defaults to `700`.
- **`OPENAI_TIMEOUT_MS`**: The timeout in milliseconds for AI requests. Defaults to `10000`.
- **`AI_STORY_SYSTEM_PROMPT_APPEND`**: Additional text to append to the AI's system prompt for global style control.

## 🎨 NFT Customization (Optional)

Customize the appearance of your NFTs with these variables:

- **`NFT_BACKGROUND_BASE_URL_LOCAL`**: The base URL for local NFT background images, served from the `public/` directory.
- **`NFT_BACKGROUND_BASE_URL_REMOTE`**: The base URL for remote NFT background images (e.g., an IPFS gateway or CDN).
- **`NFT_BACKGROUND_CATEGORY_MAP`**: A JSON string mapping story categories to background image filenames (e.g., `'{"adventure": "adventure.png", "fantasy": "fantasy.jpg"}'`). The application will first look for local images, then remote, and finally fall back to the default gradient.

## 🚀 Deployment

- **`PRIVATE_KEY`**: The private key of the wallet used for deploying contracts. **Do not commit this to version control.**
- **`KEYSTORE_PATH`**: The path to your encrypted keystore file.
- **`KEYSTORE_PASSWORD`**: The password for your keystore file. If not provided, you will be prompted for it during deployment.
- **`NEXT_PUBLIC_ONCHAINKIT_PROJECT_ID`**: Your Project ID from [WalletConnect Cloud](https://cloud.walletconnect.com/).
- **`NEXT_PUBLIC_ONCHAINKIT_API_KEY`**: Your API key from [OnchainKit](https://portal.cdp.coinbase.com/).

## 🏳️ Feature Flags

- **`ENABLE_PERFORMANCE_MONITORING`**: Set to `true` to enable Core Web Vitals tracking.
- **`ENABLE_HAPTIC_FEEDBACK`**: Set to `true` to enable haptic feedback on mobile devices.
