const { ethers } = require("hardhat");
const fs = require("fs");

async function main() {
  console.log("🚀 Deploying Ghost Writer contracts...\n");

  const network = hre.network.name;
  console.log("Network:", network);

  const signers = await ethers.getSigners();
  console.log("Available signers:", signers.length);
  
  if (signers.length === 0) {
    console.log("❌ No signers available! Check your keystore/private key configuration.");
    return;
  }

  const [deployer] = signers;
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

  // Deploy PriceOracle
  console.log("\n📦 Deploying PriceOracle...");
  const PriceOracle = await ethers.getContractFactory("PriceOracle");
  
  // Chainlink ETH/USD Price Feed addresses
  const priceFeedAddresses = {
    baseSepolia: "0x4aDC67696bA383F43DD60A9e78F2C97Fbbfc7cb1", // Base Sepolia ETH/USD
    base: "0x71041dddad3595F9CEd3DcCFBe3D1F4b0a16Bb70" // Base Mainnet ETH/USD
  };
  
  const priceFeedAddress = network === "base" 
    ? priceFeedAddresses.base 
    : priceFeedAddresses.baseSepolia;
  
  console.log("Using Chainlink Price Feed:", priceFeedAddress);
  console.log("⚠️  Verify this feed is active at https://data.chain.link");
  
  const priceOracle = await PriceOracle.deploy(priceFeedAddress);
  await priceOracle.waitForDeployment();
  const priceOracleAddress = await priceOracle.getAddress();
  console.log("✅ PriceOracle deployed to:", priceOracleAddress);

  // Deploy GhostWriterNFT with constructor args
  console.log("\n📦 Deploying GhostWriterNFT...");
  const GhostWriterNFT = await ethers.getContractFactory("GhostWriterNFT");
  const hiddenURI = process.env.NEXT_PUBLIC_BASE_URL 
    ? `${process.env.NEXT_PUBLIC_BASE_URL}/api/nft/hidden/`
    : "https://ghost-writer-three.vercel.app/api/nft/hidden/";
  const revealedURI = process.env.NEXT_PUBLIC_BASE_URL
    ? `${process.env.NEXT_PUBLIC_BASE_URL}/api/nft/`
    : "https://ghost-writer-three.vercel.app/api/nft/";
  
  const nft = await GhostWriterNFT.deploy(hiddenURI, revealedURI);
  await nft.waitForDeployment();
  const nftAddress = await nft.getAddress();
  console.log("✅ GhostWriterNFT deployed to:", nftAddress);

  // Deploy StoryManager
  console.log("\n📦 Deploying StoryManager...");
  const StoryManager = await ethers.getContractFactory("StoryManager");
  const storyManager = await StoryManager.deploy(nftAddress, liquidityPoolAddress, priceOracleAddress);
  await storyManager.waitForDeployment();
  const storyManagerAddress = await storyManager.getAddress();
  console.log("✅ StoryManager deployed to:", storyManagerAddress);

  // Set permissions
  console.log("\n🔗 Setting up permissions...");
  const tx = await nft.setStoryManager(storyManagerAddress);
  await tx.wait();
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
  envContent = envContent.replace(
    /NEXT_PUBLIC_PRICE_ORACLE_ADDRESS=.*/,
    `NEXT_PUBLIC_PRICE_ORACLE_ADDRESS=${priceOracleAddress}`
  );
  
  fs.writeFileSync('.env', envContent);
  console.log("✅ .env file updated");

  // Save deployment info
  const deploymentInfo = {
    network: network,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    constructorArgs: {
      GhostWriterNFT: [hiddenURI, revealedURI],
      StoryManager: [nftAddress, liquidityPoolAddress, priceOracleAddress],
      PriceOracle: [priceFeedAddress],
      LiquidityPool: []
    },
    contracts: {
      GhostWriterNFT: nftAddress,
      StoryManager: storyManagerAddress,
      PriceOracle: priceOracleAddress,
      LiquidityPool: liquidityPoolAddress
    }
  };

  fs.writeFileSync('deployment.json', JSON.stringify(deploymentInfo, null, 2));
  console.log("✅ Deployment info saved");

  console.log("\n🎉 Deployment completed!");
  console.log("\n📋 Contract Addresses:");
  console.log("   GhostWriterNFT:", nftAddress);
  console.log("   StoryManager:", storyManagerAddress);
  console.log("   PriceOracle:", priceOracleAddress);
  console.log("   LiquidityPool:", liquidityPoolAddress);
  
  console.log("\n🔍 To verify contracts, run:");
  console.log("   npm run verify");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
