#!/usr/bin/env node

/**
 * Dependency Validation Script
 * Rule: All dependencies must be pinned and verified
 * Enforcement: CI pipeline fails if dependencies are invalid
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function checkDependencies() {
  try {
    console.log('🔍 Checking dependency integrity...');
    
    // Check if package-lock.json exists
    if (!fs.existsSync('package-lock.json')) {
      console.error('❌ package-lock.json not found');
      process.exit(1);
    }
    
    // Check for vulnerable dependencies
    console.log('🔍 Checking for vulnerable dependencies...');
    try {
      execSync('npm audit --production', { stdio: 'ignore' });
    } catch (error) {
      console.error('❌ Vulnerable dependencies found');
      console.error('Run `npm audit fix` to resolve vulnerabilities');
      process.exit(1);
    }
    
    // Check for unpinned dependencies
    console.log('🔍 Checking for unpinned dependencies...');
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const dependencies = Object.keys(packageJson.dependencies || {});
    const devDependencies = Object.keys(packageJson.devDependencies || {});
    
    let hasUnpinned = false;
    
    [...dependencies, ...devDependencies].forEach(dep => {
      const version = packageJson.dependencies?.[dep] || packageJson.devDependencies?.[dep];
      if (version && (version.startsWith('^') || version.startsWith('~'))) {
        console.error(`❌ Unpinned dependency: ${dep}@${version}`);
        hasUnpinned = true;
      }
    });
    
    if (hasUnpinned) {
      console.error('All dependencies must be pinned to exact versions (no ^ or ~)');
      process.exit(1);
    }
    
    // Verify node_modules matches package-lock.json
    console.log('🔍 Verifying node_modules integrity...');
    try {
      execSync('npm ci --dry-run', { stdio: 'ignore' });
    } catch (error) {
      console.error('❌ node_modules does not match package-lock.json');
      console.error('Run `npm ci` to fix dependency tree');
      process.exit(1);
    }
    
    console.log('✅ Dependency validation passed');
    return true;
  } catch (error) {
    console.error('❌ Dependency validation failed:', error.message);
    process.exit(1);
  }
}

checkDependencies();