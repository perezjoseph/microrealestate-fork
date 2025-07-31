import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

// Import standalone components
import StandaloneConfig from './standalone/config.js';
import MessageService from './standalone/message-service.js';
import ValidationService from './standalone/validation.js';
import SecurityService from './standalone/security.js';
import {
  globalErrorHandler,
  asyncHandler,
  createSuccessResponse
} from './standalone/error-handler.js';
import { createAuthMiddleware } from './standalone/auth-middleware-factory.js';
import logger from './standalone/logger.js';

// Authentication configuration
const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET;
const auth = createAuthMiddleware({ accessTokenSecret: ACCESS_TOKEN_SECRET });

const app = express();

// Security middleware
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"]
      }
    }
  })
);

app.use(SecurityService.securityHeaders);

// CORS configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
  'http://localhost:3000',
  'http://localhost:8080',
  'http://localhost:8200'
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        logger.warn('CORS blocked request from origin:', origin);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key']
  })
);

// Request parsing with size limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const generalLimiter = SecurityService.createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // 100 requests per 15 minutes
});

const messageLimiter = SecurityService.createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 10 // 10 messages per minute
});

app.use(generalLimiter);

// Add request ID for tracing
app.use((req, res, next) => {
  req.requestId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  next();
});

// Initialize configuration and services
let config, messageService;

try {
  config = new StandaloneConfig();
  messageService = new MessageService(config);
} catch (error) {
  logger.error('Failed to initialize services:', error.message);
  process.exit(1);
}

// Authentication handled by common middleware

const PORT = config.get('PORT');

// Validate configuration on startup
function validateStartupConfiguration() {
  const securityValidation = SecurityService.validateSecurityConfig();
  const authValidation = {
    valid: !!ACCESS_TOKEN_SECRET,
    methods: { jwt: !!ACCESS_TOKEN_SECRET }
  };

  const allIssues = [];

  if (!securityValidation.valid) {
    logger.warn('Security configuration issues:', securityValidation.issues);
    allIssues.push(...securityValidation.issues);
  }

  if (!authValidation.valid) {
    logger.warn('Authentication configuration issues:', authValidation.issues);
    allIssues.push(...authValidation.issues);
  }

  // Exit in production if any critical issues exist
  if (allIssues.length > 0 && process.env.NODE_ENV === 'production') {
    logger.error('Configuration invalid for production:', allIssues);
    process.exit(1);
  }

  logger.info('Authentication methods available:', authValidation.methods);

  return {
    security: securityValidation,
    auth: authValidation,
    allValid: securityValidation.valid && authValidation.valid
  };
}

const configValidation = validateStartupConfiguration();

// Health check endpoint (no authentication required)
app.get('/health', (req, res) => {
  const healthData = {
    service: 'WhatsApp Service (Standalone)',
    version: '1.0.0',
    apiConfigured: config.isApiConfigured(),
    mode: config.getMode(),
    timestamp: new Date().toISOString(),
    authentication: configValidation.auth.methods,
    security: {
      corsConfigured: !!process.env.ALLOWED_ORIGINS,
      rateLimitEnabled: true,
      jwtEnabled: configValidation.auth.methods.jwt
    }
  };

  res.json(createSuccessResponse(healthData, 'Service is healthy'));
});

// Send WhatsApp message endpoint
app.post(
  '/send-message',
  messageLimiter,
  auth.authenticate,
  ValidationService.createMiddleware(ValidationService.validateSendMessage),
  asyncHandler(async (req, res) => {
    const { phoneNumber, message, recipientName } = req.validatedData;

    const result = await messageService.sendMessageWithFallback(
      phoneNumber,
      message,
      recipientName
    );

    // Sanitized logging
    logger.info('WhatsApp message sent', {
      method: result.method,
      recipientName: SecurityService.sanitizeForLog(recipientName),
      requestId: req.requestId,
      apiKey: req.apiKey
    });

    // Remove sensitive data from response
    const sanitizedResult = {
      success: result.success,
      method: result.method,
      messageId: result.messageId,
      whatsappURL: result.whatsappURL,
      recipientName: result.recipientName
      // Don't return phoneNumber in response
    };

    res.json(
      createSuccessResponse(
        sanitizedResult,
        `WhatsApp message sent via ${result.method}`
      )
    );
  })
);

// Send invoice via WhatsApp endpoint
app.post(
  '/send-invoice',
  messageLimiter,
  auth.authenticate,
  ValidationService.createMiddleware(ValidationService.validateSendInvoice),
  asyncHandler(async (req, res) => {
    const {
      phoneNumbers,
      tenantName,
      invoicePeriod,
      totalAmount,
      currency,
      invoiceUrl,
      organizationName,
      dueDate
    } = req.validatedData;

    // Create template parameters for factura2 template
    const templateParams = [
      tenantName || 'Cliente',
      invoicePeriod,
      `${currency || 'RD$'} ${totalAmount}`,
      dueDate || 'Por definir',
      organizationName || 'MicroRealEstate'
    ];

    // Generate results for all phone numbers
    const results = [];

    for (const phone of phoneNumbers) {
      try {
        const result = await messageService.sendTemplateMessageWithFallback(
          phone,
          'factura2',
          'es',
          templateParams,
          tenantName
        );

        results.push({
          phoneNumber: SecurityService.sanitizeForLog(phone), // Sanitize in response
          success: true,
          method: result.method,
          messageId: result.messageId,
          whatsappURL: result.whatsappURL
        });

        logger.info('Invoice sent', {
          method: result.method,
          requestId: req.requestId,
          apiKey: req.apiKey
        });
      } catch (error) {
        logger.error('Error processing phone number', {
          error: error.message,
          requestId: req.requestId
        });

        results.push({
          phoneNumber: SecurityService.sanitizeForLog(phone),
          success: false,
          error: error.message
        });
      }
    }

    const successCount = results.filter((r) => r.success).length;

    logger.info('Invoice delivery completed', {
      tenantName: SecurityService.sanitizeForLog(tenantName),
      successCount,
      totalCount: results.length,
      requestId: req.requestId,
      userId: SecurityService.sanitizeForLog(req.userId),
      userType: req.userType
    });

    res.json(
      createSuccessResponse({
        message: `Invoice sent to ${successCount} of ${results.length} phone number(s)`,
        results,
        tenantName: SecurityService.sanitizeForLog(tenantName),
        totalSent: successCount,
        totalRequested: results.length
      })
    );
  })
);

// Global error handler
app.use(globalErrorHandler);

// Start the server
app.listen(PORT, () => {
  logger.info(`WhatsApp service running on port ${PORT}`);
  logger.info('WhatsApp Business API configuration:', {
    apiUrl: config.get('WHATSAPP_API_URL'),
    phoneNumberId: config.get('WHATSAPP_PHONE_NUMBER_ID')
      ? '***configured***'
      : 'not configured',
    accessToken: config.get('WHATSAPP_ACCESS_TOKEN')
      ? '***configured***'
      : 'not configured',
    templateLanguage: config.get('WHATSAPP_TEMPLATE_LANGUAGE'),
    invoiceTemplate: config.get('WHATSAPP_INVOICE_TEMPLATE'),
    mode: config.getMode()
  });

  logger.info('Security configuration:', {
    jwtAuthEnabled: !!process.env.ACCESS_TOKEN_SECRET,
    corsConfigured: !!process.env.ALLOWED_ORIGINS,
    rateLimitEnabled: true,
    allowedOrigins: allowedOrigins.length
  });

  // Error if no authentication configured
  if (!process.env.ACCESS_TOKEN_SECRET) {
    logger.error('❌ ACCESS_TOKEN_SECRET required for JWT authentication.');
  }
});

export default app;
