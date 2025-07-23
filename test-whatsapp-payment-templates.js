#!/usr/bin/env node

/**
 * WhatsApp Payment Templates Test Script
 * 
 * This script tests the new configurable WhatsApp payment notice templates
 * and verifies that the environment variables are properly configured.
 */

const axios = require('axios');

// Load environment variables
require('dotenv').config();

const WHATSAPP_SERVICE_URL = process.env.WHATSAPP_URL || 'http://localhost:8500';
const TEST_PHONE_NUMBER = process.env.TEST_PHONE_NUMBER || '18091234567';

console.log('🧪 WhatsApp Payment Templates Test');
console.log('===================================');
console.log();

// Test data for different scenarios
const testScenarios = [
  {
    name: 'Payment Notice (First Reminder)',
    templateName: 'rentcall',
    data: {
      phoneNumbers: [TEST_PHONE_NUMBER],
      tenantName: 'Juan Pérez',
      invoicePeriod: 'Enero 2025',
      totalAmount: '15000.00',
      currency: 'RD$',
      dueDate: '31 de Enero, 2025',
      invoiceUrl: 'https://app.microrealestate.com/invoice/123',
      organizationName: 'MicroRealEstate',
      locale: 'es-DO'
    }
  },
  {
    name: 'Payment Reminder (Second Notice)',
    templateName: 'rentcall_reminder',
    data: {
      phoneNumbers: [TEST_PHONE_NUMBER],
      tenantName: 'María González',
      invoicePeriod: 'Enero 2025',
      totalAmount: '18000.00',
      currency: 'RD$',
      dueDate: '31 de Enero, 2025',
      daysOverdue: 7,
      invoiceUrl: 'https://app.microrealestate.com/invoice/124',
      organizationName: 'MicroRealEstate',
      locale: 'es-DO'
    }
  },
  {
    name: 'Final Notice (Last Warning)',
    templateName: 'rentcall_last_reminder',
    data: {
      phoneNumbers: [TEST_PHONE_NUMBER],
      tenantName: 'Carlos Rodríguez',
      invoicePeriod: 'Enero 2025',
      totalAmount: '20000.00',
      currency: 'RD$',
      dueDate: '31 de Enero, 2025',
      daysOverdue: 15,
      invoiceUrl: 'https://app.microrealestate.com/invoice/125',
      organizationName: 'MicroRealEstate',
      locale: 'es-DO'
    }
  },
  {
    name: 'Invoice Delivery',
    templateName: 'invoice',
    data: {
      phoneNumbers: [TEST_PHONE_NUMBER],
      tenantName: 'Ana Martínez',
      invoicePeriod: 'Enero 2025',
      totalAmount: '12000.00',
      currency: 'RD$',
      dueDate: '31 de Enero, 2025',
      invoiceUrl: 'https://app.microrealestate.com/invoice/126',
      organizationName: 'MicroRealEstate',
      locale: 'es-DO'
    }
  }
];

async function testWhatsAppService() {
  try {
    console.log('🔍 Testing WhatsApp service health...');
    const healthResponse = await axios.get(`${WHATSAPP_SERVICE_URL}/health`);
    console.log('✅ WhatsApp service is healthy');
    console.log(`   Mode: ${healthResponse.data.mode}`);
    console.log(`   API Configured: ${healthResponse.data.apiConfigured}`);
    console.log();
  } catch (error) {
    console.error('❌ WhatsApp service health check failed:', error.message);
    console.log('   Make sure the WhatsApp service is running on', WHATSAPP_SERVICE_URL);
    return false;
  }
  
  return true;
}

async function testEnvironmentConfiguration() {
  try {
    console.log('🔍 Testing environment configuration...');
    const envResponse = await axios.get(`${WHATSAPP_SERVICE_URL}/debug/env`);
    const config = envResponse.data;
    
    console.log('📋 Template Configuration:');
    console.log(`   Invoice Template: ${config.WHATSAPP_INVOICE_TEMPLATE}`);
    console.log(`   Payment Notice Template: ${config.WHATSAPP_PAYMENT_NOTICE_TEMPLATE}`);
    console.log(`   Payment Reminder Template: ${config.WHATSAPP_PAYMENT_REMINDER_TEMPLATE}`);
    console.log(`   Final Notice Template: ${config.WHATSAPP_FINAL_NOTICE_TEMPLATE}`);
    console.log(`   Template Language: ${config.WHATSAPP_TEMPLATE_LANGUAGE}`);
    console.log(`   Access Token: ${config.WHATSAPP_ACCESS_TOKEN}`);
    console.log(`   Phone Number ID: ${config.WHATSAPP_PHONE_NUMBER_ID ? 'SET' : 'NOT_SET'}`);
    console.log();
    
    return true;
  } catch (error) {
    console.error('❌ Environment configuration test failed:', error.message);
    return false;
  }
}

async function testPaymentTemplate(scenario) {
  try {
    console.log(`🧪 Testing: ${scenario.name}`);
    console.log(`   Template: ${scenario.templateName}`);
    console.log(`   Tenant: ${scenario.data.tenantName}`);
    console.log(`   Amount: ${scenario.data.currency} ${scenario.data.totalAmount}`);
    
    const response = await axios.post(`${WHATSAPP_SERVICE_URL}/send-invoice`, {
      templateName: scenario.templateName,
      ...scenario.data
    });
    
    if (response.data.success) {
      console.log('✅ Template test successful');
      console.log(`   Results: ${response.data.results.length} message(s) processed`);
      console.log(`   API Success: ${response.data.summary.apiSuccess}`);
      console.log(`   URL Fallback: ${response.data.summary.urlFallback}`);
      
      // Show first result details
      if (response.data.results.length > 0) {
        const result = response.data.results[0];
        console.log(`   Method: ${result.method}`);
        if (result.method === 'api' && result.messageId) {
          console.log(`   Message ID: ${result.messageId}`);
        } else if (result.method === 'url' && result.whatsappURL) {
          console.log(`   WhatsApp URL: ${result.whatsappURL.substring(0, 80)}...`);
        }
      }
    } else {
      console.log('❌ Template test failed');
      console.log(`   Error: ${response.data.error || 'Unknown error'}`);
    }
    
    console.log();
    return response.data.success;
    
  } catch (error) {
    console.error(`❌ Template test failed for ${scenario.name}:`, error.message);
    if (error.response?.data) {
      console.error('   Response:', JSON.stringify(error.response.data, null, 2));
    }
    console.log();
    return false;
  }
}

async function runAllTests() {
  console.log(`🎯 Test Configuration:`);
  console.log(`   WhatsApp Service URL: ${WHATSAPP_SERVICE_URL}`);
  console.log(`   Test Phone Number: ${TEST_PHONE_NUMBER}`);
  console.log();
  
  // Test service health
  const serviceHealthy = await testWhatsAppService();
  if (!serviceHealthy) {
    console.log('❌ Cannot proceed with tests - service not available');
    process.exit(1);
  }
  
  // Test environment configuration
  const configValid = await testEnvironmentConfiguration();
  if (!configValid) {
    console.log('❌ Cannot proceed with tests - configuration invalid');
    process.exit(1);
  }
  
  // Test each payment template scenario
  console.log('🧪 Testing Payment Template Scenarios:');
  console.log('=====================================');
  console.log();
  
  let successCount = 0;
  let totalTests = testScenarios.length;
  
  for (const scenario of testScenarios) {
    const success = await testPaymentTemplate(scenario);
    if (success) successCount++;
    
    // Wait between tests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Summary
  console.log('📊 Test Summary:');
  console.log(`   Total Tests: ${totalTests}`);
  console.log(`   Successful: ${successCount}`);
  console.log(`   Failed: ${totalTests - successCount}`);
  console.log(`   Success Rate: ${Math.round((successCount / totalTests) * 100)}%`);
  console.log();
  
  if (successCount === totalTests) {
    console.log('🎉 All tests passed! WhatsApp payment templates are working correctly.');
  } else {
    console.log('⚠️  Some tests failed. Check the configuration and try again.');
  }
  
  console.log();
  console.log('💡 Next Steps:');
  console.log('1. Submit the templates to Meta Business Manager for approval');
  console.log('2. Update template names in .env file once approved');
  console.log('3. Test with real phone numbers in your WhatsApp Business API');
  console.log('4. Monitor delivery status using the webhook endpoints');
}

// Run the tests
runAllTests().catch(error => {
  console.error('❌ Test execution failed:', error.message);
  process.exit(1);
});
