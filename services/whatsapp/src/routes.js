import express from 'express';
import { logger, Middlewares } from '@microrealestate/common';
import * as WhatsAppSender from './whatsapp-sender.js';

const router = express.Router();

// Middleware
router.use(Middlewares.needAccessToken);
router.use(Middlewares.checkOrganization);

// Health check
router.get('/status', (req, res) => {
  res.json({ status: 'OK', service: 'whatsapp' });
});

// Send WhatsApp message with invoice
router.post('/send-invoice', async (req, res) => {
  try {
    const { tenantId, invoiceUrl, message, phoneNumber } = req.body;
    
    if (!phoneNumber || !invoiceUrl) {
      return res.status(400).json({ 
        error: 'Phone number and invoice URL are required' 
      });
    }

    const result = await WhatsAppSender.sendInvoice({
      phoneNumber,
      message: message || 'Su factura está lista',
      invoiceUrl,
      tenantId,
      organizationId: req.realm._id
    });

    logger.info(`WhatsApp invoice sent to ${phoneNumber} for tenant ${tenantId}`);
    res.json(result);
  } catch (error) {
    logger.error('Error sending WhatsApp invoice:', error);
    res.status(500).json({ error: error.message });
  }
});

// Send WhatsApp message (general)
router.post('/send-message', async (req, res) => {
  try {
    const { phoneNumber, message, mediaUrl } = req.body;
    
    if (!phoneNumber || !message) {
      return res.status(400).json({ 
        error: 'Phone number and message are required' 
      });
    }

    const result = await WhatsAppSender.sendMessage({
      phoneNumber,
      message,
      mediaUrl,
      organizationId: req.realm._id
    });

    logger.info(`WhatsApp message sent to ${phoneNumber}`);
    res.json(result);
  } catch (error) {
    logger.error('Error sending WhatsApp message:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
