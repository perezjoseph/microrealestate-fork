const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// WhatsApp message templates matching email functionality
const MESSAGE_TEMPLATES = {
  // Invoice template (already implemented)
  invoice: (data) => `Estimado/a ${data.tenantName},

Su factura del período ${data.invoicePeriod} está lista.

 Total: ${data.currency} ${data.totalAmount}

${data.invoiceUrl ? ` Ver factura: ${data.invoiceUrl}` : ''}

Gracias por su confianza.
${data.organizationName}`,

  // First payment notice template
  rentcall: (data) => `Estimado/a ${data.tenantName},

🔔 RECORDATORIO DE PAGO

Su renta del período ${data.invoicePeriod} está pendiente de pago.

 Monto: ${data.currency} ${data.totalAmount}
📅 Fecha límite: ${data.dueDate}

${data.invoiceUrl ? ` Ver factura: ${data.invoiceUrl}` : ''}

Por favor, realice su pago a la brevedad posible.

${data.organizationName}`,

  // Second payment notice template  
  rentcall_reminder: (data) => `Estimado/a ${data.tenantName},

⚠️ SEGUNDO AVISO - PAGO PENDIENTE

Su renta del período ${data.invoicePeriod} continúa pendiente.

 Monto: ${data.currency} ${data.totalAmount}
📅 Fecha límite: ${data.dueDate}
⏰ Días de retraso: ${data.daysOverdue}

${data.invoiceUrl ? ` Ver factura: ${data.invoiceUrl}` : ''}

Es importante regularizar su situación para evitar inconvenientes.

${data.organizationName}`,

  // Last payment notice template
  rentcall_last_reminder: (data) => `Estimado/a ${data.tenantName},

🚨 ÚLTIMO AVISO - PAGO URGENTE

Su renta del período ${data.invoicePeriod} está en mora.

 Monto: ${data.currency} ${data.totalAmount}
📅 Fecha límite: ${data.dueDate}
⏰ Días de retraso: ${data.daysOverdue}

${data.invoiceUrl ? ` Ver factura: ${data.invoiceUrl}` : ''}

⚠️ IMPORTANTE: Si no recibimos su pago en las próximas 48 horas, procederemos según los términos del contrato.

Contacte inmediatamente para resolver esta situación.

${data.organizationName}`,

  // OTP template for tenant authentication
  otp: (data) => `Código de verificación MicroRealEstate

🔐 Su código de acceso es: ${data.otpCode}

Este código expira en ${data.expirationMinutes} minutos.

No comparta este código con nadie.

${data.organizationName}`,

  // Password reset template
  reset_password: (data) => `Recuperación de contraseña

🔑 Hemos recibido una solicitud para restablecer su contraseña.

${data.resetUrl ? `🔗 Haga clic aquí para crear una nueva contraseña: ${data.resetUrl}` : ''}

Si no solicitó este cambio, ignore este mensaje.

${data.organizationName}`
};

// Generic international phone number formatting
function formatPhoneNumber(phoneNumber) {
  // Clean phone number (remove spaces, dashes, parentheses, etc.)
  let cleanPhone = phoneNumber.replace(/[^\d+]/g, '');
  
  // If it already starts with +, use as-is
  if (cleanPhone.startsWith('+')) {
    return cleanPhone;
  }
  
  // If it doesn't start with +, add it
  if (!cleanPhone.startsWith('+')) {
    cleanPhone = '+' + cleanPhone;
  }
  
  return cleanPhone;
}

// Generate WhatsApp URL with generic formatting
function generateWhatsAppURL(phoneNumber, message) {
  const formattedPhone = formatPhoneNumber(phoneNumber);
  
  // Remove the + for WhatsApp URL format
  const phoneForUrl = formattedPhone.replace('+', '');
  
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${phoneForUrl}?text=${encodedMessage}`;
}

// Enhanced send message endpoint with template support
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
      otpCode,
      expirationMinutes,
      resetUrl
    } = req.body;
    
    if (!templateName || !MESSAGE_TEMPLATES[templateName]) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or missing template name',
        availableTemplates: Object.keys(MESSAGE_TEMPLATES)
      });
    }
    
    if (!phoneNumbers || !Array.isArray(phoneNumbers) || phoneNumbers.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'At least one phone number is required'
      });
    }
    
    // Generate message using template
    const messageData = {
      tenantName,
      invoicePeriod,
      totalAmount,
      currency,
      invoiceUrl,
      organizationName,
      dueDate,
      daysOverdue,
      otpCode,
      expirationMinutes,
      resetUrl
    };
    
    const message = MESSAGE_TEMPLATES[templateName](messageData);
    
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
        
        console.log(` ${templateName} URL generated for ${phone}`);
        
      } catch (error) {
        console.error(` Error generating URL for ${phone}:`, error.message);
        
        results.push({
          phoneNumber: phone,
          success: false,
          error: error.message,
          templateName
        });
      }
    }
    
    console.log(` ${templateName} delivery summary for ${tenantName}: ${results.filter(r => r.success).length} URLs generated`);
    
    res.json({
      success: true,
      templateName,
      message: `${templateName} URLs generated for ${results.filter(r => r.success).length} phone number(s)`,
      results,
      tenantName,
      messagePreview: message.substring(0, 100) + '...'
    });
    
  } catch (error) {
    console.error(' Error generating WhatsApp URLs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate WhatsApp URLs',
      details: error.message
    });
  }
});

// Bulk send endpoint (matching email functionality)
app.post('/send-bulk', async (req, res) => {
  try {
    const { 
      templateName,
      tenants, // Array of tenant objects with phone numbers and data
      organizationName = 'MicroRealEstate'
    } = req.body;
    
    if (!templateName || !MESSAGE_TEMPLATES[templateName]) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or missing template name'
      });
    }
    
    if (!tenants || !Array.isArray(tenants) || tenants.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'At least one tenant is required'
      });
    }
    
    const results = [];
    
    for (const tenant of tenants) {
      const { phoneNumbers, ...tenantData } = tenant;
      
      if (!phoneNumbers || phoneNumbers.length === 0) {
        results.push({
          tenantName: tenantData.tenantName,
          success: false,
          error: 'No phone numbers provided'
        });
        continue;
      }
      
      // Generate message for this tenant
      const messageData = {
        ...tenantData,
        organizationName
      };
      
      const message = MESSAGE_TEMPLATES[templateName](messageData);
      
      // Generate URLs for this tenant's phone numbers
      const tenantResults = [];
      
      for (const phone of phoneNumbers) {
        try {
          const whatsappURL = generateWhatsAppURL(phone, message);
          
          tenantResults.push({
            phoneNumber: phone,
            formattedPhone: formatPhoneNumber(phone),
            success: true,
            whatsappURL
          });
          
        } catch (error) {
          tenantResults.push({
            phoneNumber: phone,
            success: false,
            error: error.message
          });
        }
      }
      
      results.push({
        tenantName: tenantData.tenantName,
        success: tenantResults.some(r => r.success),
        phoneResults: tenantResults,
        messagePreview: message.substring(0, 100) + '...'
      });
    }
    
    const successCount = results.filter(r => r.success).length;
    
    res.json({
      success: true,
      templateName,
      message: `${templateName} processed for ${successCount}/${tenants.length} tenants`,
      results,
      summary: {
        total: tenants.length,
        successful: successCount,
        failed: tenants.length - successCount
      }
    });
    
  } catch (error) {
    console.error(' Error in bulk WhatsApp send:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process bulk WhatsApp send',
      details: error.message
    });
  }
});

// Get available templates
app.get('/templates', (req, res) => {
  res.json({
    success: true,
    templates: Object.keys(MESSAGE_TEMPLATES),
    descriptions: {
      invoice: 'Monthly rent invoice notification',
      rentcall: 'First payment reminder notice',
      rentcall_reminder: 'Second payment reminder notice',
      rentcall_last_reminder: 'Final payment notice',
      otp: 'One-time password for tenant authentication',
      reset_password: 'Password reset notification'
    }
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    service: 'Generic WhatsApp Integration',
    timestamp: new Date().toISOString(),
    availableTemplates: Object.keys(MESSAGE_TEMPLATES).length,
    phoneFormatting: 'Generic International (+CountryCode)',
    features: [
      'Invoice notifications',
      'Payment reminders',
      'OTP delivery',
      'Password reset',
      'Bulk messaging',
      'Generic international phone formatting'
    ]
  });
});

const PORT = process.env.WHATSAPP_PORT || 8500;

app.listen(PORT, () => {
  console.log(` Generic WhatsApp service running on port ${PORT}`);
  console.log(` Available templates: ${Object.keys(MESSAGE_TEMPLATES).join(', ')}`);
  console.log(`🌍 Using generic international phone formatting`);
  console.log(` All email functionality now available via WhatsApp`);
});

module.exports = app;
