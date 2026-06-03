#!/usr/bin/env node

// Custom build script to force standard Next.js compiler
process.env.NEXT_DISABLE_TURBOPACK = '1';

const { execSync } = require('child_process');
const path = require('path');

try {
  console.log('Starting Next.js build with standard compiler...');
  execSync(`node ${path.join('node_modules', 'next', 'dist', 'bin', 'next')} build`, {
    stdio: 'inherit',
    env: { ...process.env, NEXT_DISABLE_TURBOPACK: '1' }
  });
  console.log('Build completed successfully!');
} catch (error) {
  console.error('Build failed:', error);
  process.exit(1);
}