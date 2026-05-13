require("@nomicfoundation/hardhat-toolbox");
require("@nomicfoundation/hardhat-ethers");
require("dotenv").config();
const fs = require("fs");
const { Wallet } = require("ethers");

function getDeployerAccounts() {
  if (process.env.PRIVATE_KEY) {
    return [process.env.PRIVATE_KEY];
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
        runs: 1,
      },
    },
  },
  networks: {
    hardhat: {
      allowUnlimitedContractSize: true,
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      accounts: accounts.length > 0 ? accounts : undefined,
    },
    baseSepolia: {
      url: "https://sepolia.base.org",
      accounts,
      chainId: 84532,
    },
    monadTestnet: {
      url: "https://testnet-rpc.monad.xyz",
      accounts,
      chainId: 10143,
    }
  }
};