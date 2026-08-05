require("@nomicfoundation/hardhat-toolbox");
require("@nomicfoundation/hardhat-ethers");
require("@nomicfoundation/hardhat-chai-matchers");
require("@typechain/hardhat");
require("solidity-coverage");
require("hardhat-gas-reporter");
require("@nomicfoundation/hardhat-network-helpers");
require("dotenv").config();

const fs = require("fs");
const { Wallet } = require("ethers");

function getDeployerAccounts() {
  if (process.env.PRIVATE_KEY) {
    return [process.env.PRIVATE_KEY];
  }

  if (process.env.KEYSTORE_PATH && process.env.KEYSTORE_PASSWORD) {
    try {
      const keystore = fs.readFileSync(process.env.KEYSTORE_PATH, "utf8");
      const wallet = Wallet.fromEncryptedJsonSync(keystore, process.env.KEYSTORE_PASSWORD);
      return [wallet.privateKey];
    } catch (error) {
      console.error("Failed to load keystore:", error.message);
      return [];
    }
  }

  return [];
}

const accounts = getDeployerAccounts();

module.exports = {
  solidity: {
    version: "0.8.28",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      evmVersion: "cancun",
    },
  },
  networks: {
    hardhat: {
      chainId: 31337,
      accounts: {
        mnemonic: "test test test test test test test test test test test junk",
        path: "m/44'/60'/0'/0",
        initialIndex: 0,
        count: 20,
      },
    },

    localhost: {
      url: "http://127.0.0.1:8545",
      accounts,
    },

    base: {
      url: "https://mainnet.base.org",
      accounts,
      chainId: 8453,
      gasPrice: 1000000000,
    },

    baseSepolia: {
      url: "https://sepolia.base.org",
      accounts,
      chainId: 84532,
      gasPrice: 1000000000,
    },

    monad: {
      url: "https://rpc.monad.xyz",
      accounts,
      chainId: 143,
    },

    monadTestnet: {
      url: "https://testnet.monad.xyz/rpc",
      accounts,
      chainId: 10143,
    },

    mode: {
      url: "https://mainnet.mode.network",
      accounts,
      chainId: 34443,
    },

    modeSepolia: {
      url: "https://sepolia.mode.network",
      accounts,
      chainId: 919,
    },
  },
  etherscan: {
    apiKey: {
      base: process.env.BASESCAN_API_KEY || "",
      baseSepolia: process.env.BASESCAN_API_KEY || "",
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
    ],
  },
  typechain: {
    outDir: "typechain-types",
    target: "ethers-v6",
  },
  paths: {
    tests: "./test-contracts",
    sources: "./contracts",
    cache: "./cache",
    artifacts: "./artifacts",
  },
  mocha: {
    timeout: 40000,
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS === "true",
    currency: "USD",
    coinmarketcap: process.env.COINMARKETCAP_API_KEY,
    outputFile: "gas-report.txt",
    noColors: true,
  },
};
