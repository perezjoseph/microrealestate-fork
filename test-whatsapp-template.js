#!/usr/bin/env node

/**
 * WhatsApp Template Configuration Test Script
 * 
 * This script tests the WhatsApp template configuration and verifies
 * that the environment variables are properly set.
 */

const WHATSAPP_TEMPLATE_NAME = process.env.WHATSAPP_TEMPLATE_NAME || 'factura2';
const WHATSAPP_TEMPLATE_LANGUAGE = process.env.WHATSAPP_TEMPLATE_LANGUAGE || 'es';
const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;

console.log('🔧 WhatsApp Template Configuration Test');
console.log('=====================================');
console.log();

console.log('📋 Environment Variables:');
console.log(`   WHATSAPP_TEMPLATE_NAME: ${WHATSAPP_TEMPLATE_NAME}`);
console.log(`   WHATSAPP_TEMPLATE_LANGUAGE: ${WHATSAPP_TEMPLATE_LANGUAGE}`);
console.log(`   WHATSAPP_ACCESS_TOKEN: ${WHATSAPP_ACCESS_TOKEN ? '✅ Set (' + WHATSAPP_ACCESS_TOKEN.substring(0, 20) + '...)' : '❌ Missing'}`);
console.log(`   WHATSAPP_PHONE_NUMBER_ID: ${WHATSAPP_PHONE_NUMBER_ID ? '✅ Set' : '❌ Missing'}`);
console.log();

// Template parameter mapping function
function buildTemplateParameters(data) {
  const { tenantName, invoicePeriod, totalAmount, currency, dueDate, invoiceUrl } = data;
  
  const formattedAmount = `${currency} ${totalAmount}`;
  const formattedDueDate = dueDate || 'Por definir';
  
  return [
    { type: 'text', text: tenantName || 'Cliente' },
    { type: 'text', text: invoicePeriod || 'Período actual' },
    { type: 'text', text: formattedAmount },
    { type: 'text', text: formattedDueDate },
    { type: 'text', text: invoiceUrl || '#' }
  ];
}

// Test data
const testData = {
  tenantName: 'Juan Pérez',
  invoicePeriod: 'Enero 2025',
  totalAmount: '15000.00',
  currency: 'RD$',
  dueDate: '31 de Enero, 2025',
  invoiceUrl: 'https://app.microrealestate.com/invoice/123'
};

console.log('📝 Template Parameters Test:');
const parameters = buildTemplateParameters(testData);
parameters.forEach((param, index) => {
  console.log(`   {{${index + 1}}}: "${param.text}"`);
});
console.log();

// Template payload structure
const templatePayload = {
  messaging_product: 'whatsapp',
  to: '1234567890',
  type: 'template',
  template: {
    name: WHATSAPP_TEMPLATE_NAME,
    language: {
      code: WHATSAPP_TEMPLATE_LANGUAGE
    },
    components: [
      {
        type: 'body',
        parameters: parameters
      }
    ]
  }
};

console.log('📤 Template Payload Structure:');
console.log(JSON.stringify(templatePayload, null, 2));
console.log();

console.log('✅ Configuration test completed!');
console.log();
console.log('📋 Next Steps:');
console.log('1. Submit the template to Meta Business Manager for approval');
console.log('2. Update WHATSAPP_TEMPLATE_NAME if you use a different name');
console.log('3. Ensure your access token has the required permissions');
console.log('4. Test with an approved phone number');
console.log();
console.log('📖 For detailed instructions, see: WHATSAPP_TEMPLATE_README.md');
