/**
 * Unified authentication interface
 * Provides backward compatibility while encouraging new pattern usage
 */

import { createAuthMiddleware } from './auth-middleware-factory.js';
import AuthMiddleware from './auth-middleware.js';
import logger from './logger.js';

/**
 * Create authentication middleware with automatic fallback
 * @param {Object} options - Configuration options
 * @returns {Object} Authentication middleware interface
 */
export function createUnifiedAuth(options = {}) {
  const factoryAuth = createAuthMiddleware(options);
  const legacyAuth = new AuthMiddleware(options);

  return {
    // Primary interface (recommended)
    authenticate: factoryAuth.authenticate,
    requireRoles: factoryAuth.requireRoles,

    // Legacy interface (deprecated but supported)
    authenticateJWT: legacyAuth.authenticateJWT,

    // Utility methods
    validateConfig: () => factoryAuth.validateConfig(),
    getAuthStatus: () => factoryAuth.getAuthStatus(),

    // Migration helper
    isLegacyMode: () => {
      logger.warn(
        'Using legacy authentication interface. Consider migrating to unified interface.'
      );
      return true;
    }
  };
}

export default createUnifiedAuth;
