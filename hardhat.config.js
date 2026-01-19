require("@nomicfoundation/hardhat-toolbox");
require("@nomicfoundation/hardhat-ethers");
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
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },

  networks: {
    hardhat: {
      accounts: accounts.length > 0 ? accounts.map(key => ({ 
        privateKey: key, 
        balance: "10000000000000000000000" 
      })) : undefined,
    },

    localhost: {
      url: "http://127.0.0.1:8545",
      accounts,
    },

    baseSepolia: {
      url: "https://sepolia.base.org",
      accounts,
      chainId: 84532,
      gasPrice: 1000000000,
    },

    base: {
      url: "https://mainnet.base.org",
      accounts,
      chainId: 8453,
      gasPrice: 1000000000,
    },

    monadTestnet: {
      url: "https://testnet.monad.xyz/rpc",
      accounts,
      chainId: 10143,
    },

    monad: {
      url: "https://rpc.monad.xyz",
      accounts,
      chainId: 143,
    },

    modeSepolia: {
      url: "https://sepolia.mode.network",
      accounts,
      chainId: 919,
    },

    mode: {
      url: "https://mainnet.mode.network",
      accounts,
      chainId: 34443,
    },
  },

  etherscan: {
    apiKey: process.env.BASESCAN_API_KEY || "",
    customChains: [
      {
        network: "baseSepolia",
        chainId: 84532,
        urls: {
          apiURL: "https://api-sepolia.basescan.org/api",
          browserURL: "https://sepolia.basescan.org",
        },
      },
      {
        network: "base",
        chainId: 8453,
        urls: {
          apiURL: "https://api.basescan.org/api",
          browserURL: "https://basescan.org",
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
