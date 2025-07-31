/**
 * Enhanced validation service for WhatsApp standalone service
 */
class ValidationService {
  // Constants
  static MAX_PHONE_NUMBERS = 50;
  static MAX_MESSAGE_LENGTH = 4096;
  static PHONE_REGEX = /^[1-9]\d{6,14}$/;
  /**
   * Validate phone number format
   */
  static isValidPhoneNumber(phoneNumber) {
    if (!phoneNumber || typeof phoneNumber !== 'string') {
      return false;
    }

    const cleaned = phoneNumber.replace(/[\s-()]/g, '');

    if (!cleaned.startsWith('+')) {
      return false;
    }

    const digits = cleaned.substring(1);
    return ValidationService.PHONE_REGEX.test(digits);
  }

  /**
   * Normalize phone number to E.164 format
   */
  static normalizePhoneNumber(phoneNumber) {
    if (!phoneNumber || typeof phoneNumber !== 'string') {
      return null;
    }

    const cleaned = phoneNumber.replace(/[\s-()]/g, '');

    if (!cleaned.startsWith('+')) {
      return `+${cleaned}`;
    }

    return cleaned;
  }

  /**
   * Validate MongoDB ObjectId format
   */
  static isValidObjectId(id) {
    if (!id || typeof id !== 'string') {
      return false;
    }
    return /^[0-9a-fA-F]{24}$/.test(id);
  }

  /**
   * Validate template type
   */
  static isValidTemplateType(templateType) {
    const validTypes = [
      'invoice',
      'paymentNotice',
      'paymentReminder',
      'finalNotice',
      'login'
    ];
    return validTypes.includes(templateType);
  }

  /**
   * Validate send message request (original)
   */
  static validateSendMessage(req, res, next) {
    const { phoneNumber, message, recipientName } = req.body;
    const errors = [];

    // Validate phone number
    if (!phoneNumber) {
      errors.push('Phone number is required');
    } else if (!ValidationService.isValidPhoneNumber(phoneNumber)) {
      errors.push(
        'Invalid phone number format. Use international format (+1234567890)'
      );
    }

    // Validate message
    if (!message) {
      errors.push('Message is required');
    } else if (typeof message !== 'string') {
      errors.push('Message must be a string');
    } else if (message.length > ValidationService.MAX_MESSAGE_LENGTH) {
      errors.push(`Message too long (max ${ValidationService.MAX_MESSAGE_LENGTH} characters)`);
    } else if (message.trim().length === 0) {
      errors.push('Message cannot be empty');
    }

    // Validate recipient name (optional)
    if (recipientName && typeof recipientName !== 'string') {
      errors.push('Recipient name must be a string');
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors,
        timestamp: new Date().toISOString()
      });
    }

    // Normalize phone number
    req.validatedData = {
      phoneNumber: ValidationService.normalizePhoneNumber(phoneNumber),
      message: message.trim(),
      recipientName: recipientName?.trim() || 'Unknown'
    };

    next();
  }

  /**
   * Validate phone numbers array
   */
  static _validatePhoneNumbers(phoneNumbers, errors) {
    if (!phoneNumbers) {
      errors.push('Phone numbers are required');
    } else if (!Array.isArray(phoneNumbers)) {
      errors.push('Phone numbers must be an array');
    } else if (phoneNumbers.length === 0) {
      errors.push('At least one phone number is required');
    } else if (phoneNumbers.length > ValidationService.MAX_PHONE_NUMBERS) {
      errors.push(`Maximum ${ValidationService.MAX_PHONE_NUMBERS} phone numbers allowed`);
    } else {
      phoneNumbers.forEach((phone, index) => {
        if (!ValidationService.isValidPhoneNumber(phone)) {
          errors.push(`Invalid phone number at index ${index}: ${phone}`);
        }
      });
    }
  }

  /**
   * Validate invoice common fields
   */
  static _validateInvoiceFields(data, errors) {
    const {
      tenantName,
      invoicePeriod,
      totalAmount,
      currency,
      invoiceUrl,
      organizationName,
      dueDate
    } = data;

    // Validate required fields
    if (
      !tenantName ||
      typeof tenantName !== 'string' ||
      tenantName.trim().length === 0
    ) {
      errors.push('Tenant name is required');
    }

    if (
      !invoicePeriod ||
      typeof invoicePeriod !== 'string' ||
      invoicePeriod.trim().length === 0
    ) {
      errors.push('Invoice period is required');
    }

    if (!totalAmount) {
      errors.push('Total amount is required');
    } else if (
      typeof totalAmount !== 'string' &&
      typeof totalAmount !== 'number'
    ) {
      errors.push('Total amount must be a string or number');
    }

    // Validate optional fields
    if (currency && typeof currency !== 'string') {
      errors.push('Currency must be a string');
    }

    if (
      invoiceUrl &&
      (typeof invoiceUrl !== 'string' || !invoiceUrl.startsWith('http'))
    ) {
      errors.push('Invoice URL must be a valid HTTP URL');
    }

    if (organizationName && typeof organizationName !== 'string') {
      errors.push('Organization name must be a string');
    }

    if (dueDate && typeof dueDate !== 'string') {
      errors.push('Due date must be a string');
    }
  }

  /**
   * Normalize invoice data
   */
  static _normalizeInvoiceData(data) {
    const {
      phoneNumbers,
      tenantName,
      invoicePeriod,
      totalAmount,
      currency,
      invoiceUrl,
      organizationName,
      dueDate
    } = data;

    return {
      phoneNumbers: phoneNumbers.map((phone) =>
        ValidationService.normalizePhoneNumber(phone)
      ),
      tenantName: tenantName.trim(),
      invoicePeriod: invoicePeriod.trim(),
      totalAmount: String(totalAmount),
      currency: currency?.trim() || 'RD$',
      invoiceUrl: invoiceUrl?.trim(),
      organizationName: organizationName?.trim() || 'MicroRealEstate',
      dueDate: dueDate?.trim() || 'Por definir'
    };
  }

  /**
   * Validate send invoice request (original)
   */
  static validateSendInvoice(req, res, next) {
    const errors = [];

    ValidationService._validatePhoneNumbers(req.body.phoneNumbers, errors);
    ValidationService._validateInvoiceFields(req.body, errors);

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors,
        timestamp: new Date().toISOString()
      });
    }

    req.validatedData = ValidationService._normalizeInvoiceData(req.body);
    next();
  }

  /**
   * Validate enhanced send invoice request (with realmId)
   */
  static validateSendInvoiceEnhanced(req, res, next) {
    const { realmId } = req.body;
    const errors = [];

    // Validate realmId (required for enhanced version)
    if (!realmId) {
      errors.push('Organization ID (realmId) is required');
    } else if (!ValidationService.isValidObjectId(realmId)) {
      errors.push('Invalid organization ID format');
    }

    ValidationService._validatePhoneNumbers(req.body.phoneNumbers, errors);
    ValidationService._validateInvoiceFields(req.body, errors);

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors,
        timestamp: new Date().toISOString()
      });
    }

    req.validatedData = {
      realmId: realmId.trim(),
      ...ValidationService._normalizeInvoiceData(req.body)
    };

    next();
  }

  /**
   * Validate test template request
   */
  static validateTestTemplate(req, res, next) {
    const { realmId, phoneNumber, templateType, templateData } = req.body;

    const errors = [];

    // Validate realmId
    if (!realmId) {
      errors.push('Organization ID (realmId) is required');
    } else if (!ValidationService.isValidObjectId(realmId)) {
      errors.push('Invalid organization ID format');
    }

    // Validate phone number
    if (!phoneNumber) {
      errors.push('Phone number is required');
    } else if (!ValidationService.isValidPhoneNumber(phoneNumber)) {
      errors.push(
        'Invalid phone number format. Use international format (+1234567890)'
      );
    }

    // Validate template type
    if (!templateType) {
      errors.push('Template type is required');
    } else if (!ValidationService.isValidTemplateType(templateType)) {
      errors.push(
        'Invalid template type. Valid types: invoice, paymentNotice, paymentReminder, finalNotice, login'
      );
    }

    // Validate template data
    if (!templateData) {
      errors.push('Template data is required');
    } else if (
      typeof templateData !== 'object' ||
      Array.isArray(templateData)
    ) {
      errors.push('Template data must be an object');
    }

    // Template-specific validation
    if (templateType && templateData) {
      switch (templateType) {
        case 'invoice':
          if (!templateData.tenantName)
            errors.push('Template data missing: tenantName');
          if (!templateData.period)
            errors.push('Template data missing: period');
          if (!templateData.amount)
            errors.push('Template data missing: amount');
          break;
        case 'paymentNotice':
        case 'paymentReminder':
        case 'finalNotice':
          if (!templateData.tenantName)
            errors.push('Template data missing: tenantName');
          if (!templateData.amount)
            errors.push('Template data missing: amount');
          if (!templateData.dueDate)
            errors.push('Template data missing: dueDate');
          break;
        case 'login':
          if (!templateData.code) errors.push('Template data missing: code');
          break;
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors,
        timestamp: new Date().toISOString()
      });
    }

    // Normalize data
    req.validatedData = {
      realmId: realmId.trim(),
      phoneNumber: ValidationService.normalizePhoneNumber(phoneNumber),
      templateType,
      templateData
    };

    next();
  }

  /**
   * Create validation middleware
   */
  static createMiddleware(validationFunction) {
    return (req, res, next) => {
      try {
        validationFunction(req, res, next);
      } catch (error) {
        res.status(500).json({
          success: false,
          message: 'Validation error',
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    };
  }
}

/**
 * Validate JWT format
 */
export function isValidJWTFormat(token) {
  if (!token || typeof token !== 'string') {
    return false;
  }

  const parts = token.split('.');
  return parts.length === 3;
}

/**
 * Sanitize user data for logging
 */
export function sanitizeUserForLogging(user) {
  if (!user || typeof user !== 'object') {
    return {};
  }

  // eslint-disable-next-line no-unused-vars
  const { password, token, ...sanitized } = user;
  return sanitized;
}

export default ValidationService;
