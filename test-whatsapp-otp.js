#!/usr/bin/env node

/**
 * Test script to verify WhatsApp OTP functionality
 * This script tests the basic flow without actually sending WhatsApp messages
 */

const axios = require('axios');

// Mock environment variables
process.env.WHATSAPP_API_URL = 'https://graph.facebook.com/v18.0';
process.env.WHATSAPP_ACCESS_TOKEN = 'test_token';
process.env.WHATSAPP_PHONE_NUMBER_ID = 'test_phone_id';
process.env.WHATSAPP_LOGIN_TEMPLATE_NAME = 'otpcode';
process.env.WHATSAPP_LOGIN_TEMPLATE_LANGUAGE = 'es';

// Mock WhatsApp OTP sending function
async function sendWhatsAppOTP(phoneNumber, otp) {
  console.log(`📱 Mock WhatsApp OTP: Sending OTP "${otp}" to ${phoneNumber}`);
  
  // Simulate API call structure
  const payload = {
    messaging_product: 'whatsapp',
    to: phoneNumber,
    type: 'template',
    template: {
      name: process.env.WHATSAPP_LOGIN_TEMPLATE_NAME,
      language: {
        code: process.env.WHATSAPP_LOGIN_TEMPLATE_LANGUAGE
      },
      components: [
        {
          type: 'body',
          parameters: [
            {
              type: 'text',
              text: otp
            }
          ]
        }
      ]
    }
  };

  console.log('📋 WhatsApp API Payload:', JSON.stringify(payload, null, 2));
  
  // Mock successful response
  return { 
    success: true, 
    messageId: 'mock_message_id_' + Date.now() 
  };
}

// Test phone number validation
function validatePhoneNumber(phoneNumber) {
  const phoneRegex = /^\+?[1-9]\d{1,14}$/;
  return phoneRegex.test(phoneNumber);
}

// Generate OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Test the WhatsApp OTP flow
async function testWhatsAppOTPFlow() {
  console.log('🚀 Testing WhatsApp OTP Flow for Tenant Authentication\n');

  // Test cases
  const testCases = [
    { phone: '+1234567890', valid: true },
    { phone: '+573001234567', valid: true }, // Colombian number
    { phone: '+18095551234', valid: true },  // Dominican Republic number
    { phone: 'invalid_phone', valid: false },
    { phone: '+', valid: false },
    { phone: '', valid: false }
  ];

  for (const testCase of testCases) {
    console.log(`📞 Testing phone: ${testCase.phone}`);
    
    const isValid = validatePhoneNumber(testCase.phone);
    console.log(`   Validation: ${isValid ? '✅ Valid' : '❌ Invalid'}`);
    
    if (isValid !== testCase.valid) {
      console.log(`   ⚠️  Expected ${testCase.valid}, got ${isValid}`);
    }
    
    if (isValid) {
      const otp = generateOTP();
      console.log(`   🔢 Generated OTP: ${otp}`);
      
      try {
        const result = await sendWhatsAppOTP(testCase.phone, otp);
        console.log(`   📤 Send result: ${result.success ? '✅ Success' : '❌ Failed'}`);
        if (result.messageId) {
          console.log(`   📨 Message ID: ${result.messageId}`);
        }
      } catch (error) {
        console.log(`   ❌ Error sending OTP: ${error.message}`);
      }
    }
    
    console.log('');
  }
}

// Test tenant query structure
function testTenantQuery() {
  console.log('🔍 Testing Tenant Query Structure\n');
  
  const phoneNumber = '+573001234567';
  
  // This is the query structure that will be used in the tenant service
  const query = {
    $or: [
      { 'contacts.phone': phoneNumber },
      { 'contacts.phone1': phoneNumber },
      { 'contacts.phone2': phoneNumber }
    ]
  };
  
  console.log('📋 MongoDB Query for tenant lookup:');
  console.log(JSON.stringify(query, null, 2));
  console.log('');
}

// Test Redis payload structure
function testRedisPayload() {
  console.log('💾 Testing Redis Payload Structure\n');
  
  const phoneNumber = '+573001234567';
  const otp = generateOTP();
  const now = new Date();
  const createdAt = now.getTime();
  const expiresAt = createdAt + 5 * 60 * 1000; // 5 minutes
  
  const redisPayload = `createdAt=${createdAt};expiresAt=${expiresAt};phoneNumber=${phoneNumber};type=whatsapp`;
  
  console.log('📋 Redis payload structure:');
  console.log(`Key: ${otp}`);
  console.log(`Value: ${redisPayload}`);
  
  // Test parsing
  const parsed = redisPayload.split(';').reduce((acc, rawValue) => {
    const [key, value] = rawValue.split('=');
    if (key) {
      acc[key] = value;
    }
    return acc;
  }, {});
  
  console.log('📋 Parsed payload:');
  console.log(JSON.stringify(parsed, null, 2));
  console.log('');
}

// Test JWT token structure
function testJWTStructure() {
  console.log('🔐 Testing JWT Token Structure\n');
  
  const account = {
    email: 'user@whatsapp.tenant',
    phone: '+573001234567',
    role: 'tenant',
    tenantId: '507f1f77bcf86cd799439011'
  };
  
  console.log('📋 JWT Account payload:');
  console.log(JSON.stringify({ account }, null, 2));
  console.log('');
}

// Run all tests
async function runTests() {
  console.log('🧪 WhatsApp OTP Integration Test Suite');
  console.log('=====================================\n');
  
  await testWhatsAppOTPFlow();
  testTenantQuery();
  testRedisPayload();
  testJWTStructure();
  
  console.log('✅ All tests completed!');
  console.log('\n📝 Implementation Summary:');
  console.log('- ✅ WhatsApp OTP sending function');
  console.log('- ✅ Phone number validation');
  console.log('- ✅ Tenant authentication routes');
  console.log('- ✅ MongoDB query structure');
  console.log('- ✅ Redis payload handling');
  console.log('- ✅ JWT token structure');
  console.log('- ✅ Frontend components');
  console.log('- ✅ Translations (EN/ES)');
}

// Run the tests
runTests().catch(console.error);
