import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

// Import standalone components
import StandaloneConfig from './standalone/config.js';
import MessageService from './standalone/message-service-updated.js'; // Use updated service
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
      if (!origin) return callback(null, true);

      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        logger.warn('CORS blocked request from origin:', origin);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true
  })
);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  req.requestId = Math.random().toString(36).substring(2, 15);
  logger.info(`${req.method} ${req.path}`, {
    requestId: req.requestId,
    userAgent: req.get('User-Agent'),
    ip: req.ip
  });
  next();
});

// Rate limiting
import rateLimit from 'express-rate-limit';

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false
});

const messageLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // limit each IP to 10 message requests per minute
  message: 'Too many message requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false
});

app.use(generalLimiter);

// Initialize services
const config = new StandaloneConfig();
const messageService = new MessageService(config); // Pass config for backward compatibility

// Configuration validation
const configValidation = config.validate();
if (!configValidation.valid) {
  logger.error('Configuration validation failed:', configValidation.issues);
  process.exit(1);
}

if (configValidation.issues?.length > 0) {
  configValidation.issues.forEach((issue) =>
    logger.warn('Config warning:', issue)
  );
}

logger.info('WhatsApp Service (Standalone) starting...', {
  mode: config.getMode(),
  apiConfigured: config.isApiConfigured(),
  nodeEnv: process.env.NODE_ENV
});

// Health check endpoint (no authentication required)
app.get('/health', (req, res) => {
  const healthData = {
    service: 'WhatsApp Service (Standalone)',
    version: '1.0.0',
    apiConfigured: config.isApiConfigured(),
    mode: config.getMode(),
    timestamp: new Date().toISOString(),
    authentication: 'JWT',
    security: {
      corsConfigured: !!process.env.ALLOWED_ORIGINS,
      rateLimitEnabled: true,
      helmetEnabled: true
    }
  };

  res.json(createSuccessResponse(healthData, 'Service is healthy'));
});

// Send WhatsApp message endpoint (backward compatibility)
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

    logger.info('WhatsApp message sent', {
      method: result.method,
      success: result.success,
      requestId: req.requestId,
      apiKey: req.apiKey
    });

    res.json(
      createSuccessResponse(
        {
          messageId: result.messageId,
          method: result.method,
          whatsappURL: result.whatsappURL,
          phoneNumber: SecurityService.sanitizeForLog(result.phoneNumber),
          success: result.success
        },
        'Message sent successfully'
      )
    );
  })
);

// Enhanced send invoice endpoint with organization support
app.post(
  '/send-invoice',
  messageLimiter,
  auth.authenticate,
  ValidationService.createMiddleware(
    ValidationService.validateSendInvoiceEnhanced
  ),
  asyncHandler(async (req, res) => {
    const {
      realmId, // Organization ID - NEW REQUIRED PARAMETER
      phoneNumbers,
      tenantName,
      invoicePeriod,
      totalAmount,
      currency,
      invoiceUrl,
      organizationName,
      dueDate
    } = req.validatedData;

    // Prepare template data for the new system
    const templateData = {
      tenantName: tenantName || 'Cliente',
      period: invoicePeriod,
      amount: `${currency || 'RD$'} ${totalAmount}`,
      dueDate: dueDate || 'Por definir',
      organization: organizationName || 'MicroRealEstate'
    };

    // Use the new organization-aware method
    const results = await messageService.sendInvoiceToMultiple(
      realmId,
      phoneNumbers,
      templateData
    );

    // Format results for response
    const formattedResults = results.map((result) => ({
      phoneNumber: SecurityService.sanitizeForLog(result.phoneNumber),
      success: result.success,
      method: result.method,
      messageId: result.messageId,
      whatsappURL: result.whatsappURL,
      configSource: result.configSource, // NEW: Shows if config came from database or environment
      error: result.error
    }));

    const successCount = results.filter((r) => r.success).length;

    logger.info('Invoice batch sent', {
      realmId,
      totalCount: phoneNumbers.length,
      successCount,
      requestId: req.requestId,
      apiKey: req.apiKey
    });

    res.json(
      createSuccessResponse(
        {
          results: formattedResults,
          summary: {
            total: phoneNumbers.length,
            successful: successCount,
            failed: phoneNumbers.length - successCount
          }
        },
        `Invoice sent to ${successCount}/${phoneNumbers.length} recipients`
      )
    );
  })
);

// Backward compatibility endpoint (uses environment config)
app.post(
  '/send-invoice-legacy',
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

    // Create template parameters for factura2 template (backward compatibility)
    const templateParams = [
      tenantName || 'Cliente',
      invoicePeriod,
      `${currency || 'RD$'} ${totalAmount}`,
      dueDate || 'Por definir',
      organizationName || 'MicroRealEstate'
    ];

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
          phoneNumber: SecurityService.sanitizeForLog(phone),
          success: true,
          method: result.method,
          messageId: result.messageId,
          whatsappURL: result.whatsappURL
        });

        logger.info('Invoice sent (legacy)', {
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

    res.json(
      createSuccessResponse(
        {
          results,
          summary: {
            total: phoneNumbers.length,
            successful: successCount,
            failed: phoneNumbers.length - successCount
          }
        },
        `Invoice sent to ${successCount}/${phoneNumbers.length} recipients`
      )
    );
  })
);

// New endpoint: Get WhatsApp configuration for an organization
app.get(
  '/config/:realmId',
  auth.authenticate,
  asyncHandler(async (req, res) => {
    const { realmId } = req.params;

    const configService = messageService.configService;
    const config = await configService.getWhatsAppConfig(realmId);
    const isEnabled = await configService.isWhatsAppEnabled(realmId);

    // Return safe configuration (without sensitive data)
    const safeConfig = {
      source: config.source,
      selected: config.selected,
      isEnabled,
      defaultLanguage: config.defaultLanguage,
      apiConfigured: config.isApiConfigured(),
      mode: config.getMode(),
      templates: Object.keys(config.templates || {})
    };

    res.json(
      createSuccessResponse(safeConfig, 'Configuration retrieved successfully')
    );
  })
);

// New endpoint: Test template message
app.post(
  '/test-template',
  messageLimiter,
  auth.authenticate,
  ValidationService.createMiddleware(ValidationService.validateTestTemplate),
  asyncHandler(async (req, res) => {
    const { realmId, phoneNumber, templateType, templateData } =
      req.validatedData;

    const result = await messageService.sendTemplateMessage(
      realmId,
      phoneNumber,
      templateType,
      templateData,
      'Test User'
    );

    logger.info('Template test sent', {
      realmId,
      templateType,
      method: result.method,
      requestId: req.requestId,
      apiKey: req.apiKey
    });

    res.json(
      createSuccessResponse(
        {
          messageId: result.messageId,
          method: result.method,
          whatsappURL: result.whatsappURL,
          configSource: result.configSource,
          templateType: result.templateType
        },
        'Template message sent successfully'
      )
    );
  })
);

// Error handling middleware
app.use(globalErrorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    timestamp: new Date().toISOString()
  });
});

// Start server
const PORT = config.get('PORT');
const server = app.listen(PORT, () => {
  logger.info(`WhatsApp Service (Standalone) listening on port ${PORT}`, {
    mode: config.getMode(),
    apiConfigured: config.isApiConfigured()
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

export default app;
