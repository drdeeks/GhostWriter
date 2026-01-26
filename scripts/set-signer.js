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
 * 3. Set STORY_TEMPLATE_SIGNER_ADDRESS below to the address you want to use
 * 
 * USAGE:
 *   npx hardhat run scripts/set-signer.js --network base
 *   npx hardhat run scripts/set-signer.js --network baseSepolia
 * 
 * The STORY_TEMPLATE_SIGNER_PRIVATE_KEY in your .env should correspond to this address.
 */

const { ethers } = require("hardhat");

// ============================================================================
// CONFIGURATION - Update this address before running
// ============================================================================
const STORY_MANAGER_ADDRESS = "0x2AA8f70643384F1122c9bff67b4CB8bc43631b85";
const NEW_SIGNER_ADDRESS = "0xba33ceF8B2DDf55abBbABC88F4AEEd85366AA6C3";
// ============================================================================

async function main() {
  console.log("========================================");
  console.log("  Set Story Template Signer");
  console.log("========================================\n");

  // Get signer (from PRIVATE_KEY or KEYSTORE)
  const signers = await ethers.getSigners();
  
  if (!signers || signers.length === 0) {
    console.error("❌ No signer available!");
    console.error("   Set PRIVATE_KEY or KEYSTORE_PATH+KEYSTORE_PASSWORD in .env");
    process.exit(1);
  }

  const signer = signers[0];
  console.log("📝 Your wallet:", signer.address);

  // Connect to StoryManager
  const sm = await ethers.getContractAt("StoryManager", STORY_MANAGER_ADDRESS, signer);

  // Get current state
  const owner = await sm.owner();
  const currentSigner = await sm.storyTemplateSigner();

  console.log("📋 Contract owner:", owner);
  console.log("📋 Current template signer:", currentSigner);
  console.log("📋 New template signer:", NEW_SIGNER_ADDRESS);
  console.log("");

  // Check if already set
  if (currentSigner.toLowerCase() === NEW_SIGNER_ADDRESS.toLowerCase()) {
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
  const tx = await sm.setStoryTemplateSigner(NEW_SIGNER_ADDRESS);
  console.log("📤 Tx hash:", tx.hash);
  
  console.log("⏳ Waiting for confirmation...");
  await tx.wait();
  
  // Verify
  const newSigner = await sm.storyTemplateSigner();
  console.log("\n✅ Success! Template signer updated.");
  console.log("   New signer:", newSigner);

  console.log("\n========================================");
  console.log("  NEXT STEPS");
  console.log("========================================");
  console.log("1. Add to .env:");
  console.log(`   STORY_TEMPLATE_SIGNER_PRIVATE_KEY=0x...`);
  console.log(`   (private key for ${NEW_SIGNER_ADDRESS})`);
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
