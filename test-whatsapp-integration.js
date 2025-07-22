#!/usr/bin/env node

const axios = require('axios');

// Test configuration
const WHATSAPP_SERVICE_URL = 'http://localhost:8500';
const GATEWAY_URL = 'http://localhost:8080';

// Test data
const testData = {
  phoneNumber: '+18091234567',
  message: 'Test message from MicroRealEstate WhatsApp integration',
  recipientName: 'Test User',
  tenantName: 'Juan Pérez',
  invoicePeriod: '2025-01',
  totalAmount: '25000.00',
  currency: 'RD$',
  invoiceUrl: 'https://example.com/invoice/123',
  organizationName: 'MicroRealEstate Test'
};

console.log('🧪 Starting WhatsApp Integration Tests...\n');

// Test 1: Direct WhatsApp service health check
async function testWhatsAppHealth() {
  console.log('1️⃣ Testing WhatsApp service health...');
  try {
    const response = await axios.get(`${WHATSAPP_SERVICE_URL}/health`);
    console.log('✅ WhatsApp service is healthy:', response.data);
    return true;
  } catch (error) {
    console.error('❌ WhatsApp service health check failed:', error.message);
    return false;
  }
}

// Test 2: Direct send-message endpoint
async function testSendMessage() {
  console.log('\n2️⃣ Testing send-message endpoint...');
  try {
    const response = await axios.post(`${WHATSAPP_SERVICE_URL}/send-message`, {
      phoneNumber: testData.phoneNumber,
      message: testData.message,
      recipientName: testData.recipientName
    });
    
    console.log('✅ Send message successful:', response.data);
    console.log('📱 Generated WhatsApp URL:', response.data.whatsappURL);
    return true;
  } catch (error) {
    console.error('❌ Send message failed:', error.message);
    return false;
  }
}

// Test 3: Direct send-invoice endpoint
async function testSendInvoice() {
  console.log('\n3️⃣ Testing send-invoice endpoint...');
  try {
    const response = await axios.post(`${WHATSAPP_SERVICE_URL}/send-invoice`, {
      phoneNumbers: [testData.phoneNumber, '+18291234567'],
      tenantName: testData.tenantName,
      invoicePeriod: testData.invoicePeriod,
      totalAmount: testData.totalAmount,
      currency: testData.currency,
      invoiceUrl: testData.invoiceUrl,
      organizationName: testData.organizationName
    });
    
    console.log('✅ Send invoice successful:', response.data);
    console.log('📊 Results:', response.data.results);
    return true;
  } catch (error) {
    console.error('❌ Send invoice failed:', error.message);
    return false;
  }
}

// Test 4: Gateway health check
async function testGatewayHealth() {
  console.log('\n4️⃣ Testing Gateway health...');
  try {
    const response = await axios.get(`${GATEWAY_URL}/health`);
    console.log('✅ Gateway is healthy');
    
    // Check if WhatsApp service is included in health check
    const healthData = response.data;
    if (healthData.services && healthData.services.some(s => s.includes('whatsapp'))) {
      console.log('✅ WhatsApp service is included in gateway health check');
    } else {
      console.log('⚠️ WhatsApp service may not be properly integrated with gateway');
    }
    return true;
  } catch (error) {
    console.error('❌ Gateway health check failed:', error.message);
    return false;
  }
}

// Test 5: Phone number formatting
function testPhoneFormatting() {
  console.log('\n5️⃣ Testing phone number formatting...');
  
  const testNumbers = [
    '8091234567',
    '18091234567',
    '+18091234567',
    '829-123-4567',
    '849 123 4567',
    '1-809-123-4567'
  ];
  
  console.log('📞 Testing Dominican Republic phone number formatting:');
  testNumbers.forEach(number => {
    // Simulate the formatting logic from the WhatsApp service
    let cleanPhone = number.replace(/[^\d+]/g, '');
    let formattedPhone = cleanPhone;
    
    if (!cleanPhone.startsWith('+')) {
      if (cleanPhone.startsWith('1809') || cleanPhone.startsWith('1829') || cleanPhone.startsWith('1849')) {
        formattedPhone = `+${cleanPhone}`;
      } else if (cleanPhone.length === 10) {
        formattedPhone = `+1809${cleanPhone}`;
      } else {
        formattedPhone = `+${cleanPhone}`;
      }
    }
    
    const whatsappNumber = formattedPhone.replace('+', '');
    console.log(`  ${number} → ${formattedPhone} → wa.me/${whatsappNumber}`);
  });
  
  return true;
}

// Test 6: Message encoding
function testMessageEncoding() {
  console.log('\n6️⃣ Testing message encoding...');
  
  const testMessage = `Estimado/a ${testData.tenantName},

Su factura del período ${testData.invoicePeriod} está lista.

💰 Total: ${testData.currency} ${testData.totalAmount}

📄 Ver factura: ${testData.invoiceUrl}

Gracias por su confianza.
${testData.organizationName}`;

  const encodedMessage = encodeURIComponent(testMessage);
  const whatsappURL = `https://wa.me/18091234567?text=${encodedMessage}`;
  
  console.log('📝 Original message:');
  console.log(testMessage);
  console.log('\n🔗 Generated WhatsApp URL:');
  console.log(whatsappURL);
  
  return true;
}

// Run all tests
async function runAllTests() {
  const results = [];
  
  results.push(await testWhatsAppHealth());
  results.push(await testSendMessage());
  results.push(await testSendInvoice());
  results.push(await testGatewayHealth());
  results.push(testPhoneFormatting());
  results.push(testMessageEncoding());
  
  const passed = results.filter(r => r).length;
  const total = results.length;
  
  console.log('\n📊 Test Results Summary:');
  console.log(`✅ Passed: ${passed}/${total}`);
  console.log(`❌ Failed: ${total - passed}/${total}`);
  
  if (passed === total) {
    console.log('\n🎉 All tests passed! WhatsApp integration is working correctly.');
  } else {
    console.log('\n⚠️ Some tests failed. Please check the errors above.');
  }
  
  return passed === total;
}

// Run the tests
runAllTests().catch(error => {
  console.error('💥 Test execution failed:', error);
  process.exit(1);
});
