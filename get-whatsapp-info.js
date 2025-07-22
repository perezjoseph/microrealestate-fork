#!/usr/bin/env node

const https = require('https');

const ACCESS_TOKEN = 'EAAScKNKNyJoBPJz7yOmZCqjcLC9m1d5o4MCJipFke3y8cTJZBHitZCcc0yuT4kVNAARxJbHZCNOX2Xr4k9g4navBWTlcuVz4rsZAeLjlutplhxE2wJp9vExuUUlTAGCnM4ZCrqTDUZCq1TRw6fHzJsw7uqxo9aRxeToYYXL1puFLxZCjxu72BWZBZBFEUlmQVMZB08ZC9Rg7qNpuFPlKO2fjyFWmD5DxCdNZCJcI5UQDyokKl9Qu7MwHC6p2bPDEWNiiOHQZDZD';

console.log('🔍 Fetching your WhatsApp Business Account information...\n');

// Get Business Accounts
const options = {
  hostname: 'graph.facebook.com',
  path: `/v18.0/me/businesses?access_token=${ACCESS_TOKEN}`,
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
        console.error('❌ Error:', response.error.message);
        console.log('\n💡 This might mean:');
        console.log('   1. Your access token has expired');
        console.log('   2. You need to regenerate it from Facebook Business Manager');
        console.log('   3. Your app needs additional permissions');
        return;
      }
      
      if (response.data && response.data.length > 0) {
        console.log('✅ Found Business Accounts:');
        response.data.forEach((business, index) => {
          console.log(`   ${index + 1}. ${business.name} (ID: ${business.id})`);
        });
        
        const businessId = response.data[0].id;
        console.log(`\n🔍 Getting WhatsApp Business Accounts for: ${response.data[0].name}`);
        
        // Get WhatsApp Business Accounts
        getWhatsAppAccounts(businessId);
      } else {
        console.log('⚠️  No business accounts found.');
        console.log('\n💡 You may need to:');
        console.log('   1. Create a WhatsApp Business Account');
        console.log('   2. Link it to your Facebook Business Manager');
        console.log('   3. Get proper permissions for your access token');
      }
    } catch (error) {
      console.error('❌ Error parsing response:', error.message);
      console.log('Raw response:', data);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Request error:', error.message);
});

req.end();

function getWhatsAppAccounts(businessId) {
  const whatsappOptions = {
    hostname: 'graph.facebook.com',
    path: `/v18.0/${businessId}/client_whatsapp_business_accounts?access_token=${ACCESS_TOKEN}`,
    method: 'GET'
  };

  const whatsappReq = https.request(whatsappOptions, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        const response = JSON.parse(data);
        
        if (response.error) {
          console.error('❌ Error getting WhatsApp accounts:', response.error.message);
          return;
        }
        
        if (response.data && response.data.length > 0) {
          console.log('\n✅ Found WhatsApp Business Accounts:');
          response.data.forEach((account, index) => {
            console.log(`   ${index + 1}. ${account.name} (ID: ${account.id})`);
          });
          
          const whatsappAccountId = response.data[0].id;
          console.log(`\n🔍 Getting phone numbers for: ${response.data[0].name}`);
          
          // Get Phone Numbers
          getPhoneNumbers(whatsappAccountId);
        } else {
          console.log('\n⚠️  No WhatsApp Business Accounts found.');
          console.log('\n💡 You need to:');
          console.log('   1. Set up WhatsApp Business API');
          console.log('   2. Add a phone number to your WhatsApp Business Account');
          console.log('   3. Verify the phone number');
        }
      } catch (error) {
        console.error('❌ Error parsing WhatsApp response:', error.message);
        console.log('Raw response:', data);
      }
    });
  });

  whatsappReq.on('error', (error) => {
    console.error('❌ WhatsApp request error:', error.message);
  });

  whatsappReq.end();
}

function getPhoneNumbers(whatsappAccountId) {
  const phoneOptions = {
    hostname: 'graph.facebook.com',
    path: `/v18.0/${whatsappAccountId}/phone_numbers?access_token=${ACCESS_TOKEN}`,
    method: 'GET'
  };

  const phoneReq = https.request(phoneOptions, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        const response = JSON.parse(data);
        
        if (response.error) {
          console.error('❌ Error getting phone numbers:', response.error.message);
          return;
        }
        
        if (response.data && response.data.length > 0) {
          console.log('\n✅ Found Phone Numbers:');
          response.data.forEach((phone, index) => {
            console.log(`   ${index + 1}. ${phone.display_phone_number} (ID: ${phone.id})`);
            console.log(`      Status: ${phone.verified_name || 'Not verified'}`);
            console.log(`      Quality: ${phone.quality_rating || 'Unknown'}`);
          });
          
          // Show the configuration
          console.log('\n🎉 Your WhatsApp Configuration:');
          console.log('=====================================');
          console.log(`WHATSAPP_ACCESS_TOKEN=${ACCESS_TOKEN}`);
          console.log(`WHATSAPP_BUSINESS_ACCOUNT_ID=${whatsappAccountId}`);
          console.log(`WHATSAPP_PHONE_NUMBER_ID=${response.data[0].id}`);
          console.log('=====================================');
          
          console.log('\n📝 Next Steps:');
          console.log('1. Copy the configuration above to your .env file');
          console.log('2. Run: docker compose up -d whatsapp');
          console.log('3. Run: docker compose up -d gateway');
          console.log('4. Test sending a WhatsApp message!');
          
        } else {
          console.log('\n⚠️  No phone numbers found.');
          console.log('\n💡 You need to:');
          console.log('   1. Add a phone number to your WhatsApp Business Account');
          console.log('   2. Verify the phone number');
          console.log('   3. Make sure it\'s approved for messaging');
        }
      } catch (error) {
        console.error('❌ Error parsing phone response:', error.message);
        console.log('Raw response:', data);
      }
    });
  });

  phoneReq.on('error', (error) => {
    console.error('❌ Phone request error:', error.message);
  });

  phoneReq.end();
}
