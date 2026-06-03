"use strict";

const fs = require("fs");
const path = require("path");

const REQUIRED_ENV_VARS = [
  "PRIVATE_KEY",
  "NEXT_PUBLIC_CHAIN_ID",
  "NEXT_PUBLIC_ONCHAINKIT_PROJECT_ID",
  "NEXT_PUBLIC_ONCHAINKIT_API_KEY",
  "STORY_TEMPLATE_SIGNER_PRIVATE_KEY"
];

const ENV_FILE_PATH = path.resolve(__dirname, "../../../.env");

function validateEnv() {
  if (!fs.existsSync(ENV_FILE_PATH)) {
    console.error("❌ .env file not found");
    return false;
  }

  const envContent = fs.readFileSync(ENV_FILE_PATH, "utf8");
  const missingVars = [];

  REQUIRED_ENV_VARS.forEach(envVar => {
    if (!envContent.includes(`${envVar}=`)) {
      missingVars.push(envVar);
    }
  });

  if (missingVars.length > 0) {
    console.error(`❌ Missing required environment variables: ${missingVars.join(", ")}`);
    return false;
  }

  console.log("✅ All required environment variables are present");
  return true;
}

function validatePrivateKey() {
  const envContent = fs.readFileSync(ENV_FILE_PATH, "utf8");
  const privateKeyMatch = envContent.match(/PRIVATE_KEY=([a-fA-F0-9]{64})/);
  const signerKeyMatch = envContent.match(/STORY_TEMPLATE_SIGNER_PRIVATE_KEY=([a-fA-F0-9]{64})/);

  if (!privateKeyMatch || privateKeyMatch[1].length !== 64) {
    console.error("❌ PRIVATE_KEY must be a 64-character hex string");
    return false;
  }

  if (!signerKeyMatch || signerKeyMatch[1].length !== 64) {
    console.error("❌ STORY_TEMPLATE_SIGNER_PRIVATE_KEY must be a 64-character hex string");
    return false;
  }

  console.log("✅ Private keys are properly formatted");
  return true;
}

function validateChainId() {
  const envContent = fs.readFileSync(ENV_FILE_PATH, "utf8");
  const chainIdMatch = envContent.match(/NEXT_PUBLIC_CHAIN_ID=(\d+)/);

  if (!chainIdMatch) {
    console.error("❌ NEXT_PUBLIC_CHAIN_ID must be set");
    return false;
  }

  const validChainIds = ["8453", "84532"]; // Base and Base Sepolia
  if (!validChainIds.includes(chainIdMatch[1])) {
    console.error(`❌ NEXT_PUBLIC_CHAIN_ID must be one of: ${validChainIds.join(", ")}`);
    return false;
  }

  console.log("✅ Chain ID is valid");
  return true;
}

function main() {
  console.log("🔍 Validating environment configuration...");
  
  const envValid = validateEnv();
  const keyValid = validatePrivateKey();
  const chainValid = validateChainId();
  
  if (!envValid || !keyValid || !chainValid) {
    console.error("\n❌ Environment validation failed");
    process.exit(1);
  }
  
  console.log("\n✅ Environment validation passed");
  return true;
}

if (require.main === module) {
  main();
}

module.exports = { validateEnv, validatePrivateKey, validateChainId };