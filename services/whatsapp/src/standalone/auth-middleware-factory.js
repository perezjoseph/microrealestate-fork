import { JWTAuthStrategy } from './auth-strategies.js';
import { AuthErrorFactory } from './auth-errors.js';
import logger from './logger.js';

/**
 * Factory for creating authentication middleware with different strategies
 */
export class AuthMiddlewareFactory {
  constructor(config = {}) {
    this.config = {
      authenticatorUrl:
        config.authenticatorUrl ||
        process.env.AUTHENTICATOR_URL ||
        'http://localhost:8000',
      accessTokenSecret:
        config.accessTokenSecret || process.env.ACCESS_TOKEN_SECRET,
      ...config
    };

    this.strategy = this._createStrategy();
  }

  /**
   * Create authentication middleware
   */
  createAuthMiddleware() {
    return (req, res, next) => {
      if (!this.strategy) {
        const error = AuthErrorFactory.configError();
        logger.error('Authentication strategy not configured', {
          error: error.message
        });
        return res.status(error.statusCode).json(error.toJSON());
      }

      const result = this.strategy.authenticate(req);

      if (!result.success) {
        this._logAuthFailure(req, result);
        return res.status(this._getStatusCode(result.code)).json(result);
      }

      // Set user information on request
      req.user = result.user;
      req.authMethod = 'jwt';
      req.authUser =
        result.user.email || result.user.clientId || result.user.serviceId;

      this._logAuthSuccess(req, result.user);
      next();
    };
  }

  /**
   * Create role-based access control middleware
   */
  createRoleMiddleware(allowedRoles) {
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
  }

  /**
   * Validate authentication configuration
   */
  validateConfig() {
    const issues = [];
    const warnings = [];

    if (!this.config.accessTokenSecret) {
      issues.push('ACCESS_TOKEN_SECRET environment variable not set');
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
        hasJwt: !!this.config.accessTokenSecret
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
      strategyType: this.strategy?.constructor.name || 'none'
    };
  }

  // Private methods
  _createStrategy() {
    if (this.config.accessTokenSecret) {
      return new JWTAuthStrategy(this.config.accessTokenSecret);
    }
    return null;
  }

  _getStatusCode(errorCode) {
    const statusMap = {
      AUTH_CONFIG_ERROR: 500,
      INSUFFICIENT_PERMISSIONS: 403
    };
    return statusMap[errorCode] || 401;
  }

  _logAuthSuccess(req, user) {
    logger.info('JWT authentication successful', {
      userType: user.type,
      userIdentifier: user.email || user.clientId || user.serviceId,
      role: user.role,
      ip: req.ip,
      url: req.url,
      userAgent: req.get('User-Agent')
    });
  }

  _logAuthFailure(req, result) {
    logger.warn('Authentication failed', {
      error: result.error,
      code: result.code,
      ip: req.ip,
      url: req.url,
      userAgent: req.get('User-Agent')
    });
  }

  _logInsufficientPermissions(req, allowedRoles) {
    logger.warn('Insufficient permissions', {
      userRole: req.user?.role,
      requiredRoles: allowedRoles,
      user: req.authUser,
      url: req.url,
      ip: req.ip
    });
  }
}

/**
 * Convenience function to create a configured auth middleware factory
 */
export function createAuthMiddleware(config = {}) {
  const factory = new AuthMiddlewareFactory(config);
  return {
    authenticate: factory.createAuthMiddleware(),
    requireRoles: (roles) => factory.createRoleMiddleware(roles),
    validateConfig: () => factory.validateConfig(),
    getAuthStatus: () => factory.getAuthStatus()
  };
}
