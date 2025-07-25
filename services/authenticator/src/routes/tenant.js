/* eslint-disable sort-imports */
import {
  Collections,
  logger,
  Middlewares,
  Service,
  ServiceError
} from '@microrealestate/common';
import {
  authRateLimit,
  authSlowDown,
  createAccountSpecificRateLimit
} from '../middleware/rateLimiting.js';
import {
  securityMonitoring,
  suspiciousActivityDetector,
  trackFailedAttempts
} from '../middleware/securityMonitoring.js';
import { customAlphabet } from 'nanoid';
import axios from 'axios';
import express from 'express';
import jwt from 'jsonwebtoken';

const nanoid = customAlphabet('0123456789', 6);

// WhatsApp Business API configuration
const WHATSAPP_API_URL =
  process.env.WHATSAPP_API_URL || 'https://graph.facebook.com/v18.0';
const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const WHATSAPP_LOGIN_TEMPLATE_NAME =
  process.env.WHATSAPP_LOGIN_TEMPLATE_NAME || 'otpcode';
const WHATSAPP_LOGIN_TEMPLATE_LANGUAGE =
  process.env.WHATSAPP_LOGIN_TEMPLATE_LANGUAGE || 'es';

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
          },
          {
            type: 'button',
            sub_type: 'url',
            index: '0',
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
        Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    logger.info('WhatsApp OTP sent successfully', {
      phoneNumber,
      messageId: response.data.messages[0].id
    });
    return { success: true, messageId: response.data.messages[0].id };
  } catch (error) {
    logger.error('Failed to send WhatsApp OTP', {
      phoneNumber,
      error: (error.response && error.response.data) || error.message,
      status: error.response && error.response.status,
      statusText: error.response && error.response.statusText,
      fullError: error.message
    });
    return {
      success: false,
      error: (error.response && error.response.data) || error.message
    };
  }
}

export default function () {
  console.log('TENANT ROUTER: Starting tenant router setup...');

  const {
    EMAILER_URL,
    ACCESS_TOKEN_SECRET,
    TOKEN_COOKIE_ATTRIBUTES,
    PRODUCTION
  } = Service.getInstance().envConfig.getValues();

  console.log('TENANT ROUTER: Environment config loaded');

  const tenantRouter = express.Router();

  console.log('TENANT ROUTER: Adding security middleware...');
  // Add security monitoring middleware
  tenantRouter.use(securityMonitoring);
  tenantRouter.use(suspiciousActivityDetector);
  tenantRouter.use(trackFailedAttempts);

  console.log('TENANT ROUTER: Setting up email signin route...');
  tenantRouter.post(
    '/signin',
    authRateLimit, // Rate limit authentication attempts
    authSlowDown, // Progressive delay for repeated attempts
    createAccountSpecificRateLimit(15 * 60 * 1000, 5), // 5 attempts per 15 minutes per email
    Middlewares.asyncWrapper(async (req, res) => {
      let { email } = req.body;
      email = email && email.trim().toLowerCase();
      if (!email) {
        logger.error('missing email field');
        throw new ServiceError('missing fields', 422);
      }

      if (email.includes(';') || email.includes('=')) {
        // ; and = are needed as separators in the redis payload
        logger.error('email contains unsupported characters');
        throw new ServiceError('unsupported email', 422);
      }

      const tenants = await Collections.Tenant.find({
        'contacts.email': email
      });
      if (!tenants.length) {
        logger.info(`login failed for ${email} tenant not found`);
        return res.sendStatus(204);
      }

      const otp = nanoid();
      const now = new Date();
      const createdAt = now.getTime();
      const expiresAt = createdAt + 5 * 60 * 1000; // 5m
      await Service.getInstance().redisClient.set(
        otp,
        `createdAt=${createdAt};expiresAt=${expiresAt};email=${email}`
      );

      logger.debug(
        `create a new OTP ${otp} for email ${email} and domain ${req.hostname}`
      );

      // send email
      await axios.post(
        `${EMAILER_URL}/otp`,
        {
          templateName: 'otp',
          recordId: email,
          params: {
            otp
          }
        },
        {
          headers: {
            'Accept-Language': req.rawLocale.code
          }
        }
      );

      // always return 204 to avoid email enumeration
      res.sendStatus(204);
    })
  );

  // WhatsApp OTP signin route for tenants
  tenantRouter.post(
    '/whatsapp/signin',
    authRateLimit, // Rate limit authentication attempts
    authSlowDown, // Progressive delay for repeated attempts
    createAccountSpecificRateLimit(15 * 60 * 1000, 5), // 5 attempts per 15 minutes per phone
    Middlewares.asyncWrapper(async (req, res) => {
      let { phoneNumber } = req.body;
      phoneNumber = phoneNumber && phoneNumber.trim();
      if (!phoneNumber) {
        logger.error('missing phoneNumber field');
        throw new ServiceError('missing fields', 422);
      }

      // Validate phone number format
      const phoneRegex = /^\+?[1-9]\d{1,14}$/;
      if (!phoneRegex.test(phoneNumber)) {
        logger.error('invalid phone number format');
        throw new ServiceError('invalid phone number', 422);
      }

      if (phoneNumber.includes(';') || phoneNumber.includes('=')) {
        // ; and = are needed as separators in the redis payload
        logger.error('phone number contains unsupported characters');
        throw new ServiceError('unsupported phone number', 422);
      }

      // Check if tenant exists with this phone number
      const tenants = await Collections.Tenant.find({
        $or: [
          { 'contacts.phone': phoneNumber },
          { 'contacts.phone1': phoneNumber },
          { 'contacts.phone2': phoneNumber }
        ]
      });

      if (!tenants.length) {
        logger.info(
          `WhatsApp login failed for ${phoneNumber} tenant not found`
        );
        return res.sendStatus(204);
      }

      // Check if the phone number has WhatsApp enabled
      const tenant = tenants[0];
      const hasWhatsAppEnabled = tenant.contacts.some(
        (contact) =>
          (contact.phone === phoneNumber ||
            contact.phone1 === phoneNumber ||
            contact.phone2 === phoneNumber) &&
          (contact.whatsapp1 || contact.whatsapp2)
      );

      if (!hasWhatsAppEnabled) {
        logger.info(`WhatsApp not enabled for phone ${phoneNumber}`);
        return res.sendStatus(204);
      }

      const otp = nanoid();
      const now = new Date();
      const createdAt = now.getTime();
      const expiresAt = createdAt + 5 * 60 * 1000; // 5m
      await Service.getInstance().redisClient.set(
        otp,
        `createdAt=${createdAt};expiresAt=${expiresAt};phoneNumber=${phoneNumber};type=whatsapp`
      );

      logger.debug(
        `create a new WhatsApp OTP ${otp} for phone ${phoneNumber} and domain ${req.hostname}`
      );

      // Send WhatsApp OTP
      const result = await sendWhatsAppOTP(phoneNumber, otp);

      if (!result.success) {
        logger.error(
          `Failed to send WhatsApp OTP to ${phoneNumber}`,
          result.error
        );
        throw new ServiceError('Failed to send WhatsApp OTP', 500);
      }

      // always return 204 to avoid phone enumeration
      res.sendStatus(204);
    })
  );

  tenantRouter.delete(
    '/signout',
    Middlewares.asyncWrapper(async (req, res) => {
      const sessionToken = req.cookies.sessionToken;
      logger.debug(`remove the session token: ${sessionToken}`);
      if (!sessionToken) {
        return res.sendStatus(204);
      }

      await Service.getInstance().redisClient.del(sessionToken);
      res.clearCookie('sessionToken', TOKEN_COOKIE_ATTRIBUTES);
      res.sendStatus(204);
    })
  );

  tenantRouter.get(
    '/signedin',
    authRateLimit, // Rate limit OTP verification attempts
    Middlewares.asyncWrapper(async (req, res) => {
      const { otp } = req.query;
      if (!otp) {
        throw new ServiceError('invalid otp', 401);
      }

      const rawPayload = await Service.getInstance().redisClient.get(otp);
      if (!rawPayload) {
        throw new ServiceError(
          `email not found for otp ${otp}. Code already used`,
          401
        );
      }
      await Service.getInstance().redisClient.del(otp);

      const payload = rawPayload.split(';').reduce((acc, rawValue) => {
        const [key, value] = rawValue.split('=');
        if (key) {
          acc[key] = value;
        }
        return acc;
      }, {});

      const now = new Date().getTime();
      const expiresAt = Number(payload.expiresAt) || 0;
      if (now > expiresAt) {
        logger.debug(`otp ${otp} has expired`);
        throw new ServiceError('invalid otp', 401);
      }

      let account;
      let sessionKey;

      // Handle WhatsApp OTP
      if (payload.type === 'whatsapp') {
        // Find tenant by phone number
        const tenants = await Collections.Tenant.find({
          $or: [
            { 'contacts.phone': payload.phoneNumber },
            { 'contacts.phone1': payload.phoneNumber },
            { 'contacts.phone2': payload.phoneNumber }
          ]
        });

        if (!tenants.length) {
          throw new ServiceError('tenant not found', 401);
        }

        const tenant = tenants[0];
        const contact = tenant.contacts.find(
          (c) =>
            c.phone === payload.phoneNumber ||
            c.phone1 === payload.phoneNumber ||
            c.phone2 === payload.phoneNumber
        );

        account = {
          email:
            (contact && contact.email) ||
            `${payload.phoneNumber}@whatsapp.tenant`,
          phone: payload.phoneNumber,
          role: 'tenant'
        };
        sessionKey = payload.phoneNumber;
      } else {
        // Handle email OTP (existing functionality)
        account = { email: payload.email, role: 'tenant' };
        sessionKey = payload.email;
      }

      const sessionToken = jwt.sign({ account }, ACCESS_TOKEN_SECRET, {
        expiresIn: PRODUCTION ? '30m' : '12h'
      });
      await Service.getInstance().redisClient.set(sessionToken, sessionKey);
      res.cookie('sessionToken', sessionToken, TOKEN_COOKIE_ATTRIBUTES);
      res.json({ sessionToken });
    })
  );

  // WhatsApp OTP verification route (separate endpoint for clarity)
  tenantRouter.get(
    '/whatsapp/signedin',
    authRateLimit, // Rate limit OTP verification attempts
    Middlewares.asyncWrapper(async (req, res) => {
      const { otp } = req.query;
      if (!otp) {
        throw new ServiceError('invalid otp', 401);
      }

      const rawPayload = await Service.getInstance().redisClient.get(otp);
      if (!rawPayload) {
        throw new ServiceError(
          `phone number not found for otp ${otp}. Code already used`,
          401
        );
      }
      await Service.getInstance().redisClient.del(otp);

      const payload = rawPayload.split(';').reduce((acc, rawValue) => {
        const [key, value] = rawValue.split('=');
        if (key) {
          acc[key] = value;
        }
        return acc;
      }, {});

      const now = new Date().getTime();
      const expiresAt = Number(payload.expiresAt) || 0;
      if (now > expiresAt) {
        logger.debug(`WhatsApp otp ${otp} has expired`);
        throw new ServiceError('invalid otp', 401);
      }

      // Verify this is a WhatsApp OTP
      if (payload.type !== 'whatsapp') {
        throw new ServiceError('invalid otp type', 401);
      }

      // Find tenant by phone number
      const tenants = await Collections.Tenant.find({
        $or: [
          { 'contacts.phone': payload.phoneNumber },
          { 'contacts.phone1': payload.phoneNumber },
          { 'contacts.phone2': payload.phoneNumber }
        ]
      });

      if (!tenants.length) {
        throw new ServiceError('tenant not found', 401);
      }

      const tenant = tenants[0];
      const contact = tenant.contacts.find(
        (c) =>
          c.phone === payload.phoneNumber ||
          c.phone1 === payload.phoneNumber ||
          c.phone2 === payload.phoneNumber
      );

      const account = {
        email:
          (contact && contact.email) ||
          `${payload.phoneNumber}@whatsapp.tenant`,
        phone: payload.phoneNumber,
        role: 'tenant',
        tenantId: tenant._id
      };

      const sessionToken = jwt.sign({ account }, ACCESS_TOKEN_SECRET, {
        expiresIn: PRODUCTION ? '30m' : '12h'
      });
      await Service.getInstance().redisClient.set(
        sessionToken,
        payload.phoneNumber
      );
      res.cookie('sessionToken', sessionToken, TOKEN_COOKIE_ATTRIBUTES);

      logger.info(`WhatsApp signin successful for ${payload.phoneNumber}`);
      res.json({
        sessionToken,
        user: {
          email: account.email,
          phone: payload.phoneNumber,
          role: account.role,
          tenantId: tenant._id
        }
      });
    })
  );

  tenantRouter.get(
    '/session',
    Middlewares.asyncWrapper(async (req, res) => {
      const sessionToken = req.cookies.sessionToken;
      if (!sessionToken) {
        throw new ServiceError('invalid token', 401);
      }

      const sessionKey =
        await Service.getInstance().redisClient.get(sessionToken);
      if (!sessionKey) {
        logger.error(`session key not found for token ${sessionToken}`);
        throw new ServiceError('invalid token', 401);
      }

      try {
        const decoded = jwt.verify(sessionToken, ACCESS_TOKEN_SECRET);

        // Return session info based on whether it's email or phone-based
        if (decoded.account.phone) {
          return res.json({
            email: decoded.account.email,
            phone: decoded.account.phone,
            role: decoded.account.role,
            tenantId: decoded.account.tenantId
          });
        } else {
          return res.json({ email: sessionKey });
        }
      } catch (error) {
        throw new ServiceError(error, 401);
      }
    })
  );

  return tenantRouter;
}
