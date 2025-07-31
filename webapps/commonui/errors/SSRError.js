/**
 * SSR-specific error class with categorized error types and severity levels
 */

export const SSR_ERROR_TYPES = {
  HYDRATION_MISMATCH: 'HYDRATION_MISMATCH',
  ENVIRONMENT_DETECTION: 'ENVIRONMENT_DETECTION',
  STORAGE_ACCESS: 'STORAGE_ACCESS',
  THEME_RESOLUTION: 'THEME_RESOLUTION',
  COMPONENT_RENDER: 'COMPONENT_RENDER',
  BROWSER_API: 'BROWSER_API'
};

export const SSR_ERROR_SEVERITY = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL'
};

/**
 * Custom error class for SSR-related issues
 */
export class SSRError extends Error {
  constructor(message, type = SSR_ERROR_TYPES.COMPONENT_RENDER, severity = SSR_ERROR_SEVERITY.MEDIUM, context = {}) {
    super(message);
    this.name = 'SSRError';
    this.type = type;
    this.severity = severity;
    this.context = context;
    this.timestamp = new Date().toISOString();
    this.isSSR = typeof window === 'undefined';
    
    // Capture stack trace if available
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, SSRError);
    }
  }

  /**
   * Create a hydration mismatch error
   */
  static hydrationMismatch(componentName, expected, actual, context = {}) {
    return new SSRError(
      `Hydration mismatch in ${componentName}: expected "${expected}", got "${actual}"`,
      SSR_ERROR_TYPES.HYDRATION_MISMATCH,
      SSR_ERROR_SEVERITY.HIGH,
      {
        componentName,
        expected,
        actual,
        ...context
      }
    );
  }

  /**
   * Create an environment detection error
   */
  static environmentDetection(message, context = {}) {
    return new SSRError(
      `Environment detection failed: ${message}`,
      SSR_ERROR_TYPES.ENVIRONMENT_DETECTION,
      SSR_ERROR_SEVERITY.MEDIUM,
      context
    );
  }

  /**
   * Create a storage access error
   */
  static storageAccess(storageType, operation, context = {}) {
    return new SSRError(
      `Storage access failed: ${operation} on ${storageType}`,
      SSR_ERROR_TYPES.STORAGE_ACCESS,
      SSR_ERROR_SEVERITY.LOW,
      {
        storageType,
        operation,
        ...context
      }
    );
  }

  /**
   * Create a theme resolution error
   */
  static themeResolution(message, context = {}) {
    return new SSRError(
      `Theme resolution failed: ${message}`,
      SSR_ERROR_TYPES.THEME_RESOLUTION,
      SSR_ERROR_SEVERITY.MEDIUM,
      context
    );
  }

  /**
   * Create a browser API error
   */
  static browserAPI(apiName, context = {}) {
    return new SSRError(
      `Browser API not available: ${apiName}`,
      SSR_ERROR_TYPES.BROWSER_API,
      SSR_ERROR_SEVERITY.LOW,
      {
        apiName,
        ...context
      }
    );
  }

  /**
   * Convert error to a serializable object for logging
   */
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      type: this.type,
      severity: this.severity,
      context: this.context,
      timestamp: this.timestamp,
      isSSR: this.isSSR,
      stack: this.stack
    };
  }

  /**
   * Check if error should be reported based on severity
   */
  shouldReport() {
    return this.severity === SSR_ERROR_SEVERITY.HIGH || this.severity === SSR_ERROR_SEVERITY.CRITICAL;
  }

  /**
   * Check if error should cause component fallback
   */
  shouldFallback() {
    return this.severity === SSR_ERROR_SEVERITY.MEDIUM || this.severity === SSR_ERROR_SEVERITY.HIGH || this.severity === SSR_ERROR_SEVERITY.CRITICAL;
  }
}