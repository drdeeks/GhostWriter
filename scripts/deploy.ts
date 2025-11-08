// Hardhat injects ethers globally - declare types
declare const ethers: any;
import * as fs from "fs";

async function getDeployer() {
  if (process.env.PRIVATE_KEY) {
    console.log("Using private key from .env");
    return new ethers.Wallet(process.env.PRIVATE_KEY, ethers.provider);
  }
  if (process.env.KEYSTORE_PATH) {
    console.log("Using keystore from .env");
    const keystore = fs.readFileSync(process.env.KEYSTORE_PATH, "utf8");
    const password = await promptForPassword();
    return ethers.Wallet.fromEncryptedJson(keystore, password).then(wallet => wallet.connect(ethers.provider));
  }
  console.log("Using default hardhat signer");
  const [deployer] = await ethers.getSigners();
  return deployer;
}

function promptForPassword(): Promise<string> {
  return new Promise((resolve) => {
    // Save original stdin settings
    const stdin = process.stdin;
    const stdout = process.stdout;

    stdout.write("Enter keystore password: ");

    let password = "";
    let isRawMode = false;

    // Function to restore terminal
    const restoreTerminal = () => {
      if (isRawMode && stdin.isTTY) {
        stdin.setRawMode(false);
        isRawMode = false;
      }
    };

    // Function to handle input
    const handleInput = (chunk: Buffer) => {
      const char = chunk.toString();

      // Enter key - submit password
      if (char === "\r" || char === "\n") {
        stdout.write("\n");
        cleanup();
        resolve(password);
        return;
      }

      // Backspace - remove last character
      if (char === "\b" || char === "\x7f") {
        if (password.length > 0) {
          password = password.slice(0, -1);
          // Move cursor back, erase character, move cursor back
          stdout.write("\b \b");
        }
        return;
      }

      // Ctrl+C - exit
      if (char === "\x03") {
        stdout.write("\n");
        cleanup();
        process.exit(0);
      }

      // Regular character - add to password and show asterisk
      if (char.length === 1 && char >= " " && char <= "~") {
        password += char;
        stdout.write("*");
      }
    };

    // Function to cleanup event listeners
    const cleanup = () => {
      restoreTerminal();
      stdin.removeListener("data", handleInput);
      stdin.pause();
    };

    // Set up raw mode for secure input
    if (stdin.isTTY) {
      stdin.setRawMode(true);
      isRawMode = true;
    }

    // Handle process termination
    process.on("SIGINT", () => {
      cleanup();
      process.exit(0);
    });

    // Start listening for input
    stdin.on("data", handleInput);
    stdin.resume();
  });
}

async function main() {
  console.log("🚀 Starting Ghost Writer deployment...\n");

  // Get deployer
  const deployer = await getDeployer();
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
