import { ethers } from "hardhat";
import * as fs from "fs";

async function main() {
  console.log("🚀 Deploying Ghost Writer contracts...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "ETH\n");

  if (balance < ethers.parseEther("0.001")) {
    console.log("⚠️  Insufficient balance! Get ETH from faucet");
    console.log("   Address:", deployer.address);
    return;
  }

  // Deploy LiquidityPool
  console.log("📦 Deploying LiquidityPool...");
  const LiquidityPool = await ethers.getContractFactory("LiquidityPool");
  const liquidityPool = await LiquidityPool.deploy();
  await liquidityPool.waitForDeployment();
  const liquidityPoolAddress = await liquidityPool.getAddress();
  console.log("✅ LiquidityPool deployed to:", liquidityPoolAddress);

  // Deploy GhostWriterNFT
  console.log("\n📦 Deploying GhostWriterNFT...");
  const GhostWriterNFT = await ethers.getContractFactory("GhostWriterNFT");
  const hiddenURI = "https://ghost-writer-three.vercel.app/api/nft/hidden/";
  const revealedURI = "https://ghost-writer-three.vercel.app/api/nft/";
  const nft = await GhostWriterNFT.deploy(hiddenURI, revealedURI);
  await nft.waitForDeployment();
  const nftAddress = await nft.getAddress();
  console.log("✅ GhostWriterNFT deployed to:", nftAddress);

  // Deploy StoryManager
  console.log("\n📦 Deploying StoryManager...");
  const StoryManager = await ethers.getContractFactory("StoryManager");
  const storyManager = await StoryManager.deploy(nftAddress, liquidityPoolAddress);
  await storyManager.waitForDeployment();
  const storyManagerAddress = await storyManager.getAddress();
  console.log("✅ StoryManager deployed to:", storyManagerAddress);

  // Set permissions
  console.log("\n🔗 Setting up permissions...");
  await nft.setStoryManager(storyManagerAddress);
  console.log("✅ StoryManager set as NFT minter");

  // Update .env
  console.log("\n📝 Updating .env file...");
  let envContent = fs.readFileSync('.env', 'utf8');
  
  envContent = envContent.replace(
    /NEXT_PUBLIC_NFT_CONTRACT_ADDRESS=.*/,
    `NEXT_PUBLIC_NFT_CONTRACT_ADDRESS=${nftAddress}`
  );
  envContent = envContent.replace(
    /NEXT_PUBLIC_STORY_MANAGER_ADDRESS=.*/,
    `NEXT_PUBLIC_STORY_MANAGER_ADDRESS=${storyManagerAddress}`
  );
  envContent = envContent.replace(
    /NEXT_PUBLIC_LIQUIDITY_POOL_ADDRESS=.*/,
    `NEXT_PUBLIC_LIQUIDITY_POOL_ADDRESS=${liquidityPoolAddress}`
  );
  
  fs.writeFileSync('.env', envContent);
  console.log("✅ .env file updated");

  // Save deployment info
  const deploymentInfo = {
    network: process.env.HARDHAT_NETWORK || "unknown",
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {
      GhostWriterNFT: nftAddress,
      StoryManager: storyManagerAddress,
      LiquidityPool: liquidityPoolAddress
    }
  };

  fs.writeFileSync('deployment.json', JSON.stringify(deploymentInfo, null, 2));
  console.log("✅ Deployment info saved");

  console.log("\n🎉 Deployment completed!");
  console.log("\n📋 Contract Addresses:");
  console.log("   GhostWriterNFT:", nftAddress);
  console.log("   StoryManager:", storyManagerAddress);
  console.log("   LiquidityPool:", liquidityPoolAddress);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
