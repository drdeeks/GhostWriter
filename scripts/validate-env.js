#!/usr/bin/env node

/**
 * Environment Variable Validation Script
 * Rule: All environment variables must be validated before deployment
 * Enforcement: CI pipeline fails if validation fails
 */

const { cleanEnv, str, num, bool, url } = require('envalid');

function validateEnvironment() {
  try {
    const env = cleanEnv(process.env, {
      // Required for all environments
      NEXT_PUBLIC_CHAIN_ID: num(),
      NEXT_PUBLIC_BASE_URL: url(),
      NEXT_PUBLIC_ONCHAINKIT_PROJECT_ID: str(),
      NEXT_PUBLIC_ONCHAINKIT_API_KEY: str(),
      
      // Required for contract deployment
      PRIVATE_KEY: str({ default: '' }),
      KEYSTORE_PATH: str({ default: '' }),
      KEYSTORE_PASSWORD: str({ default: '' }),
      
      // Required for contract addresses
      NEXT_PUBLIC_NFT_CONTRACT_ADDRESS: str({ default: '' }),
      NEXT_PUBLIC_STORY_MANAGER_ADDRESS: str({ default: '' }),
      NEXT_PUBLIC_LIQUIDITY_POOL_ADDRESS: str({ default: '' }),
      NEXT_PUBLIC_PRICE_ORACLE_ADDRESS: str({ default: '' }),
      
      // Optional
      OPENAI_API_KEY: str({ default: '' }),
      BASESCAN_API_KEY: str({ default: '' }),
      MONADSCAN_API_KEY: str({ default: '' }),
      MODESCAN_API_KEY: str({ default: '' }),
      
      // Feature flags
      ENABLE_PERFORMANCE_MONITORING: bool({ default: false }),
      ENABLE_HAPTIC_FEEDBACK: bool({ default: false }),
    });
    
    console.log('✅ Environment validation passed');
    return true;
  } catch (error) {
    console.error('❌ Environment validation failed:');
    console.error(error.message);
    process.exit(1);
  }
}

validateEnvironment();