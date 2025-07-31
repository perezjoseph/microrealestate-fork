/**
 * Default configuration values for the API service
 */
export const DEFAULT_CONFIG = {
  PORTS: {
    API: 8200,
    EMAILER: 8083,
    PDFGENERATOR: 8082
  },
  URLS: {
    EMAILER: 'http://localhost:8083/emailer',
    PDFGENERATOR: 'http://localhost:8082/pdfgenerator'
  },
  FEATURES: {
    DEMO_MODE: false,
    RESTORE_DB: false
  }
};

/**
 * Validates required environment variables
 * @param {Object} config - Configuration object
 * @throws {Error} If required variables are missing
 */
export function validateConfig(config) {
  const required = ['EMAILER_URL', 'PDFGENERATOR_URL'];
  const missing = required.filter((key) => !config[key]);

  if (missing.length > 0) {
    throw new Error(`Missing required configuration: ${missing.join(', ')}`);
  }
}

/**
 * Safely parses boolean environment variables
 * @param {string} value - Environment variable value
 * @param {boolean} defaultValue - Default value if parsing fails
 * @returns {boolean}
 */
export function parseBoolean(value, defaultValue = false) {
  if (typeof value !== 'string') return defaultValue;
  return value.toLowerCase() === 'true';
}
