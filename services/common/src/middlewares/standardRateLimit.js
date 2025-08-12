import { rateLimit } from 'express-rate-limit';
import { logger } from '../logger/index.js';

/**
 * Standard rate limiting configuration for MicroRealEstate services
 */
export class StandardRateLimit {
  static createRateLimit({
    windowMs = 15 * 60 * 1000, // 15 minutes
    max = 100,
    message = 'Too many requests from this IP, please try again later.',
    logPrefix = 'RATE_LIMIT',
    keyGenerator = null,
    skip = null,
    demoModeMultiplier = 3
  } = {}) {
    const isDemoMode = process.env.DEMO_MODE === 'true';
    const isProduction = process.env.NODE_ENV === 'production';
    
    // Apply demo mode multiplier (more conservative in production)
    const effectiveMax = isDemoMode 
      ? Math.floor(max * (isProduction ? Math.min(demoModeMultiplier, 3) : demoModeMultiplier))
      : max;

    return rateLimit({
      windowMs,
      max: effectiveMax,
      keyGenerator,
      skip,
      message: {
        error: message,
        retryAfter: Math.floor(windowMs / 1000)
      },
      standardHeaders: true,
      legacyHeaders: false,
      handler: (req, res) => {
        const identifier = keyGenerator ? keyGenerator(req) : req.ip;
        logger.warn(`${logPrefix} rate limit exceeded`, {
          identifier,
          path: req.path,
          userAgent: req.get('User-Agent'),
          service: process.env.SERVICE_NAME || 'unknown'
        });
        
        res.status(429).json({
          error: message,
          retryAfter: Math.floor(windowMs / 1000)
        });
      },
      onLimitReached: (req) => {
        const identifier = keyGenerator ? keyGenerator(req) : req.ip;
        logger.info(`${logPrefix} rate limit reached`, {
          identifier,
          path: req.path,
          service: process.env.SERVICE_NAME || 'unknown'
        });
      }
    });
  }

  // Predefined configurations for common use cases
  static emailService() {
    return this.createRateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 30,
      message: 'Too many email requests from this IP, please try again later.',
      logPrefix: 'EMAIL_SERVICE',
      demoModeMultiplier: 10
    });
  }

  static authService() {
    return this.createRateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 5,
      message: 'Too many authentication attempts from this IP, please try again after 15 minutes.',
      logPrefix: 'AUTH_SERVICE',
      demoModeMultiplier: 20
    });
  }

  static generalApi() {
    return this.createRateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100,
      message: 'Too many requests from this IP, please try again later.',
      logPrefix: 'GENERAL_API'
    });
  }
}