/**
 * Configuration management for standalone WhatsApp service
 */
class StandaloneConfig {
  constructor() {
    this.config = {
      PORT: Number(process.env.PORT) || 8500,
      WHATSAPP_API_URL:
        process.env.WHATSAPP_API_URL || 'https://graph.facebook.com/v18.0',
      WHATSAPP_ACCESS_TOKEN: process.env.WHATSAPP_ACCESS_TOKEN,
      WHATSAPP_PHONE_NUMBER_ID: process.env.WHATSAPP_PHONE_NUMBER_ID,
      WHATSAPP_BUSINESS_ACCOUNT_ID: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID,
      WHATSAPP_TEMPLATE_LANGUAGE:
        process.env.WHATSAPP_TEMPLATE_LANGUAGE || 'es',
      WHATSAPP_INVOICE_TEMPLATE:
        process.env.WHATSAPP_INVOICE_TEMPLATE || 'factura2',
      WHATSAPP_WEBHOOK_VERIFY_TOKEN: process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN,
      ACCESS_TOKEN_SECRET: process.env.ACCESS_TOKEN_SECRET,
      WHATSAPP_API_KEYS: process.env.WHATSAPP_API_KEYS,
      ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS,
      NODE_ENV: process.env.NODE_ENV || 'development'
    };
  }

  /**
   * Get configuration value
   * @param {string} key - Configuration key
   * @returns {any} - Configuration value
   */
  get(key) {
    return this.config[key];
  }

  /**
   * Check if WhatsApp API is configured
   * @returns {boolean} - True if API is configured
   */
  isApiConfigured() {
    return !!(
      this.config.WHATSAPP_ACCESS_TOKEN && this.config.WHATSAPP_PHONE_NUMBER_ID
    );
  }

  /**
   * Get service mode based on configuration
   * @returns {string} - Service mode
   */
  getMode() {
    if (this.isApiConfigured()) {
      return 'Business API + Fallback';
    }
    return 'URL Generation Only';
  }

  /**
   * Validate required configuration
   * @returns {Object} - Validation result
   */
  validate() {
    const issues = [];

    // Check authentication configuration
    if (!this.config.ACCESS_TOKEN_SECRET) {
      issues.push('ACCESS_TOKEN_SECRET required for JWT authentication');
    }

    // Check production-specific requirements
    if (this.config.NODE_ENV === 'production') {
      if (!this.config.ALLOWED_ORIGINS) {
        issues.push('ALLOWED_ORIGINS must be configured for production');
      }

      if (!this.isApiConfigured()) {
        issues.push('WhatsApp API credentials recommended for production');
      }
    }

    return {
      valid: issues.length === 0,
      issues
    };
  }

  /**
   * Get all configuration values (for debugging)
   * @returns {Object} - Configuration object with sensitive values masked
   */
  getAll() {
    const masked = { ...this.config };

    // Mask sensitive values
    const sensitiveKeys = [
      'WHATSAPP_ACCESS_TOKEN',
      'ACCESS_TOKEN_SECRET',
      'WHATSAPP_API_KEYS',
      'WHATSAPP_WEBHOOK_VERIFY_TOKEN'
    ];

    sensitiveKeys.forEach((key) => {
      if (masked[key]) {
        masked[key] = '***configured***';
      }
    });

    return masked;
  }
}

export default StandaloneConfig;
