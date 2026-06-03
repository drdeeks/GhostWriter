#!/usr/bin/env node

/**
 * Smart Contract Rollback Script
 * Rule: Rollback must be executed within 15 minutes of critical failure
 * Enforcement: Automated rollback with verification
 */

const { ethers } = require('hardhat');
const fs = require('fs');
const path = require('path');

async function rollbackContracts() {
  try {
    console.log('🚨 Starting contract rollback...');
    
    // Load previous deployment
    const previousDeploymentPath = path.join(__dirname, '../deployment-backup.json');
    if (!fs.existsSync(previousDeploymentPath)) {
      console.error('❌ No previous deployment backup found');
      process.exit(1);
    }
    
    const previousDeployment = JSON.parse(fs.readFileSync(previousDeploymentPath, 'utf8'));
    
    console.log(`📋 Rolling back to deployment from ${previousDeployment.timestamp}`);
    console.log(`🌐 Network: ${previousDeployment.network}`);
    
    // Redeploy contracts from previous deployment
    const signers = await ethers.getSigners();
    const [deployer] = signers;
    
    console.log(`👤 Deployer: ${deployer.address}`);
    
    // Deploy GhostWriterToken if it existed
    if (previousDeployment.contracts.GhostWriterToken) {
      console.log('📦 Redeploying GhostWriterToken...');
      const GhostWriterToken = await ethers.getContractFactory('GhostWriterToken');
      const token = await GhostWriterToken.deploy();
      await token.waitForDeployment();
      const tokenAddress = await token.getAddress();
      
      if (tokenAddress.toLowerCase() !== previousDeployment.contracts.GhostWriterToken.toLowerCase()) {
        console.warn(`⚠️  GhostWriterToken address changed: ${previousDeployment.contracts.GhostWriterToken} → ${tokenAddress}`);
      }
      console.log(`✅ GhostWriterToken redeployed to: ${tokenAddress}`);
    }
    
    // Deploy LiquidityPool
    console.log('📦 Redeploying LiquidityPool...');
    const LiquidityPool = await ethers.getContractFactory('LiquidityPool');
    const liquidityPool = await LiquidityPool.deploy();
    await liquidityPool.waitForDeployment();
    const liquidityPoolAddress = await liquidityPool.getAddress();
    
    if (liquidityPoolAddress.toLowerCase() !== previousDeployment.contracts.LiquidityPool.toLowerCase()) {
      console.warn(`⚠️  LiquidityPool address changed: ${previousDeployment.contracts.LiquidityPool} → ${liquidityPoolAddress}`);
    }
    console.log(`✅ LiquidityPool redeployed to: ${liquidityPoolAddress}`);
    
    // Deploy PriceOracle
    console.log('📦 Redeploying PriceOracle...');
    const PriceOracle = await ethers.getContractFactory('PriceOracle');
    const priceFeedAddress = previousDeployment.constructorArgs.PriceOracle[0];
    const priceOracle = await PriceOracle.deploy(priceFeedAddress);
    await priceOracle.waitForDeployment();
    const priceOracleAddress = await priceOracle.getAddress();
    
    if (priceOracleAddress.toLowerCase() !== previousDeployment.contracts.PriceOracle.toLowerCase()) {
      console.warn(`⚠️  PriceOracle address changed: ${previousDeployment.contracts.PriceOracle} → ${priceOracleAddress}`);
    }
    console.log(`✅ PriceOracle redeployed to: ${priceOracleAddress}`);
    
    // Deploy GhostWriterNFT
    console.log('📦 Redeploying GhostWriterNFT...');
    const GhostWriterNFT = await ethers.getContractFactory('GhostWriterNFT');
    const [hiddenURI, revealedURI] = previousDeployment.constructorArgs.GhostWriterNFT;
    const nft = await GhostWriterNFT.deploy(hiddenURI, revealedURI);
    await nft.waitForDeployment();
    const nftAddress = await nft.getAddress();
    
    if (nftAddress.toLowerCase() !== previousDeployment.contracts.GhostWriterNFT.toLowerCase()) {
      console.warn(`⚠️  GhostWriterNFT address changed: ${previousDeployment.contracts.GhostWriterNFT} → ${nftAddress}`);
    }
    console.log(`✅ GhostWriterNFT redeployed to: ${nftAddress}`);
    
    // Deploy StoryManager
    console.log('📦 Redeploying StoryManager...');
    const StoryManager = await ethers.getContractFactory('StoryManager');
    const [nftAddr, liquidityPoolAddr, priceOracleAddr] = previousDeployment.constructorArgs.StoryManager;
    const storyManager = await StoryManager.deploy(nftAddr, liquidityPoolAddr, priceOracleAddr);
    await storyManager.waitForDeployment();
    const storyManagerAddress = await storyManager.getAddress();
    
    if (storyManagerAddress.toLowerCase() !== previousDeployment.contracts.StoryManager.toLowerCase()) {
      console.warn(`⚠️  StoryManager address changed: ${previousDeployment.contracts.StoryManager} → ${storyManagerAddress}`);
    }
    console.log(`✅ StoryManager redeployed to: ${storyManagerAddress}`);
    
    // Set permissions
    console.log('🔗 Setting up permissions...');
    
    // Set StoryManager as NFT minter
    console.log('   Setting StoryManager as NFT minter...');
    const tx1 = await nft.setStoryManager(storyManagerAddress);
    await tx1.wait();
    console.log('✅ StoryManager set as NFT minter');
    
    // Set StoryManager as LiquidityPool depositor
    console.log('   Setting StoryManager as LiquidityPool depositor...');
    const tx2 = await liquidityPool.setStoryManager(storyManagerAddress);
    await tx2.wait();
    console.log('✅ StoryManager set as LiquidityPool depositor');
    
    // Restore deployment.json
    fs.writeFileSync('deployment.json', JSON.stringify(previousDeployment, null, 2));
    console.log('✅ deployment.json restored');
    
    console.log('\n🎉 Rollback completed successfully!');
    
  } catch (error) {
    console.error('❌ Rollback failed:', error);
    process.exit(1);
  }
}

rollbackContracts().catch(console.error);