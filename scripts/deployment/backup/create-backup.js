"use strict";

const fs = require("fs");
const path = require("path");

const BACKUP_DIR = path.resolve(__dirname, "../backup");
const DEPLOYMENT_FILE = path.resolve(__dirname, "../../../deployment.json");
const ENV_FILE = path.resolve(__dirname, "../../../.env");

function createBackup() {
  if (!fs.existsSync(DEPLOYMENT_FILE)) {
    console.error("❌ deployment.json not found - cannot create backup");
    return false;
  }
  
  // Create backup directory if it doesn't exist
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupFile = path.join(BACKUP_DIR, `backup-${timestamp}.json`);
  
  try {
    const backupData = {
      timestamp,
      deployment: JSON.parse(fs.readFileSync(DEPLOYMENT_FILE, "utf8"))
    };
    
    // Include .env if it exists
    if (fs.existsSync(ENV_FILE)) {
      backupData.env = fs.readFileSync(ENV_FILE, "utf8");
    }
    
    fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2));
    console.log(`✅ Backup created: ${backupFile}`);
    return true;
  } catch (error) {
    console.error("❌ Failed to create backup:", error.message);
    return false;
  }
}

function main() {
  console.log("💾 Creating deployment backup...");
  
  if (!createBackup()) {
    console.error("\n❌ Backup creation failed");
    process.exit(1);
  }
  
  console.log("\n✅ Backup completed successfully");
}

if (require.main === module) {
  main();
}

module.exports = { createBackup };