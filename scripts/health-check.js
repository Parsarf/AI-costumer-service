#!/usr/bin/env node

const http = require('http');
const https = require('https');

/**
 * Health check script for the Shopify AI Support Bot
 */

const DEFAULT_URL = 'http://localhost:3001';
const HEALTH_ENDPOINTS = ['/health', '/ready'];

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    
    const req = client.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({
            status: res.statusCode,
            data: json,
            headers: res.headers
          });
        } catch (error) {
          resolve({
            status: res.statusCode,
            data: data,
            headers: res.headers
          });
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

async function checkHealth(baseUrl) {
  console.log(`🔍 Checking health of ${baseUrl}...`);
  console.log('');
  
  for (const endpoint of HEALTH_ENDPOINTS) {
    const url = `${baseUrl}${endpoint}`;
    
    try {
      console.log(`📡 Testing ${endpoint}...`);
      const response = await makeRequest(url);
      
      if (response.status === 200) {
        console.log(`✅ ${endpoint} - OK (${response.status})`);
        if (response.data && typeof response.data === 'object') {
          console.log(`   Status: ${response.data.status || 'unknown'}`);
          if (response.data.timestamp) {
            console.log(`   Timestamp: ${response.data.timestamp}`);
          }
        }
      } else {
        console.log(`❌ ${endpoint} - Failed (${response.status})`);
        console.log(`   Response: ${JSON.stringify(response.data)}`);
      }
    } catch (error) {
      console.log(`❌ ${endpoint} - Error: ${error.message}`);
    }
    
    console.log('');
  }
}

async function main() {
  const baseUrl = process.argv[2] || DEFAULT_URL;
  
  console.log('🏥 Shopify AI Support Bot - Health Check');
  console.log('==========================================');
  console.log('');
  
  try {
    await checkHealth(baseUrl);
    console.log('🎉 Health check completed!');
  } catch (error) {
    console.error('💥 Health check failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { checkHealth, makeRequest };

