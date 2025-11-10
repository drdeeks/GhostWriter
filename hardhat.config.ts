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

const config: HardhatUserConfig & { etherscan?: any; gasReporter?: any; sourcify?: any } = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  sourcify: {
    enabled: true,
    apiUrl: "https://sourcify-api-monad.blockvision.org",
    browserUrl: "https://testnet.monadexplorer.com",
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
    // Monad Testnet
    monadTestnet: {
      url: process.env.MONAD_TESTNET_RPC_URL || "https://testnet-rpc.monad.xyz",
      accounts: accounts,
      chainId: 10143,
      gasPrice: 20000000000, // 20 gwei
      gas: 8000000, // Gas limit
      timeout: 60000, // 60 second timeout
    },
    // Monad Mainnet
    monad: {
      url: process.env.MONAD_RPC_URL || "https://rpc.monad.xyz",
      accounts: accounts,
      chainId: 143,
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
      monad: process.env.MONAD_EXPLORER_API_KEY || "",
      monadTestnet: process.env.MONAD_EXPLORER_API_KEY || "",
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
        network: "monad",
        chainId: 143,
        urls: {
          apiURL: "https://explorer.monad.xyz/api",
          browserURL: "https://explorer.monad.xyz",
        },
      },
      {
        network: "monadTestnet",
        chainId: 10143,
        urls: {
          apiURL: "https://testnet.monadexplorer.com/api",
          browserURL: "https://testnet.monadexplorer.com",
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
