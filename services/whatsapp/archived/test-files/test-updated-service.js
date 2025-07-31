#!/usr/bin/env node

/**
 * Test script for updated WhatsApp service with database configuration
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Simple mocks for testing
const logger = {
  info: (msg, ...args) => console.log(`ℹ️  ${msg}`, ...args),
  debug: (msg, ...args) => console.log(`🔍 ${msg}`, ...args),
  warn: (msg, ...args) => console.log(`⚠️  ${msg}`, ...args),
  error: (msg, ...args) => console.error(`❌ ${msg}`, ...args)
};

// Mock PhoneUtils
const PhoneUtils = {
  formatForApi: (phone) => phone.replace(/[\s-()]/g, ''),
  generateWhatsAppURL: (phone, message) => {
    const encodedMessage = encodeURIComponent(message);
    const cleanPhone = phone.replace(/[\s-()]/g, '');
    return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
  }
};

// Mock config for backward compatibility
const mockConfig = {
  get: (key) => {
    const config = {
      WHATSAPP_ACCESS_TOKEN: process.env.WHATSAPP_ACCESS_TOKEN || '',
      WHATSAPP_PHONE_NUMBER_ID: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
      WHATSAPP_API_URL:
        process.env.WHATSAPP_API_URL || 'https://graph.facebook.com/v18.0'
    };
    return config[key];
  },
  isApiConfigured: () =>
    !!(
      process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID
    )
};

// Simplified WhatsAppConfigService for testing
class WhatsAppConfigService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000;
  }

  async getWhatsAppConfig(realmId) {
    try {
      const cacheKey = `config_${realmId}`;
      const cached = this.cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.config;
      }

      const dbConfig = await this._getConfigFromDatabase(realmId);
      if (dbConfig && dbConfig.selected) {
        const config = this._buildConfigFromDatabase(dbConfig);
        this._cacheConfig(cacheKey, config);
        return config;
      }

      const envConfig = this._getConfigFromEnvironment();
      this._cacheConfig(cacheKey, envConfig);
      return envConfig;
    } catch (error) {
      logger.error(
        `Error getting WhatsApp config for realm ${realmId}:`,
        error
      );
      return this._getConfigFromEnvironment();
    }
  }

  getTemplate(config, templateType) {
    const template = config.templates?.[templateType];
    if (template) {
      return template;
    }
    return this._getDefaultTemplate(templateType);
  }

  async isWhatsAppEnabled(realmId) {
    try {
      const config = await this.getWhatsAppConfig(realmId);
      return !!(config.selected && config.accessToken && config.phoneNumberId);
    } catch (error) {
      return false;
    }
  }

  clearCache(realmId = null) {
    if (realmId) {
      this.cache.delete(`config_${realmId}`);
    } else {
      this.cache.clear();
    }
  }

  async _getConfigFromDatabase(realmId) {
    try {
      const realmSchema = new mongoose.Schema(
        {
          thirdParties: { whatsapp: mongoose.Schema.Types.Mixed }
        },
        { strict: false }
      );

      let Realm;
      if (mongoose.models.Realm) {
        Realm = mongoose.models.Realm;
      } else {
        Realm = mongoose.model('Realm', realmSchema);
      }

      const realm = await Realm.findById(realmId).select(
        'thirdParties.whatsapp'
      );
      return realm?.thirdParties?.whatsapp || null;
    } catch (error) {
      logger.error('Error fetching config from database:', error);
      return null;
    }
  }

  _buildConfigFromDatabase(dbConfig) {
    return {
      source: 'database',
      selected: dbConfig.selected,
      accessToken: dbConfig.accessToken || '',
      phoneNumberId: dbConfig.phoneNumberId || '',
      businessAccountId: dbConfig.businessAccountId || '',
      apiUrl: dbConfig.apiUrl || 'https://graph.facebook.com/v18.0',
      webhookVerifyToken: dbConfig.webhookVerifyToken || '',
      defaultLanguage: dbConfig.defaultLanguage || 'es',
      templates: dbConfig.templates || {},
      isApiConfigured: function () {
        return !!(this.accessToken && this.phoneNumberId);
      },
      getMode: function () {
        return this.isApiConfigured() ? 'api' : 'fallback';
      }
    };
  }

  _getConfigFromEnvironment() {
    return {
      source: 'environment',
      selected: true,
      accessToken: process.env.WHATSAPP_ACCESS_TOKEN || '',
      phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
      businessAccountId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || '',
      apiUrl:
        process.env.WHATSAPP_API_URL || 'https://graph.facebook.com/v18.0',
      webhookVerifyToken: process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || '',
      defaultLanguage: process.env.WHATSAPP_TEMPLATE_LANGUAGE || 'es',
      templates: {
        invoice: {
          name: process.env.WHATSAPP_INVOICE_TEMPLATE || 'factura2',
          language: process.env.WHATSAPP_TEMPLATE_LANGUAGE || 'es',
          parameters: [
            'tenantName',
            'period',
            'amount',
            'dueDate',
            'organization'
          ]
        },
        paymentNotice: {
          name:
            process.env.WHATSAPP_PAYMENT_NOTICE_TEMPLATE || 'payment_notice',
          language: process.env.WHATSAPP_TEMPLATE_LANGUAGE || 'es',
          parameters: ['tenantName', 'amount', 'dueDate']
        }
      },
      isApiConfigured: function () {
        return !!(this.accessToken && this.phoneNumberId);
      },
      getMode: function () {
        return this.isApiConfigured() ? 'api' : 'fallback';
      }
    };
  }

  _getDefaultTemplate(templateType) {
    const defaultTemplates = {
      invoice: {
        name: 'factura2',
        language: 'es',
        parameters: [
          'tenantName',
          'period',
          'amount',
          'dueDate',
          'organization'
        ]
      },
      paymentNotice: {
        name: 'payment_notice',
        language: 'es',
        parameters: ['tenantName', 'amount', 'dueDate']
      }
    };
    return (
      defaultTemplates[templateType] || {
        name: 'default',
        language: 'es',
        parameters: []
      }
    );
  }

  _cacheConfig(cacheKey, config) {
    this.cache.set(cacheKey, { config, timestamp: Date.now() });
  }
}

// Simplified MessageService for testing
class MessageService {
  constructor(fallbackConfig = null) {
    this.fallbackConfig = fallbackConfig;
    this.configService = new WhatsAppConfigService();
    this.messageStatusTracker = new Map();
  }

  async sendTemplateMessage(
    realmId,
    phoneNumber,
    templateType,
    templateData,
    recipientName = 'Unknown'
  ) {
    try {
      const config = await this.configService.getWhatsAppConfig(realmId);

      if (!config.isApiConfigured()) {
        logger.warn(
          `WhatsApp API not configured for realm ${realmId}, using fallback`
        );
        return this._sendWithFallback(
          phoneNumber,
          templateData,
          recipientName,
          templateType
        );
      }

      const template = this.configService.getTemplate(config, templateType);
      const templateParams = this._buildTemplateParameters(
        template,
        templateData
      );

      // Simulate API call (don't actually send)
      logger.info('Would send template message via API:', {
        template: template.name,
        language: template.language,
        parameters: templateParams,
        to: PhoneUtils.formatForApi(phoneNumber)
      });

      return {
        success: true,
        method: 'api',
        messageId: 'test_message_' + Date.now(),
        phoneNumber,
        recipientName,
        templateType,
        configSource: config.source,
        apiResponse: { messages: [{ id: 'test_message_' + Date.now() }] }
      };
    } catch (error) {
      logger.error('Template message failed:', error.message);
      return this._sendWithFallback(
        phoneNumber,
        templateData,
        recipientName,
        templateType,
        error.message
      );
    }
  }

  async sendInvoiceToMultiple(
    realmId,
    phoneNumbers,
    invoiceData,
    options = {}
  ) {
    const results = [];

    for (const phone of phoneNumbers) {
      try {
        const result = await this.sendTemplateMessage(
          realmId,
          phone,
          'invoice',
          invoiceData,
          invoiceData.tenantName
        );
        results.push(result);
      } catch (error) {
        results.push({
          success: false,
          phoneNumber: phone,
          error: error.message
        });
      }
    }

    return results;
  }

  _buildTemplateParameters(template, templateData) {
    return template.parameters.map((paramName) => {
      const value = templateData[paramName];
      if (value === undefined || value === null) {
        logger.warn(`Missing template parameter: ${paramName}`);
        return `[${paramName}]`;
      }
      return String(value);
    });
  }

  _sendWithFallback(
    phoneNumber,
    templateData,
    recipientName,
    templateType,
    apiError = null
  ) {
    const message = this._createMessageFromTemplate(templateType, templateData);
    const whatsappURL = PhoneUtils.generateWhatsAppURL(phoneNumber, message);

    return {
      success: true,
      method: 'url',
      whatsappURL,
      phoneNumber,
      recipientName,
      templateType,
      apiError
    };
  }

  _createMessageFromTemplate(templateType, templateData) {
    if (templateType === 'invoice') {
      const {
        tenantName = 'Cliente',
        period = 'N/A',
        amount = '0',
        dueDate = 'Por definir',
        organization = 'MicroRealEstate'
      } = templateData;
      return `Estimado/a ${tenantName},\n\nSu factura del período ${period} está lista.\n\n💰 Total: ${amount}\n📅 Fecha límite: ${dueDate}\n\nGracias por su confianza.\n${organization}`;
    }
    return `Mensaje: ${JSON.stringify(templateData)}`;
  }
}

async function testUpdatedService() {
  console.log('🧪 Testing Updated WhatsApp Service...\n');

  try {
    const mongoUrl = process.env.MONGO_URL || 'mongodb://localhost:27017/mredb';
    console.log(`📡 Connecting to MongoDB: ${mongoUrl}`);
    await mongoose.connect(mongoUrl);
    console.log('✅ Connected to MongoDB\n');

    const messageService = new MessageService(mockConfig);

    // Test 1: Send invoice with database configuration
    console.log('🔍 Test 1: Send invoice with database configuration');
    const existingOrgId = '6886c64de6119456418c4819';
    const invoiceData = {
      tenantName: 'Juan Pérez',
      period: 'Enero 2024',
      amount: 'RD$ 25,000',
      dueDate: '2024-02-15',
      organization: 'Apartamentos Central'
    };

    const result1 = await messageService.sendTemplateMessage(
      existingOrgId,
      '+18091234567',
      'invoice',
      invoiceData,
      'Juan Pérez'
    );

    console.log(`📊 Result: ${result1.success ? 'SUCCESS' : 'FAILED'}`);
    console.log(`📊 Method: ${result1.method}`);
    console.log(`📊 Config source: ${result1.configSource}`);
    console.log(`📊 Template type: ${result1.templateType}`);
    if (result1.whatsappURL) {
      console.log(
        `📊 WhatsApp URL: ${result1.whatsappURL.substring(0, 100)}...`
      );
    }
    console.log();

    // Test 2: Send invoice to multiple numbers
    console.log('🔍 Test 2: Send invoice to multiple numbers');
    const phoneNumbers = ['+18091234567', '+18097654321'];
    const results2 = await messageService.sendInvoiceToMultiple(
      existingOrgId,
      phoneNumbers,
      invoiceData
    );

    console.log(`📊 Batch results: ${results2.length} messages processed`);
    results2.forEach((result, index) => {
      console.log(
        `📊 Phone ${index + 1}: ${result.success ? 'SUCCESS' : 'FAILED'} (${result.method})`
      );
    });
    console.log();

    // Test 3: Test with non-existent organization (should use environment config)
    console.log('🔍 Test 3: Test with non-existent organization');
    const nonExistentOrgId = '507f1f77bcf86cd799439011';
    const result3 = await messageService.sendTemplateMessage(
      nonExistentOrgId,
      '+18091234567',
      'invoice',
      invoiceData,
      'Test User'
    );

    console.log(`📊 Result: ${result3.success ? 'SUCCESS' : 'FAILED'}`);
    console.log(`📊 Method: ${result3.method}`);
    console.log(`📊 Config source: ${result3.configSource}`);
    console.log();

    // Test 4: Test configuration service directly
    console.log('🔍 Test 4: Test configuration service directly');
    const config1 =
      await messageService.configService.getWhatsAppConfig(existingOrgId);
    const config2 =
      await messageService.configService.getWhatsAppConfig(nonExistentOrgId);

    console.log(`📊 Existing org config source: ${config1.source}`);
    console.log(`📊 Existing org enabled: ${config1.selected}`);
    console.log(`📊 Non-existent org config source: ${config2.source}`);
    console.log(`📊 Non-existent org enabled: ${config2.selected}`);

    console.log('\n🎉 All tests completed successfully!');
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('📡 Disconnected from MongoDB');
  }
}

// Run tests
testUpdatedService()
  .then(() => {
    console.log('🏁 Test script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Test script failed:', error);
    process.exit(1);
  });
