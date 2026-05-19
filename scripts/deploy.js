const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");
const { Wallet } = require("ethers");
const crypto = require("crypto");

// Parse command line flags
const args = process.argv.slice(2);
const DEPLOY_TOKEN = args.includes("--with-token") || args.includes("-t");

// Helper function to add delays between transactions
async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Helper function to deploy with proper gas settings
async function deployWithGas(factory, args = []) {
  const feeData = await ethers.provider.getFeeData();

  // Increase buffer to 200% (2x) to ensure replacement
  const deploymentOptions = {
    maxFeePerGas: feeData.maxFeePerGas * 200n / 100n,
    maxPriorityFeePerGas: feeData.maxPriorityFeePerGas * 200n / 100n,
  };

  console.log(`   Gas settings: maxFee=${ethers.formatUnits(deploymentOptions.maxFeePerGas, 'gwei')} gwei, maxPriorityFee=${ethers.formatUnits(deploymentOptions.maxPriorityFeePerGas, 'gwei')} gwei`);

  const contract = await factory.deploy(...args, deploymentOptions);
  await contract.waitForDeployment();

  // Wait 3 seconds between deployments to ensure transactions are processed
  await sleep(3000);

  return contract;
}

// Helper function to send transactions with proper gas settings
async function sendTxWithGas(tx) {
  const feeData = await ethers.provider.getFeeData();

  const txOptions = {
    maxFeePerGas: feeData.maxFeePerGas * 200n / 100n,
    maxPriorityFeePerGas: feeData.maxPriorityFeePerGas * 200n / 100n,
  };

  const result = await tx(txOptions);

  // Wait 3 seconds between transactions
  await sleep(3000);

  return result;
}

// Generate a new random wallet for story template signing
function generateTemplateSigner() {
  const wallet = Wallet.createRandom();
  return {
    address: wallet.address,
    privateKey: wallet.privateKey,
  };
}

// Create an encrypted keystore file
async function createKeystore(wallet, password) {
  const encryptedJson = await wallet.encrypt(password);
  const keystoreDir = path.join(process.cwd(), 'keystores');
  if (!fs.existsSync(keystoreDir)) {
    fs.mkdirSync(keystoreDir, { recursive: true });
  }
  const filename = `template-signer-${Date.now()}.json`;
  const filepath = path.join(keystoreDir, filename);
  fs.writeFileSync(filepath, encryptedJson);
  return { filepath, filename };
}

async function main() {
  console.log("🚀 Deploying Ghost Writer contracts...\n");
  if (DEPLOY_TOKEN) {
    console.log("🪙 GHOST token deployment: ENABLED\n");
  }

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

  // Check current gas prices
  const feeData = await ethers.provider.getFeeData();
  console.log("Current network gas prices:");
  console.log("   Base Fee:", ethers.formatUnits(feeData.maxFeePerGas || 0n, 'gwei'), "gwei");
  console.log("   Priority Fee:", ethers.formatUnits(feeData.maxPriorityFeePerGas || 0n, 'gwei'), "gwei\n");

  // Track deployed contracts
  let tokenAddress = null;

  // Deploy GHOST Token (optional)
  if (DEPLOY_TOKEN) {
    console.log("📦 Deploying GhostWriterToken (GHOST)...");
    const GhostWriterToken = await ethers.getContractFactory("GhostWriterToken");
    const token = await deployWithGas(GhostWriterToken);
    tokenAddress = await token.getAddress();
    console.log("✅ GhostWriterToken deployed to:", tokenAddress);
  }

  // Deploy LiquidityPool
  console.log("\n📦 Deploying LiquidityPool...");
  const LiquidityPool = await ethers.getContractFactory("LiquidityPool");
  const liquidityPool = await deployWithGas(LiquidityPool);
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
  
  const priceOracle = await deployWithGas(PriceOracle, [priceFeedAddress]);
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
  
  const nft = await deployWithGas(GhostWriterNFT, [hiddenURI, revealedURI]);
  const nftAddress = await nft.getAddress();
  console.log("✅ GhostWriterNFT deployed to:", nftAddress);

  // Deploy StoryManager
  console.log("\n📦 Deploying StoryManager...");
  const StoryManager = await ethers.getContractFactory("StoryManager");
  const storyManager = await deployWithGas(StoryManager, [nftAddress, liquidityPoolAddress, priceOracleAddress]);
  const storyManagerAddress = await storyManager.getAddress();
  console.log("✅ StoryManager deployed to:", storyManagerAddress);

  // Set permissions
  console.log("\n🔗 Setting up permissions...");

  // Allow StoryManager to mint NFTs
  console.log("   Setting StoryManager as NFT minter...");
  const tx = await sendTxWithGas((opts) => nft.setStoryManager(storyManagerAddress, opts));
  await tx.wait();
  console.log("✅ StoryManager set as NFT minter");

  // Allow StoryManager to deposit fees into LiquidityPool
  console.log("   Setting StoryManager as LiquidityPool depositor...");
  const tx2 = await sendTxWithGas((opts) => liquidityPool.setStoryManager(storyManagerAddress, opts));
  await tx2.wait();
  console.log("✅ StoryManager set as LiquidityPool depositor");

  // Configure server-authorized signer for story template approvals (EIP-712)
  // Auto-generate a new signer if not provided
  let signerAddress;
  let signerPrivateKey;
  
  if (process.env.STORY_TEMPLATE_SIGNER_PRIVATE_KEY) {
    // Use existing signer from env
    const signerWallet = new Wallet(process.env.STORY_TEMPLATE_SIGNER_PRIVATE_KEY);
    signerAddress = signerWallet.address;
    console.log("   Using existing story template signer...");
  } else {
    // Generate new signer and keystore automatically
    console.log("   🔄 Auto-generating story template signer...");
    const newSigner = generateTemplateSigner();
    signerAddress = newSigner.address;
    signerPrivateKey = newSigner.privateKey;
    
    // Create encrypted keystore
    const keystorePassword = crypto.randomBytes(32).toString('hex');
    const { filepath, filename } = await createKeystore(newSigner, keystorePassword);
    
    console.log(`   ✅ New signer generated: ${signerAddress}`);
    console.log(`   🔐 Keystore saved: ${filepath}`);
    console.log(`   ⚠️  SAVE THIS PASSWORD: ${keystorePassword}`);
    console.log(`   ⚠️  SAVE THIS PRIVATE KEY: ${signerPrivateKey}`);
  }
  
  console.log("   Setting story template signer on-chain...");
  const tx3 = await sendTxWithGas((opts) => storyManager.setStoryTemplateSigner(signerAddress, opts));
  await tx3.wait();
  console.log("✅ Story template signer set to:", signerAddress);

  // Set GHOST token address on contracts if token was deployed
  if (DEPLOY_TOKEN && tokenAddress) {
    console.log("\n🪙 Configuring GHOST token on contracts...");

    console.log("   Setting GHOST token on StoryManager...");
    const tx4 = await sendTxWithGas((opts) => storyManager.setGhostToken(tokenAddress, opts));
    await tx4.wait();
    console.log("✅ GHOST token set on StoryManager");

    console.log("   Setting GHOST token on LiquidityPool...");
    const tx5 = await sendTxWithGas((opts) => liquidityPool.setGhostToken(tokenAddress, opts));
    await tx5.wait();
    console.log("✅ GHOST token set on LiquidityPool");
  }

  // Update .env
  console.log("\n📝 Updating .env file...");
  let envContent = '';
  try {
    envContent = fs.readFileSync('.env', 'utf8');
  } catch {
    console.log("⚠️  .env file not found, creating new one");
  }
  
  const updateEnvVar = (content, key, value) => {
    const regex = new RegExp(`${key}=.*`);
    if (regex.test(content)) {
      return content.replace(regex, `${key}=${value}`);
    } else {
      return content + `\n${key}=${value}`;
    }
  };

  envContent = updateEnvVar(envContent, 'NEXT_PUBLIC_NFT_CONTRACT_ADDRESS', nftAddress);
  envContent = updateEnvVar(envContent, 'NEXT_PUBLIC_STORY_MANAGER_ADDRESS', storyManagerAddress);
  envContent = updateEnvVar(envContent, 'NEXT_PUBLIC_LIQUIDITY_POOL_ADDRESS', liquidityPoolAddress);
  envContent = updateEnvVar(envContent, 'NEXT_PUBLIC_PRICE_ORACLE_ADDRESS', priceOracleAddress);

  if (DEPLOY_TOKEN && tokenAddress) {
    envContent = updateEnvVar(envContent, 'NEXT_PUBLIC_TOKEN_ADDRESS', tokenAddress);
  }
  
  // Save signer info if auto-generated
  if (signerPrivateKey) {
    envContent = updateEnvVar(envContent, 'STORY_TEMPLATE_SIGNER_PRIVATE_KEY', signerPrivateKey);
    envContent = updateEnvVar(envContent, 'STORY_TEMPLATE_SIGNER_ADDRESS', signerAddress);
  }
  
  fs.writeFileSync('.env', envContent);
  console.log("✅ .env file updated");

  // Save deployment info
  const deploymentInfo = {
    network: network,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    constructorArgs: {
      ...(DEPLOY_TOKEN && { GhostWriterToken: [] }),
      GhostWriterNFT: [hiddenURI, revealedURI],
      StoryManager: [nftAddress, liquidityPoolAddress, priceOracleAddress],
      PriceOracle: [priceFeedAddress],
      LiquidityPool: []
    },
    contracts: {
      ...(DEPLOY_TOKEN && tokenAddress && { GhostWriterToken: tokenAddress }),
      GhostWriterNFT: nftAddress,
      StoryManager: storyManagerAddress,
      PriceOracle: priceOracleAddress,
      LiquidityPool: liquidityPoolAddress
    },
    storyTemplateSigner: signerAddress,
  };

  if (!DEPLOY_TOKEN) {
    deploymentInfo.notes = {
      ghostToken: "To deploy GHOST token, run: npx hardhat run scripts/deploy.js --network <network> -- --with-token"
    };
  }

  fs.writeFileSync('deployment.json', JSON.stringify(deploymentInfo, null, 2));
  console.log("✅ Deployment info saved to deployment.json");

  console.log("\n🎉 Deployment completed!");
  console.log("\n📋 Contract Addresses:");
  if (DEPLOY_TOKEN && tokenAddress) {
    console.log("   GhostWriterToken (GHOST):", tokenAddress);
  }
  console.log("   GhostWriterNFT:", nftAddress);
  console.log("   StoryManager:", storyManagerAddress);
  console.log("   PriceOracle:", priceOracleAddress);
  console.log("   LiquidityPool:", liquidityPoolAddress);
  console.log("   Story Template Signer:", signerAddress);
  
  if (!DEPLOY_TOKEN) {
    console.log("\n📝 GHOST Token:");
    console.log("   To deploy with token, add --with-token or -t flag");
  }

  if (signerPrivateKey) {
    console.log("\n⚠️  IMPORTANT: Save these credentials securely:");
    console.log("   Story Template Signer Address:", signerAddress);
    console.log("   Story Template Signer Private Key:", signerPrivateKey);
    console.log("   Keystore password was printed above — save it now!");
  }

  console.log("\n🔍 To verify contracts, run:");
  console.log("   npm run verify");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
