import hre from "hardhat";
import fs from "fs";
import { Wallet, ContractFactory } from "ethers";
import type { HardhatRuntimeEnvironment } from "hardhat/types";
import type { HardhatEthersHelpers } from "@nomicfoundation/hardhat-ethers/types";

// Extend HRE with Ethers plugin for TypeScript
const ethers: HardhatEthersHelpers = (hre as HardhatRuntimeEnvironment & { ethers: HardhatEthersHelpers }).ethers;

/**
 * Prompt user for keystore password securely
 */
async function promptForPassword(): Promise<string> {
  return new Promise((resolve) => {
    const stdin = process.stdin;
    const stdout = process.stdout;

    stdout.write("Enter keystore password: ");
    let password = "";
    let isRaw = false;

    const restore = () => {
      if (isRaw && stdin.isTTY) stdin.setRawMode(false);
      isRaw = false;
    };

    const cleanup = () => {
      restore();
      stdin.removeListener("data", onData);
      stdin.pause();
    };

    const onData = (chunk: Buffer) => {
      const char = chunk.toString();
      if (char === "\r" || char === "\n") {
        stdout.write("\n");
        cleanup();
        resolve(password);
      } else if (char === "\x03") {
        stdout.write("\n");
        cleanup();
        process.exit(0);
      } else if (char === "\b" || char === "\x7f") {
        if (password.length > 0) {
          password = password.slice(0, -1);
          stdout.write("\b \b");
        }
      } else if (char >= " " && char <= "~") {
        password += char;
        stdout.write("*");
      }
    };

    if (stdin.isTTY) {
      stdin.setRawMode(true);
      isRaw = true;
    }

    stdin.on("data", onData);
    stdin.resume();
  });
}

/**
 * Get deployer Wallet
 */
async function getDeployer(): Promise<Wallet> {
  if (process.env.PRIVATE_KEY) {
    console.log("Using private key from .env");
    return new ethers.Wallet(process.env.PRIVATE_KEY, ethers.provider);
  }

  if (process.env.KEYSTORE_PATH) {
    console.log("Using keystore from .env");
    const keystore = fs.readFileSync(process.env.KEYSTORE_PATH, "utf8");
    const password = await promptForPassword();
    const wallet = await ethers.Wallet.fromEncryptedJson(keystore, password);
    return wallet.connect(ethers.provider);
  }

  console.log("Using default Hardhat signer");
  const [deployer] = await ethers.getSigners();
  return deployer;
}

/**
 * Deploy a contract
 */
async function deployContract(name: string, args: any[] = [], deployer?: Wallet) {
  const factory: ContractFactory = await ethers.getContractFactory(name, deployer);
  const contract = await factory.deploy(...args);
  await contract.waitForDeployment();
  const address = await contract.getAddress();
  console.log(`✅ ${name} deployed to: ${address}`);
  return { contract, address };
}

/**
 * Verify a contract
 */
async function verifyContract(address: string, args: any[] = []) {
  try {
    await hre.run("verify:verify", {
      address,
      constructorArguments: args,
      network: hre.network.name,
    });
    console.log(`✅ Verified: ${address}`);
  } catch (err: any) {
    console.warn(`⚠️ Verification failed for ${address}: ${err?.message || err}`);
  }
}

/**
 * Main deployment + verification
 */
async function main() {
  console.log(`🌐 Deploying on network: ${hre.network.name}`);

  const deployer = await getDeployer();
  const deployerAddress = await deployer.getAddress();
  console.log("Deployer:", deployerAddress);
  console.log(
    "Balance:",
    ethers.formatEther(await ethers.provider.getBalance(deployerAddress)),
    "ETH"
  );

  // Deploy LiquidityPool
  const { contract: liquidityPool, address: poolAddress } = await deployContract(
    "LiquidityPool",
    [],
    deployer
  );

  // Deploy GhostWriterNFT
  const hiddenURI = process.env.NEXT_PUBLIC_HIDDEN_BASE_URI || "ipfs://QmHidden/";
  const revealedURI = process.env.NEXT_PUBLIC_REVEALED_BASE_URI || "ipfs://QmRevealed/";
  const { contract: nftContract, address: nftAddress } = await deployContract(
    "GhostWriterNFT",
    [hiddenURI, revealedURI],
    deployer
  );

  // Deploy StoryManager
  const { contract: storyManager, address: managerAddress } = await deployContract(
    "StoryManager",
    [nftAddress, poolAddress],
    deployer
  );

  // Configure contracts
  console.log("⚙️ Setting StoryManager in contracts...");
  await (await nftContract.setStoryManager(managerAddress)).wait();
  await (await liquidityPool.setStoryManager(managerAddress)).wait();
  console.log("✅ Contracts configured with StoryManager");

  // Verify contracts
  console.log("\n🔍 Verifying contracts...");
  await verifyContract(poolAddress, []);
  await verifyContract(nftAddress, [hiddenURI, revealedURI]);
  await verifyContract(managerAddress, [nftAddress, poolAddress]);

  console.log("\n🎉 Deployment + verification complete!");
  console.log("Contract addresses:");
  console.log("LiquidityPool:", poolAddress);
  console.log("GhostWriterNFT:", nftAddress);
  console.log("StoryManager:", managerAddress);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });

