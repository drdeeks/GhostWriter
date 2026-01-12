const hre = require("hardhat");
const fs = require('fs');

async function main() {
  console.log("🔍 Verifying Ghost Writer contracts on BaseScan...\n");

  // Read deployment info
  if (!fs.existsSync('deployment.json')) {
    console.error("❌ deployment.json not found. Deploy contracts first.");
    process.exit(1);
  }

  const deployment = JSON.parse(fs.readFileSync('deployment.json', 'utf8'));
  const { contracts } = deployment;

  console.log("📋 Verifying contracts:");
  console.log("   GhostWriterNFT:", contracts.GhostWriterNFT);
  console.log("   StoryManager:", contracts.StoryManager);
  console.log("   LiquidityPool:", contracts.LiquidityPool);
  console.log("");

  try {
    // Verify LiquidityPool (no constructor args)
    console.log("🔍 Verifying LiquidityPool...");
    await hre.run("verify:verify", {
      address: contracts.LiquidityPool,
      constructorArguments: [],
    });
    console.log("✅ LiquidityPool verified");

    // Verify GhostWriterNFT (no constructor args)
    console.log("\n🔍 Verifying GhostWriterNFT...");
    await hre.run("verify:verify", {
      address: contracts.GhostWriterNFT,
      constructorArguments: [],
    });
    console.log("✅ GhostWriterNFT verified");

    // Verify StoryManager (with constructor args)
    console.log("\n🔍 Verifying StoryManager...");
    await hre.run("verify:verify", {
      address: contracts.StoryManager,
      constructorArguments: [contracts.GhostWriterNFT, contracts.LiquidityPool],
    });
    console.log("✅ StoryManager verified");

    console.log("\n🎉 All contracts verified successfully!");
    console.log("\n🔗 View on BaseScan:");
    console.log(`   GhostWriterNFT: https://sepolia.basescan.org/address/${contracts.GhostWriterNFT}`);
    console.log(`   StoryManager: https://sepolia.basescan.org/address/${contracts.StoryManager}`);
    console.log(`   LiquidityPool: https://sepolia.basescan.org/address/${contracts.LiquidityPool}`);

  } catch (error) {
    console.error("❌ Verification failed:", error.message);
    
    if (error.message.includes("Already Verified")) {
      console.log("ℹ️  Contracts may already be verified");
    } else if (error.message.includes("API Key")) {
      console.log("ℹ️  Add BASESCAN_API_KEY to .env for verification");
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Verification script failed:", error);
    process.exit(1);
  });
