import type { HardhatUserConfig } from "hardhat/config";
require("@nomicfoundation/hardhat-toolbox");
require("@nomicfoundation/hardhat-ethers");
const dotenv = require("dotenv");
const fs = require("fs");
const { Wallet } = require("ethers");

dotenv.config();

function getDeployerAccounts() {
  if (process.env.PRIVATE_KEY) {
    return [process.env.PRIVATE_KEY];
  }
  if (process.env.KEYSTORE_PATH && process.env.KEYSTORE_PASSWORD) {
    const keystore = fs.readFileSync(process.env.KEYSTORE_PATH, "utf8");
    const wallet = Wallet.fromEncryptedJsonSync(keystore, process.env.KEYSTORE_PASSWORD);
    return [wallet.privateKey];
  }
  return [];
}

const accounts = getDeployerAccounts();

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    // Base Mainnet
    base: {
      url: process.env.BASE_RPC_URL || "https://mainnet.base.org",
      accounts: accounts,
      chainId: 8453,
    },
    // Base Sepolia Testnet
    baseSepolia: {
      url: process.env.BASE_SEPOLIA_RPC_URL || "https://sepolia.base.org",
      accounts: accounts,
      chainId: 84532,
    },
    // Mode Mainnet
    mode: {
      url: process.env.MODE_RPC_URL || "https://mainnet.mode.network",
      accounts: accounts,
      chainId: 34443,
    },
    // Mode Sepolia Testnet
    modeSepolia: {
      url: process.env.MODE_SEPOLIA_RPC_URL || "https://sepolia.mode.network",
      accounts: accounts,
      chainId: 919,
    },
    // Localhost for testing
    localhost: {
      url: "http://127.0.0.1:8545",
    },
    hardhat: {
      chainId: 31337,
    },
  },
  etherscan: {
    apiKey: {
      base: process.env.BASESCAN_API_KEY || "",
      baseSepolia: process.env.BASESCAN_API_KEY || "",
      mode: process.env.MODESCAN_API_KEY || "",
      modeSepolia: process.env.MODESCAN_API_KEY || "",
    },
    customChains: [
      {
        network: "base",
        chainId: 8453,
        urls: {
          apiURL: "https://api.basescan.org/api",
          browserURL: "https://basescan.org",
        },
      },
      {
        network: "baseSepolia",
        chainId: 84532,
        urls: {
          apiURL: "https://api-sepolia.basescan.org/api",
          browserURL: "https://sepolia.basescan.org",
        },
      },
      {
        network: "mode",
        chainId: 34443,
        urls: {
          apiURL: "https://explorer.mode.network/api",
          browserURL: "https://explorer.mode.network",
        },
      },
      {
        network: "modeSepolia",
        chainId: 919,
        urls: {
          apiURL: "https://sepolia.explorer.mode.network/api",
          browserURL: "https://sepolia.explorer.mode.network",
        },
      },
    ],
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS === "true",
    currency: "USD",
    coinmarketcap: process.env.COINMARKETCAP_API_KEY,
  },
};

module.exports = config;
