import { ethers } from "hardhat";

async function main() {
  console.log("🚀 Starting Ghost Writer deployment...\n");

  // Get deployer
  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying contracts with account:", deployer.address);
  console.log(
    "💰 Account balance:",
    ethers.formatEther(await ethers.provider.getBalance(deployer.address)),
    "ETH\n"
  );

  // Deploy LiquidityPool
  console.log("📦 Deploying LiquidityPool...");
  const LiquidityPool = await ethers.getContractFactory("LiquidityPool");
  const liquidityPool = await LiquidityPool.deploy();
  await liquidityPool.waitForDeployment();
  const poolAddress = await liquidityPool.getAddress();
  console.log("✅ LiquidityPool deployed to:", poolAddress, "\n");

  // Deploy GhostWriterNFT
  console.log("📦 Deploying GhostWriterNFT...");
  const hiddenURI = process.env.NEXT_PUBLIC_HIDDEN_BASE_URI || "ipfs://QmHidden/";
  const revealedURI = process.env.NEXT_PUBLIC_REVEALED_BASE_URI || "ipfs://QmRevealed/";
  
  const GhostWriterNFT = await ethers.getContractFactory("GhostWriterNFT");
  const nftContract = await GhostWriterNFT.deploy(hiddenURI, revealedURI);
  await nftContract.waitForDeployment();
  const nftAddress = await nftContract.getAddress();
  console.log("✅ GhostWriterNFT deployed to:", nftAddress, "\n");

  // Deploy StoryManager
  console.log("📦 Deploying StoryManager...");
  const StoryManager = await ethers.getContractFactory("StoryManager");
  const storyManager = await StoryManager.deploy(nftAddress, poolAddress);
  await storyManager.waitForDeployment();
  const managerAddress = await storyManager.getAddress();
  console.log("✅ StoryManager deployed to:", managerAddress, "\n");

  // Setup contracts
  console.log("⚙️  Setting up contract permissions...");
  
  // Set StoryManager in NFT contract
  const setManagerTx = await nftContract.setStoryManager(managerAddress);
  await setManagerTx.wait();
  console.log("✅ NFT contract configured with StoryManager");

  // Set StoryManager in LiquidityPool
  const setPoolManagerTx = await liquidityPool.setStoryManager(managerAddress);
  await setPoolManagerTx.wait();
  console.log("✅ LiquidityPool configured with StoryManager\n");

  // Print summary
  console.log("🎉 Deployment complete!\n");
  console.log("📋 Contract Addresses:");
  console.log("====================");
  console.log("GhostWriterNFT:  ", nftAddress);
  console.log("StoryManager:    ", managerAddress);
  console.log("LiquidityPool:   ", poolAddress);
  console.log("\n💡 Add these to your .env file:");
  console.log(`NFT_CONTRACT_ADDRESS=${nftAddress}`);
  console.log(`STORY_MANAGER_ADDRESS=${managerAddress}`);
  console.log(`LIQUIDITY_POOL_ADDRESS=${poolAddress}`);
  console.log("\n🔐 Verify contracts on explorer with:");
  console.log(`npx hardhat verify --network <network> ${nftAddress} "${hiddenURI}" "${revealedURI}"`);
  console.log(`npx hardhat verify --network <network> ${managerAddress} ${nftAddress} ${poolAddress}`);
  console.log(`npx hardhat verify --network <network> ${poolAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
