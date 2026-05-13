# 👻 Ghost Writer: Community Storytelling Game

Ghost Writer is an innovative, collaborative storytelling game where players contribute words to community-driven stories, minting unique NFT artifacts that evolve from hidden placeholders to revealed syntactic nodes upon story completion.

## 🚀 Vision
Ghost Writer is built for the next generation of onchain social interaction. It is a high-performance community engine designed for elegant, collaborative creativity.

## 🏗️ Protocol Infrastructure

### System Components
- **StoryManager**: The central narrative engine and game loop orchestrator.
- **NFT Core**: Dynamic SVG generation with EIP-4906 auto-reveal signals.
- **Liquidity Node**: Secure vault for protocol fees and automated refunds.
- **System Terminal**: A tactical admin dashboard for governance and monitoring.

### Active Deployments
| Component | Chain A | Chain B |
|-----------|-------------------|-------------------|
| **StoryManager** | `0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9` | `0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9` |
| **NFT Core** | `0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9` | `0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9` |
| **Liquidity Node** | `0x5FbDB2315678afecb367f032d93F642f64180aa3` | `0x5FbDB2315678afecb367f032d93F642f64180aa3` |

## 🛡️ Governance & Security
- **Immutable Hierarchy**: On-chain Admin and Co-Admin roles for decentralized oversight.
- **Whitelisting**: Automated "Free Access" protocol for partners and early adopters.
- **EIP-712 Verification**: Cryptographic story template signing via dedicated server nodes.
- **Pull-over-Push**: Secure transaction patterns to prevent gas griefing and DoS attacks.

## 🎭 The Artifact Cycle
1. **Hidden Phase**: Contributor mints a locked artifact. Displays user identity (Farcaster name or address) and narrative placement (e.g., `Node 4/10`).
2. **Revealed Phase**: On story completion, the contract triggers an automatic metadata flip. Artifact reveals the contributed word and completion timestamp.

## 🛠️ Developer Setup
```bash
# Clone & Install
git clone https://github.com/drdeeks/GhostWriter.git && cd GhostWriter
npm install --legacy-peer-deps

# Deployment
npm run deploy:baseSepolia
npm run deploy:monadTestnet

# Verification
npm run verify
```

## 🧪 The Tasting Suite
GhostWriter includes a rigorous and humorous testing suite. Run it to ensure your implementation has "high taste."
```bash
npm run taste
```

## 📜 Community Note
Ghost Writer is designed to thrive wherever high-performance, community-driven narratives are built.