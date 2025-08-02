/**
 * Error reporting and logging utilities for SSR errors
 */

import { SSRError, SSR_ERROR_SEVERITY } from './SSRError.js';

// Error reporting configuration
const ERROR_REPORTING_CONFIG = {
  maxErrorsPerSession: 50,
  batchSize: 10,
  batchTimeout: 5000,
  enableConsoleLogging: process.env.NODE_ENV === 'development',
  enableRemoteReporting: process.env.NODE_ENV === 'production'
};

// In-memory error storage for batching
let errorBatch = [];
let errorCount = 0;
let batchTimeout = null;

/**
 * Report an SSR error with context preservation
 */
export function reportSSRError(error, errorInfo = {}) {
  // Prevent error reporting spam
  if (errorCount >= ERROR_REPORTING_CONFIG.maxErrorsPerSession) {
    return;
  }

  errorCount++;

  const errorReport = {
    id: generateErrorId(),
    timestamp: new Date().toISOString(),
    error: error instanceof SSRError ? error.toJSON() : {
      name: error.name || 'Error',
      message: error.message || 'Unknown error',
      stack: error.stack,
      type: 'UNKNOWN',
      severity: SSR_ERROR_SEVERITY.MEDIUM
    },
    errorInfo,
    context: {
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'SSR',
      url: typeof window !== 'undefined' ? window.location.href : 'SSR',
      isSSR: typeof window === 'undefined',
      timestamp: Date.now()
    },
    sessionId: getSessionId()
  };

  // Console logging in development
  if (ERROR_REPORTING_CONFIG.enableConsoleLogging) {
    console.group(`🚨 SSR Error Report [${errorReport.error.severity}]`);
    console.error('Error:', errorReport.error);
    console.error('Context:', errorReport.context);
    console.error('Error Info:', errorInfo);
    console.groupEnd();
  }

  // Add to batch for remote reporting
  if (ERROR_REPORTING_CONFIG.enableRemoteReporting) {
    addToBatch(errorReport);
  }

  // Immediate reporting for critical errors
  if (error instanceof SSRError && error.severity === SSR_ERROR_SEVERITY.CRITICAL) {
    flushErrorBatch();
  }
}

/**
 * Add error to batch for efficient reporting
 */
function addToBatch(errorReport) {
  errorBatch.push(errorReport);

  // Flush batch if it reaches max size
  if (errorBatch.length >= ERROR_REPORTING_CONFIG.batchSize) {
    flushErrorBatch();
    return;
  }

  // Set timeout to flush batch
  if (batchTimeout) {
    clearTimeout(batchTimeout);
  }

  batchTimeout = setTimeout(() => {
    flushErrorBatch();
  }, ERROR_REPORTING_CONFIG.batchTimeout);
}

/**
 * Flush error batch to remote reporting service
 */
function flushErrorBatch() {
  if (errorBatch.length === 0) {
    return;
  }

  const batch = [...errorBatch];
  errorBatch = [];

  if (batchTimeout) {
    clearTimeout(batchTimeout);
    batchTimeout = null;
  }

  // Send to remote reporting service
  sendErrorBatch(batch).catch(err => {
    console.warn('Failed to send error batch:', err);
  });
}

/**
 * Send error batch to remote service
 */
async function sendErrorBatch(batch) {
  // Skip if no reporting endpoint configured
  if (!process.env.NEXT_PUBLIC_ERROR_REPORTING_ENDPOINT) {
    return;
  }

  try {
    const response = await fetch(process.env.NEXT_PUBLIC_ERROR_REPORTING_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        errors: batch,
        metadata: {
          timestamp: new Date().toISOString(),
          batchSize: batch.length,
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'SSR'
        }
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  } catch (error) {
    // Fallback to console logging if remote reporting fails
    console.warn('Error reporting failed:', error);
    batch.forEach(errorReport => {
      console.error('Failed to report error:', errorReport);
    });
  }
}

/**
 * Generate unique error ID
 */
function generateErrorId() {
  return `ssr_error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get or create session ID
 */
function getSessionId() {
  if (typeof window === 'undefined') {
    return 'ssr_session';
  }

  let sessionId = sessionStorage.getItem('ssr_session_id');
  if (!sessionId) {
    // Use cryptographically secure random values
    const randomBytes = new Uint8Array(9);
    crypto.getRandomValues(randomBytes);
    const randomString = Array.from(randomBytes, byte => byte.toString(36)).join('').substr(0, 9);
    sessionId = `session_${Date.now()}_${randomString}`;
    try {
      sessionStorage.setItem('ssr_session_id', sessionId);
    } catch (e) {
      // Fallback if sessionStorage is not available
      sessionId = 'fallback_session';
    }
  }

  return sessionId;
}

/**
 * Create error logger with context
 */
export function createErrorLogger(componentName, additionalContext = {}) {
  return {
    logError: (error, context = {}) => {
      reportSSRError(error, {
        componentName,
        ...additionalContext,
        ...context
      });
    },
    
    logHydrationMismatch: (expected, actual, context = {}) => {
      const error = SSRError.hydrationMismatch(componentName, expected, actual, context);
      reportSSRError(error, { componentName, ...additionalContext });
    },
    
    logThemeError: (message, context = {}) => {
      const error = SSRError.themeResolution(message, context);
      reportSSRError(error, { componentName, ...additionalContext });
    },
    
    logStorageError: (storageType, operation, context = {}) => {
      const error = SSRError.storageAccess(storageType, operation, context);
      reportSSRError(error, { componentName, ...additionalContext });
    }
  };
}

/**
 * Graceful error handling utility
 */
export function withErrorHandling(fn, fallbackValue = null, context = {}) {
  return (...args) => {
    try {
      return fn(...args);
    } catch (error) {
      reportSSRError(error, context);
      return fallbackValue;
    }
  };
}

/**
 * Async error handling utility
 */
export function withAsyncErrorHandling(asyncFn, fallbackValue = null, context = {}) {
  return async (...args) => {
    try {
      return await asyncFn(...args);
    } catch (error) {
      reportSSRError(error, context);
      return fallbackValue;
    }
  };
}

/**
 * Initialize error reporting system
 */
export function initializeErrorReporting(config = {}) {
  Object.assign(ERROR_REPORTING_CONFIG, config);

  // Flush any remaining errors before page unload
  if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', () => {
      flushErrorBatch();
    });

    // Handle uncaught promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      const error = new SSRError(
        `Unhandled promise rejection: ${event.reason}`,
        'COMPONENT_RENDER',
        SSR_ERROR_SEVERITY.HIGH,
        { reason: event.reason }
      );
      reportSSRError(error);
    });
  }
}

/**
 * Get error reporting statistics
 */
export function getErrorStats() {
  return {
    totalErrors: errorCount,
    pendingErrors: errorBatch.length,
    maxErrors: ERROR_REPORTING_CONFIG.maxErrorsPerSession,
    config: ERROR_REPORTING_CONFIG
  };
}