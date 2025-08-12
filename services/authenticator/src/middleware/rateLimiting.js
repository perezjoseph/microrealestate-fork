import { logger } from '@microrealestate/common';
import { rateLimit } from 'express-rate-limit';
import { slowDown } from 'express-slow-down';

// Configuration constants
const RATE_LIMIT_CONFIG = {
  AUTH_WINDOW_MS: 15 * 60 * 1000, // 15 minutes
  AUTH_MAX_ATTEMPTS: 5,
  AUTH_MAX_ATTEMPTS_DEMO: 100,
  PASSWORD_RESET_WINDOW_MS: 60 * 60 * 1000, // 1 hour
  PASSWORD_RESET_MAX_ATTEMPTS: 3,
  SIGNUP_WINDOW_MS: 60 * 60 * 1000, // 1 hour
  SIGNUP_MAX_ATTEMPTS: 5,
  TOKEN_REFRESH_WINDOW_MS: 5 * 60 * 1000, // 5 minutes
  TOKEN_REFRESH_MAX_ATTEMPTS: 20,
  GENERAL_WINDOW_MS: 15 * 60 * 1000, // 15 minutes
  GENERAL_MAX_ATTEMPTS: 100,
  SLOW_DOWN_WINDOW_MS: 15 * 60 * 1000, // 15 minutes
  SLOW_DOWN_DELAY_AFTER: 2,
  SLOW_DOWN_DELAY_MS_MULTIPLIER: 1000,
  SLOW_DOWN_MAX_DELAY_MS: 10000
};

// Demo mode configuration with security considerations
const isDemoMode = process.env.DEMO_MODE === 'true';
const isProduction = process.env.NODE_ENV === 'production';

// Security: Limit demo mode benefits in production
const getDemoModeMultiplier = () => {
  if (!isDemoMode) return 1;
  return isProduction ? 3 : 10; // More conservative in production
};

const demoMultiplier = getDemoModeMultiplier();
logger.info('Rate limiting middleware initializing', { 
  demoMode: isDemoMode, 
  isProduction,
  demoMultiplier 
});

/**
 * Factory function to create rate limit middleware with consistent configuration
 * @param {Object} config - Rate limit configuration
 * @param {number} config.windowMs - Time window in milliseconds
 * @param {number} config.max - Maximum requests per window
 * @param {string} config.errorMessage - Error message to return
 * @param {string} config.logPrefix - Prefix for log messages
 * @param {Function} [config.keyGenerator] - Custom key generator function
 * @param {Function} [config.skip] - Skip function for certain requests
 * @returns {Function} Rate limit middleware
 */
const createRateLimit = ({
  windowMs,
  max,
  errorMessage,
  logPrefix,
  keyGenerator,
  skip
}) => {
  const retryAfterSeconds = Math.floor(windowMs / 1000);
  
  return rateLimit({
    windowMs,
    max,
    keyGenerator,
    skip,
    message: {
      error: errorMessage,
      retryAfter: retryAfterSeconds
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      const identifier = keyGenerator ? keyGenerator(req) : req.ip;
      logger.warn(`${logPrefix} rate limit exceeded`, {
        identifier,
        path: req.path,
        userAgent: req.get('User-Agent')
      });
      
      res.status(429).json({
        error: errorMessage,
        retryAfter: retryAfterSeconds
      });
    },
    onLimitReached: (req) => {
      const identifier = keyGenerator ? keyGenerator(req) : req.ip;
      logger.info(`${logPrefix} rate limit reached`, {
        identifier,
        path: req.path
      });
    }
  });
};

// Strict rate limiting for authentication attempts (more lenient in demo mode)
export const authRateLimit = createRateLimit({
  windowMs: RATE_LIMIT_CONFIG.AUTH_WINDOW_MS,
  max: Math.floor(RATE_LIMIT_CONFIG.AUTH_MAX_ATTEMPTS * demoMultiplier),
  errorMessage: 'Too many authentication attempts from this IP, please try again after 15 minutes.',
  logPrefix: 'AUTH',
  skip: (req) => req.path === '/health'
});

// More lenient rate limiting for password reset requests
export const passwordResetRateLimit = createRateLimit({
  windowMs: RATE_LIMIT_CONFIG.PASSWORD_RESET_WINDOW_MS,
  max: Math.floor(RATE_LIMIT_CONFIG.PASSWORD_RESET_MAX_ATTEMPTS * demoMultiplier),
  errorMessage: 'Too many password reset attempts from this IP, please try again after 1 hour.',
  logPrefix: 'PASSWORD_RESET'
});

// Rate limiting for signup attempts
export const signupRateLimit = createRateLimit({
  windowMs: RATE_LIMIT_CONFIG.SIGNUP_WINDOW_MS,
  max: Math.floor(RATE_LIMIT_CONFIG.SIGNUP_MAX_ATTEMPTS * demoMultiplier),
  errorMessage: 'Too many signup attempts from this IP, please try again after 1 hour.',
  logPrefix: 'SIGNUP'
});

// Progressive delay for repeated requests (slows down responses)
export const authSlowDown = slowDown({
  windowMs: RATE_LIMIT_CONFIG.SLOW_DOWN_WINDOW_MS,
  delayAfter: RATE_LIMIT_CONFIG.SLOW_DOWN_DELAY_AFTER,
  delayMs: (hits) => hits * RATE_LIMIT_CONFIG.SLOW_DOWN_DELAY_MS_MULTIPLIER,
  maxDelayMs: RATE_LIMIT_CONFIG.SLOW_DOWN_MAX_DELAY_MS,
  onLimitReached: (req) => {
    logger.warn('AUTH slow down limit reached', {
      ip: req.ip,
      path: req.path,
      userAgent: req.get('User-Agent')
    });
  }
});

// Rate limiting for token refresh
export const tokenRefreshRateLimit = createRateLimit({
  windowMs: RATE_LIMIT_CONFIG.TOKEN_REFRESH_WINDOW_MS,
  max: Math.floor(RATE_LIMIT_CONFIG.TOKEN_REFRESH_MAX_ATTEMPTS * demoMultiplier),
  errorMessage: 'Too many token refresh attempts, please try again later.',
  logPrefix: 'TOKEN_REFRESH'
});

// General API rate limiting
export const generalRateLimit = createRateLimit({
  windowMs: RATE_LIMIT_CONFIG.GENERAL_WINDOW_MS,
  max: Math.floor(RATE_LIMIT_CONFIG.GENERAL_MAX_ATTEMPTS * demoMultiplier),
  errorMessage: 'Too many requests from this IP, please try again later.',
  logPrefix: 'GENERAL'
});

// Account-specific rate limiting (by email)
export const createAccountSpecificRateLimit = (
  windowMs = RATE_LIMIT_CONFIG.AUTH_WINDOW_MS,
  max = 10
) => {
  const adjustedMax = Math.floor(max * demoMultiplier);
  
  logger.debug('Creating account-specific rate limit', {
    windowMs,
    max: adjustedMax,
    demoMode: isDemoMode
  });
  
  return createRateLimit({
    windowMs,
    max: adjustedMax,
    errorMessage: 'Too many attempts for this account, please try again later.',
    logPrefix: 'ACCOUNT_SPECIFIC',
    keyGenerator: (req) => {
      // Use email as key if available, otherwise fall back to IP
      const key = req.body?.email || req.ip;
      return key;
    }
  });
};

logger.info('Rate limiting middleware initialization complete');
