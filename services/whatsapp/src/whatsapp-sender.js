import axios from 'axios';
import FormData from 'form-data';
import { logger, Service } from '@microrealestate/common';

const { 
  WHATSAPP_API_URL, 
  WHATSAPP_ACCESS_TOKEN, 
  WHATSAPP_PHONE_NUMBER_ID,
  WHATSAPP_BUSINESS_ACCOUNT_ID 
} = Service.getInstance().envConfig.getValues();

/**
 * Send WhatsApp message with invoice attachment
 */
export async function sendInvoice({ phoneNumber, message, invoiceUrl, tenantId, organizationId }) {
  try {
    // Clean phone number (remove non-digits, add country code if needed)
    const cleanPhone = cleanPhoneNumber(phoneNumber);
    
    // First, send the message
    const messageResult = await sendTextMessage(cleanPhone, message);
    
    // Then, send the invoice as a document
    const documentResult = await sendDocument(cleanPhone, invoiceUrl, 'Factura.pdf');
    
    // Log the activity
    await logWhatsAppActivity({
      phoneNumber: cleanPhone,
      tenantId,
      organizationId,
      type: 'invoice',
      status: 'sent',
      messageId: messageResult.messages?.[0]?.id,
      documentId: documentResult.messages?.[0]?.id
    });

    return {
      success: true,
      messageId: messageResult.messages?.[0]?.id,
      documentId: documentResult.messages?.[0]?.id,
      phoneNumber: cleanPhone
    };
  } catch (error) {
    logger.error('Error sending WhatsApp invoice:', error);
    
    // Log the failed attempt
    await logWhatsAppActivity({
      phoneNumber: cleanPhoneNumber(phoneNumber),
      tenantId,
      organizationId,
      type: 'invoice',
      status: 'failed',
      error: error.message
    });
    
    throw error;
  }
}

/**
 * Send simple WhatsApp text message
 */
export async function sendMessage({ phoneNumber, message, mediaUrl, organizationId }) {
  try {
    const cleanPhone = cleanPhoneNumber(phoneNumber);
    
    let result;
    if (mediaUrl) {
      // Send media message
      result = await sendMediaMessage(cleanPhone, message, mediaUrl);
    } else {
      // Send text message
      result = await sendTextMessage(cleanPhone, message);
    }
    
    await logWhatsAppActivity({
      phoneNumber: cleanPhone,
      organizationId,
      type: 'message',
      status: 'sent',
      messageId: result.messages?.[0]?.id
    });

    return {
      success: true,
      messageId: result.messages?.[0]?.id,
      phoneNumber: cleanPhone
    };
  } catch (error) {
    logger.error('Error sending WhatsApp message:', error);
    throw error;
  }
}

/**
 * Send text message via WhatsApp Business API
 */
async function sendTextMessage(phoneNumber, message) {
  const url = `${WHATSAPP_API_URL}/${WHATSAPP_PHONE_NUMBER_ID}/messages`;
  
  const payload = {
    messaging_product: 'whatsapp',
    to: phoneNumber,
    type: 'text',
    text: {
      body: message
    }
  };

  const response = await axios.post(url, payload, {
    headers: {
      'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
      'Content-Type': 'application/json'
    }
  });

  return response.data;
}

/**
 * Send document via WhatsApp Business API
 */
async function sendDocument(phoneNumber, documentUrl, filename = 'document.pdf') {
  const url = `${WHATSAPP_API_URL}/${WHATSAPP_PHONE_NUMBER_ID}/messages`;
  
  const payload = {
    messaging_product: 'whatsapp',
    to: phoneNumber,
    type: 'document',
    document: {
      link: documentUrl,
      filename: filename,
      caption: 'Su factura adjunta'
    }
  };

  const response = await axios.post(url, payload, {
    headers: {
      'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
      'Content-Type': 'application/json'
    }
  });

  return response.data;
}

/**
 * Send media message (image, video, etc.)
 */
async function sendMediaMessage(phoneNumber, caption, mediaUrl) {
  const url = `${WHATSAPP_API_URL}/${WHATSAPP_PHONE_NUMBER_ID}/messages`;
  
  // Determine media type based on URL extension
  const mediaType = getMediaType(mediaUrl);
  
  const payload = {
    messaging_product: 'whatsapp',
    to: phoneNumber,
    type: mediaType,
    [mediaType]: {
      link: mediaUrl,
      caption: caption
    }
  };

  const response = await axios.post(url, payload, {
    headers: {
      'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
      'Content-Type': 'application/json'
    }
  });

  return response.data;
}

/**
 * Clean and format phone number
 */
function cleanPhoneNumber(phoneNumber) {
  // Remove all non-digit characters
  let cleaned = phoneNumber.replace(/\D/g, '');
  
  // Add Dominican Republic country code if not present
  if (cleaned.length === 10 && cleaned.startsWith('8')) {
    cleaned = '1' + cleaned; // Add US/Dominican country code
  } else if (cleaned.length === 10) {
    cleaned = '1809' + cleaned.substring(3); // Assume 809 area code for DR
  }
  
  return cleaned;
}

/**
 * Determine media type from URL
 */
function getMediaType(url) {
  const extension = url.split('.').pop().toLowerCase();
  
  if (['jpg', 'jpeg', 'png', 'gif'].includes(extension)) {
    return 'image';
  } else if (['mp4', 'avi', 'mov'].includes(extension)) {
    return 'video';
  } else if (['mp3', 'wav', 'ogg'].includes(extension)) {
    return 'audio';
  } else {
    return 'document';
  }
}

/**
 * Log WhatsApp activity to database
 */
async function logWhatsAppActivity(activity) {
  try {
    // This would typically save to a WhatsApp activity log collection
    logger.info('WhatsApp activity:', activity);
    
    // You can implement database logging here if needed
    // await Collections.WhatsAppLog.create(activity);
  } catch (error) {
    logger.error('Error logging WhatsApp activity:', error);
  }
}
