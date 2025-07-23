import express from 'express';
import { logger, Service, ServiceError, Middlewares } from '@microrealestate/common';
import axios from 'axios';
import { nanoid } from 'nanoid';

const router = express.Router();

// WhatsApp Business API configuration
const WHATSAPP_API_URL = process.env.WHATSAPP_API_URL || 'https://graph.facebook.com/v18.0';
const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const WHATSAPP_LOGIN_TEMPLATE_NAME = process.env.WHATSAPP_LOGIN_TEMPLATE_NAME || 'otpcode';
const WHATSAPP_LOGIN_TEMPLATE_LANGUAGE = process.env.WHATSAPP_LOGIN_TEMPLATE_LANGUAGE || 'es';

// Send WhatsApp OTP using the otpcode template
async function sendWhatsAppOTP(phoneNumber, otp) {
  try {
    const url = `${WHATSAPP_API_URL}/${WHATSAPP_PHONE_NUMBER_ID}/messages`;
    
    const payload = {
      messaging_product: 'whatsapp',
      to: phoneNumber,
      type: 'template',
      template: {
        name: WHATSAPP_LOGIN_TEMPLATE_NAME,
        language: {
          code: WHATSAPP_LOGIN_TEMPLATE_LANGUAGE
        },
        components: [
          {
            type: 'body',
            parameters: [
              {
                type: 'text',
                text: otp
              }
            ]
          }
        ]
      }
    };

    const response = await axios.post(url, payload, {
      headers: {
        'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    logger.info('WhatsApp OTP sent successfully', { phoneNumber, messageId: response.data.messages[0].id });
    return { success: true, messageId: response.data.messages[0].id };
  } catch (error) {
    logger.error('Failed to send WhatsApp OTP', { 
      phoneNumber, 
      error: error.response?.data || error.message 
    });
    return { success: false, error: error.response?.data || error.message };
  }
}

// WhatsApp OTP request endpoint (similar to tenant email OTP)
router.post(
  '/signin',
  Middlewares.asyncWrapper(async (req, res) => {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      logger.info('WhatsApp signin failed - no phone number provided');
      return res.sendStatus(204);
    }

    // Validate phone number format
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    if (!phoneRegex.test(phoneNumber)) {
      logger.info(`WhatsApp signin failed - invalid phone number format: ${phoneNumber}`);
      return res.sendStatus(204);
    }

    try {
      // Check if user exists with this phone number (you'll need to add phone field to your user model)
      const db = Service.getInstance().db;
      const users = await db.collection('accounts').find({ 
        $or: [
          { phone: phoneNumber },
          { whatsappPhone: phoneNumber }
        ]
      }).toArray();

      if (!users.length) {
        logger.info(`WhatsApp signin failed for ${phoneNumber} - user not found`);
        return res.sendStatus(204);
      }

      // Generate OTP using same system as email OTP
      const otp = nanoid();
      const now = new Date();
      const createdAt = now.getTime();
      const expiresAt = createdAt + 5 * 60 * 1000; // 5 minutes

      // Store in Redis with same format as email OTP
      await Service.getInstance().redisClient.set(
        otp,
        `createdAt=${createdAt};expiresAt=${expiresAt};phoneNumber=${phoneNumber};type=whatsapp`
      );

      logger.debug(
        `Created WhatsApp OTP ${otp} for phone ${phoneNumber}`
      );

      // Send WhatsApp message
      const result = await sendWhatsAppOTP(phoneNumber, otp);

      if (result.success) {
        logger.info(`WhatsApp OTP sent successfully to ${phoneNumber}`);
        res.sendStatus(200);
      } else {
        logger.error(`Failed to send WhatsApp OTP to ${phoneNumber}`, result.error);
        res.sendStatus(500);
      }

    } catch (error) {
      logger.error('Error in WhatsApp signin', { error: error.message, phoneNumber });
      res.sendStatus(500);
    }
  })
);

// WhatsApp OTP verification endpoint (similar to tenant signedin)
router.get(
  '/signedin',
  Middlewares.asyncWrapper(async (req, res) => {
    const { otp } = req.query;
    if (!otp) {
      throw new ServiceError('invalid otp', 401);
    }

    // Get OTP data from Redis
    const rawPayload = await Service.getInstance().redisClient.get(otp);
    if (!rawPayload) {
      throw new ServiceError(
        `phone number not found for otp ${otp}. Code already used`,
        401
      );
    }
    
    // Delete OTP after use
    await Service.getInstance().redisClient.del(otp);

    // Parse payload
    const payload = rawPayload.split(';').reduce((acc, rawValue) => {
      const [key, value] = rawValue.split('=');
      if (key) {
        acc[key] = value;
      }
      return acc;
    }, {});

    // Check if OTP is expired
    const now = new Date().getTime();
    const expiresAt = Number(payload.expiresAt) || 0;
    if (now > expiresAt) {
      logger.debug(`WhatsApp OTP ${otp} has expired`);
      throw new ServiceError('invalid otp', 401);
    }

    // Verify this is a WhatsApp OTP
    if (payload.type !== 'whatsapp') {
      throw new ServiceError('invalid otp type', 401);
    }

    // Find user by phone number
    const db = Service.getInstance().db;
    const users = await db.collection('accounts').find({ 
      $or: [
        { phone: payload.phoneNumber },
        { whatsappPhone: payload.phoneNumber }
      ]
    }).toArray();

    if (!users.length) {
      throw new ServiceError('user not found', 401);
    }

    const user = users[0];
    
    // Create session token (similar to email OTP flow)
    const jwt = require('jsonwebtoken');
    const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET;
    const PRODUCTION = process.env.NODE_ENV === 'production';

    const account = { 
      email: user.email, 
      phone: payload.phoneNumber,
      role: user.role || 'tenant' 
    };
    
    const sessionToken = jwt.sign({ account }, ACCESS_TOKEN_SECRET, {
      expiresIn: PRODUCTION ? '30m' : '12h'
    });

    const { TOKEN_COOKIE_ATTRIBUTES } = Service.getInstance().envConfig;
    res.cookie('sessionToken', sessionToken, TOKEN_COOKIE_ATTRIBUTES);

    logger.info(`WhatsApp signin successful for ${payload.phoneNumber}`);
    res.json({
      user: {
        email: user.email,
        phone: payload.phoneNumber,
        role: account.role
      }
    });
  })
);

export default function() {
  return router;
}
