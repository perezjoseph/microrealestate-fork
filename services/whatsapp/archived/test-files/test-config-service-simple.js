#!/usr/bin/env node

/**
 * Simple test script for WhatsAppConfigService
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Simple logger mock
const logger = {
  info: (msg, ...args) => console.log(`ℹ️  ${msg}`, ...args),
  debug: (msg, ...args) => console.log(`🔍 ${msg}`, ...args),
  warn: (msg, ...args) => console.log(`⚠️  ${msg}`, ...args),
  error: (msg, ...args) => console.error(`❌ ${msg}`, ...args)
};

// Simple config mock
const mockConfig = {
  get: (key) => {
    const config = {
      whatsappAccessToken: process.env.WHATSAPP_ACCESS_TOKEN || '',
      whatsappPhoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
      whatsappBusinessAccountId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || '',
      whatsappApiUrl:
        process.env.WHATSAPP_API_URL || 'https://graph.facebook.com/v18.0',
      whatsappTemplateLanguage: process.env.WHATSAPP_TEMPLATE_LANGUAGE || 'es',
      whatsappInvoiceTemplate:
        process.env.WHATSAPP_INVOICE_TEMPLATE || 'factura2'
    };
    return config[key];
  }
};

/**
 * Simplified WhatsApp Configuration Service for testing
 */
class WhatsAppConfigService {
  constructor() {
    this.fallbackConfig = mockConfig;
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes cache
  }

  async getWhatsAppConfig(realmId) {
    try {
      // Check cache first
      const cacheKey = `config_${realmId}`;
      const cached = this.cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
        logger.debug(`Using cached WhatsApp config for realm ${realmId}`);
        return cached.config;
      }

      // Try to get from database first
      const dbConfig = await this._getConfigFromDatabase(realmId);
      if (dbConfig && dbConfig.selected) {
        logger.info(`Using database WhatsApp config for realm ${realmId}`);
        const config = this._buildConfigFromDatabase(dbConfig);
        this._cacheConfig(cacheKey, config);
        return config;
      }

      // Fall back to environment variables
      logger.info(
        `Using environment variable WhatsApp config for realm ${realmId}`
      );
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

    logger.warn(`Template ${templateType} not found, using default`);
    return this._getDefaultTemplate(templateType);
  }

  async isWhatsAppEnabled(realmId) {
    try {
      const config = await this.getWhatsAppConfig(realmId);
      return !!(config.selected && config.accessToken && config.phoneNumberId);
    } catch (error) {
      logger.error(
        `Error checking WhatsApp status for realm ${realmId}:`,
        error
      );
      return false;
    }
  }

  clearCache(realmId = null) {
    if (realmId) {
      this.cache.delete(`config_${realmId}`);
      logger.debug(`Cleared WhatsApp config cache for realm ${realmId}`);
    } else {
      this.cache.clear();
      logger.debug('Cleared all WhatsApp config cache');
    }
  }

  async _getConfigFromDatabase(realmId) {
    try {
      const realmSchema = new mongoose.Schema(
        {
          thirdParties: {
            whatsapp: mongoose.Schema.Types.Mixed
          }
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
      logger.error(
        `Error fetching WhatsApp config from database for realm ${realmId}:`,
        error
      );
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
      accessToken: this.fallbackConfig.get('whatsappAccessToken') || '',
      phoneNumberId: this.fallbackConfig.get('whatsappPhoneNumberId') || '',
      businessAccountId:
        this.fallbackConfig.get('whatsappBusinessAccountId') || '',
      apiUrl:
        this.fallbackConfig.get('whatsappApiUrl') ||
        'https://graph.facebook.com/v18.0',
      webhookVerifyToken: process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || '',
      defaultLanguage:
        this.fallbackConfig.get('whatsappTemplateLanguage') || 'es',
      templates: {
        invoice: {
          name:
            this.fallbackConfig.get('whatsappInvoiceTemplate') || 'factura2',
          language: this.fallbackConfig.get('whatsappTemplateLanguage') || 'es',
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
          language: this.fallbackConfig.get('whatsappTemplateLanguage') || 'es',
          parameters: ['tenantName', 'amount', 'dueDate']
        },
        paymentReminder: {
          name:
            process.env.WHATSAPP_PAYMENT_REMINDER_TEMPLATE || 'second_notice',
          language: this.fallbackConfig.get('whatsappTemplateLanguage') || 'es',
          parameters: ['tenantName', 'amount', 'dueDate', 'daysOverdue']
        },
        finalNotice: {
          name:
            process.env.WHATSAPP_FINAL_NOTICE_TEMPLATE ||
            'rentcall_last_reminder',
          language: this.fallbackConfig.get('whatsappTemplateLanguage') || 'es',
          parameters: ['tenantName', 'amount', 'dueDate', 'daysOverdue']
        },
        login: {
          name: process.env.WHATSAPP_LOGIN_TEMPLATE_NAME || 'otpcode',
          language: process.env.WHATSAPP_LOGIN_TEMPLATE_LANGUAGE || 'es',
          parameters: ['code', 'expiry']
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
      },
      paymentReminder: {
        name: 'second_notice',
        language: 'es',
        parameters: ['tenantName', 'amount', 'dueDate', 'daysOverdue']
      },
      finalNotice: {
        name: 'rentcall_last_reminder',
        language: 'es',
        parameters: ['tenantName', 'amount', 'dueDate', 'daysOverdue']
      },
      login: {
        name: 'otpcode',
        language: 'es',
        parameters: ['code', 'expiry']
      }
    };

    return (
      defaultTemplates[templateType] || {
        name: 'default_template',
        language: 'es',
        parameters: []
      }
    );
  }

  _cacheConfig(cacheKey, config) {
    this.cache.set(cacheKey, {
      config,
      timestamp: Date.now()
    });
  }
}

async function testConfigService() {
  console.log('🧪 Testing WhatsApp Configuration Service...\n');

  try {
    // Connect to MongoDB
    const mongoUrl = process.env.MONGO_URL || 'mongodb://localhost:27017/mredb';
    console.log(`📡 Connecting to MongoDB: ${mongoUrl}`);
    await mongoose.connect(mongoUrl);
    console.log('✅ Connected to MongoDB\n');

    const configService = new WhatsAppConfigService();

    // Test 1: Get configuration for existing organization (should use database)
    console.log(
      '🔍 Test 1: Getting config for existing organization (Apartamentos)'
    );
    const existingOrgId = '6886c64de6119456418c4819';
    const dbConfig = await configService.getWhatsAppConfig(existingOrgId);

    console.log(`📊 Configuration source: ${dbConfig.source}`);
    console.log(`📊 WhatsApp enabled: ${dbConfig.selected}`);
    console.log(`📊 Default language: ${dbConfig.defaultLanguage}`);
    console.log(`📊 API configured: ${dbConfig.isApiConfigured()}`);
    console.log(`📊 Mode: ${dbConfig.getMode()}`);

    const invoiceTemplate = configService.getTemplate(dbConfig, 'invoice');
    console.log(
      `📊 Invoice template: ${invoiceTemplate.name} (${invoiceTemplate.language})`
    );
    console.log(
      `📊 Invoice parameters: ${invoiceTemplate.parameters.join(', ')}\n`
    );

    // Test 2: Get configuration for non-existent organization (should use environment)
    console.log('🔍 Test 2: Getting config for non-existent organization');
    const nonExistentOrgId = '507f1f77bcf86cd799439011';
    const envConfig = await configService.getWhatsAppConfig(nonExistentOrgId);

    console.log(`📊 Configuration source: ${envConfig.source}`);
    console.log(`📊 WhatsApp enabled: ${envConfig.selected}`);
    console.log(`📊 Default language: ${envConfig.defaultLanguage}`);
    console.log(`📊 API configured: ${envConfig.isApiConfigured()}`);
    console.log(`📊 Mode: ${envConfig.getMode()}`);

    const envInvoiceTemplate = configService.getTemplate(envConfig, 'invoice');
    console.log(
      `📊 Invoice template: ${envInvoiceTemplate.name} (${envInvoiceTemplate.language})`
    );
    console.log(
      `📊 Invoice parameters: ${envInvoiceTemplate.parameters.join(', ')}\n`
    );

    // Test 3: Check WhatsApp enabled status
    console.log('🔍 Test 3: Checking WhatsApp enabled status');
    const isEnabledExisting =
      await configService.isWhatsAppEnabled(existingOrgId);
    const isEnabledNonExistent =
      await configService.isWhatsAppEnabled(nonExistentOrgId);

    console.log(`📊 Existing org WhatsApp enabled: ${isEnabledExisting}`);
    console.log(
      `📊 Non-existent org WhatsApp enabled: ${isEnabledNonExistent}\n`
    );

    // Test 4: Template types
    console.log('🔍 Test 4: Testing all template types');
    const templateTypes = [
      'invoice',
      'paymentNotice',
      'paymentReminder',
      'finalNotice',
      'login'
    ];

    for (const templateType of templateTypes) {
      const template = configService.getTemplate(dbConfig, templateType);
      console.log(
        `📊 ${templateType}: ${template.name} (${template.parameters.length} params)`
      );
    }

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
testConfigService()
  .then(() => {
    console.log('🏁 Test script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Test script failed:', error);
    process.exit(1);
  });
