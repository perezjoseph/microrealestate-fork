/**
 * JWT Token Configuration
 * Centralized configuration for token expiration times and security settings
 */

export const TOKEN_CONFIG = {
  // User authentication tokens
  USER_TOKENS: {
    PRODUCTION: {
      ACCESS_TOKEN_EXPIRY: '15m', // 15 minutes - short for security
      REFRESH_TOKEN_EXPIRY: '7d', // 7 days - reasonable for user experience
      REFRESH_TOKEN_TTL: 7 * 24 * 60 * 60 // 7 days in seconds
    },
    DEVELOPMENT: {
      ACCESS_TOKEN_EXPIRY: '1h', // 1 hour - longer for development convenience
      REFRESH_TOKEN_EXPIRY: '30d', // 30 days - extended for development
      REFRESH_TOKEN_TTL: 30 * 24 * 60 * 60 // 30 days in seconds
    }
  },

  // Application/API tokens
  APPLICATION_TOKENS: {
    ACCESS_TOKEN_EXPIRY: '1h', // 1 hour for application tokens
    MAX_EXPIRY: '24h' // Maximum allowed expiry for app credentials
  },

  // Password reset tokens
  RESET_TOKENS: {
    EXPIRY: '1h', // 1 hour for password reset
    TTL: 3600 // 1 hour in seconds
  },

  // Security settings
  SECURITY: {
    INCLUDE_JTI: true, // Include unique token ID
    INCLUDE_IAT: true, // Include issued at timestamp
    INCLUDE_TYPE: true, // Include token type
    ROTATE_ON_REFRESH: true // Generate new refresh token on each refresh
  }
};

/**
 * Get token configuration based on environment
 * @param {string} environment - 'production' or 'development'
 * @returns {object} Token configuration
 */
export function getTokenConfig(environment = 'production') {
  const isProduction = environment === 'production';
  return {
    ...TOKEN_CONFIG,
    CURRENT: isProduction
      ? TOKEN_CONFIG.USER_TOKENS.PRODUCTION
      : TOKEN_CONFIG.USER_TOKENS.DEVELOPMENT,
    IS_PRODUCTION: isProduction
  };
}

/**
 * Validate token expiry time
 * @param {string} expiry - Token expiry string (e.g., '1h', '7d')
 * @returns {boolean} Whether the expiry is valid
 */
export function validateTokenExpiry(expiry) {
  const validPattern = /^(\d+)([smhd])$/;
  const match = expiry.match(validPattern);

  if (!match) return false;

  const [, value, unit] = match;
  const numValue = parseInt(value);

  // Set reasonable limits
  switch (unit) {
    case 's':
      return numValue >= 30 && numValue <= 3600; // 30 seconds to 1 hour
    case 'm':
      return numValue >= 1 && numValue <= 60; // 1 minute to 1 hour
    case 'h':
      return numValue >= 1 && numValue <= 24; // 1 hour to 24 hours
    case 'd':
      return numValue >= 1 && numValue <= 30; // 1 day to 30 days
    default:
      return false;
  }
}

/**
 * Convert expiry string to seconds
 * @param {string} expiry - Token expiry string (e.g., '1h', '7d')
 * @returns {number} Expiry in seconds
 */
export function expiryToSeconds(expiry) {
  const match = expiry.match(/^(\d+)([smhd])$/);
  if (!match) throw new Error('Invalid expiry format');

  const [, value, unit] = match;
  const numValue = parseInt(value);

  const multipliers = {
    s: 1,
    m: 60,
    h: 60 * 60,
    d: 24 * 60 * 60
  };

  return numValue * multipliers[unit];
}
