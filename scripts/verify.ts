import { run } from "hardhat";

async function main() {
  const nftAddress = process.env.NFT_CONTRACT_ADDRESS;
  const managerAddress = process.env.STORY_MANAGER_ADDRESS;
  const poolAddress = process.env.LIQUIDITY_POOL_ADDRESS;

  if (!nftAddress || !managerAddress || !poolAddress) {
    console.error("❌ Missing contract addresses in .env file");
    console.log("Please add:");
    console.log("  NFT_CONTRACT_ADDRESS=<address>");
    console.log("  STORY_MANAGER_ADDRESS=<address>");
    console.log("  LIQUIDITY_POOL_ADDRESS=<address>");
    return;
  }

  const hiddenURI = process.env.NEXT_PUBLIC_HIDDEN_BASE_URI || "ipfs://QmHidden/";
  const revealedURI = process.env.NEXT_PUBLIC_REVEALED_BASE_URI || "ipfs://QmRevealed/";

  console.log("🔍 Verifying contracts...\n");

  try {
    // Verify LiquidityPool
    console.log("Verifying LiquidityPool...");
    await run("verify:verify", {
      address: poolAddress,
      constructorArguments: [],
    });
    console.log("✅ LiquidityPool verified\n");

    // Verify GhostWriterNFT
    console.log("Verifying GhostWriterNFT...");
    await run("verify:verify", {
      address: nftAddress,
      constructorArguments: [hiddenURI, revealedURI],
    });
    console.log("✅ GhostWriterNFT verified\n");

    // Verify StoryManager
    console.log("Verifying StoryManager...");
    await run("verify:verify", {
      address: managerAddress,
      constructorArguments: [nftAddress, poolAddress],
    });
    console.log("✅ StoryManager verified\n");

    console.log("🎉 All contracts verified successfully!");
  } catch (error) {
    console.error("❌ Verification failed:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
