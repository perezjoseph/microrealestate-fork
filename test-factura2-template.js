#!/usr/bin/env node

/**
 * Factura2 WhatsApp Template Test Script
 * 
 * This script tests the factura2 WhatsApp template configuration
 * and verifies that the environment variables are properly set.
 */

const WHATSAPP_TEMPLATE_NAME = process.env.WHATSAPP_TEMPLATE_NAME || 'factura2';
const WHATSAPP_TEMPLATE_LANGUAGE = process.env.WHATSAPP_TEMPLATE_LANGUAGE || 'es';
const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;

console.log('🧾 Factura2 WhatsApp Template Configuration Test');
console.log('===============================================');
console.log();

console.log('📋 Environment Variables:');
console.log(`   WHATSAPP_TEMPLATE_NAME: ${WHATSAPP_TEMPLATE_NAME}`);
console.log(`   WHATSAPP_TEMPLATE_LANGUAGE: ${WHATSAPP_TEMPLATE_LANGUAGE}`);
console.log(`   WHATSAPP_ACCESS_TOKEN: ${WHATSAPP_ACCESS_TOKEN ? '✅ Set (' + WHATSAPP_ACCESS_TOKEN.substring(0, 20) + '...)' : '❌ Missing'}`);
console.log(`   WHATSAPP_PHONE_NUMBER_ID: ${WHATSAPP_PHONE_NUMBER_ID ? '✅ Set' : '❌ Missing'}`);
console.log();

// Template parameter mapping function for factura2
function buildFactura2Parameters(data) {
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

// Test data for Dominican Republic context
const testData = {
  tenantName: 'María González',
  invoicePeriod: 'Enero 2025',
  totalAmount: '25000.00',
  currency: 'RD$',
  dueDate: '31 de Enero, 2025',
  invoiceUrl: 'https://app.microrealestate.com/factura/456'
};

console.log('📝 Factura2 Template Parameters Test:');
const parameters = buildFactura2Parameters(testData);
parameters.forEach((param, index) => {
  console.log(`   {{${index + 1}}}: "${param.text}"`);
});
console.log();

// Template payload structure for factura2
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

console.log('📤 Factura2 Template Payload Structure:');
console.log(JSON.stringify(templatePayload, null, 2));
console.log();

console.log('✅ Factura2 configuration test completed!');
console.log();
console.log('📋 Next Steps:');
console.log('1. Ensure "factura2" template is approved in Meta Business Manager');
console.log('2. Verify the template uses the same 5-parameter structure');
console.log('3. Test with an approved phone number');
console.log('4. Check that the template language is set to "es" (Spanish)');
console.log();
console.log('🔧 Template Structure Expected:');
console.log('   {{1}} - Tenant Name (e.g., "María González")');
console.log('   {{2}} - Invoice Period (e.g., "Enero 2025")');
console.log('   {{3}} - Total Amount (e.g., "RD$ 25,000.00")');
console.log('   {{4}} - Due Date (e.g., "31 de Enero, 2025")');
console.log('   {{5}} - Invoice URL (e.g., "https://...")');
console.log();
console.log('📖 For detailed instructions, see: WHATSAPP_TEMPLATE_README.md');
