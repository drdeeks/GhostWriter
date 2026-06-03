#!/usr/bin/env node
"use strict";

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const BACKUP_DIR = path.resolve(__dirname, "../backup");
const DEPLOYMENT_FILE = path.resolve(__dirname, "../../../deployment.json");

function getLatestBackup() {
  if (!fs.existsSync(BACKUP_DIR)) {
    console.error("❌ Backup directory not found");
    return null;
  }
  
  const backups = fs.readdirSync(BACKUP_DIR)
    .filter(file => file.endsWith(".json"))
    .sort((a, b) => fs.statSync(path.join(BACKUP_DIR, b)).mtime - fs.statSync(path.join(BACKUP_DIR, a)).mtime);
  
  if (backups.length === 0) {
    console.error("❌ No backups found");
    return null;
  }
  
  return path.join(BACKUP_DIR, backups[0]);
}

function rollbackContracts() {
  const latestBackup = getLatestBackup();
  if (!latestBackup) return false;
  
  try {
    console.log(`🔙 Rolling back to backup: ${latestBackup}`);
    
    const backupData = JSON.parse(fs.readFileSync(latestBackup, "utf8"));
    
    // Restore deployment.json
    fs.writeFileSync(DEPLOYMENT_FILE, JSON.stringify(backupData.deployment, null, 2));
    console.log("✅ Restored deployment.json");
    
    // Restore .env if it exists in backup
    if (backupData.env) {
      fs.writeFileSync(path.resolve(__dirname, "../../../.env"), backupData.env);
      console.log("✅ Restored .env file");
    }
    
    // Re-run set-signer script if needed
    if (backupData.deployment.storyTemplateSigner) {
      execSync("npx hardhat run scripts/set-signer.js --network base", { stdio: "inherit" });
      console.log("✅ Re-registered story template signer");
    }
    
    return true;
  } catch (error) {
    console.error("❌ Rollback failed:", error.message);
    return false;
  }
}

function main() {
  console.log("🔙 Starting contract rollback procedure...");
  
  if (!rollbackContracts()) {
    console.error("\n❌ Contract rollback failed");
    process.exit(1);
  }
  
  console.log("\n✅ Contract rollback completed successfully");
}

if (require.main === module) {
  main();
}

module.exports = { rollbackContracts };
