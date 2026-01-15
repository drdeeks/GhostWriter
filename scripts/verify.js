const hre = require("hardhat");
const fs = require('fs');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

async function main() {
  console.log("🔍 Verifying Ghost Writer contracts...\n");

  // Read deployment info
  if (!fs.existsSync('deployment.json')) {
    console.error("❌ deployment.json not found. Deploy contracts first.");
    process.exit(1);
  }

  const deployment = JSON.parse(fs.readFileSync('deployment.json', 'utf8'));
  const { contracts, constructorArgs, network } = deployment;

  console.log(`📋 Verifying contracts on ${network}:`);
  console.log("   GhostWriterNFT:", contracts.GhostWriterNFT);
  console.log("   StoryManager:", contracts.StoryManager);
  console.log("   PriceOracle:", contracts.PriceOracle);
  console.log("   LiquidityPool:", contracts.LiquidityPool);
  console.log("");

  // Check if we have API key for verification
  if (!process.env.BASESCAN_API_KEY && (network.includes('base') || network.includes('Base'))) {
    console.log("⚠️  BASESCAN_API_KEY not found in .env");
    console.log("   Add your API key to enable verification");
    console.log("   Get one at: https://basescan.org/myapikey");
    return;
  }

  try {
    // Verify LiquidityPool (no constructor args)
    console.log("🔍 Verifying LiquidityPool...");
    const lpArgs = constructorArgs.LiquidityPool.length > 0 ? constructorArgs.LiquidityPool.join(' ') : '';
    await execPromise(`npx hardhat verify --network ${network} ${contracts.LiquidityPool} ${lpArgs}`);
    console.log("✅ LiquidityPool verified");

    // Verify PriceOracle (with constructor args)
    console.log("\n🔍 Verifying PriceOracle...");
    const oracleArgs = constructorArgs.PriceOracle.join(' ');
    await execPromise(`npx hardhat verify --network ${network} ${contracts.PriceOracle} ${oracleArgs}`);
    console.log("✅ PriceOracle verified");

    // Verify GhostWriterNFT (with constructor args)
    console.log("\n🔍 Verifying GhostWriterNFT...");
    const nftArgs = constructorArgs.GhostWriterNFT.map(arg => `"${arg}"`).join(' ');
    await execPromise(`npx hardhat verify --network ${network} ${contracts.GhostWriterNFT} ${nftArgs}`);
    console.log("✅ GhostWriterNFT verified");

    // Verify StoryManager (with constructor args)
    console.log("\n🔍 Verifying StoryManager...");
    const smArgs = constructorArgs.StoryManager.join(' ');
    await execPromise(`npx hardhat verify --network ${network} ${contracts.StoryManager} ${smArgs}`);
    console.log("✅ StoryManager verified");

    console.log("\n🎉 All contracts verified successfully!");
    
    // Show appropriate explorer links based on network
    const getExplorerUrl = (network, address) => {
      switch (network) {
        case 'baseSepolia':
          return `https://sepolia.basescan.org/address/${address}`;
        case 'base':
          return `https://basescan.org/address/${address}`;
        case 'monadTestnet':
          return `https://testnet.monad.xyz/address/${address}`;
        case 'monad':
          return `https://monad.xyz/address/${address}`;
        case 'modeSepolia':
          return `https://sepolia.explorer.mode.network/address/${address}`;
        case 'mode':
          return `https://explorer.mode.network/address/${address}`;
        default:
          return `Explorer: ${address}`;
      }
    };

    console.log("\n🔗 View on Explorer:");
    console.log(`   GhostWriterNFT: ${getExplorerUrl(network, contracts.GhostWriterNFT)}`);
    console.log(`   StoryManager: ${getExplorerUrl(network, contracts.StoryManager)}`);
    console.log(`   PriceOracle: ${getExplorerUrl(network, contracts.PriceOracle)}`);
    console.log(`   LiquidityPool: ${getExplorerUrl(network, contracts.LiquidityPool)}`);

  } catch (error) {
    console.error("❌ Verification failed:", error.message);
    
    if (error.message.includes("Already Verified")) {
      console.log("ℹ️  Contracts may already be verified");
    } else if (error.message.includes("API Key")) {
      console.log("ℹ️  Add BASESCAN_API_KEY to .env for verification");
    } else if (error.message.includes("does not have bytecode")) {
      console.log("ℹ️  Contract may not be deployed or address is incorrect");
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Verification script failed:", error);
    process.exit(1);
  });
