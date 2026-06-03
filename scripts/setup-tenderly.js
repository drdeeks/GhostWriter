#!/usr/bin/env node

/**
 * Enterprise-grade Tenderly Alert Setup
 * Configures comprehensive monitoring for all critical contract events
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Enterprise-grade configuration
const TENDERLY_CONFIG = {
  project: process.env.TENDERLY_PROJECT || 'ghost-writer',
  username: process.env.TENDERLY_USERNAME,
  accessKey: process.env.TENDERLY_ACCESS_KEY,
  networkId: process.env.NEXT_PUBLIC_CHAIN_ID || '8453', // Base mainnet
  notificationChannels: {
    email: process.env.ALERT_EMAIL || 'alerts@ghostwriter.app',
    slack: process.env.SLACK_WEBHOOK_URL,
    pagerduty: process.env.PAGERDUTY_INTEGRATION_KEY
  },
  contracts: [
    {
      name: 'GhostWriterNFT',
      address: process.env.NEXT_PUBLIC_NFT_CONTRACT_ADDRESS,
      events: [
        { name: 'Transfer', severity: 'high', description: 'NFT transfer between addresses' },
        { name: 'Mint', severity: 'critical', description: 'New NFT minted' },
        { name: 'Burn', severity: 'high', description: 'NFT burned' },
        { name: 'Approval', severity: 'medium', description: 'NFT approval' },
        { name: 'ApprovalForAll', severity: 'medium', description: 'Approval for all NFTs' }
      ]
    },
    {
      name: 'StoryManager',
      address: process.env.NEXT_PUBLIC_STORY_MANAGER_ADDRESS,
      events: [
        { name: 'StoryCreated', severity: 'high', description: 'New story created' },
        { name: 'ContributionAdded', severity: 'high', description: 'New contribution added to story' },
        { name: 'StoryCompleted', severity: 'critical', description: 'Story marked as completed' },
        { name: 'OwnershipTransferred', severity: 'critical', description: 'Contract ownership transferred' },
        { name: 'Paused', severity: 'critical', description: 'Contract paused' },
        { name: 'Unpaused', severity: 'critical', description: 'Contract unpaused' }
      ]
    },
    {
      name: 'LiquidityPool',
      address: process.env.NEXT_PUBLIC_LIQUIDITY_POOL_ADDRESS,
      events: [
        { name: 'Deposited', severity: 'high', description: 'Funds deposited into pool' },
        { name: 'Withdrawn', severity: 'high', description: 'Funds withdrawn from pool' },
        { name: 'EmergencyWithdraw', severity: 'critical', description: 'Emergency withdrawal' },
        { name: 'RewardPaid', severity: 'medium', description: 'Rewards paid to contributor' },
        { name: 'Staked', severity: 'medium', description: 'Tokens staked' },
        { name: 'Unstaked', severity: 'medium', description: 'Tokens unstaked' }
      ]
    },
    {
      name: 'GhostWriterToken',
      address: process.env.NEXT_PUBLIC_TOKEN_CONTRACT_ADDRESS,
      events: [
        { name: 'Transfer', severity: 'high', description: 'Token transfer' },
        { name: 'Approval', severity: 'medium', description: 'Token approval' },
        { name: 'Mint', severity: 'critical', description: 'New tokens minted' },
        { name: 'Burn', severity: 'high', description: 'Tokens burned' }
      ]
    }
  ],
  // Transaction-level alerts
  transactionAlerts: [
    {
      name: 'HighValueTransfers',
      description: 'Large value transfers (>$10,000 USD equivalent)',
      condition: 'value > 10000000000000000000', // 10 ETH equivalent
      severity: 'critical'
    },
    {
      name: 'FailedTransactions',
      description: 'Any failed transaction',
      condition: 'status == false',
      severity: 'critical'
    },
    {
      name: 'HighGasUsage',
      description: 'Transactions using >5M gas',
      condition: 'gas_used > 5000000',
      severity: 'high'
    },
    {
      name: 'AdminFunctionCalls',
      description: 'Calls to admin-only functions',
      condition: 'to == contract_address && input.startsWith("0x")', // Simplified
      severity: 'critical'
    }
  ]
};

async function setupTenderlyAlerts() {
  try {
    console.log('🚀 Setting up enterprise-grade Tenderly alerts...');
    
    if (!TENDERLY_CONFIG.username || !TENDERLY_CONFIG.accessKey) {
      throw new Error('Tenderly credentials not configured. Set TENDERLY_USERNAME and TENDERLY_ACCESS_KEY');
    }
    
    const baseUrl = `https://api.tenderly.co/api/v1/account/${TENDERLY_CONFIG.username}/project/${TENDERLY_CONFIG.project}`;
    
    // Setup notification channels
    const notificationChannels = ['email'];
    if (TENDERLY_CONFIG.notificationChannels.slack) notificationChannels.push('slack');
    if (TENDERLY_CONFIG.notificationChannels.pagerduty) notificationChannels.push('pagerduty');
    
    // Create alerts for each contract event
    for (const contract of TENDERLY_CONFIG.contracts) {
      if (!contract.address) continue;
      
      console.log(`📡 Setting up alerts for ${contract.name} at ${contract.address}`);
      
      for (const event of contract.events) {
        const alertData = {
          network_id: TENDERLY_CONFIG.networkId,
          contract_address: contract.address,
          event_name: event.name,
          description: `[${event.severity.toUpperCase()}] ${event.description} (${contract.name})`,
          alert_type: 'event',
          conditions: [], // Alert on all occurrences
          notification_channels: notificationChannels
        };
        
        try {
          const response = await axios.post(`${baseUrl}/alerts`, alertData, {
            headers: {
              'X-Access-Key': TENDERLY_CONFIG.accessKey,
              'Content-Type': 'application/json'
            }
          });
          
          console.log(`✅ Created ${event.severity} alert for ${contract.name} ${event.name}: ${response.data.id}`);
        } catch (error) {
          console.error(`❌ Failed to create alert for ${contract.name} ${event.name}:`, error.response?.data || error.message);
        }
      }
    }
    
    // Create transaction-level alerts
    console.log('🔍 Setting up transaction-level alerts...');
    for (const alert of TENDERLY_CONFIG.transactionAlerts) {
      const alertData = {
        network_id: TENDERLY_CONFIG.networkId,
        name: alert.name,
        description: `[${alert.severity.toUpperCase()}] ${alert.description}`,
        alert_type: 'transaction',
        conditions: [
          {
            type: 'transaction',
            network_id: TENDERLY_CONFIG.networkId,
            condition: alert.condition
          }
        ],
        notification_channels: notificationChannels
      };
      
      try {
        const response = await axios.post(`${baseUrl}/alerts`, alertData, {
          headers: {
            'X-Access-Key': TENDERLY_CONFIG.accessKey,
            'Content-Type': 'application/json'
          }
        });
        
        console.log(`✅ Created ${alert.severity} transaction alert: ${alert.name} (${response.data.id})`);
      } catch (error) {
        console.error(`❌ Failed to create transaction alert ${alert.name}:`, error.response?.data || error.message);
      }
    }
    
    // Save alert configuration to file
    const outputPath = path.join(__dirname, 'tenderly-alerts-config.json');
    fs.writeFileSync(outputPath, JSON.stringify(TENDERLY_CONFIG, null, 2));
    console.log(`💾 Saved alert configuration to ${outputPath}`);
    
    console.log('🎉 Enterprise-grade Tenderly alerts setup complete!');
    
  } catch (error) {
    console.error('❌ Tenderly setup failed:', error.message);
    process.exit(1);
  }
}

setupTenderlyAlerts();