/**
 * Authentication error definitions and factory
 */

/**
 * Base authentication error class
 */
export class AuthError extends Error {
  constructor(code, message, statusCode = 401, details = null) {
    super(message);
    this.name = 'AuthError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.timestamp = new Date().toISOString();
  }

  toJSON() {
    return {
      success: false,
      error: this.message,
      code: this.code,
      statusCode: this.statusCode,
      details: this.details,
      timestamp: this.timestamp
    };
  }
}

/**
 * Factory for creating standardized authentication errors
 */
export class AuthErrorFactory {
  static missingToken() {
    return new AuthError('MISSING_TOKEN', 'Access token is required', 401);
  }

  static invalidToken(details = null) {
    return new AuthError('INVALID_TOKEN', 'Invalid access token', 401, details);
  }

  static expiredToken() {
    return new AuthError('EXPIRED_TOKEN', 'Access token has expired', 401);
  }

  static authRequired() {
    return new AuthError('AUTH_REQUIRED', 'Authentication is required', 401);
  }

  static insufficientPermissions(
    message = 'Insufficient permissions',
    requiredRoles = []
  ) {
    return new AuthError('INSUFFICIENT_PERMISSIONS', message, 403, {
      requiredRoles
    });
  }

  static configError(
    message = 'Authentication service not properly configured'
  ) {
    return new AuthError('AUTH_CONFIG_ERROR', message, 500);
  }

  static rateLimitExceeded(retryAfter = null) {
    return new AuthError(
      'RATE_LIMIT_EXCEEDED',
      'Too many authentication attempts',
      429,
      { retryAfter }
    );
  }
}
