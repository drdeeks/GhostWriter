const hre = require("hardhat");
const fs = require("fs");

async function main() {
  console.log("🚀 Deploying Ghost Writer contracts to Base Sepolia...\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(balance), "ETH\n");

  if (balance < hre.ethers.parseEther("0.001")) {
    console.log("⚠️  Insufficient balance! Get testnet ETH from: https://www.base.org/faucet");
    console.log("   Address:", deployer.address);
    console.log("");
    return;
  }

  // Deploy LiquidityPool first
  console.log("📦 Deploying LiquidityPool...");
  const LiquidityPool = await hre.ethers.getContractFactory("LiquidityPool");
  const liquidityPool = await LiquidityPool.deploy();
  await liquidityPool.waitForDeployment();
  const liquidityPoolAddress = await liquidityPool.getAddress();
  console.log("✅ LiquidityPool deployed to:", liquidityPoolAddress);

  // Deploy GhostWriterNFT
  console.log("\n📦 Deploying GhostWriterNFT...");
  const GhostWriterNFT = await hre.ethers.getContractFactory("GhostWriterNFT");
  const hiddenURI = "https://ghost-writer-three.vercel.app/api/nft/hidden/";
  const revealedURI = "https://ghost-writer-three.vercel.app/api/nft/";
  const nft = await GhostWriterNFT.deploy(hiddenURI, revealedURI);
  await nft.waitForDeployment();
  const nftAddress = await nft.getAddress();
  console.log("✅ GhostWriterNFT deployed to:", nftAddress);

  // Deploy StoryManager
  console.log("\n📦 Deploying StoryManager...");
  const StoryManager = await hre.ethers.getContractFactory("StoryManager");
  const storyManager = await StoryManager.deploy(nftAddress, liquidityPoolAddress);
  await storyManager.waitForDeployment();
  const storyManagerAddress = await storyManager.getAddress();
  console.log("✅ StoryManager deployed to:", storyManagerAddress);

  // Set StoryManager as minter for NFT contract
  console.log("\n🔗 Setting up permissions...");
  await nft.setStoryManager(storyManagerAddress);
  console.log("✅ StoryManager set as NFT minter");

  // Update .env file with contract addresses
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
  console.log("✅ .env file updated with contract addresses");

  // Save deployment info
  const deploymentInfo = {
    network: "baseSepolia",
    chainId: 84532,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {
      GhostWriterNFT: nftAddress,
      StoryManager: storyManagerAddress,
      LiquidityPool: liquidityPoolAddress
    }
  };

  fs.writeFileSync('deployment.json', JSON.stringify(deploymentInfo, null, 2));
  console.log("✅ Deployment info saved to deployment.json");

  console.log("\n🎉 Deployment completed successfully!");
  console.log("\n📋 Contract Addresses:");
  console.log("   GhostWriterNFT:", nftAddress);
  console.log("   StoryManager:", storyManagerAddress);
  console.log("   LiquidityPool:", liquidityPoolAddress);
  console.log("\n🔗 Verify contracts with:");
  console.log(`   npx hardhat verify --network baseSepolia ${nftAddress}`);
  console.log(`   npx hardhat verify --network baseSepolia ${storyManagerAddress} ${nftAddress} ${liquidityPoolAddress}`);
  console.log(`   npx hardhat verify --network baseSepolia ${liquidityPoolAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
