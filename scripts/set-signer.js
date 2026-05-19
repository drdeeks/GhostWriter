/**
 * Set Story Template Signer
 *
 * This script sets the storyTemplateSigner address on the StoryManager contract.
 * The signer is used to create EIP-712 signatures for story template approvals,
 * allowing users to create stories with server-generated templates.
 *
 * PREREQUISITES:
 * 1. You must be the contract owner to run this script
 * 2. Set PRIVATE_KEY or KEYSTORE_PATH+KEYSTORE_PASSWORD in .env
 * 3. Set STORY_TEMPLATE_SIGNER_ADDRESS in .env or deployment.json
 *
 * USAGE:
 *   npx hardhat run scripts/set-signer.js --network base
 *   npx hardhat run scripts/set-signer.js --network baseSepolia
 *
 * The STORY_TEMPLATE_SIGNER_PRIVATE_KEY in your .env should correspond to this address.
 */

const { ethers } = require("hardhat");
const fs = require("fs");

// Load configuration from .env or deployment.json
function loadConfig() {
  let storyManagerAddress = process.env.NEXT_PUBLIC_STORY_MANAGER_ADDRESS;
  let newSignerAddress = process.env.STORY_TEMPLATE_SIGNER_ADDRESS;

  // Fallback to deployment.json if env vars not set
  if (!storyManagerAddress && fs.existsSync('deployment.json')) {
    const deployment = JSON.parse(fs.readFileSync('deployment.json', 'utf8'));
    storyManagerAddress = deployment.contracts?.StoryManager;
  }

  if (!newSignerAddress && fs.existsSync('deployment.json')) {
    const deployment = JSON.parse(fs.readFileSync('deployment.json', 'utf8'));
    newSignerAddress = deployment.storyTemplateSigner;
  }

  return { storyManagerAddress, newSignerAddress };
}

async function main() {
  console.log("========================================");
  console.log("  Set Story Template Signer");
  console.log("========================================\n");

  const { storyManagerAddress, newSignerAddress } = loadConfig();

  if (!storyManagerAddress) {
    console.error("❌ StoryManager address not found!");
    console.error("   Set NEXT_PUBLIC_STORY_MANAGER_ADDRESS in .env");
    console.error("   Or ensure deployment.json exists with StoryManager address");
    process.exit(1);
  }

  if (!newSignerAddress) {
    console.error("❌ Story template signer address not found!");
    console.error("   Set STORY_TEMPLATE_SIGNER_ADDRESS in .env");
    console.error("   Or ensure deployment.json exists with storyTemplateSigner");
    console.error("");
    console.error("   To generate a new signer, run the deploy script:");
    console.error("   npm run deploy:baseSepolia");
    process.exit(1);
  }

  // Get signer (from PRIVATE_KEY or KEYSTORE)
  const signers = await ethers.getSigners();

  if (!signers || signers.length === 0) {
    console.error("❌ No signer available!");
    console.error("   Set PRIVATE_KEY or KEYSTORE_PATH+KEYSTORE_PASSWORD in .env");
    process.exit(1);
  }

  const signer = signers[0];
  console.log("📝 Your wallet:", signer.address);
  console.log("📋 StoryManager:", storyManagerAddress);
  console.log("📋 New template signer:", newSignerAddress);
  console.log("");

  // Connect to StoryManager
  const sm = await ethers.getContractAt("StoryManager", storyManagerAddress, signer);

  // Get current state
  const owner = await sm.owner();
  const currentSigner = await sm.storyTemplateSigner();

  console.log("📋 Contract owner:", owner);
  console.log("📋 Current template signer:", currentSigner);
  console.log("");

  // Check if already set
  if (currentSigner.toLowerCase() === newSignerAddress.toLowerCase()) {
    console.log("✅ Template signer is already set to this address!");
    console.log("\nNo transaction needed.");
    return;
  }

  // Check ownership
  if (signer.address.toLowerCase() !== owner.toLowerCase()) {
    console.error("❌ You are not the contract owner!");
    console.error(`   Owner: ${owner}`);
    console.error(`   You:   ${signer.address}`);
    console.error("\nUse the owner wallet to run this script.");
    process.exit(1);
  }

  // Execute transaction
  console.log("🚀 Sending transaction...");
  const tx = await sm.setStoryTemplateSigner(newSignerAddress);
  console.log("📤 Tx hash:", tx.hash);

  console.log("⏳ Waiting for confirmation...");
  await tx.wait();

  // Verify
  const updatedSigner = await sm.storyTemplateSigner();
  console.log("\n✅ Success! Template signer updated.");
  console.log("   New signer:", updatedSigner);

  console.log("\n========================================");
  console.log("  NEXT STEPS");
  console.log("========================================");
  console.log("1. Add to .env:");
  console.log(`   STORY_TEMPLATE_SIGNER_PRIVATE_KEY=0x...`);
  console.log(`   (private key for ${newSignerAddress})`);
  console.log("");
  console.log("2. Add to Vercel environment variables:");
  console.log("   STORY_TEMPLATE_SIGNER_PRIVATE_KEY=0x...");
  console.log("");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error:", error.message);
    process.exit(1);
  });
