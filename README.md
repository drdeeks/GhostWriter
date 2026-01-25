# 👻 Ghost Writer - AI-Powered Community Storytelling NFT Game

Ghost Writer is a collaborative storytelling game on the Base blockchain where players contribute words to AI-generated stories. Each contribution mints a unique NFT, turning every word into a collectible piece of a community-created narrative.

**Version**: 2.0.0 | **Status**: ✅ Ready for Testnet

---

## ✨ What is This?

Ghost Writer blends creative writing with blockchain technology to create a unique gamified experience.

- **AI-Powered Storytelling**: At its core, Ghost Writer uses AI (specifically `gpt-4o-mini`) to dynamically generate "Mad Libs" style story templates. This ensures a constant stream of new and engaging narratives.
- **Community-Driven Content**: Stories are not written by a single person but are completed by the community. Each player contributes a word to fill in the blanks, collectively bringing the story to life.
- **NFTs as Contributions**: Every word contributed is minted as an NFT on the Base blockchain. This gives players true ownership of their contributions and creates a novel way to engage with and collect digital art.
- **Gamification**: The platform includes leaderboards, achievements, and a credit system to reward active participants.
- **Enterprise-Ready**: Built with a focus on security and performance, Ghost Writer includes features like a pull-over-push refund pattern, batch processing for large stories, and comprehensive test coverage.

---

## 🚀 Dev Quickstart

Get your local development environment up and running in a few minutes.

**Prerequisites:**
- [Node.js](https://nodejs.org/en) (v18 or higher)
- [Foundry](https://getfoundry.sh/) for smart contract development
- A Web3 wallet (e.g., MetaMask, Coinbase Wallet)

**1. Clone & Install**
```bash
git clone https://github.com/drdeeks/GhostWriter.git
cd GhostWriter
npm install --legacy-peer-deps
```

**2. Environment Setup**
Copy the example environment file and fill in the required variables.
```bash
cp env.example .env
```
You will need to provide:
- `PRIVATE_KEY`: Your wallet's private key for deploying contracts.
- `NEXT_PUBLIC_ONCHAINKIT_PROJECT_ID`: Your WalletConnect project ID.
- `OPENAI_API_KEY`: (Optional) For enabling AI features.

**3. Deploy Contracts**
Deploy the smart contracts to a local network or testnet.
```bash
# Start a local Hardhat node
npm run node

# In a new terminal, deploy the contracts
npm run deploy:localhost
```

**4. Run the Application**
```bash
npm run dev
```
The application will be available at `http://localhost:3000`.

---

## 🏗️ Key Files & Directories

Here is a high-level overview of the repository structure:

```
/
├── contracts/          # Solidity smart contracts
│   ├── StoryManager.sol  # Core game logic
│   └── GhostWriterNFT.sol # NFT contract
├── src/
│   ├── app/              # Next.js application
│   │   ├── api/          # API routes (AI, NFT metadata)
│   │   └── page.tsx      # Main application page
│   ├── components/       # React components
│   └── lib/              # Core libraries (AI service, utils)
├── scripts/            # Deployment and utility scripts
├── test/               # Smart contract tests
└── hardhat.config.js   # Hardhat configuration
```

---

## 🚢 Deployment

### Required Services
- **RPC Provider**: An RPC URL for interacting with the blockchain (e.g., Infura, Alchemy).
- **AI Provider**: An OpenAI API key is required for dynamic story generation and word moderation.
- **WalletConnect**: A Project ID from [WalletConnect Cloud](https://cloud.walletconnect.com/) is needed for wallet connections.

### Testnet (Base Sepolia)
1.  Configure your `.env` file with Base Sepolia RPC URLs and your private key.
2.  Deploy the contracts: `npm run deploy:baseSepolia`
3.  Update your `.env` file with the deployed contract addresses.
4.  Deploy the frontend to a provider like Vercel.

### Mainnet (Base)
The process is the same as for testnet, but using the `npm run deploy:base` command. A security audit is highly recommended before deploying to mainnet.

For a more detailed guide, see [docs/SETUP.md](docs/SETUP.md).

---

## 📖 Deeper Docs

- **[SETUP.md](docs/SETUP.md)**: Detailed instructions for local development and deployment.
- **[ENVIRONMENT.md](docs/ENVIRONMENT.md)**: An explanation of all environment variables.
- **[AI.md](docs/AI.md)**: Information on AI tuning and style control.
- **[MODERATION.md](docs/MODERATION.md)**: Details on word moderation behavior.
- **[NFT_MEDIA.md](docs/NFT_MEDIA.md)**: How NFT metadata and images are generated.
- **[ADMIN.md](docs/ADMIN.md)**: A guide to the admin dashboard and its features.

---

## ⚠️ Common Pitfalls

- **Signer Mismatch**: Ensure the `PRIVATE_KEY` in your `.env` file corresponds to the wallet you are using in your browser.
- **Missing Contract Addresses**: After deploying your contracts, make sure to update the relevant `NEXT_PUBLIC_*` addresses in your `.env` file.
- **Incorrect `chainId` or RPC**: Double-check that your `NEXT_PUBLIC_CHAIN_ID` and RPC URLs in your `.env` file match the network you are targeting.

---

## 🎮 Story Specifications

- **Mini**: ~50 total words in the final story; requires 5–10 user-contributed words.
- **Normal**: ~100 total words; requires 10–15 user-contributed words.
- **Epic**: ~150 total words; requires 15–25 user-contributed words. (Owner-only creation)

---
**Built with 💜 by DrDeeks | Powered by Base 🟪 | Secured by OpenZeppelin 🛡️ | Enhanced by AI 🤖**