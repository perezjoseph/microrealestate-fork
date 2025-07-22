#!/usr/bin/env node

const https = require('https');

// Test with common endpoints to find your credentials
const ACCESS_TOKEN = 'EAAScKNKNyJoBPJz7yOmZCqjcLC9m1d5o4MCJipFke3y8cTJZBHitZCcc0yuT4kVNAARxJbHZCNOX2Xr4k9g4navBWTlcuVz4rsZAeLjlutplhxE2wJp9vExuUUlTAGCnM4ZCrqTDUZCq1TRw6fHzJsw7uqxo9aRxeToYYXL1puFLxZCjxu72BWZBZBFEUlmQVMZB08ZC9Rg7qNpuFPlKO2fjyFWmD5DxCdNZCJcI5UQDyokKl9Qu7MwHC6p2bPDEWNiiOHQZDZD';

console.log('🔍 Testing WhatsApp API access...\n');

// Test basic API access
const options = {
  hostname: 'graph.facebook.com',
  path: `/v18.0/me?access_token=${ACCESS_TOKEN}`,
  method: 'GET'
};

const req = https.request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const response = JSON.parse(data);
      
      if (response.error) {
        console.error('❌ API Error:', response.error.message);
        console.log('\n📋 Manual Setup Instructions:');
        console.log('=====================================');
        console.log('Since the API access needs more permissions, please follow these steps:');
        console.log('');
        console.log('1. Go to: https://business.facebook.com/');
        console.log('2. Select your Business Account');
        console.log('3. Go to WhatsApp Manager');
        console.log('4. Find your WhatsApp Business Account');
        console.log('5. Look for:');
        console.log('   - Business Account ID (usually starts with numbers)');
        console.log('   - Phone Number ID (for your WhatsApp number)');
        console.log('');
        console.log('6. Update your .env file with:');
        console.log('   WHATSAPP_BUSINESS_ACCOUNT_ID=your_business_account_id');
        console.log('   WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id');
        console.log('');
        console.log('📱 Alternative: Use WhatsApp Web Integration');
        console.log('If the Business API is too complex, I can set up a simpler');
        console.log('WhatsApp Web integration that works without these credentials.');
        return;
      }
      
      console.log('✅ API Access OK');
      console.log('App Name:', response.name || 'Unknown');
      console.log('App ID:', response.id || 'Unknown');
      
    } catch (error) {
      console.error('❌ Error parsing response:', error.message);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Request error:', error.message);
});

req.end();
