import { AuthMiddlewareFactory } from './auth-middleware-factory.js';

/**
 * Authentication error codes for backward compatibility
 */
export const AUTH_ERRORS = {
  MISSING_TOKEN: 'MISSING_TOKEN',
  INVALID_TOKEN: 'INVALID_TOKEN',
  EXPIRED_TOKEN: 'EXPIRED_TOKEN',
  AUTH_REQUIRED: 'AUTH_REQUIRED',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
  CONFIG_ERROR: 'AUTH_CONFIG_ERROR',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED'
};

/**
 * Base authentication class that provides a simplified interface
 * while maintaining backward compatibility with the original AuthMiddleware
 */
export class AuthBase {
  constructor(config = {}) {
    this.factory = new AuthMiddlewareFactory(config);

    // Bind methods for backward compatibility
    this.authenticateJWT = this.factory.createAuthMiddleware();
    this.requireRoles = this.factory.createRoleMiddleware.bind(this.factory);
    this.validateConfig = this.factory.validateConfig.bind(this.factory);
    this.getAuthStatus = this.factory.getAuthStatus.bind(this.factory);
  }

  /**
   * Create middleware for specific roles
   * @param {string[]} allowedRoles - Array of allowed roles
   * @returns {Function} Express middleware function
   */
  createRoleMiddleware(allowedRoles) {
    return this.factory.createRoleMiddleware(allowedRoles);
  }

  /**
   * Get authentication configuration
   */
  getConfig() {
    return { ...this.factory.config };
  }

  /**
   * Check if authentication is properly configured
   */
  isConfigured() {
    return this.factory.validateConfig().valid;
  }
}

export default AuthBase;
