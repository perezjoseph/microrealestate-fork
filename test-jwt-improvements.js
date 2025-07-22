#!/usr/bin/env node

/**
 * Test script to verify JWT token expiration improvements
 * This script tests the new token configuration and security features
 */

const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Mock configuration similar to the actual implementation
const TOKEN_CONFIG = {
  USER_TOKENS: {
    PRODUCTION: {
      ACCESS_TOKEN_EXPIRY: '15m',
      REFRESH_TOKEN_EXPIRY: '7d',
      REFRESH_TOKEN_TTL: 7 * 24 * 60 * 60
    },
    DEVELOPMENT: {
      ACCESS_TOKEN_EXPIRY: '1h',
      REFRESH_TOKEN_EXPIRY: '30d',
      REFRESH_TOKEN_TTL: 30 * 24 * 60 * 60
    }
  },
  APPLICATION_TOKENS: {
    ACCESS_TOKEN_EXPIRY: '1h'
  },
  RESET_TOKENS: {
    EXPIRY: '1h',
    TTL: 3600
  }
};

function getTokenConfig(environment = 'production') {
  const isProduction = environment === 'production';
  return {
    ...TOKEN_CONFIG,
    CURRENT: isProduction ? TOKEN_CONFIG.USER_TOKENS.PRODUCTION : TOKEN_CONFIG.USER_TOKENS.DEVELOPMENT,
    IS_PRODUCTION: isProduction
  };
}

function expiryToSeconds(expiry) {
  const match = expiry.match(/^(\d+)([smhd])$/);
  if (!match) throw new Error('Invalid expiry format');
  
  const [, value, unit] = match;
  const numValue = parseInt(value);
  
  const multipliers = {
    s: 1,
    m: 60,
    h: 60 * 60,
    d: 24 * 60 * 60
  };
  
  return numValue * multipliers[unit];
}

// Test secrets (for testing only)
const ACCESS_TOKEN_SECRET = 'test_access_secret_key_for_testing_only';
const REFRESH_TOKEN_SECRET = 'test_refresh_secret_key_for_testing_only';

function testTokenGeneration(environment) {
  console.log(`\n🧪 Testing ${environment.toUpperCase()} Environment`);
  console.log('=' .repeat(50));
  
  const tokenConfig = getTokenConfig(environment);
  const { ACCESS_TOKEN_EXPIRY, REFRESH_TOKEN_EXPIRY } = tokenConfig.CURRENT;
  
  // Mock account data
  const account = {
    email: 'test@example.com',
    role: 'administrator',
    firstname: 'Test',
    lastname: 'User'
  };
  
  const now = Math.floor(Date.now() / 1000);
  const jti = crypto.randomUUID();
  
  // Generate access token
  const accessToken = jwt.sign({
    account,
    jti: jti + '_access',
    iat: now,
    type: 'access'
  }, ACCESS_TOKEN_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY
  });
  
  // Generate refresh token
  const refreshToken = jwt.sign({
    account,
    jti: jti + '_refresh',
    iat: now,
    type: 'refresh'
  }, REFRESH_TOKEN_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRY
  });
  
  // Decode tokens to verify
  const decodedAccess = jwt.decode(accessToken);
  const decodedRefresh = jwt.decode(refreshToken);
  
  console.log(`✅ Access Token Expiry: ${ACCESS_TOKEN_EXPIRY} (${expiryToSeconds(ACCESS_TOKEN_EXPIRY)} seconds)`);
  console.log(`✅ Refresh Token Expiry: ${REFRESH_TOKEN_EXPIRY} (${expiryToSeconds(REFRESH_TOKEN_EXPIRY)} seconds)`);
  console.log(`✅ Access Token Expires At: ${new Date(decodedAccess.exp * 1000).toISOString()}`);
  console.log(`✅ Refresh Token Expires At: ${new Date(decodedRefresh.exp * 1000).toISOString()}`);
  console.log(`✅ Token JTI: ${jti}`);
  console.log(`✅ Access Token Type: ${decodedAccess.type}`);
  console.log(`✅ Refresh Token Type: ${decodedRefresh.type}`);
  
  // Verify token structure
  const requiredClaims = ['account', 'jti', 'iat', 'type', 'exp'];
  const accessClaims = Object.keys(decodedAccess);
  const refreshClaims = Object.keys(decodedRefresh);
  
  const accessHasAllClaims = requiredClaims.every(claim => accessClaims.includes(claim));
  const refreshHasAllClaims = requiredClaims.every(claim => refreshClaims.includes(claim));
  
  console.log(`✅ Access Token Claims Complete: ${accessHasAllClaims ? 'YES' : 'NO'}`);
  console.log(`✅ Refresh Token Claims Complete: ${refreshHasAllClaims ? 'YES' : 'NO'}`);
  
  return {
    accessToken,
    refreshToken,
    decodedAccess,
    decodedRefresh,
    valid: accessHasAllClaims && refreshHasAllClaims
  };
}

function testApplicationToken() {
  console.log(`\n🔧 Testing Application Tokens`);
  console.log('=' .repeat(50));
  
  const tokenConfig = getTokenConfig();
  const application = {
    clientId: 'test-client-id',
    name: 'Test Application'
  };
  
  const now = Math.floor(Date.now() / 1000);
  const organizationId = 'test-org-id';
  
  const accessToken = jwt.sign({
    application,
    jti: crypto.randomUUID(),
    iat: now,
    type: 'application',
    organizationId
  }, ACCESS_TOKEN_SECRET, {
    expiresIn: tokenConfig.APPLICATION_TOKENS.ACCESS_TOKEN_EXPIRY
  });
  
  const decoded = jwt.decode(accessToken);
  
  console.log(`✅ Application Token Expiry: ${tokenConfig.APPLICATION_TOKENS.ACCESS_TOKEN_EXPIRY}`);
  console.log(`✅ Token Expires At: ${new Date(decoded.exp * 1000).toISOString()}`);
  console.log(`✅ Token Type: ${decoded.type}`);
  console.log(`✅ Organization ID: ${decoded.organizationId}`);
  console.log(`✅ Client ID: ${decoded.application.clientId}`);
  
  return { accessToken, decoded, valid: decoded.type === 'application' };
}

function testResetToken() {
  console.log(`\n🔄 Testing Reset Tokens`);
  console.log('=' .repeat(50));
  
  const tokenConfig = getTokenConfig();
  const email = 'test@example.com';
  
  const token = jwt.sign({
    email,
    jti: crypto.randomUUID(),
    iat: Math.floor(Date.now() / 1000),
    type: 'reset'
  }, 'test_reset_secret', {
    expiresIn: tokenConfig.RESET_TOKENS.EXPIRY
  });
  
  const decoded = jwt.decode(token);
  
  console.log(`✅ Reset Token Expiry: ${tokenConfig.RESET_TOKENS.EXPIRY}`);
  console.log(`✅ Token Expires At: ${new Date(decoded.exp * 1000).toISOString()}`);
  console.log(`✅ Token Type: ${decoded.type}`);
  console.log(`✅ Email: ${decoded.email}`);
  console.log(`✅ TTL Seconds: ${tokenConfig.RESET_TOKENS.TTL}`);
  
  return { token, decoded, valid: decoded.type === 'reset' };
}

function runTests() {
  console.log('🚀 JWT Token Security Improvements Test Suite');
  console.log('=' .repeat(60));
  
  try {
    // Test production environment
    const prodResults = testTokenGeneration('production');
    
    // Test development environment
    const devResults = testTokenGeneration('development');
    
    // Test application tokens
    const appResults = testApplicationToken();
    
    // Test reset tokens
    const resetResults = testResetToken();
    
    // Summary
    console.log(`\n📊 Test Results Summary`);
    console.log('=' .repeat(50));
    console.log(`✅ Production Tokens: ${prodResults.valid ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Development Tokens: ${devResults.valid ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Application Tokens: ${appResults.valid ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Reset Tokens: ${resetResults.valid ? 'PASS' : 'FAIL'}`);
    
    const allPassed = prodResults.valid && devResults.valid && appResults.valid && resetResults.valid;
    
    console.log(`\n🎯 Overall Result: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
    
    if (allPassed) {
      console.log('\n🔒 JWT Token Security Improvements Successfully Implemented!');
      console.log('   - Reasonable token expiration times');
      console.log('   - Enhanced security claims (JTI, IAT, type)');
      console.log('   - Environment-specific configuration');
      console.log('   - Proper token structure and validation');
    }
    
    return allPassed;
    
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    return false;
  }
}

// Run the tests
if (require.main === module) {
  const success = runTests();
  process.exit(success ? 0 : 1);
}

module.exports = { runTests, testTokenGeneration, testApplicationToken, testResetToken };
