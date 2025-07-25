import { logger } from '@microrealestate/common';
import rateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';

console.log(' Rate limiting middleware loading...');

// Strict rate limiting for authentication attempts
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: {
    error:
      'Too many authentication attempts from this IP, please try again after 15 minutes.',
    retryAfter: 15 * 60 // seconds
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req, res) => {
    console.log(
      'AUTH RATE LIMIT TRIGGERED for IP:',
      req.ip,
      'on path:',
      req.path
    );
    logger.warn(`Rate limit exceeded for IP: ${req.ip} on ${req.path}`);
    res.status(429).json({
      error:
        'Too many authentication attempts from this IP, please try again after 15 minutes.',
      retryAfter: 15 * 60
    });
  },
  skip: (req) => {
    // Skip rate limiting for health checks or specific IPs if needed
    return req.path === '/health';
  },
  onLimitReached: (req) => {
    console.log('AUTH RATE LIMIT REACHED for IP:', req.ip);
  }
});

console.log(' authRateLimit middleware created');

// More lenient rate limiting for password reset requests
export const passwordResetRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each IP to 3 password reset requests per hour
  message: {
    error:
      'Too many password reset attempts from this IP, please try again after 1 hour.',
    retryAfter: 60 * 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    console.log('PASSWORD RESET RATE LIMIT TRIGGERED for IP:', req.ip);
    logger.warn(`Password reset rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      error:
        'Too many password reset attempts from this IP, please try again after 1 hour.',
      retryAfter: 60 * 60
    });
  }
});

console.log(' passwordResetRateLimit middleware created');

// Rate limiting for signup attempts
export const signupRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // Limit each IP to 5 signup attempts per hour
  message: {
    error:
      'Too many signup attempts from this IP, please try again after 1 hour.',
    retryAfter: 60 * 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    console.log('SIGNUP RATE LIMIT TRIGGERED for IP:', req.ip);
    logger.warn(`Signup rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      error:
        'Too many signup attempts from this IP, please try again after 1 hour.',
      retryAfter: 60 * 60
    });
  }
});

console.log(' signupRateLimit middleware created');

// Progressive delay for repeated requests (slows down responses)
export const authSlowDown = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 2, // Allow 2 requests per windowMs without delay
  delayMs: (hits) => hits * 1000, // Add 1 second delay per hit after delayAfter
  maxDelayMs: 10000, // Maximum delay of 10 seconds
  onLimitReached: (req) => {
    console.log(
      ' AUTH SLOW DOWN TRIGGERED for IP:',
      req.ip,
      'on path:',
      req.path
    );
    logger.warn(`Slow down limit reached for IP: ${req.ip} on ${req.path}`);
  }
});

console.log(' authSlowDown middleware created');

// Rate limiting for token refresh
export const tokenRefreshRateLimit = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 20, // Allow more frequent token refreshes
  message: {
    error: 'Too many token refresh attempts, please try again later.',
    retryAfter: 5 * 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    console.log('TOKEN REFRESH RATE LIMIT TRIGGERED for IP:', req.ip);
    logger.warn(`Token refresh rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      error: 'Too many token refresh attempts, please try again later.',
      retryAfter: 5 * 60
    });
  }
});

console.log(' tokenRefreshRateLimit middleware created');

// General API rate limiting
export const generalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: 15 * 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    console.log(
      'GENERAL RATE LIMIT TRIGGERED for IP:',
      req.ip,
      'on path:',
      req.path
    );
    logger.warn(`General rate limit exceeded for IP: ${req.ip} on ${req.path}`);
    res.status(429).json({
      error: 'Too many requests from this IP, please try again later.',
      retryAfter: 15 * 60
    });
  }
});

console.log(' generalRateLimit middleware created');

// Account-specific rate limiting (by email)
export const createAccountSpecificRateLimit = (
  windowMs = 15 * 60 * 1000,
  max = 10
) => {
  console.log(
    ' Creating account-specific rate limit with window:',
    windowMs,
    'max:',
    max
  );
  return rateLimit({
    windowMs,
    max,
    keyGenerator: (req) => {
      // Use email as key if available, otherwise fall back to IP
      const key = req.body?.email || req.ip;
      console.log('Account-specific rate limit key:', key);
      return key;
    },
    message: {
      error: 'Too many attempts for this account, please try again later.',
      retryAfter: windowMs / 1000
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      const identifier = req.body?.email || req.ip;
      console.log(
        'ACCOUNT-SPECIFIC RATE LIMIT TRIGGERED for:',
        identifier,
        'on path:',
        req.path
      );
      logger.warn(
        `Account-specific rate limit exceeded for: ${identifier} on ${req.path}`
      );
      res.status(429).json({
        error: 'Too many attempts for this account, please try again later.',
        retryAfter: windowMs / 1000
      });
    }
  });
};

console.log(' All rate limiting middleware exported successfully');
