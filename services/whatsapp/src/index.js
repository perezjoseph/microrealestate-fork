const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

// WhatsApp Business API configuration
const WHATSAPP_API_URL = process.env.WHATSAPP_API_URL || 'https://graph.facebook.com/v18.0';
const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const WHATSAPP_TEMPLATE_NAME = process.env.WHATSAPP_TEMPLATE_NAME || 'factura2';
const WHATSAPP_TEMPLATE_LANGUAGE = process.env.WHATSAPP_TEMPLATE_LANGUAGE || 'es';

console.log(`🔧 WhatsApp Template Configuration:`);
console.log(`   Template Name: ${WHATSAPP_TEMPLATE_NAME}`);
console.log(`   Template Language: ${WHATSAPP_TEMPLATE_LANGUAGE}`);

// Template parameter mapping for the approved Meta template
function buildTemplateParameters(data) {
  const { tenantName, invoicePeriod, totalAmount, currency, dueDate, invoiceUrl } = data;
  
  // Debug logging to identify the issue
  console.log('🔍 Template data received:', {
    tenantName,
    invoicePeriod,
    totalAmount,
    totalAmountType: typeof totalAmount,
    currency,
    dueDate,
    invoiceUrl
  });
  
  // Comprehensive amount handling with multiple fallbacks
  let safeAmount = '0.00';
  
  if (totalAmount !== undefined && totalAmount !== null && totalAmount !== '') {
    // Convert to string and handle various formats
    const amountStr = String(totalAmount);
    if (amountStr !== 'undefined' && amountStr !== 'null' && !isNaN(parseFloat(amountStr))) {
      safeAmount = parseFloat(amountStr).toFixed(2);
    }
  }
  
  console.log('🔍 Amount processing:', {
    originalAmount: totalAmount,
    processedAmount: safeAmount
  });
  
  // Format the amount with currency
  const formattedAmount = `${currency} ${safeAmount}`;
  
  // Format the due date in Spanish format
  const formattedDueDate = dueDate || 'Por definir';
  
  console.log('🔍 Final template parameters:', {
    tenantName: tenantName || 'Cliente',
    invoicePeriod: invoicePeriod || 'Período actual',
    formattedAmount,
    formattedDueDate,
    invoiceUrl: invoiceUrl || '#'
  });
  
  return [
    { type: 'text', text: tenantName || 'Cliente' },           // {{1}} - Tenant name
    { type: 'text', text: invoicePeriod || 'Período actual' }, // {{2}} - Period
    { type: 'text', text: formattedAmount },                   // {{3}} - Amount with currency
    { type: 'text', text: formattedDueDate },                  // {{4}} - Due date
    { type: 'text', text: invoiceUrl || '#' }                  // {{5}} - Invoice URL
  ];
}

// WhatsApp message templates with locale support
const MESSAGE_TEMPLATES = {
  // English templates
  en: {
    invoice: (data) => `Dear ${data.tenantName},

Your invoice for period ${data.invoicePeriod} is ready.

💰 Total: ${data.currency} ${data.totalAmount}

${data.invoiceUrl ? `📄 View invoice: ${data.invoiceUrl}` : ''}

Thank you for your trust.
${data.organizationName}`,

    rentcall: (data) => `Dear ${data.tenantName},

🔔 PAYMENT REMINDER

Your rent for period ${data.invoicePeriod} is pending payment.

💰 Amount: ${data.currency} ${data.totalAmount}
📅 Due date: ${data.dueDate}

${data.invoiceUrl ? `📄 View invoice: ${data.invoiceUrl}` : ''}

Please make your payment as soon as possible.

${data.organizationName}`,

    rentcall_reminder: (data) => `Dear ${data.tenantName},

⚠️ SECOND NOTICE - PAYMENT PENDING

Your rent for period ${data.invoicePeriod} remains pending.

💰 Amount: ${data.currency} ${data.totalAmount}
📅 Due date: ${data.dueDate}
⏰ Days overdue: ${data.daysOverdue}

${data.invoiceUrl ? `📄 View invoice: ${data.invoiceUrl}` : ''}

It's important to regularize your situation to avoid inconveniences.

${data.organizationName}`,

    rentcall_last_reminder: (data) => `Dear ${data.tenantName},

🚨 FINAL NOTICE - URGENT PAYMENT

Your rent for period ${data.invoicePeriod} is in arrears.

💰 Amount: ${data.currency} ${data.totalAmount}
📅 Due date: ${data.dueDate}
⏰ Days overdue: ${data.daysOverdue}

${data.invoiceUrl ? `📄 View invoice: ${data.invoiceUrl}` : ''}

⚠️ IMPORTANT: If we don't receive your payment within the next 48 hours, we will proceed according to the contract terms.

Please contact us immediately to resolve this situation.

${data.organizationName}`
  },

  // Spanish templates (es-CO, es-DO)
  'es-CO': {
    invoice: (data) => `Estimado/a ${data.tenantName},

Su factura del período ${data.invoicePeriod} está lista.

💰 Saldo pendiente: ${data.currency} ${data.totalAmount}

${data.invoiceUrl ? `📄 Ver factura: ${data.invoiceUrl}` : ''}

Gracias por su confianza.
${data.organizationName}`,

    rentcall: (data) => `Estimado/a ${data.tenantName},

🔔 RECORDATORIO DE PAGO

Su renta del período ${data.invoicePeriod} está pendiente de pago.

💰 Monto: ${data.currency} ${data.totalAmount}
📅 Fecha límite: ${data.dueDate}

${data.invoiceUrl ? `📄 Ver factura: ${data.invoiceUrl}` : ''}

Por favor, realice su pago a la brevedad posible.

${data.organizationName}`,

    rentcall_reminder: (data) => `Estimado/a ${data.tenantName},

⚠️ SEGUNDO AVISO - PAGO PENDIENTE

Su renta del período ${data.invoicePeriod} continúa pendiente.

💰 Monto: ${data.currency} ${data.totalAmount}
📅 Fecha límite: ${data.dueDate}
⏰ Días de retraso: ${data.daysOverdue}

${data.invoiceUrl ? `📄 Ver factura: ${data.invoiceUrl}` : ''}

Es importante regularizar su situación para evitar inconvenientes.

${data.organizationName}`,

    rentcall_last_reminder: (data) => `Estimado/a ${data.tenantName},

🚨 ÚLTIMO AVISO - PAGO URGENTE

Su renta del período ${data.invoicePeriod} está en mora.

💰 Monto: ${data.currency} ${data.totalAmount}
📅 Fecha límite: ${data.dueDate}
⏰ Días de retraso: ${data.daysOverdue}

${data.invoiceUrl ? `📄 Ver factura: ${data.invoiceUrl}` : ''}

⚠️ IMPORTANTE: Si no recibimos su pago en las próximas 48 horas, procederemos según los términos del contrato.

Contacte inmediatamente para resolver esta situación.

${data.organizationName}`
  },

  // French templates
  'fr-FR': {
    invoice: (data) => `Cher/Chère ${data.tenantName},

Votre facture pour la période ${data.invoicePeriod} est prête.

💰 Total: ${data.currency} ${data.totalAmount}

${data.invoiceUrl ? `📄 Voir la facture: ${data.invoiceUrl}` : ''}

Merci pour votre confiance.
${data.organizationName}`,

    rentcall: (data) => `Cher/Chère ${data.tenantName},

🔔 RAPPEL DE PAIEMENT

Votre loyer pour la période ${data.invoicePeriod} est en attente de paiement.

💰 Montant: ${data.currency} ${data.totalAmount}
📅 Date limite: ${data.dueDate}

${data.invoiceUrl ? `📄 Voir la facture: ${data.invoiceUrl}` : ''}

Veuillez effectuer votre paiement dès que possible.

${data.organizationName}`,

    rentcall_reminder: (data) => `Cher/Chère ${data.tenantName},

⚠️ DEUXIÈME AVIS - PAIEMENT EN ATTENTE

Votre loyer pour la période ${data.invoicePeriod} reste en attente.

💰 Montant: ${data.currency} ${data.totalAmount}
📅 Date limite: ${data.dueDate}
⏰ Jours de retard: ${data.daysOverdue}

${data.invoiceUrl ? `📄 Voir la facture: ${data.invoiceUrl}` : ''}

Il est important de régulariser votre situation pour éviter les désagréments.

${data.organizationName}`,

    rentcall_last_reminder: (data) => `Cher/Chère ${data.tenantName},

🚨 DERNIER AVIS - PAIEMENT URGENT

Votre loyer pour la période ${data.invoicePeriod} est en retard.

💰 Montant: ${data.currency} ${data.totalAmount}
📅 Date limite: ${data.dueDate}
⏰ Jours de retard: ${data.daysOverdue}

${data.invoiceUrl ? `📄 Voir la facture: ${data.invoiceUrl}` : ''}

⚠️ IMPORTANT: Si nous ne recevons pas votre paiement dans les 48 heures, nous procéderons selon les termes du contrat.

Veuillez nous contacter immédiatement pour résoudre cette situation.

${data.organizationName}`
  },

  // German templates
  'de-DE': {
    invoice: (data) => `Liebe/r ${data.tenantName},

Ihre Rechnung für den Zeitraum ${data.invoicePeriod} ist bereit.

💰 Gesamt: ${data.currency} ${data.totalAmount}

${data.invoiceUrl ? `📄 Rechnung anzeigen: ${data.invoiceUrl}` : ''}

Vielen Dank für Ihr Vertrauen.
${data.organizationName}`,

    rentcall: (data) => `Liebe/r ${data.tenantName},

🔔 ZAHLUNGSERINNERUNG

Ihre Miete für den Zeitraum ${data.invoicePeriod} steht noch aus.

💰 Betrag: ${data.currency} ${data.totalAmount}
📅 Fälligkeitsdatum: ${data.dueDate}

${data.invoiceUrl ? `📄 Rechnung anzeigen: ${data.invoiceUrl}` : ''}

Bitte leisten Sie Ihre Zahlung so bald wie möglich.

${data.organizationName}`,

    rentcall_reminder: (data) => `Liebe/r ${data.tenantName},

⚠️ ZWEITE MAHNUNG - ZAHLUNG AUSSTEHEND

Ihre Miete für den Zeitraum ${data.invoicePeriod} ist weiterhin ausstehend.

💰 Betrag: ${data.currency} ${data.totalAmount}
📅 Fälligkeitsdatum: ${data.dueDate}
⏰ Tage überfällig: ${data.daysOverdue}

${data.invoiceUrl ? `📄 Rechnung anzeigen: ${data.invoiceUrl}` : ''}

Es ist wichtig, Ihre Situation zu regularisieren, um Unannehmlichkeiten zu vermeiden.

${data.organizationName}`,

    rentcall_last_reminder: (data) => `Liebe/r ${data.tenantName},

🚨 LETZTE MAHNUNG - DRINGENDE ZAHLUNG

Ihre Miete für den Zeitraum ${data.invoicePeriod} ist im Rückstand.

💰 Betrag: ${data.currency} ${data.totalAmount}
📅 Fälligkeitsdatum: ${data.dueDate}
⏰ Tage überfällig: ${data.daysOverdue}

${data.invoiceUrl ? `📄 Rechnung anzeigen: ${data.invoiceUrl}` : ''}

⚠️ WICHTIG: Wenn wir Ihre Zahlung nicht innerhalb der nächsten 48 Stunden erhalten, werden wir gemäß den Vertragsbedingungen vorgehen.

Bitte kontaktieren Sie uns sofort, um diese Situation zu lösen.

${data.organizationName}`
  },

  // Portuguese templates
  'pt-BR': {
    invoice: (data) => `Caro/a ${data.tenantName},

Sua fatura do período ${data.invoicePeriod} está pronta.

💰 Total: ${data.currency} ${data.totalAmount}

${data.invoiceUrl ? `📄 Ver fatura: ${data.invoiceUrl}` : ''}

Obrigado pela sua confiança.
${data.organizationName}`,

    rentcall: (data) => `Caro/a ${data.tenantName},

🔔 LEMBRETE DE PAGAMENTO

Seu aluguel do período ${data.invoicePeriod} está pendente de pagamento.

💰 Valor: ${data.currency} ${data.totalAmount}
📅 Data limite: ${data.dueDate}

${data.invoiceUrl ? `📄 Ver fatura: ${data.invoiceUrl}` : ''}

Por favor, realize seu pagamento o mais breve possível.

${data.organizationName}`,

    rentcall_reminder: (data) => `Caro/a ${data.tenantName},

⚠️ SEGUNDO AVISO - PAGAMENTO PENDENTE

Seu aluguel do período ${data.invoicePeriod} continua pendente.

💰 Valor: ${data.currency} ${data.totalAmount}
📅 Data limite: ${data.dueDate}
⏰ Dias em atraso: ${data.daysOverdue}

${data.invoiceUrl ? `📄 Ver fatura: ${data.invoiceUrl}` : ''}

É importante regularizar sua situação para evitar inconvenientes.

${data.organizationName}`,

    rentcall_last_reminder: (data) => `Caro/a ${data.tenantName},

🚨 ÚLTIMO AVISO - PAGAMENTO URGENTE

Seu aluguel do período ${data.invoicePeriod} está em atraso.

💰 Valor: ${data.currency} ${data.totalAmount}
📅 Data limite: ${data.dueDate}
⏰ Dias em atraso: ${data.daysOverdue}

${data.invoiceUrl ? `📄 Ver fatura: ${data.invoiceUrl}` : ''}

⚠️ IMPORTANTE: Se não recebermos seu pagamento nas próximas 48 horas, procederemos conforme os termos do contrato.

Entre em contato imediatamente para resolver esta situação.

${data.organizationName}`
  }
};

// Copy Spanish templates to es-DO (Dominican Republic uses same Spanish)
MESSAGE_TEMPLATES['es-DO'] = MESSAGE_TEMPLATES['es-CO'];

// Function to get message template based on locale
function getMessageTemplate(templateName, locale = 'en', data) {
  // Default to English if locale not found
  const localeTemplates = MESSAGE_TEMPLATES[locale] || MESSAGE_TEMPLATES['en'];
  const template = localeTemplates[templateName];
  
  if (!template) {
    throw new Error(`Template '${templateName}' not found for locale '${locale}'`);
  }
  
  return template(data);
}

// Generic international phone number formatting
function formatPhoneNumber(phoneNumber) {
  // Clean phone number (remove spaces, dashes, parentheses, etc.)
  let cleanPhone = phoneNumber.replace(/[^\d+]/g, '');
  
  // If it already starts with +, remove it for processing
  if (cleanPhone.startsWith('+')) {
    cleanPhone = cleanPhone.substring(1);
  }
  
  // Return the clean number (WhatsApp API expects without +)
  return cleanPhone;
}

// Enhanced send document endpoint with template support
app.post('/send-document', async (req, res) => {
  try {
    const { 
      templateName,
      phoneNumbers, 
      tenantName, 
      invoicePeriod, 
      totalAmount, 
      currency = '$',
      invoiceUrl,
      organizationName = 'MicroRealEstate',
      dueDate,
      daysOverdue,
      locale = 'en'  // Default to English if not provided
    } = req.body;
    
    // Validate template exists for the given locale
    const localeTemplates = MESSAGE_TEMPLATES[locale] || MESSAGE_TEMPLATES['en'];
    if (!templateName || !localeTemplates[templateName]) {
      return res.status(400).json({
        success: false,
        error: `Invalid or missing template name '${templateName}' for locale '${locale}'`,
        availableTemplates: Object.keys(localeTemplates),
        supportedLocales: Object.keys(MESSAGE_TEMPLATES)
      });
    }
    
    if (!phoneNumbers || !Array.isArray(phoneNumbers) || phoneNumbers.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'At least one phone number is required'
      });
    }
    
    // Generate message using localized template
    const messageData = {
      tenantName,
      invoicePeriod,
      totalAmount,
      currency,
      invoiceUrl,
      organizationName,
      dueDate,
      daysOverdue
    };
    
    const message = getMessageTemplate(templateName, locale, messageData);
    
    // Generate WhatsApp URLs for all phone numbers
    const results = [];
    
    for (const phone of phoneNumbers) {
      try {
        const whatsappURL = generateWhatsAppURL(phone, message);
        
        results.push({
          phoneNumber: phone,
          formattedPhone: formatPhoneNumber(phone),
          success: true,
          method: 'url',
          whatsappURL,
          templateName
        });
        
        console.log(`✅ ${templateName} URL generated for ${phone}`);
        
      } catch (error) {
        console.error(`❌ Error generating URL for ${phone}:`, error.message);
        
        results.push({
          phoneNumber: phone,
          success: false,
          error: error.message,
          templateName
        });
      }
    }
    
    console.log(`📊 ${templateName} delivery summary for ${tenantName}: ${results.filter(r => r.success).length} URLs generated`);
    
    res.json({
      success: true,
      templateName,
      message: `${templateName} URLs generated for ${results.filter(r => r.success).length} phone number(s)`,
      results,
      tenantName,
      messagePreview: message.substring(0, 100) + '...'
    });
    
  } catch (error) {
    console.error('❌ Error generating WhatsApp URLs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate WhatsApp URLs',
      details: error.message
    });
  }
});

// Send message via WhatsApp Business API using configurable templates
async function sendWhatsAppTemplateMessage(phoneNumber, templateData) {
  if (!WHATSAPP_ACCESS_TOKEN || !WHATSAPP_PHONE_NUMBER_ID) {
    throw new Error('WhatsApp Business API credentials not configured');
  }
  
  const formattedPhone = formatPhoneNumber(phoneNumber);
  
  // Build template parameters based on the approved Meta template structure
  const templateParameters = buildTemplateParameters(templateData);
  
  const payload = {
    messaging_product: 'whatsapp',
    to: formattedPhone,
    type: 'template',
    template: {
      name: WHATSAPP_TEMPLATE_NAME,
      language: {
        code: WHATSAPP_TEMPLATE_LANGUAGE
      },
      components: [
        {
          type: 'body',
          parameters: templateParameters
        }
      ]
    }
  };
  
  try {
    console.log(`📤 Sending template "${WHATSAPP_TEMPLATE_NAME}" to ${formattedPhone}...`);
    console.log(`📋 Template parameters:`, templateParameters.map(p => p.text).join(', '));
    
    const response = await axios.post(
      `${WHATSAPP_API_URL}/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
      payload,
      {
        headers: {
          'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log(`✅ Template message sent successfully to ${formattedPhone}`);
    
    // Store message for delivery tracking
    if (response.data.messages && response.data.messages[0]) {
      const messageId = response.data.messages[0].id;
      messageStatusTracker.set(messageId, {
        status: 'sent',
        timestamp: new Date(),
        recipientId: formattedPhone,
        lastUpdated: new Date(),
        messageType: 'template',
        templateName: WHATSAPP_TEMPLATE_NAME
      });
      console.log(`📝 Tracking message: ${messageId}`);
    }
    
    return response.data;
  } catch (error) {
    // Enhanced error handling with specific Facebook API errors
    if (error.response?.data?.error) {
      const fbError = error.response.data.error;
      console.error(`❌ WhatsApp Template API Error for ${formattedPhone}:`, fbError);
      
      // Handle specific error codes
      if (fbError.code === 131030) {
        throw new Error(`Phone number ${formattedPhone} not in allowed list. Add it to your WhatsApp Business API configuration.`);
      } else if (fbError.code === 190) {
        throw new Error('WhatsApp access token expired or invalid');
      } else if (fbError.code === 132000) {
        throw new Error(`Template "${WHATSAPP_TEMPLATE_NAME}" not found or not approved. Please check your template configuration.`);
      } else {
        throw new Error(`WhatsApp API Error (${fbError.code}): ${fbError.message}`);
      }
    }
    
    throw new Error(`WhatsApp API request failed: ${error.message}`);
  }
}

// Send message via WhatsApp Business API (template-first approach)
async function sendWhatsAppMessage(phoneNumber, message, templateData = null) {
  if (!WHATSAPP_ACCESS_TOKEN || !WHATSAPP_PHONE_NUMBER_ID) {
    throw new Error('WhatsApp Business API credentials not configured');
  }
  
  const formattedPhone = formatPhoneNumber(phoneNumber);
  
  // Try template message first if template data is provided
  if (templateData) {
    try {
      console.log(`🔄 Trying template message for ${formattedPhone}...`);
      const templateResponse = await sendWhatsAppTemplateMessage(phoneNumber, templateData);
      console.log(`✅ Template message sent successfully to ${formattedPhone}`);
      return templateResponse;
    } catch (templateError) {
      console.log(`⚠️ Template message failed for ${formattedPhone}: ${templateError.message}`);
      console.log(`🔄 Falling back to text message...`);
    }
  }
  
  // Fallback to text message
  const payload = {
    messaging_product: 'whatsapp',
    to: formattedPhone,
    type: 'text',
    text: {
      body: message
    }
  };
  
  try {
    const response = await axios.post(
      `${WHATSAPP_API_URL}/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
      payload,
      {
        headers: {
          'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log(`✅ Text message sent successfully to ${formattedPhone}`);
    
    // Store message for delivery tracking
    if (response.data.messages && response.data.messages[0]) {
      const messageId = response.data.messages[0].id;
      messageStatusTracker.set(messageId, {
        status: 'sent',
        timestamp: new Date(),
        recipientId: formattedPhone,
        lastUpdated: new Date(),
        messageType: 'text'
      });
      console.log(`📝 Tracking message: ${messageId}`);
    }
    
    return response.data;
  } catch (error) {
    // Enhanced error handling with specific Facebook API errors
    if (error.response?.data?.error) {
      const fbError = error.response.data.error;
      console.error(`❌ WhatsApp API Error for ${formattedPhone}:`, fbError);
      
      // Handle specific error codes
      if (fbError.code === 131030) {
        throw new Error(`Phone number ${formattedPhone} not in allowed list. Add it to your WhatsApp Business API configuration.`);
      } else if (fbError.code === 190) {
        throw new Error('WhatsApp access token expired or invalid');
      } else {
        throw new Error(`WhatsApp API Error (${fbError.code}): ${fbError.message}`);
      }
    }
    
    throw new Error(`WhatsApp API request failed: ${error.message}`);
  }
}

// Generate WhatsApp Web URL for manual sending
function generateWhatsAppURL(phoneNumber, message) {
  const cleanPhone = phoneNumber.replace(/[^\d+]/g, '');
  
  // Use the phone number as provided, just ensure it's clean
  let formattedPhone = cleanPhone;
  
  // If it doesn't start with +, add it
  if (!formattedPhone.startsWith('+')) {
    formattedPhone = `+${formattedPhone}`;
  }
  
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${formattedPhone.replace('+', '')}?text=${encodedMessage}`;
}

// Send WhatsApp message via Business API
app.post('/send-message', async (req, res) => {
  try {
    const { phoneNumber, message, recipientName } = req.body;
    
    if (!phoneNumber || !message) {
      return res.status(400).json({
        success: false,
        error: 'Phone number and message are required'
      });
    }
    
    try {
      // Try to send via WhatsApp Business API first
      const apiResponse = await sendWhatsAppMessage(phoneNumber, message);
      
      console.log(`✅ WhatsApp message sent via API to ${recipientName || phoneNumber}`);
      
      res.json({
        success: true,
        method: 'api',
        messageId: apiResponse.messages?.[0]?.id,
        message: `WhatsApp message sent via API to ${recipientName || phoneNumber}`,
        phoneNumber: phoneNumber,
        recipientName: recipientName || 'Unknown',
        apiResponse
      });
      
    } catch (apiError) {
      console.warn(`⚠️ WhatsApp API failed for ${recipientName || phoneNumber}:`, apiError.message);
      
      // Fallback to WhatsApp Web URL
      const whatsappURL = generateWhatsAppURL(phoneNumber, message);
      
      console.log(`📱 Fallback: WhatsApp URL generated for ${recipientName || phoneNumber}`);
      
      res.json({
        success: true,
        method: 'url',
        whatsappURL,
        message: `WhatsApp API unavailable, generated URL for ${recipientName || phoneNumber}`,
        phoneNumber: phoneNumber,
        recipientName: recipientName || 'Unknown',
        apiError: apiError.message
      });
    }
    
  } catch (error) {
    console.error('❌ Error sending WhatsApp message:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send WhatsApp message',
      details: error.message
    });
  }
});

// Send invoice via WhatsApp Business API (enhanced to support all templates)
app.post('/send-invoice', async (req, res) => {
  try {
    console.log('🔍 Raw request body:', JSON.stringify(req.body, null, 2));
    
    const { 
      phoneNumbers, 
      tenantName, 
      invoicePeriod, 
      totalAmount, 
      currency = 'RD$',
      invoiceUrl,
      organizationName = 'MicroRealEstate',
      locale = 'es-CO',  // Default to Colombian Spanish
      templateName = 'invoice',  // Default to invoice template
      dueDate,
      daysOverdue
    } = req.body;
    
    // Comprehensive debugging to identify the issue
    console.log('🔍 Received request data:', {
      phoneNumbers,
      tenantName,
      invoicePeriod,
      totalAmount,
      totalAmountType: typeof totalAmount,
      totalAmountValue: totalAmount,
      totalAmountString: String(totalAmount),
      currency,
      invoiceUrl,
      organizationName,
      locale,
      templateName,
      dueDate,
      daysOverdue
    });
    
    // Check if totalAmount is problematic or zero (account current)
    if (totalAmount === undefined || totalAmount === null || totalAmount === '' || totalAmount <= 0) {
      console.log('⏭️ Skipping WhatsApp message - No balance due:', {
        totalAmount,
        type: typeof totalAmount,
        stringValue: String(totalAmount),
        reason: totalAmount <= 0 ? 'Account current or overpaid' : 'Amount undefined'
      });
      
      return res.json({
        success: true,
        message: 'No payment reminder needed - account current',
        results: [],
        tenantName,
        summary: { total: 0, apiSuccess: 0, urlFallback: 0 },
        reason: 'No balance due'
      });
    }
    
    if (!phoneNumbers || !Array.isArray(phoneNumbers) || phoneNumbers.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'At least one phone number is required'
      });
    }
    
    // Validate template exists for the given locale
    const localeTemplates = MESSAGE_TEMPLATES[locale] || MESSAGE_TEMPLATES['en'];
    if (!localeTemplates[templateName]) {
      return res.status(400).json({
        success: false,
        error: `Template '${templateName}' not found for locale '${locale}'`,
        availableTemplates: Object.keys(localeTemplates),
        supportedLocales: Object.keys(MESSAGE_TEMPLATES)
      });
    }
    
    // Generate localized message using template
    const messageData = {
      tenantName: tenantName || 'Cliente',
      invoicePeriod,
      totalAmount,
      currency,
      invoiceUrl,
      organizationName,
      dueDate,
      daysOverdue
    };
    
    // Prepare template data for Meta-approved template
    const templateData = {
      tenantName: tenantName || 'Cliente',
      invoicePeriod,
      totalAmount,
      currency,
      dueDate,
      invoiceUrl
    };
    
    const message = getMessageTemplate(templateName, locale, messageData);
    
    // Send messages via WhatsApp Business API with fallback to URLs
    const results = [];
    let apiSuccessCount = 0;
    let urlFallbackCount = 0;
    
    for (const phone of phoneNumbers) {
      try {
        // Try WhatsApp Business API first with template data
        const apiResponse = await sendWhatsAppMessage(phone, message, templateData);
        
        results.push({
          phoneNumber: phone,
          success: true,
          method: 'api',
          messageId: apiResponse.messages?.[0]?.id,
          templateName,
          apiResponse
        });
        
        apiSuccessCount++;
        console.log(`✅ ${templateName} sent via API to ${phone} for ${tenantName}`);
        
      } catch (apiError) {
        console.warn(`⚠️ API failed for ${phone}, using fallback:`, apiError.message);
        
        // Fallback to WhatsApp Web URL
        const whatsappURL = generateWhatsAppURL(phone, message);
        
        results.push({
          phoneNumber: phone,
          success: true,
          method: 'url',
          whatsappURL,
          templateName,
          apiError: apiError.message
        });
        
        urlFallbackCount++;
        console.log(`📱 Fallback URL generated for ${phone} (${templateName})`);
      }
    }
    
    console.log(`📊 ${templateName} delivery summary for ${tenantName}: ${apiSuccessCount} via API, ${urlFallbackCount} via URL`);
    
    res.json({
      success: true,
      templateName,
      message: `${templateName} sent to ${results.length} phone number(s)`,
      results,
      tenantName,
      summary: {
        total: results.length,
        apiSuccess: apiSuccessCount,
        urlFallback: urlFallbackCount
      },
      messagePreview: message.substring(0, 100) + '...'
    });
    
  } catch (error) {
    console.error('❌ Error sending WhatsApp message:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send WhatsApp message',
      details: error.message
    });
  }
});

// Webhook verification for WhatsApp Business API
app.get('/webhook', (req, res) => {
  const VERIFY_TOKEN = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || 'microrealestate_webhook_token';
  
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  
  console.log(`🔍 Webhook verification attempt:`);
  console.log(`   Mode: ${mode}`);
  console.log(`   Received token: ${token}`);
  console.log(`   Expected token: ${VERIFY_TOKEN}`);
  console.log(`   Challenge: ${challenge}`);
  
  if (mode && token) {
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('✅ Webhook verified successfully');
      res.status(200).send(challenge);
    } else {
      console.log('❌ Webhook verification failed - token mismatch');
      res.sendStatus(403);
    }
  } else {
    console.log('❌ Webhook verification failed - missing parameters');
    res.sendStatus(400);
  }
});

// Message delivery status tracking
const messageStatusTracker = new Map();

// Webhook endpoint to receive delivery status updates
app.post('/webhook', (req, res) => {
  try {
    const body = req.body;
    
    if (body.object === 'whatsapp_business_account') {
      body.entry?.forEach(entry => {
        entry.changes?.forEach(change => {
          if (change.field === 'messages') {
            const value = change.value;
            
            // Handle message status updates
            if (value.statuses) {
              value.statuses.forEach(status => {
                const messageId = status.id;
                const statusType = status.status; // sent, delivered, read, failed
                const timestamp = status.timestamp;
                const recipientId = status.recipient_id;
                
                // Store status update
                messageStatusTracker.set(messageId, {
                  status: statusType,
                  timestamp: new Date(parseInt(timestamp) * 1000),
                  recipientId,
                  lastUpdated: new Date()
                });
                
                console.log(`📊 Message Status Update: ${messageId} -> ${statusType} (${recipientId})`);
                
                // Handle failed messages
                if (statusType === 'failed' && status.errors) {
                  status.errors.forEach(error => {
                    console.error(`❌ Message Failed: ${messageId}`, {
                      code: error.code,
                      title: error.title,
                      message: error.message,
                      details: error.error_data
                    });
                  });
                }
              });
            }
            
            // Handle incoming messages (for future use)
            if (value.messages) {
              value.messages.forEach(message => {
                console.log(`📨 Incoming message from ${message.from}: ${message.text?.body || '[media]'}`);
              });
            }
          }
        });
      });
    }
    
    res.status(200).send('EVENT_RECEIVED');
  } catch (error) {
    console.error('❌ Webhook processing error:', error);
    res.status(500).send('WEBHOOK_ERROR');
  }
});

// Get message delivery status
app.get('/message-status/:messageId', (req, res) => {
  const messageId = req.params.messageId;
  const status = messageStatusTracker.get(messageId);
  
  if (status) {
    res.json({
      success: true,
      messageId,
      status: status.status,
      timestamp: status.timestamp,
      recipientId: status.recipientId,
      lastUpdated: status.lastUpdated
    });
  } else {
    res.json({
      success: false,
      messageId,
      error: 'Message status not found',
      note: 'Status may not be available for messages sent before webhook was configured'
    });
  }
});

// Get all message statuses (for debugging)
app.get('/message-statuses', (req, res) => {
  const statuses = Array.from(messageStatusTracker.entries()).map(([messageId, status]) => ({
    messageId,
    ...status
  }));
  
  res.json({
    success: true,
    count: statuses.length,
    statuses: statuses.sort((a, b) => b.lastUpdated - a.lastUpdated)
  });
});

// Debug endpoint to check environment variables
app.get('/debug/env', (req, res) => {
  res.json({
    WHATSAPP_TEMPLATE_NAME: process.env.WHATSAPP_TEMPLATE_NAME,
    WHATSAPP_TEMPLATE_LANGUAGE: process.env.WHATSAPP_TEMPLATE_LANGUAGE,
    WHATSAPP_WEBHOOK_VERIFY_TOKEN: process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN,
    WHATSAPP_ACCESS_TOKEN: process.env.WHATSAPP_ACCESS_TOKEN ? 'SET' : 'NOT_SET',
    WHATSAPP_PHONE_NUMBER_ID: process.env.WHATSAPP_PHONE_NUMBER_ID
  });
});

app.get('/health', (req, res) => {
  const hasApiCredentials = !!(WHATSAPP_ACCESS_TOKEN && WHATSAPP_PHONE_NUMBER_ID);
  
  res.json({ 
    status: 'OK', 
    service: 'WhatsApp Business Integration',
    timestamp: new Date().toISOString(),
    apiConfigured: hasApiCredentials,
    mode: hasApiCredentials ? 'Business API + Fallback' : 'URL Generation Only'
  });
});

const PORT = process.env.WHATSAPP_PORT || 8500;

// Send Meta-approved template message
app.post('/send-template', async (req, res) => {
  try {
    const { phoneNumbers, templateName, templateLanguage, templateParameters } = req.body;
    
    if (!phoneNumbers || !Array.isArray(phoneNumbers) || phoneNumbers.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Phone numbers array is required'
      });
    }

    const results = [];
    
    for (const phoneNumber of phoneNumbers) {
      try {
        const templateData = {
          templateName: templateName || WHATSAPP_TEMPLATE_NAME || 'hello_world',
          language: templateLanguage || WHATSAPP_TEMPLATE_LANGUAGE || 'en_US',
          parameters: templateParameters || []
        };
        
        const response = await sendMetaTemplate(phoneNumber, templateData);
        
        results.push({
          phoneNumber,
          success: true,
          method: 'template',
          messageId: response.messages?.[0]?.id,
          templateName: templateData.templateName,
          response
        });
        
        console.log(`✅ Template "${templateData.templateName}" sent to ${phoneNumber}`);
        
      } catch (error) {
        console.error(`❌ Template send failed for ${phoneNumber}:`, error.message);
        
        results.push({
          phoneNumber,
          success: false,
          error: error.message,
          templateName: templateName || 'hello_world'
        });
      }
    }
    
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;
    
    console.log(`📊 Template delivery summary: ${successCount} sent, ${failureCount} failed`);
    
    res.json({
      success: successCount > 0,
      message: `Template sent to ${successCount} of ${phoneNumbers.length} phone number(s)`,
      results,
      summary: {
        total: phoneNumbers.length,
        success: successCount,
        failed: failureCount
      }
    });
    
  } catch (error) {
    console.error('❌ Error sending template messages:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send template messages',
      details: error.message
    });
  }
});

// Send Meta-approved template message function
async function sendMetaTemplate(phoneNumber, templateData) {
  if (!WHATSAPP_ACCESS_TOKEN || !WHATSAPP_PHONE_NUMBER_ID) {
    throw new Error('WhatsApp Business API credentials not configured');
  }
  
  const formattedPhone = formatPhoneNumber(phoneNumber);
  
  const payload = {
    messaging_product: 'whatsapp',
    to: formattedPhone,
    type: 'template',
    template: {
      name: templateData.templateName,
      language: {
        code: templateData.language
      }
    }
  };

  // Add template parameters if provided
  if (templateData.parameters && templateData.parameters.length > 0) {
    payload.template.components = [
      {
        type: 'body',
        parameters: templateData.parameters.map(param => ({
          type: 'text',
          text: param
        }))
      }
    ];
  }
  
  try {
    console.log(`📤 Sending Meta template "${templateData.templateName}" to ${formattedPhone}...`);
    
    const response = await axios.post(
      `${WHATSAPP_API_URL}/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
      payload,
      {
        headers: {
          'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log(`✅ Meta template sent successfully to ${formattedPhone}`);
    return response.data;
  } catch (error) {
    if (error.response?.data?.error) {
      const fbError = error.response.data.error;
      console.error(`❌ Meta Template API Error for ${formattedPhone}:`, fbError);
      
      if (fbError.code === 131030) {
        throw new Error(`Phone number ${formattedPhone} not in allowed list`);
      } else if (fbError.code === 190) {
        throw new Error('WhatsApp access token expired or invalid');
      } else if (fbError.code === 132000) {
        throw new Error(`Template "${templateData.templateName}" not found or not approved`);
      } else {
        throw new Error(`WhatsApp API Error (${fbError.code}): ${fbError.message}`);
      }
    }
    
    throw new Error(`WhatsApp API request failed: ${error.message}`);
  }
}

app.listen(PORT, () => {
  console.log(`🚀 WhatsApp service running on port ${PORT}`);
  
  if (WHATSAPP_ACCESS_TOKEN && WHATSAPP_PHONE_NUMBER_ID) {
    console.log(`✅ WhatsApp Business API configured`);
    console.log(`📱 Phone Number ID: ${WHATSAPP_PHONE_NUMBER_ID}`);
  } else {
    console.log(`⚠️  WhatsApp Business API not configured - using URL fallback only`);
    console.log(`💡 Set WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID for API integration`);
  }
});

module.exports = app;
