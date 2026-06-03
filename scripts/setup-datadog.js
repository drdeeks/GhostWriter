#!/usr/bin/env node

const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Configuration
const DATADOG_API = 'https://api.datadoghq.com/api/v1';
const PROJECT_DIR = path.join(__dirname, '..');

// Environment variables
const {
  DATADOG_API_KEY,
  DATADOG_APP_KEY,
} = process.env;

if (!DATADOG_API_KEY || !DATADOG_APP_KEY) {
  console.error('Missing Datadog environment variables');
  process.exit(1);
}

// Axios instance for Datadog API
const datadogApi = axios.create({
  baseURL: DATADOG_API,
  headers: {
    'DD-API-KEY': DATADOG_API_KEY,
    'DD-APPLICATION-KEY': DATADOG_APP_KEY,
    'Content-Type': 'application/json',
  },
});

// Setup Datadog
const setupDatadog = async () => {
  try {
    console.log('Setting up Datadog monitoring...');
    
    // Create dashboards
    console.log('Creating Datadog dashboards...');
    
    const dashboard = {
      title: 'GhostWriter - Smart Contract Monitoring',
      description: 'Monitoring dashboard for GhostWriter smart contracts',
      widgets: [
        {
          definition: {
            title: 'Transaction Volume',
            type: 'timeseries',
            requests: [
              {
                q: 'sum:ethereum.transactions{network:base}.as_count()',
                display_type: 'line',
              }
            ]
          }
        },
        {
          definition: {
            title: 'Gas Usage',
            type: 'timeseries',
            requests: [
              {
                q: 'avg:ethereum.gas_used{network:base}',
                display_type: 'line',
              }
            ]
          }
        },
        {
          definition: {
            title: 'Contract Events',
            type: 'event_stream',
            query: 'sources:ethereum network:base',
            event_size: 'l',
          }
        }
      ],
      layout_type: 'ordered',
      is_read_only: false,
    };
    
    const dashboardResponse = await datadogApi.post('/dashboard', dashboard);
    console.log(`Created dashboard: ${dashboardResponse.data.id}`);
    
    // Create monitors
    console.log('Creating Datadog monitors...');
    
    const monitors = [
      {
        name: 'High Transaction Volume',
        type: 'query alert',
        query: 'sum(last_5m):sum:ethereum.transactions{network:base}.as_count() > 1000',
        message: 'High transaction volume detected on Base network',
        tags: ['env:production', 'service:ghostwriter', 'team:engineering'],
        options: {
          notify_no_data: false,
          renotify_interval: 60,
          include_tags: true,
        }
      },
      {
        name: 'High Gas Usage',
        type: 'query alert',
        query: 'avg(last_5m):avg:ethereum.gas_used{network:base} > 5000000',
        message: 'High gas usage detected on Base network',
        tags: ['env:production', 'service:ghostwriter', 'team:engineering'],
        options: {
          notify_no_data: false,
          renotify_interval: 60,
          include_tags: true,
        }
      }
    ];
    
    for (const monitor of monitors) {
      const monitorResponse = await datadogApi.post('/monitor', monitor);
      console.log(`Created monitor: ${monitorResponse.data.name}`);
    }
    
    console.log('Datadog setup completed successfully!');
  } catch (error) {
    console.error('Error setting up Datadog:', error.response?.data || error.message);
    process.exit(1);
  }
};

// Run setup
setupDatadog();