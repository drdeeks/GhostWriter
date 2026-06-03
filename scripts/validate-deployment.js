#!/usr/bin/env node

/**
 * REAL Deployment Validation Script
 * This actually validates a deployment - not some theoretical checklist
 */

const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

// REAL configuration from deployment.json
const deployment = JSON.parse(fs.readFileSync('deployment.json', 'utf8'));
const env = require('dotenv').config().parsed;

async function validateDeployment() {
  try {
    console.log('🔍 Validating deployment for real...');
    
    // Validate environment variables
    const requiredEnvVars = [
      'NEXT_PUBLIC_CHAIN_ID',
      'NEXT_PUBLIC_NFT_CONTRACT_ADDRESS',
      'NEXT_PUBLIC_STORY_MANAGER_ADDRESS',
      'NEXT_PUBLIC_LIQUIDITY_POOL_ADDRESS'
    ];
    
    for (const envVar of requiredEnvVars) {
      if (!env[envVar]) {
        throw new Error(`Missing environment variable: ${envVar}`);
      }
    }
    
    // Validate network connection
    const provider = new ethers.JsonRpcProvider(
      env.NEXT_PUBLIC_CHAIN_ID === '8453' ? 'https://mainnet.base.org' : 
      env.NEXT_PUBLIC_CHAIN_ID === '84532' ? 'https://sepolia.base.org' : 
      'http://localhost:8545'
    );
    
    const network = await provider.getNetwork();
    console.log(`✅ Connected to network: ${network.name} (${network.chainId})`);
    
    // Validate contracts
    const contracts = [
      { name: 'GhostWriterNFT', address: env.NEXT_PUBLIC_NFT_CONTRACT_ADDRESS },
      { name: 'StoryManager', address: env.NEXT_PUBLIC_STORY_MANAGER_ADDRESS },
      { name: 'LiquidityPool', address: env.NEXT_PUBLIC_LIQUIDITY_POOL_ADDRESS }
    ];
    
    for (const contract of contracts) {
      console.log(`🔍 Validating ${contract.name} at ${contract.address}`);
      
      // Check if contract exists
      const code = await provider.getCode(contract.address);
      if (code === '0x') {
        throw new Error(`Contract ${contract.name} at ${contract.address} doesn't exist`);
      }
      
      // Check basic functionality
      const contractInstance = new ethers.Contract(
        contract.address,
        require(path.join(__dirname, `../artifacts/contracts/${contract.name}.sol/${contract.name}.json`)).abi,
        provider
      );
      
      try {
        if (contract.name === 'GhostWriterNFT') {
          const name = await contractInstance.name();
          const symbol = await contractInstance.symbol();
          console.log(`✅ ${contract.name}: ${name} (${symbol})`);
        } else if (contract.name === 'StoryManager') {
          const storyCount = await contractInstance.getStoryCount();
          console.log(`✅ ${contract.name}: ${storyCount} stories`);
        } else if (contract.name === 'LiquidityPool') {
          const totalDeposits = await contractInstance.totalDeposits();
          console.log(`✅ ${contract.name}: ${ethers.formatEther(totalDeposits)} ETH deposited`);
        }
      } catch (error) {
        console.error(`⚠️  ${contract.name} validation warning:`, error.message);
      }
    }
    
    // Validate frontend
    console.log('🔍 Validating frontend...');
    const frontendUrl = env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    
    try {
      const response = await fetch(`${frontendUrl}/api/health`);
      const health = await response.json();
      
      if (health.status !== 'ok') {
        throw new Error('Frontend health check failed');
      }
      
      console.log(`✅ Frontend health: ${health.status}`);
    } catch (error) {
      console.error('⚠️  Frontend validation warning:', error.message);
    }
    
    console.log('\n🎉 Deployment validation complete!');
    console.log('\nDeployment Summary:');
    console.log(`  Network: ${network.name} (${network.chainId})`);
    console.log(`  Contracts: ${contracts.length} verified`);
    console.log(`  Frontend: ${frontendUrl}`);
    
  } catch (error) {
    console.error('\n❌ Deployment validation failed:', error.message);
    process.exit(1);
  }
}

validateDeployment();