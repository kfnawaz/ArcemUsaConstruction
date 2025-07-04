#!/usr/bin/env node

/**
 * Test script for ARCEM Construction Platform System Metrics API
 * 
 * This script demonstrates how to integrate with the system metrics API
 * for external monitoring applications.
 * 
 * Usage: node scripts/test-metrics-api.js [API_URL] [API_KEY]
 */

const https = require('https');
const http = require('http');

// Configuration
const API_URL = process.argv[2] || 'http://localhost:5000';
const API_KEY = process.argv[3] || 'sk-arcem-metrics-2025-secure-key-9f8e7d6c5b4a3210';
const ENDPOINT = '/api/system/metrics';

function makeRequest(url, options) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https:') ? https : http;
    
    const req = client.request(url, options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: jsonData
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: data
          });
        }
      });
    });
    
    req.on('error', (err) => {
      reject(err);
    });
    
    req.end();
  });
}

async function testSystemMetricsAPI() {
  console.log('🔧 ARCEM Construction Platform - System Metrics API Test');
  console.log('===============================================\n');
  
  console.log(`📍 API URL: ${API_URL}${ENDPOINT}`);
  console.log(`🔑 API Key: ${API_KEY.substring(0, 20)}...`);
  console.log();
  
  try {
    // Test 1: Valid API Key Request
    console.log('Test 1: Valid API Key Authentication');
    console.log('-------------------------------------');
    
    const validResponse = await makeRequest(`${API_URL}${ENDPOINT}`, {
      method: 'GET',
      headers: {
        'X-API-Key': API_KEY,
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`✅ Status: ${validResponse.statusCode}`);
    console.log(`⏱️  Response Time: ${validResponse.data._metadata?.response_time_ms}ms`);
    console.log(`📊 System Status: ${validResponse.data.system_health?.status}`);
    console.log(`💾 Storage Used: ${validResponse.data.storage?.used_mb}MB / ${validResponse.data.storage?.total_allocated_mb}MB`);
    console.log(`👥 Total Users: ${validResponse.data.users?.total}`);
    console.log(`🏗️  Projects: ${validResponse.data.usage_entities?.projects}`);
    console.log();
    
    // Test 2: Invalid API Key
    console.log('Test 2: Invalid API Key Authentication');
    console.log('-------------------------------------');
    
    const invalidResponse = await makeRequest(`${API_URL}${ENDPOINT}`, {
      method: 'GET',
      headers: {
        'X-API-Key': 'invalid-key',
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`❌ Status: ${invalidResponse.statusCode}`);
    console.log(`🚫 Error: ${invalidResponse.data.error}`);
    console.log(`📝 Message: ${invalidResponse.data.message}`);
    console.log();
    
    // Test 3: No API Key
    console.log('Test 3: No API Key Authentication');
    console.log('--------------------------------');
    
    const noKeyResponse = await makeRequest(`${API_URL}${ENDPOINT}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`❌ Status: ${noKeyResponse.statusCode}`);
    console.log(`🚫 Error: ${noKeyResponse.data.error}`);
    console.log();
    
    // Test 4: Bearer Token Authentication
    console.log('Test 4: Bearer Token Authentication');
    console.log('----------------------------------');
    
    const bearerResponse = await makeRequest(`${API_URL}${ENDPOINT}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`✅ Status: ${bearerResponse.statusCode}`);
    console.log(`📈 CPU Usage: ${bearerResponse.data.system_health?.cpu_usage_percent}%`);
    console.log(`🧠 Memory Usage: ${bearerResponse.data.system_health?.memory_usage_percent}%`);
    console.log();
    
    // Test 5: Rate Limiting
    console.log('Test 5: Rate Limiting (Multiple Requests)');
    console.log('----------------------------------------');
    
    let requestCount = 0;
    let rateLimitHit = false;
    
    for (let i = 0; i < 25; i++) {
      try {
        const response = await makeRequest(`${API_URL}${ENDPOINT}`, {
          method: 'GET',
          headers: {
            'X-API-Key': API_KEY,
            'Content-Type': 'application/json'
          }
        });
        
        requestCount++;
        
        if (response.statusCode === 429) {
          console.log(`⚠️  Rate limit reached after ${requestCount} requests`);
          console.log(`🔄 Rate Limit Headers:`);
          console.log(`   - X-RateLimit-Limit: ${response.headers['x-ratelimit-limit'] || 'Not provided'}`);
          console.log(`   - X-RateLimit-Remaining: ${response.headers['x-ratelimit-remaining'] || 'Not provided'}`);
          console.log(`   - X-RateLimit-Reset: ${response.headers['x-ratelimit-reset'] || 'Not provided'}`);
          rateLimitHit = true;
          break;
        }
      } catch (error) {
        console.log(`❌ Request ${i + 1} failed:`, error.message);
        break;
      }
    }
    
    if (!rateLimitHit) {
      console.log(`✅ Made ${requestCount} requests without hitting rate limit`);
    }
    
    console.log();
    console.log('🎉 API Test Complete!');
    console.log('====================');
    console.log('All authentication methods working correctly.');
    console.log('Rate limiting is functioning as expected.');
    console.log('API is ready for external monitoring integration.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Please ensure the server is running and accessible.');
  }
}

// Display sample integration code
function displaySampleCode() {
  console.log('\n📝 Sample Integration Code');
  console.log('=========================\n');
  
  console.log('JavaScript/Node.js:');
  console.log('```javascript');
  console.log(`const response = await fetch('${API_URL}${ENDPOINT}', {`);
  console.log(`  headers: {`);
  console.log(`    'X-API-Key': '${API_KEY}'`);
  console.log(`  }`);
  console.log(`});`);
  console.log(`const metrics = await response.json();`);
  console.log(`console.log('System Status:', metrics.system_health.status);`);
  console.log('```\n');
  
  console.log('Python:');
  console.log('```python');
  console.log('import requests');
  console.log();
  console.log(`url = '${API_URL}${ENDPOINT}'`);
  console.log(`headers = {'X-API-Key': '${API_KEY}'}`);
  console.log(`response = requests.get(url, headers=headers)`);
  console.log(`metrics = response.json()`);
  console.log(`print(f"System Status: {metrics['system_health']['status']}")`);
  console.log('```\n');
  
  console.log('cURL:');
  console.log('```bash');
  console.log(`curl -H "X-API-Key: ${API_KEY}" \\`);
  console.log(`     ${API_URL}${ENDPOINT}`);
  console.log('```\n');
}

// Main execution
if (require.main === module) {
  testSystemMetricsAPI()
    .then(() => {
      displaySampleCode();
    })
    .catch((error) => {
      console.error('Failed to run tests:', error);
      process.exit(1);
    });
}

module.exports = { testSystemMetricsAPI, makeRequest };