/**
 * Centralized configuration management for WhatsApp service
 */
class ConfigManager {
  constructor() {
    this.config = {
      // Server configuration
      port: process.env.WHATSAPP_PORT || process.env.PORT || 8500,
      nodeEnv: process.env.NODE_ENV || 'development',

      // Authentication
      accessTokenSecret: process.env.ACCESS_TOKEN_SECRET,

      // WhatsApp API
      whatsappApiUrl:
        process.env.WHATSAPP_API_URL || 'https://graph.facebook.com/v18.0',
      whatsappAccessToken: process.env.WHATSAPP_ACCESS_TOKEN,
      whatsappPhoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
      whatsappBusinessAccountId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID,

      // Templates
      whatsappTemplateLanguage: process.env.WHATSAPP_TEMPLATE_LANGUAGE || 'es',
      whatsappInvoiceTemplate:
        process.env.WHATSAPP_INVOICE_TEMPLATE || 'factura2',

      // Security
      allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || [
        'http://localhost:3000',
        'http://localhost:8080',
        'http://localhost:8200'
      ],

      // Rate limiting
      rateLimitWindow: 15 * 60 * 1000, // 15 minutes
      rateLimitMax: 100,
      messageRateLimitWindow: 60 * 1000, // 1 minute
      messageRateLimitMax: 10
    };
  }

  get(key) {
    return this.config[key];
  }

  getAll() {
    return { ...this.config };
  }

  isProduction() {
    return this.config.nodeEnv === 'production';
  }

  isDevelopment() {
    return this.config.nodeEnv === 'development';
  }

  isApiConfigured() {
    return !!(
      this.config.whatsappAccessToken && this.config.whatsappPhoneNumberId
    );
  }

  getMode() {
    return this.isApiConfigured() ? 'api' : 'fallback';
  }

  validate() {
    const issues = [];
    const warnings = [];

    // Critical validations
    if (!this.config.accessTokenSecret) {
      issues.push('ACCESS_TOKEN_SECRET is required for authentication');
    } else if (this.config.accessTokenSecret.length < 32) {
      warnings.push(
        'ACCESS_TOKEN_SECRET should be at least 32 characters long'
      );
    }

    if (this.isProduction() && !this.isApiConfigured()) {
      warnings.push('WhatsApp API not configured - running in fallback mode');
    }

    return {
      valid: issues.length === 0,
      issues,
      warnings
    };
  }
}

// Singleton instance
let configInstance = null;

export function getConfig() {
  if (!configInstance) {
    configInstance = new ConfigManager();
  }
  return configInstance;
}

export default ConfigManager;
