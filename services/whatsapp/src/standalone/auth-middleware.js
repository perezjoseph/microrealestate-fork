/**
 * Authentication middleware for WhatsApp service
 * Provides JWT-based authentication with role-based access control
 */

import jwt from 'jsonwebtoken';
import { AuthErrorFactory } from './auth-errors.js';
import { getAuthCache, AuthCache } from './auth-cache.js';
import { isValidJWTFormat, sanitizeUserForLogging } from './validation.js';
import logger from './logger.js';

/**
 * Authentication middleware class
 */
class AuthMiddleware {
  constructor(options = {}) {
    this.config = {
      accessTokenSecret:
        options.accessTokenSecret || process.env.ACCESS_TOKEN_SECRET,
      cacheEnabled: options.cacheEnabled !== false,
      cacheTTL: options.cacheTTL || 5 * 60 * 1000, // 5 minutes
      ...options
    };

    // Initialize cache if enabled
    if (this.config.cacheEnabled) {
      this.cache = getAuthCache({
        ttl: this.config.cacheTTL,
        maxSize: 1000
      });
    }
  }

  /**
   * JWT authentication middleware
   */
  authenticateJWT = (req, res, next) => {
    try {
      const token = this._extractToken(req);

      if (!token) {
        const error = AuthErrorFactory.missingToken();
        this._logAuthFailure(req, 'Missing token');
        return res.status(error.statusCode).json(error.toJSON());
      }

      if (!isValidJWTFormat(token)) {
        const error = AuthErrorFactory.invalidToken('Invalid token format');
        this._logAuthFailure(req, 'Invalid token format');
        return res.status(error.statusCode).json(error.toJSON());
      }

      // Check cache first
      if (this.config.cacheEnabled) {
        const tokenHash = AuthCache.hashToken(token);
        const cachedResult = this.cache.get(tokenHash);

        if (cachedResult) {
          req.user = cachedResult.user;
          req.authMethod = 'jwt-cached';
          req.authUser =
            cachedResult.user.email ||
            cachedResult.user.clientId ||
            cachedResult.user.serviceId;
          this._logAuthSuccess(req, cachedResult.user, true);
          return next();
        }
      }

      // Verify JWT token
      const decoded = jwt.verify(token, this.config.accessTokenSecret);
      const user = this._extractUserFromToken(decoded);

      // Cache the result
      if (this.config.cacheEnabled) {
        const tokenHash = AuthCache.hashToken(token);
        this.cache.set(tokenHash, { user, decoded });
      }

      // Set user information on request
      req.user = user;
      req.authMethod = 'jwt';
      req.authUser = user.email || user.clientId || user.serviceId;

      this._logAuthSuccess(req, user, false);
      next();
    } catch (error) {
      this._handleJWTError(req, res, error);
    }
  };

  /**
   * Role-based access control middleware
   */
  requireRoles = (allowedRoles) => {
    if (!Array.isArray(allowedRoles) || allowedRoles.length === 0) {
      throw new Error('allowedRoles must be a non-empty array');
    }

    return (req, res, next) => {
      if (!req.user) {
        const error = AuthErrorFactory.authRequired();
        return res.status(error.statusCode).json(error.toJSON());
      }

      if (!req.user.role || !allowedRoles.includes(req.user.role)) {
        const error = AuthErrorFactory.insufficientPermissions(
          'Insufficient permissions',
          allowedRoles
        );

        this._logInsufficientPermissions(req, allowedRoles);
        return res.status(error.statusCode).json(error.toJSON());
      }

      next();
    };
  };

  /**
   * Validate authentication configuration
   */
  validateConfig() {
    const issues = [];
    const warnings = [];

    if (!this.config.accessTokenSecret) {
      issues.push('ACCESS_TOKEN_SECRET environment variable not set');
    } else if (this.config.accessTokenSecret.length < 32) {
      warnings.push(
        'ACCESS_TOKEN_SECRET should be at least 32 characters long'
      );
    }

    return {
      valid: issues.length === 0,
      issues,
      warnings,
      methods: {
        jwt: !!this.config.accessTokenSecret,
        apiKey: false,
        fallback: false
      },
      stats: {
        hasJwt: !!this.config.accessTokenSecret,
        cacheEnabled: this.config.cacheEnabled,
        cacheStats: this.config.cacheEnabled ? this.cache.getStats() : null
      }
    };
  }

  /**
   * Get current authentication status for health checks
   */
  getAuthStatus() {
    return {
      jwtEnabled: !!this.config.accessTokenSecret,
      apiKeyEnabled: false,
      fallbackEnabled: false,
      cacheEnabled: this.config.cacheEnabled,
      cacheStats: this.config.cacheEnabled ? this.cache.getStats() : null
    };
  }

  // Private methods
  _extractToken(req) {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    return null;
  }

  _extractUserFromToken(decoded) {
    // Handle different token types
    if (decoded.type === 'user') {
      return {
        type: 'user',
        email: decoded.email,
        phone: decoded.phone,
        role: decoded.role || 'user',
        id: decoded.sub || decoded.id
      };
    } else if (decoded.type === 'application') {
      return {
        type: 'application',
        clientId: decoded.clientId,
        role: decoded.role || 'user'
      };
    } else if (decoded.type === 'service') {
      return {
        type: 'service',
        serviceId: decoded.serviceId,
        realmId: decoded.realmId,
        role: decoded.role || 'user'
      };
    } else {
      // Legacy token format - assume user type
      return {
        type: 'user',
        email: decoded.email,
        phone: decoded.phone,
        role: decoded.role || 'user',
        id: decoded.sub || decoded.id
      };
    }
  }

  _handleJWTError(req, res, error) {
    let authError;

    if (error.name === 'TokenExpiredError') {
      authError = AuthErrorFactory.expiredToken();
    } else if (error.name === 'JsonWebTokenError') {
      authError = AuthErrorFactory.invalidToken(error.message);
    } else if (error.name === 'NotBeforeError') {
      authError = AuthErrorFactory.invalidToken('Token not active yet');
    } else {
      authError = AuthErrorFactory.invalidToken('Token verification failed');
    }

    this._logAuthFailure(req, error.message);
    res.status(authError.statusCode).json(authError.toJSON());
  }

  _logAuthSuccess(req, user, fromCache = false) {
    logger.info('JWT authentication successful', {
      userType: user.type,
      userIdentifier: user.email || user.clientId || user.serviceId,
      role: user.role,
      fromCache,
      ip: req.ip,
      url: req.url,
      userAgent: req.get('User-Agent')
    });
  }

  _logAuthFailure(req, reason) {
    logger.warn('Authentication failed', {
      reason,
      ip: req.ip,
      url: req.url,
      userAgent: req.get('User-Agent')
    });
  }

  _logInsufficientPermissions(req, allowedRoles) {
    logger.warn('Insufficient permissions', {
      userRole: req.user?.role,
      requiredRoles: allowedRoles,
      user: sanitizeUserForLogging(req.user),
      url: req.url,
      ip: req.ip
    });
  }
}

export default AuthMiddleware;
