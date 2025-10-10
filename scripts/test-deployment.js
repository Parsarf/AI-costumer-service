#!/usr/bin/env node

const http = require('http');
const https = require('https');
const { checkHealth } = require('./health-check');

/**
 * Test deployment script for Shopify AI Support Bot
 */

const DEFAULT_URL = 'http://localhost:3001';

async function testDeployment(baseUrl) {
  console.log('🧪 Testing Shopify AI Support Bot Deployment');
  console.log('=============================================');
  console.log('');
  
  // Test health endpoints
  console.log('1. Testing Health Endpoints...');
  await checkHealth(baseUrl);
  
  // Test API endpoints
  console.log('2. Testing API Endpoints...');
  await testAPIEndpoints(baseUrl);
  
  // Test static files
  console.log('3. Testing Static Files...');
  await testStaticFiles(baseUrl);
  
  console.log('🎉 Deployment test completed!');
}

async function testAPIEndpoints(baseUrl) {
  const endpoints = [
    { path: '/api/health', method: 'GET', expectedStatus: 200 },
    { path: '/api/ready', method: 'GET', expectedStatus: 200 },
    { path: '/auth', method: 'GET', expectedStatus: 400 }, // Should require shop parameter
  ];
  
  for (const endpoint of endpoints) {
    try {
      const response = await makeRequest(`${baseUrl}${endpoint.path}`, endpoint.method);
      
      if (response.status === endpoint.expectedStatus) {
        console.log(`✅ ${endpoint.method} ${endpoint.path} - OK (${response.status})`);
      } else {
        console.log(`⚠️  ${endpoint.method} ${endpoint.path} - Unexpected status (${response.status}, expected ${endpoint.expectedStatus})`);
      }
    } catch (error) {
      console.log(`❌ ${endpoint.method} ${endpoint.path} - Error: ${error.message}`);
    }
  }
  
  console.log('');
}

async function testStaticFiles(baseUrl) {
  const files = [
    '/widget/loader.js',
    '/widget/static/js/main.js',
    '/widget/static/css/main.css',
  ];
  
  for (const file of files) {
    try {
      const response = await makeRequest(`${baseUrl}${file}`);
      
      if (response.status === 200) {
        console.log(`✅ ${file} - Available`);
      } else {
        console.log(`❌ ${file} - Not found (${response.status})`);
      }
    } catch (error) {
      console.log(`❌ ${file} - Error: ${error.message}`);
    }
  }
  
  console.log('');
}

function makeRequest(url, method = 'GET') {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    
    const options = {
      method: method,
      headers: {
        'User-Agent': 'Shopify-AI-Support-Bot-Test/1.0'
      }
    };
    
    const req = client.request(url, options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          data: data,
          headers: res.headers
        });
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    req.end();
  });
}

async function main() {
  const baseUrl = process.argv[2] || DEFAULT_URL;
  
  try {
    await testDeployment(baseUrl);
  } catch (error) {
    console.error('💥 Deployment test failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { testDeployment };

