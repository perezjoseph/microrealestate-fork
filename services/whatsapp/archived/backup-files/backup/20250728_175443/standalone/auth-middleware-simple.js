import logger from './logger.js';
import { AuthBase, AUTH_ERRORS } from './auth-base.js';

/**
 * Simplified JWT authentication middleware for WhatsApp service
 * Provides essential authentication functionality with proper error handling
 */
class AuthMiddleware extends AuthBase {
  constructor() {
    super();
  }

  /**
   * JWT Token authentication middleware
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  authenticateJWT = (req, res, next) => {
    if (!this.accessTokenSecret) {
      logger.error('ACCESS_TOKEN_SECRET not configured');
      return res.status(500).json({
        success: false,
        error: 'Authentication service not properly configured',
        code: AUTH_ERRORS.CONFIG_ERROR
      });
    }

    const token = this.extractToken(req);
    if (!token) {
      this.logAuth(req, 'warn', 'JWT token not provided');
      return res.status(401).json({
        success: false,
        error: 'JWT access token required',
        code: AUTH_ERRORS.MISSING_TOKEN
      });
    }

    // Validate token format
    if (!this.isValidTokenFormat(token)) {
      this.logAuth(req, 'warn', 'Invalid JWT token format');
      return res.status(401).json({
        success: false,
        error: 'Invalid access token format',
        code: AUTH_ERRORS.INVALID_TOKEN
      });
    }

    const verificationResult = this.verifyToken(token);

    if (!verificationResult.success) {
      this.logAuth(req, 'warn', 'JWT token validation failed', {
        error: verificationResult.error.error,
        code: verificationResult.error.code
      });
      return res.status(401).json(verificationResult.error);
    }

    if (!verificationResult.user) {
      this.logAuth(req, 'warn', 'Invalid JWT token structure');
      return res.status(401).json({
        success: false,
        error: 'Invalid access token structure',
        code: AUTH_ERRORS.INVALID_TOKEN
      });
    }

    // Set user context
    req.user = verificationResult.user;
    req.authMethod = 'jwt';
    req.authUser = req.user.email || req.user.clientId || req.user.serviceId;

    this.logAuth(req, 'info', 'JWT authentication successful', {
      userType: req.user.type,
      userIdentifier: req.authUser
    });

    next();
  };

  /**
   * Role-based access control middleware
   * @param {string[]} allowedRoles - Array of allowed roles
   * @returns {Function} Express middleware function
   */
  requireRoles = (allowedRoles) => {
    return (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
          code: AUTH_ERRORS.MISSING_TOKEN
        });
      }

      if (!req.user.role || !allowedRoles.includes(req.user.role)) {
        logger.warn('Insufficient permissions', {
          userRole: req.user.role,
          requiredRoles: allowedRoles,
          user: req.authUser,
          url: req.url
        });

        return res.status(403).json({
          success: false,
          error: 'Insufficient permissions',
          code: AUTH_ERRORS.INSUFFICIENT_PERMISSIONS,
          requiredRoles: allowedRoles
        });
      }

      next();
    };
  };

  /**
   * Validate authentication configuration
   * @returns {Object} Configuration validation result
   */
  validateConfig() {
    const issues = [];

    if (!this.accessTokenSecret) {
      issues.push('ACCESS_TOKEN_SECRET environment variable not set');
    }

    return {
      valid: issues.length === 0,
      issues,
      methods: {
        jwt: !!this.accessTokenSecret
      }
    };
  }
}

export default AuthMiddleware;
