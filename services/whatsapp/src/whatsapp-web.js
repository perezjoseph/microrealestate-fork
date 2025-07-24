const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// WhatsApp Web URL generator
function generateWhatsAppURL(phoneNumber, message, documentUrl = null) {
  // Clean phone number (remove spaces, dashes, etc.)
  const cleanPhone = phoneNumber.replace(/[^\d+]/g, '');
  
  // Ensure Dominican Republic country code
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
  
  // Encode message for URL
  const encodedMessage = encodeURIComponent(message);
  
  // Generate WhatsApp URL
  const whatsappURL = `https://wa.me/${formattedPhone.replace('+', '')}?text=${encodedMessage}`;
  
  return whatsappURL;
}

// Send WhatsApp message (opens WhatsApp with pre-filled message)
app.post('/send-message', async (req, res) => {
  try {
    const { phoneNumber, message, recipientName, documentUrl } = req.body;
    
    if (!phoneNumber || !message) {
      return res.status(400).json({
        success: false,
        error: 'Phone number and message are required'
      });
    }
    
    // Generate WhatsApp URL
    const whatsappURL = generateWhatsAppURL(phoneNumber, message, documentUrl);
    
    console.log(` WhatsApp URL generated for ${recipientName || phoneNumber}:`, whatsappURL);
    
    res.json({
      success: true,
      whatsappURL,
      message: `WhatsApp URL generated for ${recipientName || phoneNumber}`,
      phoneNumber: phoneNumber,
      recipientName: recipientName || 'Unknown'
    });
    
  } catch (error) {
    console.error(' Error generating WhatsApp URL:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate WhatsApp URL',
      details: error.message
    });
  }
});

// Send invoice via WhatsApp
app.post('/send-invoice', async (req, res) => {
  try {
    const { 
      phoneNumbers, 
      tenantName, 
      invoicePeriod, 
      totalAmount, 
      currency = 'RD$',
      invoiceUrl,
      organizationName = 'MicroRealEstate'
    } = req.body;
    
    if (!phoneNumbers || !Array.isArray(phoneNumbers) || phoneNumbers.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'At least one phone number is required'
      });
    }
    
    // Create personalized message in Spanish
    const message = `Estimado/a ${tenantName || 'Cliente'},

Su factura del período ${invoicePeriod} está lista.

 Total: ${currency} ${totalAmount}

${invoiceUrl ? ` Ver factura: ${invoiceUrl}` : ''}

Gracias por su confianza.
${organizationName}`;
    
    // Generate WhatsApp URLs for all phone numbers
    const results = phoneNumbers.map(phone => {
      const whatsappURL = generateWhatsAppURL(phone, message, invoiceUrl);
      return {
        phoneNumber: phone,
        whatsappURL,
        success: true
      };
    });
    
    console.log(` Generated ${results.length} WhatsApp URLs for ${tenantName}`);
    
    res.json({
      success: true,
      message: `WhatsApp URLs generated for ${results.length} phone number(s)`,
      results,
      tenantName,
      totalSent: results.length
    });
    
  } catch (error) {
    console.error(' Error sending WhatsApp invoice:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate WhatsApp URLs',
      details: error.message
    });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    service: 'WhatsApp Web Integration',
    timestamp: new Date().toISOString()
  });
});

const PORT = process.env.WHATSAPP_PORT || 8500;

app.listen(PORT, () => {
  console.log(` WhatsApp Web service running on port ${PORT}`);
  console.log(` Service type: WhatsApp Web Integration (Click-to-send)`);
});

module.exports = app;
