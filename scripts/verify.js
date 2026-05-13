const hre = require("hardhat");
const fs = require('fs');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

async function verifyContract(name, address, args, network) {
  try {
    console.log(`\n🔍 Verifying ${name}...`);

    // Format arguments based on type
    let formattedArgs = '';
    if (args && args.length > 0) {
      formattedArgs = args.map(arg => {
        // If arg is a string that looks like a URL or contains spaces, wrap in quotes
        if (typeof arg === 'string' && (arg.includes('http') || arg.includes(' ') || arg.includes('/'))) {
          return `"${arg}"`;
        }
        return arg;
      }).join(' ');
    }

    const command = `npx hardhat verify --network ${network} ${address} ${formattedArgs}`.trim();
    await execPromise(command);
    console.log(`✅ ${name} verified`);
    return true;
  } catch (error) {
    if (error.message.includes("Already Verified")) {
      console.log(`ℹ️  ${name} already verified`);
      return true;
    } else if (error.message.includes("does not have bytecode")) {
      console.log(`⚠️  ${name} not found at address ${address} - skipping`);
      return false;
    } else if (error.message.includes("API Key")) {
      console.log(`❌ ${name} verification failed: Invalid API key`);
      return false;
    } else {
      console.log(`❌ ${name} verification failed: ${error.message}`);
      return false;
    }
  }
}

async function main() {
  console.log("🔍 Verifying Ghost Writer contracts...\n");

  // Read deployment info
  if (!fs.existsSync('deployment.json')) {
    console.error("❌ deployment.json not found. Deploy contracts first.");
    process.exit(1);
  }

  const deployment = JSON.parse(fs.readFileSync('deployment.json', 'utf8'));
  const { contracts, constructorArgs, network } = deployment;

  console.log(`📋 Contracts to verify on ${network}:`);
  if (contracts.GhostWriterToken) {
    console.log("   GhostWriterToken:", contracts.GhostWriterToken);
  }
  console.log("   LiquidityPool:", contracts.LiquidityPool);
  console.log("   PriceOracle:", contracts.PriceOracle);
  console.log("   GhostWriterNFT:", contracts.GhostWriterNFT);
  console.log("   StoryManager:", contracts.StoryManager);
  console.log("");

  // Check if we have API key for verification
  if (!process.env.BASESCAN_API_KEY && (network.includes('base') || network.includes('Base'))) {
    console.log("⚠️  BASESCAN_API_KEY not found in .env");
    console.log("   Add your API key to enable verification");
    console.log("   Get one at: https://basescan.org/myapikey");
    return;
  }

  const results = {
    verified: [],
    failed: [],
    skipped: []
  };

  try {
    // Verify LiquidityPool (no constructor args)
    const lpSuccess = await verifyContract(
      "LiquidityPool",
      contracts.LiquidityPool,
      constructorArgs.LiquidityPool || [],
      network
    );
    lpSuccess ? results.verified.push("LiquidityPool") : results.failed.push("LiquidityPool");

    // Verify GhostWriterToken (only if deployed)
    if (contracts.GhostWriterToken) {
      const tokenSuccess = await verifyContract(
        "GhostWriterToken",
        contracts.GhostWriterToken,
        constructorArgs.GhostWriterToken || [],
        network
      );
      tokenSuccess ? results.verified.push("GhostWriterToken") : results.failed.push("GhostWriterToken");
    } else {
      console.log("\nℹ️  GhostWriterToken not deployed - skipping verification");
      results.skipped.push("GhostWriterToken");
    }

    // Verify PriceOracle (with constructor args)
    const oracleSuccess = await verifyContract(
      "PriceOracle",
      contracts.PriceOracle,
      constructorArgs.PriceOracle || [],
      network
    );
    oracleSuccess ? results.verified.push("PriceOracle") : results.failed.push("PriceOracle");

    // Verify GhostWriterNFT (with constructor args)
    const nftSuccess = await verifyContract(
      "GhostWriterNFT",
      contracts.GhostWriterNFT,
      constructorArgs.GhostWriterNFT || [],
      network
    );
    nftSuccess ? results.verified.push("GhostWriterNFT") : results.failed.push("GhostWriterNFT");

    // Verify StoryManager (with constructor args)
    const smSuccess = await verifyContract(
      "StoryManager",
      contracts.StoryManager,
      constructorArgs.StoryManager || [],
      network
    );
    smSuccess ? results.verified.push("StoryManager") : results.failed.push("StoryManager");

    // Summary
    console.log("\n" + "=".repeat(50));
    console.log("📊 Verification Summary:");
    console.log("=".repeat(50));

    if (results.verified.length > 0) {
      console.log(`\n✅ Verified (${results.verified.length}):`);
      results.verified.forEach(name => console.log(`   • ${name}`));
    }

    if (results.skipped.length > 0) {
      console.log(`\n⏭️  Skipped (${results.skipped.length}):`);
      results.skipped.forEach(name => console.log(`   • ${name}`));
    }

    if (results.failed.length > 0) {
      console.log(`\n❌ Failed (${results.failed.length}):`);
      results.failed.forEach(name => console.log(`   • ${name}`));
    }

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
    if (contracts.GhostWriterToken) {
      console.log(`   GhostWriterToken: ${getExplorerUrl(network, contracts.GhostWriterToken)}`);
    }
    console.log(`   LiquidityPool: ${getExplorerUrl(network, contracts.LiquidityPool)}`);
    console.log(`   PriceOracle: ${getExplorerUrl(network, contracts.PriceOracle)}`);
    console.log(`   GhostWriterNFT: ${getExplorerUrl(network, contracts.GhostWriterNFT)}`);
    console.log(`   StoryManager: ${getExplorerUrl(network, contracts.StoryManager)}`);

    if (results.failed.length === 0) {
      console.log("\n🎉 All deployed contracts verified successfully!");
    } else {
      console.log("\n⚠️  Some contracts failed verification. Check the details above.");
    }

  } catch (error) {
    console.error("\n❌ Unexpected error during verification:", error.message);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Verification script failed:", error);
    process.exit(1);
  });
