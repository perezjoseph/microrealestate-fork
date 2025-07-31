/**
 * Authentication utility functions
 */

/**
 * Mask sensitive token data for logging
 * @param {string} token - The token to mask
 * @returns {string} Masked token
 */
export function maskToken(token) {
  if (!token || typeof token !== 'string') return 'invalid';
  if (token.length < 10) return '***';
  return `${token.substring(0, 4)}...${token.substring(token.length - 4)}`;
}

/**
 * Validate JWT token format (3 base64 parts separated by dots)
 * @param {string} token - The token to validate
 * @returns {boolean} True if valid format
 */
export function isValidJWTFormat(token) {
  if (!token || typeof token !== 'string') return false;
  const parts = token.split('.');
  return parts.length === 3 && parts.every((part) => part.length > 0);
}

/**
 * Extract token from request (Authorization header or cookie)
 * @param {Object} req - Express request object
 * @returns {string|null} Extracted token or null
 */
export function extractToken(req) {
  // Check Authorization header (Bearer token)
  if (req.headers.authorization?.startsWith('Bearer ')) {
    return req.headers.authorization.substring(7);
  }

  // Check sessionToken cookie (for tenant API compatibility)
  return req.cookies?.sessionToken || null;
}

/**
 * Get user identifier from user object
 * @param {Object} user - User object from JWT
 * @returns {string} User identifier
 */
export function getUserIdentifier(user) {
  return user.email || user.clientId || user.serviceId || 'unknown';
}

/**
 * Sanitize request data for logging (remove sensitive information)
 * @param {Object} data - Data to sanitize
 * @returns {Object} Sanitized data
 */
export function sanitizeForLogging(data) {
  if (typeof data === 'object' && data !== null) {
    const sanitized = { ...data };

    // Remove or mask sensitive fields
    if (sanitized.authorization) {
      sanitized.authorization = sanitized.authorization.startsWith('Bearer ')
        ? 'Bearer ***'
        : '***';
    }

    if (sanitized.sessionToken) {
      sanitized.sessionToken = maskToken(sanitized.sessionToken);
    }

    return sanitized;
  }

  if (typeof data === 'string') {
    // Mask phone numbers and emails
    return data
      .replace(/\+?\d{10,15}/g, '+***REDACTED***')
      .replace(
        /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
        '***@***.***'
      );
  }

  return data;
}
