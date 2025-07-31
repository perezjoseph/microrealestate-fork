import mongoose from 'mongoose';
import logger from './logger.js';
import { getConfig } from './config-manager.js';

/**
 * WhatsApp Configuration Service
 *
 * Provides hierarchical configuration resolution:
 * 1. Database configuration (per-organization)
 * 2. Environment variables (fallback)
 * 3. Default values (final fallback)
 */
class WhatsAppConfigService {
  constructor() {
    this.fallbackConfig = getConfig();
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes cache
  }

  /**
   * Get WhatsApp configuration for a specific organization
   * @param {string} realmId - Organization/Realm ID
   * @returns {Promise<Object>} WhatsApp configuration
   */
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
      // Return environment config as final fallback
      return this._getConfigFromEnvironment();
    }
  }

  /**
   * Get template configuration for a specific template type
   * @param {Object} config - WhatsApp configuration
   * @param {string} templateType - Template type (invoice, paymentNotice, paymentReminder, finalNotice, login)
   * @returns {Object} Template configuration
   */
  getTemplate(config, templateType) {
    const template = config.templates?.[templateType];
    if (template) {
      return template;
    }

    // Fall back to default template
    logger.warn(`Template ${templateType} not found, using default`);
    return this._getDefaultTemplate(templateType);
  }

  /**
   * Check if WhatsApp is enabled and configured for an organization
   * @param {string} realmId - Organization/Realm ID
   * @returns {Promise<boolean>} True if WhatsApp is enabled and configured
   */
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

  /**
   * Clear configuration cache for a specific realm or all realms
   * @param {string} [realmId] - Optional realm ID to clear specific cache
   */
  clearCache(realmId = null) {
    if (realmId) {
      this.cache.delete(`config_${realmId}`);
      logger.debug(`Cleared WhatsApp config cache for realm ${realmId}`);
    } else {
      this.cache.clear();
      logger.debug('Cleared all WhatsApp config cache');
    }
  }

  /**
   * Get configuration from database
   * @private
   * @param {string} realmId - Organization/Realm ID
   * @returns {Promise<Object|null>} Database configuration or null
   */
  async _getConfigFromDatabase(realmId) {
    try {
      // Define minimal Realm schema for configuration access
      const realmSchema = new mongoose.Schema(
        {
          thirdParties: {
            whatsapp: mongoose.Schema.Types.Mixed
          }
        },
        { strict: false }
      );

      // Use existing connection or create new one
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

  /**
   * Build configuration object from database data
   * @private
   * @param {Object} dbConfig - Database configuration
   * @returns {Object} Formatted configuration
   */
  _buildConfigFromDatabase(dbConfig) {
    return {
      // Source indicator
      source: 'database',
      selected: dbConfig.selected,

      // API Configuration
      accessToken: dbConfig.accessToken || '',
      phoneNumberId: dbConfig.phoneNumberId || '',
      businessAccountId: dbConfig.businessAccountId || '',
      apiUrl: dbConfig.apiUrl || 'https://graph.facebook.com/v18.0',
      webhookVerifyToken: dbConfig.webhookVerifyToken || '',

      // Template Configuration
      defaultLanguage: dbConfig.defaultLanguage || 'es',
      templates: dbConfig.templates || {},

      // Helper methods
      isApiConfigured: function () {
        return !!(this.accessToken && this.phoneNumberId);
      },

      getMode: function () {
        return this.isApiConfigured() ? 'api' : 'fallback';
      }
    };
  }

  /**
   * Get configuration from environment variables
   * @private
   * @returns {Object} Environment-based configuration
   */
  _getConfigFromEnvironment() {
    return {
      // Source indicator
      source: 'environment',
      selected: true, // Always enabled when using environment config

      // API Configuration
      accessToken: this.fallbackConfig.get('whatsappAccessToken') || '',
      phoneNumberId: this.fallbackConfig.get('whatsappPhoneNumberId') || '',
      businessAccountId:
        this.fallbackConfig.get('whatsappBusinessAccountId') || '',
      apiUrl:
        this.fallbackConfig.get('whatsappApiUrl') ||
        'https://graph.facebook.com/v18.0',
      webhookVerifyToken: process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || '',

      // Template Configuration
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

      // Helper methods
      isApiConfigured: function () {
        return !!(this.accessToken && this.phoneNumberId);
      },

      getMode: function () {
        return this.isApiConfigured() ? 'api' : 'fallback';
      }
    };
  }

  /**
   * Get default template configuration
   * @private
   * @param {string} templateType - Template type
   * @returns {Object} Default template configuration
   */
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

  /**
   * Cache configuration
   * @private
   * @param {string} cacheKey - Cache key
   * @param {Object} config - Configuration to cache
   */
  _cacheConfig(cacheKey, config) {
    this.cache.set(cacheKey, {
      config,
      timestamp: Date.now()
    });
  }
}

// Singleton instance
let configServiceInstance = null;

/**
 * Get singleton instance of WhatsAppConfigService
 * @returns {WhatsAppConfigService} Service instance
 */
export function getWhatsAppConfigService() {
  if (!configServiceInstance) {
    configServiceInstance = new WhatsAppConfigService();
  }
  return configServiceInstance;
}

export default WhatsAppConfigService;
