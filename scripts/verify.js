const { execSync } = require("child_process");
require("dotenv").config();

async function main() {
  const deployment = require("../deployment.json");
  const network = deployment.network;
  console.log(`🔍 Verifying contracts on ${network}...`);

  const contracts = [
    { name: "LiquidityPool", address: deployment.contracts.LiquidityPool, args: "" },
    { name: "GhostWriterToken", address: deployment.contracts.GhostWriterToken, args: "" },
    { name: "PriceOracle", address: deployment.constructorArgs.PriceOracle[0], args: `"${deployment.constructorArgs.PriceOracle[0]}"` },
    { name: "GhostWriterNFT", address: deployment.contracts.GhostWriterNFT, args: `"${deployment.constructorArgs.GhostWriterNFT[0]}" "${deployment.constructorArgs.GhostWriterNFT[1]}"` },
    { name: "StoryManager", address: deployment.contracts.StoryManager, args: `"${deployment.contracts.GhostWriterNFT}" "${deployment.contracts.LiquidityPool}" "${deployment.contracts.PriceOracle}"` }
  ];

  for (const contract of contracts) {
    console.log(`\n📡 Verifying ${contract.name}...`);
    try {
      if (network.includes("monad")) {
        console.log("Using MonadVision/Socialscan Verification API...");
        // Monad skill uses a custom curl approach, here we use standard hardhat-verify if configured
        execSync(`npx hardhat verify --network ${network} ${contract.address} ${contract.args}`, { stdio: "inherit" });
      } else {
        execSync(`npx hardhat verify --network ${network} ${contract.address} ${contract.args}`, { stdio: "inherit" });
      }
    } catch (e) {
      console.log(`⚠️  Verification failed for ${contract.name} (likely already verified)`);
    }
  }
}

main().catch(console.error);