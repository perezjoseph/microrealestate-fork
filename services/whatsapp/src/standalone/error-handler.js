import logger from './logger.js';

/**
 * Base error class for standalone WhatsApp service
 */
class WhatsAppStandaloneError extends Error {
  constructor(message, statusCode = 500, code = null, context = {}) {
    super(message);
    this.name = 'WhatsAppStandaloneError';
    this.statusCode = statusCode;
    this.code = code;
    this.context = context;
    this.timestamp = new Date().toISOString();
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      statusCode: this.statusCode,
      code: this.code,
      context: this.context,
      timestamp: this.timestamp
    };
  }
}

class ValidationError extends WhatsAppStandaloneError {
  constructor(message) {
    super(message, 400);
    this.name = 'ValidationError';
  }
}

class ConfigurationError extends WhatsAppStandaloneError {
  constructor(message) {
    super(message, 503);
    this.name = 'ConfigurationError';
  }
}

class APIError extends WhatsAppStandaloneError {
  constructor(message, fbErrorCode = null) {
    super(message, 502);
    this.name = 'APIError';
    this.fbErrorCode = fbErrorCode;
  }
}

/**
 * Global error handler middleware
 * @param {Error} error - Error object
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Next middleware
 */
// eslint-disable-next-line no-unused-vars
async function globalErrorHandler(error, req, res, _next) {
  const { default: SecurityService } = await import('./security.js');

  // Log the error with context (sanitized)
  logger.error(`${error.name || 'Error'}: ${error.message}`, {
    requestId: req.requestId,
    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    apiKey: req.apiKey,
    body: SecurityService.sanitizeForLog(req.body),
    fbErrorCode: error.fbErrorCode
  });

  // Set request ID in response
  if (req.requestId) {
    res.setHeader('X-Request-ID', req.requestId);
  }

  // Handle known error types
  if (error instanceof WhatsAppStandaloneError) {
    return res.status(error.statusCode).json({
      success: false,
      error: error.message,
      code: error.code,
      type: error.name,
      requestId: req.requestId
    });
  }

  // Handle validation errors
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: error.message,
      type: 'ValidationError',
      requestId: req.requestId
    });
  }

  // Handle production vs development error responses
  const baseResponse = {
    success: false,
    type: 'UnknownError',
    requestId: req.requestId,
    timestamp: new Date().toISOString()
  };

  if (process.env.NODE_ENV === 'production') {
    // Generic error response for production
    res.status(500).json({
      ...baseResponse,
      error: 'Internal server error'
    });
  } else {
    // Detailed errors for development
    res.status(500).json({
      ...baseResponse,
      error: error.message,
      stack: error.stack
    });
  }
}

/**
 * Async error wrapper to catch async errors in routes
 * @param {Function} fn - Async route handler
 * @returns {Function} - Wrapped handler
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Create standardized success response
 * @param {Object} data - Response data
 * @param {string} message - Success message
 * @returns {Object} - Standardized response
 */
function createSuccessResponse(data, message = 'Operation successful') {
  return {
    success: true,
    message,
    timestamp: new Date().toISOString(),
    ...data
  };
}

export {
  WhatsAppStandaloneError,
  ValidationError,
  ConfigurationError,
  APIError,
  globalErrorHandler,
  asyncHandler,
  createSuccessResponse
};
