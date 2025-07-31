import { rateLimit } from 'express-rate-limit';
import logger from './logger.js';

/**
 * Security service for WhatsApp standalone service
 */
class SecurityService {
  /**
   * Create rate limiter middleware
   */
  static createRateLimiter(options = {}) {
    const defaultOptions = {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limit each IP to 100 requests per windowMs
      message: {
        success: false,
        error: 'Too many requests, please try again later'
      },
      standardHeaders: true,
      legacyHeaders: false,
      handler: (req, res) => {
        logger.warn('Rate limit exceeded', {
          ip: req.ip,
          url: req.url,
          userAgent: req.get('User-Agent')
        });
        res.status(429).json({
          success: false,
          error: 'Too many requests, please try again later'
        });
      }
    };

    return rateLimit({ ...defaultOptions, ...options });
  }

  /**
   * Security headers middleware
   */
  static securityHeaders(req, res, next) {
    // Add comprehensive security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('X-Powered-By', ''); // Remove Express signature

    // Additional security headers for API service
    res.setHeader('X-DNS-Prefetch-Control', 'off');
    res.setHeader('X-Download-Options', 'noopen');
    res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');

    // Prevent caching of sensitive responses
    if (req.path.includes('/send-') || req.path.includes('/auth')) {
      res.setHeader(
        'Cache-Control',
        'no-store, no-cache, must-revalidate, proxy-revalidate'
      );
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    }

    next();
  }

  /**
   * Simple rate limiting check for manual implementation
   */
  static checkRateLimit(identifier, maxRequests, windowMs) {
    // This is a simplified in-memory rate limiter
    // In production, use Redis or similar for distributed rate limiting
    if (!this._rateLimitStore) {
      this._rateLimitStore = new Map();
    }

    const now = Date.now();
    const key = `${identifier}:${Math.floor(now / windowMs)}`;
    const current = this._rateLimitStore.get(key) || 0;

    if (current >= maxRequests) {
      return {
        isLimited: true,
        retryAfter: Math.ceil((windowMs - (now % windowMs)) / 1000)
      };
    }

    this._rateLimitStore.set(key, current + 1);

    // Clean up old entries periodically
    if (Math.random() < 0.01) {
      // 1% chance
      this._cleanupRateLimit(now, windowMs);
    }

    return { isLimited: false };
  }

  /**
   * Clean up old rate limit entries
   */
  static _cleanupRateLimit(now, windowMs) {
    const cutoff = now - windowMs * 2; // Keep 2 windows worth of data
    for (const [key] of this._rateLimitStore) {
      const timestamp = parseInt(key.split(':')[1]) * windowMs;
      if (timestamp < cutoff) {
        this._rateLimitStore.delete(key);
      }
    }
  }

  /**
   * Sanitize data for logging to prevent log injection
   * Delegates to validation utility for consistency
   */
  static sanitizeForLog(input, maxLength = 100) {
    // Simple sanitization to avoid circular dependency
    if (!input || typeof input !== 'string') {
      return String(input || '');
    }

    return input
      .replace(/[^\x20-\x7E]/g, '') // Keep only printable ASCII characters
      .replace(/\n|\r/g, ' ') // Replace newlines with spaces
      .substring(0, maxLength);
  }

  /**
   * Validate security configuration
   */
  static validateSecurityConfig() {
    const issues = [];

    if (!process.env.ALLOWED_ORIGINS) {
      issues.push(
        'ALLOWED_ORIGINS environment variable not set - using default'
      );
    }

    return {
      valid: issues.length === 0,
      issues
    };
  }
}

export default SecurityService;
