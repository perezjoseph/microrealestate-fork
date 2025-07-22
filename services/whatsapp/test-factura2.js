#!/usr/bin/env node

/**
 * Factura2 WhatsApp Template Test Script
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

// Test data
const testData = {
  tenantName: 'María González',
  invoicePeriod: 'Enero 2025',
  totalAmount: '25000.00',
  currency: 'RD$',
  dueDate: '31 de Enero, 2025',
  invoiceUrl: 'https://app.microrealestate.com/factura/456'
};

console.log('📝 Factura2 Template Parameters:');
const parameters = buildFactura2Parameters(testData);
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

console.log('📤 Factura2 Template Payload:');
console.log(JSON.stringify(templatePayload, null, 2));
console.log();

console.log('✅ Factura2 configuration test completed!');
console.log();
console.log('📋 Important Notes:');
console.log('1. Template name is now set to "factura2"');
console.log('2. Ensure this template is approved in Meta Business Manager');
console.log('3. Template must use the same 5-parameter structure');
console.log('4. Language is set to "es" (Spanish)');
