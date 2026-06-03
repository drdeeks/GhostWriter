"use strict";

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const REQUIRED_DEPENDENCIES = {
  "@babel/core": "^7.0.0",
  "@babel/preset-env": "^7.0.0",
  "@farcaster/miniapp-sdk": "^0.2.3",
  "@coinbase/onchainkit": "^0.0.0",
  "ethers": "^6.0.0",
  "hardhat": "^2.0.0",
  "next": "^16.0.0",
  "react": "^18.0.0",
  "react-dom": "^18.0.0",
  "wagmi": "^2.0.0",
  "viem": "^2.0.0"
};

const REQUIRED_DEV_DEPENDENCIES = {
  "@types/node": "^20.0.0",
  "@types/react": "^18.0.0",
  "@types/react-dom": "^18.0.0",
  "typescript": "^5.0.0",
  "eslint": "^8.0.0",
  "jest": "^29.0.0"
};

function checkDependencies() {
  const packageJsonPath = path.resolve(__dirname, "../../../package.json");
  
  if (!fs.existsSync(packageJsonPath)) {
    console.error("❌ package.json not found");
    return false;
  }
  
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
  const dependencies = packageJson.dependencies || {};
  const devDependencies = packageJson.devDependencies || {};
  
  let allValid = true;
  
  // Check required dependencies
  for (const [dep, version] of Object.entries(REQUIRED_DEPENDENCIES)) {
    if (!dependencies[dep]) {
      console.error(`❌ Missing required dependency: ${dep}@${version}`);
      allValid = false;
    } else if (!checkVersion(dependencies[dep], version)) {
      console.error(`❌ Incorrect version for ${dep}: expected ${version}, got ${dependencies[dep]}`);
      allValid = false;
    }
  }
  
  // Check required dev dependencies
  for (const [dep, version] of Object.entries(REQUIRED_DEV_DEPENDENCIES)) {
    if (!devDependencies[dep]) {
      console.error(`❌ Missing required dev dependency: ${dep}@${version}`);
      allValid = false;
    } else if (!checkVersion(devDependencies[dep], version)) {
      console.error(`❌ Incorrect version for ${dep}: expected ${version}, got ${devDependencies[dep]}`);
      allValid = false;
    }
  }
  
  // Special check for Babel presets in dependencies (not devDependencies)
  if (!dependencies["@babel/core"] || !dependencies["@babel/preset-env"]) {
    console.error("❌ Babel presets must be in dependencies (not devDependencies) for Vercel builds");
    allValid = false;
  }
  
  return allValid;
}

function checkVersion(installedVersion, requiredVersion) {
  // Simple version check - in a real implementation, you'd use semver
  if (requiredVersion.startsWith("^")) {
    const requiredMajor = requiredVersion.split(".")[0].substring(1);
    const installedMajor = installedVersion.split(".")[0];
    return installedMajor === requiredMajor;
  }
  return installedVersion === requiredVersion;
}

function checkNodeVersion() {
  const requiredVersion = ">=18.0.0";
  const nodeVersion = process.version;
  
  if (!require("semver").satisfies(nodeVersion, requiredVersion)) {
    console.error(`❌ Node version ${nodeVersion} does not satisfy requirement: ${requiredVersion}`);
    return false;
  }
  
  console.log(`✅ Node version ${nodeVersion} is compatible`);
  return true;
}

function checkNpmVersion() {
  try {
    const npmVersion = execSync("npm --version").toString().trim();
    const requiredVersion = ">=8.0.0";
    
    if (!require("semver").satisfies(npmVersion, requiredVersion)) {
      console.error(`❌ npm version ${npmVersion} does not satisfy requirement: ${requiredVersion}`);
      return false;
    }
    
    console.log(`✅ npm version ${npmVersion} is compatible`);
    return true;
  } catch (error) {
    console.error("❌ Failed to check npm version");
    return false;
  }
}

function main() {
  console.log("🔍 Checking dependencies and environment...");
  
  const depsValid = checkDependencies();
  const nodeValid = checkNodeVersion();
  const npmValid = checkNpmVersion();
  
  if (!depsValid || !nodeValid || !npmValid) {
    console.error("\n❌ Dependency validation failed");
    process.exit(1);
  }
  
  console.log("\n✅ Dependency validation passed");
  return true;
}

if (require.main === module) {
  main();
}

module.exports = { checkDependencies, checkNodeVersion, checkNpmVersion };