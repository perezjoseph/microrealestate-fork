/**
 * Validation service for WhatsApp standalone service
 */
class ValidationService {
  /**
   * Validate phone number format
   */
  static isValidPhoneNumber(phoneNumber) {
    if (!phoneNumber || typeof phoneNumber !== 'string') {
      return false;
    }

    // Clean the phone number
    const cleaned = phoneNumber.replace(/[\s-()]/g, '');

    // Must start with + for international format
    if (!cleaned.startsWith('+')) {
      return false;
    }

    // Remove the + and validate
    const digits = cleaned.substring(1);

    // International phone number validation (E.164 format)
    // Must be 7-15 digits after country code
    const phoneRegex = /^[1-9]\d{6,14}$/;

    return phoneRegex.test(digits);
  }

  /**
   * Normalize phone number to E.164 format
   */
  static normalizePhoneNumber(phoneNumber) {
    if (!phoneNumber || typeof phoneNumber !== 'string') {
      return null;
    }

    const cleaned = phoneNumber.replace(/[\s-()]/g, '');

    // Add + if missing
    if (!cleaned.startsWith('+')) {
      return `+${cleaned}`;
    }

    return cleaned;
  }

  /**
   * Validate send message request
   */
  static validateSendMessage(req, res, next) {
    const { phoneNumber, message, recipientName } = req.body;
    const errors = [];

    if (!phoneNumber) {
      errors.push('phoneNumber is required');
    } else if (!ValidationService.isValidPhoneNumber(phoneNumber)) {
      errors.push('phoneNumber must be a valid international phone number');
    }

    if (!message) {
      errors.push('message is required');
    } else if (typeof message !== 'string') {
      errors.push('message must be a string');
    } else if (message.length > 4096) {
      errors.push('message must be less than 4096 characters');
    }

    if (recipientName && typeof recipientName !== 'string') {
      errors.push('recipientName must be a string');
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors
      });
    }

    req.validatedData = {
      phoneNumber: phoneNumber.trim(),
      message: message.trim(),
      recipientName: recipientName?.trim()
    };
    next();
  }

  /**
   * Validate send invoice request
   */
  static validateSendInvoice(req, res, next) {
    const {
      phoneNumbers,
      tenantName,
      invoicePeriod,
      totalAmount,
      currency,
      invoiceUrl,
      organizationName,
      dueDate
    } = req.body;

    const errors = [];

    if (
      !phoneNumbers ||
      !Array.isArray(phoneNumbers) ||
      phoneNumbers.length === 0
    ) {
      errors.push('phoneNumbers must be a non-empty array');
    }

    if (!tenantName) {
      errors.push('tenantName is required');
    }

    if (!invoicePeriod) {
      errors.push('invoicePeriod is required');
    }

    if (!totalAmount) {
      errors.push('totalAmount is required');
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors
      });
    }

    req.validatedData = {
      phoneNumbers,
      tenantName,
      invoicePeriod,
      totalAmount,
      currency,
      invoiceUrl,
      organizationName,
      dueDate
    };
    next();
  }

  /**
   * Create validation middleware
   */
  static createMiddleware(validationFunction) {
    return validationFunction;
  }
}

/**
 * Validate JWT token format
 * @param {string} token - JWT token to validate
 * @returns {boolean} True if valid format
 */
export function isValidJWTFormat(token) {
  if (!token || typeof token !== 'string') {
    return false;
  }

  // JWT should have 3 parts separated by dots
  const parts = token.split('.');
  if (parts.length !== 3) {
    return false;
  }

  // Each part should be base64url encoded (basic check)
  const base64UrlRegex = /^[A-Za-z0-9_-]+$/;
  return parts.every((part) => part.length > 0 && base64UrlRegex.test(part));
}

/**
 * Sanitize user data for logging
 * @param {Object} user - User object to sanitize
 * @returns {Object} Sanitized user object
 */
export function sanitizeUserForLogging(user) {
  if (!user || typeof user !== 'object') {
    return {};
  }

  return {
    type: user.type,
    role: user.role,
    id: user.id,
    // Don't log sensitive information like emails or phone numbers
    hasEmail: !!user.email,
    hasPhone: !!user.phone,
    hasClientId: !!user.clientId,
    hasServiceId: !!user.serviceId
  };
}

export default ValidationService;
