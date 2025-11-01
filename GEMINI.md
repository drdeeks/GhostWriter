# Ghost Writer - AI-Guided Mad Libs NFT Game

## Project Overview

**Ghost Writer** is a collaborative storytelling game on the Base Blockchain. Users contribute words to AI-generated Mad Libs-style story templates. Each contribution mints a hidden NFT that is only revealed when the story is completed. The project is a Web3 application with smart contracts written in Solidity, a frontend built with Next.js and React, and it uses Hardhat for development and testing.

The core of the project consists of three smart contracts:

*   **`GhostWriterNFT.sol`**: An ERC-721 contract that manages the minting and revealing of the NFTs.
*   **`StoryManager.sol`**: The main game logic contract that handles story creation, word contributions, and user stats.
*   **`LiquidityPool.sol`**: A contract that collects and manages the fees from the game.

The project also includes a Farcaster Mini App integration.

## Building and Running

### Prerequisites

*   Node.js 18+
*   `pnpm` package manager

### Installation

1.  Install dependencies:
    ```bash
    pnpm install
    ```

2.  Set up environment variables:
    ```bash
    cp .env.example .env
    ```
    Then, edit the `.env` file with your configuration.

### Key Commands

*   **Compile Contracts:**
    ```bash
    pnpm compile
    ```

*   **Run Tests:**
    ```bash
    pnpm test
    ```

*   **Run Development Server:**
    ```bash
    pnpm dev
    ```

*   **Deploy Contracts:**
    The deployment script in `scripts/deploy.ts` supports two methods:
    1.  **Private Key:** Set the `PRIVATE_KEY` in the `.env` file.
    2.  **Keystore:** Set the `KEYSTORE_PATH` in the `.env` file. You will be prompted for the password when you run the deployment script.

    To deploy to the Base Sepolia testnet:
    ```bash
    pnpm deploy:baseSepolia
    ```

*   **Verify Contracts:**
    ```bash
    pnpm verify
    ```

## Development Conventions

*   **Smart Contracts:**
    *   The contracts are written in Solidity and follow the standards of OpenZeppelin contracts.
    *   Security is a key consideration, with features like `ReentrancyGuard` and `Ownable` being used.
    *   Tests are written using Hardhat and Chai and are located in the `test/` directory.

*   **Frontend:**
    *   The frontend is a Next.js application.
    *   Components are located in `src/components/`.
    *   Custom hooks for contract interaction are in `src/hooks/`.

*   **General:**
    *   The project uses `pnpm` as its package manager.
    *   Environment variables are managed in a `.env` file.
    *   Deployment scripts are located in the `scripts/` directory.
