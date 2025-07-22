#!/usr/bin/env node

/**
 * Rate Limiting Test Script for MicroRealEstate
 * Tests various rate limiting scenarios to ensure security measures are working
 */

import axios from 'axios';
import { performance } from 'perf_hooks';

const BASE_URL = 'http://localhost:8081';
const TEST_EMAIL = 'test@example.com';
const TEST_PASSWORD = 'testpassword123';

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, colors.green);
}

function logError(message) {
  log(`❌ ${message}`, colors.red);
}

function logWarning(message) {
  log(`⚠️  ${message}`, colors.yellow);
}

function logInfo(message) {
  log(`ℹ️  ${message}`, colors.blue);
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function makeRequest(url, data = {}, method = 'POST') {
  try {
    const config = {
      method,
      url: `${BASE_URL}${url}`,
      data,
      timeout: 5000,
      validateStatus: () => true // Don't throw on HTTP error status
    };
    
    const response = await axios(config);
    return {
      status: response.status,
      data: response.data,
      headers: response.headers
    };
  } catch (error) {
    return {
      status: error.response?.status || 500,
      data: error.response?.data || { error: error.message },
      headers: error.response?.headers || {}
    };
  }
}

async function testSigninRateLimit() {
  logInfo('Testing signin rate limiting...');
  
  const results = [];
  const startTime = performance.now();
  
  // Make 10 rapid signin attempts
  for (let i = 0; i < 10; i++) {
    const result = await makeRequest('/api/v2/authenticator/landlord/signin', {
      email: TEST_EMAIL,
      password: 'wrongpassword'
    });
    
    results.push({
      attempt: i + 1,
      status: result.status,
      rateLimitRemaining: result.headers['ratelimit-remaining'],
      rateLimitReset: result.headers['ratelimit-reset']
    });
    
    logInfo(`Attempt ${i + 1}: Status ${result.status}`);
    
    if (result.status === 429) {
      logWarning(`Rate limited after ${i + 1} attempts`);
      break;
    }
    
    // Small delay between requests
    await sleep(100);
  }
  
  const endTime = performance.now();
  const duration = Math.round(endTime - startTime);
  
  // Analyze results
  const rateLimitedAttempts = results.filter(r => r.status === 429);
  
  if (rateLimitedAttempts.length > 0) {
    logSuccess(`Signin rate limiting is working! Rate limited after ${rateLimitedAttempts[0].attempt} attempts`);
    logInfo(`Test completed in ${duration}ms`);
    return true;
  } else {
    logError('Signin rate limiting may not be working properly');
    return false;
  }
}

async function testSignupRateLimit() {
  logInfo('Testing signup rate limiting...');
  
  const results = [];
  
  // Make multiple signup attempts
  for (let i = 0; i < 8; i++) {
    const result = await makeRequest('/api/v2/authenticator/landlord/signup', {
      firstname: 'Test',
      lastname: 'User',
      email: `test${i}@example.com`,
      password: TEST_PASSWORD
    });
    
    results.push({
      attempt: i + 1,
      status: result.status
    });
    
    logInfo(`Signup attempt ${i + 1}: Status ${result.status}`);
    
    if (result.status === 429) {
      logWarning(`Signup rate limited after ${i + 1} attempts`);
      break;
    }
    
    await sleep(200);
  }
  
  const rateLimitedAttempts = results.filter(r => r.status === 429);
  
  if (rateLimitedAttempts.length > 0) {
    logSuccess('Signup rate limiting is working!');
    return true;
  } else {
    logWarning('Signup rate limiting may need adjustment');
    return false;
  }
}

async function testPasswordResetRateLimit() {
  logInfo('Testing password reset rate limiting...');
  
  const results = [];
  
  // Make multiple password reset attempts
  for (let i = 0; i < 5; i++) {
    const result = await makeRequest('/api/v2/authenticator/landlord/forgotpassword', {
      email: TEST_EMAIL
    });
    
    results.push({
      attempt: i + 1,
      status: result.status
    });
    
    logInfo(`Password reset attempt ${i + 1}: Status ${result.status}`);
    
    if (result.status === 429) {
      logWarning(`Password reset rate limited after ${i + 1} attempts`);
      break;
    }
    
    await sleep(300);
  }
  
  const rateLimitedAttempts = results.filter(r => r.status === 429);
  
  if (rateLimitedAttempts.length > 0) {
    logSuccess('Password reset rate limiting is working!');
    return true;
  } else {
    logWarning('Password reset rate limiting may need adjustment');
    return false;
  }
}

async function testTenantSigninRateLimit() {
  logInfo('Testing tenant signin rate limiting...');
  
  const results = [];
  
  // Make multiple tenant signin attempts
  for (let i = 0; i < 8; i++) {
    const result = await makeRequest('/api/v2/authenticator/tenant/signin', {
      email: TEST_EMAIL
    });
    
    results.push({
      attempt: i + 1,
      status: result.status
    });
    
    logInfo(`Tenant signin attempt ${i + 1}: Status ${result.status}`);
    
    if (result.status === 429) {
      logWarning(`Tenant signin rate limited after ${i + 1} attempts`);
      break;
    }
    
    await sleep(150);
  }
  
  const rateLimitedAttempts = results.filter(r => r.status === 429);
  
  if (rateLimitedAttempts.length > 0) {
    logSuccess('Tenant signin rate limiting is working!');
    return true;
  } else {
    logWarning('Tenant signin rate limiting may need adjustment');
    return false;
  }
}

async function testGeneralApiRateLimit() {
  logInfo('Testing general API rate limiting...');
  
  const results = [];
  const startTime = performance.now();
  
  // Make many rapid API requests
  for (let i = 0; i < 50; i++) {
    const result = await makeRequest('/health', {}, 'GET');
    
    if (i % 10 === 0) {
      logInfo(`API request ${i + 1}: Status ${result.status}`);
    }
    
    if (result.status === 429) {
      logWarning(`General API rate limited after ${i + 1} requests`);
      const endTime = performance.now();
      logInfo(`Rate limit reached in ${Math.round(endTime - startTime)}ms`);
      return true;
    }
  }
  
  logWarning('General API rate limiting may be too lenient or not configured');
  return false;
}

async function testRateLimitHeaders() {
  logInfo('Testing rate limit headers...');
  
  const result = await makeRequest('/api/v2/authenticator/landlord/signin', {
    email: TEST_EMAIL,
    password: 'wrongpassword'
  });
  
  const headers = result.headers;
  const rateLimitHeaders = [
    'ratelimit-limit',
    'ratelimit-remaining',
    'ratelimit-reset'
  ];
  
  const presentHeaders = rateLimitHeaders.filter(header => headers[header]);
  
  if (presentHeaders.length > 0) {
    logSuccess(`Rate limit headers present: ${presentHeaders.join(', ')}`);
    presentHeaders.forEach(header => {
      logInfo(`${header}: ${headers[header]}`);
    });
    return true;
  } else {
    logWarning('Rate limit headers not found in response');
    return false;
  }
}

async function runAllTests() {
  log(`${colors.bold}🔒 MicroRealEstate Rate Limiting Security Test${colors.reset}`);
  log('='.repeat(50));
  
  const tests = [
    { name: 'Signin Rate Limiting', fn: testSigninRateLimit },
    { name: 'Signup Rate Limiting', fn: testSignupRateLimit },
    { name: 'Password Reset Rate Limiting', fn: testPasswordResetRateLimit },
    { name: 'Tenant Signin Rate Limiting', fn: testTenantSigninRateLimit },
    { name: 'General API Rate Limiting', fn: testGeneralApiRateLimit },
    { name: 'Rate Limit Headers', fn: testRateLimitHeaders }
  ];
  
  const results = [];
  
  for (const test of tests) {
    log(`\n${colors.bold}Testing: ${test.name}${colors.reset}`);
    log('-'.repeat(30));
    
    try {
      const result = await test.fn();
      results.push({ name: test.name, passed: result });
      
      if (result) {
        logSuccess(`${test.name} - PASSED`);
      } else {
        logError(`${test.name} - FAILED`);
      }
    } catch (error) {
      logError(`${test.name} - ERROR: ${error.message}`);
      results.push({ name: test.name, passed: false, error: error.message });
    }
    
    // Wait between tests to avoid interference
    await sleep(1000);
  }
  
  // Summary
  log(`\n${colors.bold}📊 Test Summary${colors.reset}`);
  log('='.repeat(50));
  
  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  
  results.forEach(result => {
    const status = result.passed ? '✅ PASS' : '❌ FAIL';
    const error = result.error ? ` (${result.error})` : '';
    log(`${status} - ${result.name}${error}`);
  });
  
  log(`\n${colors.bold}Overall: ${passed}/${total} tests passed${colors.reset}`);
  
  if (passed === total) {
    logSuccess('🎉 All rate limiting tests passed! Your application is well protected.');
  } else if (passed > total / 2) {
    logWarning('⚠️  Some rate limiting tests failed. Review the configuration.');
  } else {
    logError('🚨 Many rate limiting tests failed. Immediate attention required!');
  }
  
  return passed === total;
}

// Run tests if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      logError(`Test execution failed: ${error.message}`);
      process.exit(1);
    });
}

export { runAllTests };
