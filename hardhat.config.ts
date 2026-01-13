import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-ethers";
import dotenv from "dotenv";
import fs from "fs";
import { Wallet } from "ethers";

dotenv.config();

function getDeployerAccounts(): string[] {
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
    hardhat: {
      accounts: accounts.length > 0 ? accounts.map(key => ({ privateKey: key, balance: "10000000000000000000000" })) : undefined,
    },

    localhost: {
      url: "http://127.0.0.1:8545",
      accounts,
    },

    baseSepolia: {
      url: "https://sepolia.base.org",
      accounts,
      chainId: 84532,
    },

    base: {
      url: "https://mainnet.base.org",
      accounts,
      chainId: 8453,
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
    apiKey: {
      baseSepolia: process.env.BASESCAN_API_KEY!,
      base: process.env.BASESCAN_API_KEY!,
    },
    customChains: [
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

  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },

  mocha: {
    timeout: 40000,
    require: ["ts-node/register/transpile-only", "tsconfig-paths/register"],
  },

  gasReporter: {
    enabled: process.env.REPORT_GAS === "true",
    currency: "USD",
    coinmarketcap: process.env.COINMARKETCAP_API_KEY,
  },
};

export default config;