/**
 * Theme Error Handling Utilities
 * 
 * Provides comprehensive error handling and fallback mechanisms
 * for theme-related operations across the application.
 */

/**
 * Theme error types for better error categorization
 */
export const THEME_ERROR_TYPES = {
  STORAGE_ERROR: 'STORAGE_ERROR',
  SYSTEM_DETECTION_ERROR: 'SYSTEM_DETECTION_ERROR',
  DOM_MANIPULATION_ERROR: 'DOM_MANIPULATION_ERROR',
  PROVIDER_ERROR: 'PROVIDER_ERROR',
  HYDRATION_ERROR: 'HYDRATION_ERROR'
};

/**
 * Theme error severity levels
 */
export const THEME_ERROR_SEVERITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
};

/**
 * Custom error class for theme-related errors
 */
export class ThemeError extends Error {
  constructor(message, type = THEME_ERROR_TYPES.PROVIDER_ERROR, severity = THEME_ERROR_SEVERITY.MEDIUM, originalError = null) {
    super(message);
    this.name = 'ThemeError';
    this.type = type;
    this.severity = severity;
    this.originalError = originalError;
    this.timestamp = new Date().toISOString();
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      type: this.type,
      severity: this.severity,
      timestamp: this.timestamp,
      stack: this.stack,
      originalError: this.originalError ? {
        name: this.originalError.name,
        message: this.originalError.message,
        stack: this.originalError.stack
      } : null
    };
  }
}

/**
 * Logger for theme-related errors with development/production modes
 */
export class ThemeErrorLogger {
  static log(error, context = {}) {
    const errorData = {
      error: error instanceof ThemeError ? error.toJSON() : {
        name: error.name,
        message: error.message,
        stack: error.stack
      },
      context,
      timestamp: new Date().toISOString(),
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'unknown',
      url: typeof window !== 'undefined' ? window.location.href : 'unknown'
    };

    if (process.env.NODE_ENV === 'development') {
      console.group('🎨 Theme Error');
      console.error('Error:', error);
      console.log('Context:', context);
      console.log('Full Error Data:', errorData);
      console.groupEnd();
    } else {
      // In production, you might want to send to an error reporting service
      console.error('Theme Error:', errorData);
    }

    // Store recent errors for debugging (max 10 entries)
    if (typeof window !== 'undefined') {
      try {
        const recentErrors = JSON.parse(localStorage.getItem('mre-theme-errors') || '[]');
        recentErrors.unshift(errorData);
        recentErrors.splice(10); // Keep only last 10 errors
        localStorage.setItem('mre-theme-errors', JSON.stringify(recentErrors));
      } catch (storageError) {
        // Ignore localStorage errors during error logging
      }
    }
  }

  static getRecentErrors() {
    if (typeof window === 'undefined') return [];
    
    try {
      return JSON.parse(localStorage.getItem('mre-theme-errors') || '[]');
    } catch (error) {
      return [];
    }
  }

  static clearErrors() {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.removeItem('mre-theme-errors');
    } catch (error) {
      // Ignore localStorage errors
    }
  }
}

/**
 * Safe localStorage operations with fallbacks
 */
export class SafeStorage {
  static isAvailable() {
    try {
      const test = '__theme_storage_test__';
      localStorage.setItem(test, 'test');
      localStorage.removeItem(test);
      return true;
    } catch (error) {
      return false;
    }
  }

  static getItem(key, fallback = null) {
    try {
      if (!this.isAvailable()) {
        ThemeErrorLogger.log(
          new ThemeError(
            'localStorage is not available',
            THEME_ERROR_TYPES.STORAGE_ERROR,
            THEME_ERROR_SEVERITY.MEDIUM
          ),
          { operation: 'getItem', key }
        );
        return fallback;
      }

      const value = localStorage.getItem(key);
      return value !== null ? value : fallback;
    } catch (error) {
      ThemeErrorLogger.log(
        new ThemeError(
          `Failed to get item from localStorage: ${error.message}`,
          THEME_ERROR_TYPES.STORAGE_ERROR,
          THEME_ERROR_SEVERITY.LOW,
          error
        ),
        { operation: 'getItem', key }
      );
      return fallback;
    }
  }

  static setItem(key, value) {
    try {
      if (!this.isAvailable()) {
        ThemeErrorLogger.log(
          new ThemeError(
            'localStorage is not available',
            THEME_ERROR_TYPES.STORAGE_ERROR,
            THEME_ERROR_SEVERITY.MEDIUM
          ),
          { operation: 'setItem', key }
        );
        return false;
      }

      localStorage.setItem(key, value);
      return true;
    } catch (error) {
      ThemeErrorLogger.log(
        new ThemeError(
          `Failed to set item in localStorage: ${error.message}`,
          THEME_ERROR_TYPES.STORAGE_ERROR,
          THEME_ERROR_SEVERITY.LOW,
          error
        ),
        { operation: 'setItem', key }
      );
      return false;
    }
  }

  static removeItem(key) {
    try {
      if (!this.isAvailable()) {
        return false;
      }

      localStorage.removeItem(key);
      return true;
    } catch (error) {
      ThemeErrorLogger.log(
        new ThemeError(
          `Failed to remove item from localStorage: ${error.message}`,
          THEME_ERROR_TYPES.STORAGE_ERROR,
          THEME_ERROR_SEVERITY.LOW,
          error
        ),
        { operation: 'removeItem', key }
      );
      return false;
    }
  }
}

/**
 * Safe system theme detection with fallbacks
 */
export class SystemThemeDetector {
  static detect() {
    try {
      if (typeof window === 'undefined') {
        return 'light'; // SSR fallback
      }

      if (!window.matchMedia) {
        ThemeErrorLogger.log(
          new ThemeError(
            'matchMedia is not supported',
            THEME_ERROR_TYPES.SYSTEM_DETECTION_ERROR,
            THEME_ERROR_SEVERITY.MEDIUM
          ),
          { operation: 'detect' }
        );
        return 'light'; // Fallback for older browsers
      }

      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      return mediaQuery.matches ? 'dark' : 'light';
    } catch (error) {
      ThemeErrorLogger.log(
        new ThemeError(
          `Failed to detect system theme: ${error.message}`,
          THEME_ERROR_TYPES.SYSTEM_DETECTION_ERROR,
          THEME_ERROR_SEVERITY.MEDIUM,
          error
        ),
        { operation: 'detect' }
      );
      return 'light'; // Safe fallback
    }
  }

  static createListener(callback) {
    try {
      if (typeof window === 'undefined' || !window.matchMedia) {
        return null; // No listener possible
      }

      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      
      const wrappedCallback = (event) => {
        try {
          callback(event.matches ? 'dark' : 'light');
        } catch (error) {
          ThemeErrorLogger.log(
            new ThemeError(
              `Error in system theme change callback: ${error.message}`,
              THEME_ERROR_TYPES.SYSTEM_DETECTION_ERROR,
              THEME_ERROR_SEVERITY.LOW,
              error
            ),
            { operation: 'listener_callback' }
          );
        }
      };

      // Use modern addEventListener if available, fallback to addListener
      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener('change', wrappedCallback);
        return () => mediaQuery.removeEventListener('change', wrappedCallback);
      } else if (mediaQuery.addListener) {
        mediaQuery.addListener(wrappedCallback);
        return () => mediaQuery.removeListener(wrappedCallback);
      }

      return null;
    } catch (error) {
      ThemeErrorLogger.log(
        new ThemeError(
          `Failed to create system theme listener: ${error.message}`,
          THEME_ERROR_TYPES.SYSTEM_DETECTION_ERROR,
          THEME_ERROR_SEVERITY.MEDIUM,
          error
        ),
        { operation: 'createListener' }
      );
      return null;
    }
  }
}

/**
 * Safe DOM manipulation for theme application
 */
export class SafeThemeApplicator {
  static applyTheme(theme) {
    try {
      if (typeof window === 'undefined' || typeof document === 'undefined') {
        return false; // SSR environment
      }

      const root = document.documentElement;
      if (!root) {
        throw new Error('Document root element not found');
      }

      // Validate theme value
      if (!['light', 'dark'].includes(theme)) {
        throw new Error(`Invalid theme value: ${theme}`);
      }

      // Remove existing theme classes
      root.classList.remove('light', 'dark');
      
      // Add new theme class
      root.classList.add(theme);

      // Update meta theme-color for mobile browsers
      this.updateMetaThemeColor(theme);

      return true;
    } catch (error) {
      ThemeErrorLogger.log(
        new ThemeError(
          `Failed to apply theme: ${error.message}`,
          THEME_ERROR_TYPES.DOM_MANIPULATION_ERROR,
          THEME_ERROR_SEVERITY.HIGH,
          error
        ),
        { operation: 'applyTheme', theme }
      );
      return false;
    }
  }

  static updateMetaThemeColor(theme) {
    try {
      const metaThemeColor = document.querySelector('meta[name="theme-color"]');
      if (metaThemeColor) {
        const color = theme === 'dark' ? '#0f172a' : '#ffffff';
        metaThemeColor.setAttribute('content', color);
      }
    } catch (error) {
      ThemeErrorLogger.log(
        new ThemeError(
          `Failed to update meta theme color: ${error.message}`,
          THEME_ERROR_TYPES.DOM_MANIPULATION_ERROR,
          THEME_ERROR_SEVERITY.LOW,
          error
        ),
        { operation: 'updateMetaThemeColor', theme }
      );
    }
  }

  static resetToDefault() {
    try {
      if (typeof window === 'undefined' || typeof document === 'undefined') {
        return false;
      }

      const root = document.documentElement;
      if (!root) {
        return false;
      }

      // Remove all theme classes and apply light theme
      root.classList.remove('light', 'dark');
      root.classList.add('light');

      // Reset meta theme color
      this.updateMetaThemeColor('light');

      return true;
    } catch (error) {
      ThemeErrorLogger.log(
        new ThemeError(
          `Failed to reset theme to default: ${error.message}`,
          THEME_ERROR_TYPES.DOM_MANIPULATION_ERROR,
          THEME_ERROR_SEVERITY.CRITICAL,
          error
        ),
        { operation: 'resetToDefault' }
      );
      return false;
    }
  }
}

/**
 * Utility function to validate theme values
 */
export function validateTheme(theme) {
  const validThemes = ['light', 'dark', 'system'];
  return validThemes.includes(theme);
}

/**
 * Utility function to resolve theme based on system preference
 */
export function resolveTheme(theme, systemTheme) {
  if (!validateTheme(theme)) {
    ThemeErrorLogger.log(
      new ThemeError(
        `Invalid theme value: ${theme}`,
        THEME_ERROR_TYPES.PROVIDER_ERROR,
        THEME_ERROR_SEVERITY.MEDIUM
      ),
      { operation: 'resolveTheme', theme, systemTheme }
    );
    return 'light'; // Safe fallback
  }

  return theme === 'system' ? systemTheme : theme;
}

/**
 * Utility function to create safe theme change announcements
 */
export function announceThemeChange(theme, resolvedTheme) {
  try {
    if (typeof document === 'undefined') {
      return; // SSR environment
    }

    // Create or update live region for screen reader announcements
    let liveRegion = document.getElementById('theme-announcement-global');
    if (!liveRegion) {
      liveRegion = document.createElement('div');
      liveRegion.id = 'theme-announcement-global';
      liveRegion.setAttribute('aria-live', 'polite');
      liveRegion.setAttribute('aria-atomic', 'true');
      liveRegion.setAttribute('role', 'status');
      liveRegion.className = 'sr-only';
      
      // Fallback styles if sr-only class is not available
      Object.assign(liveRegion.style, {
        position: 'absolute',
        left: '-10000px',
        width: '1px',
        height: '1px',
        overflow: 'hidden',
        clipPath: 'inset(50%)',
        whiteSpace: 'nowrap',
        border: '0'
      });
      
      document.body.appendChild(liveRegion);
    }

    const message = theme === 'system'
      ? `Theme switched to system preference: ${resolvedTheme} mode`
      : `Theme switched to ${resolvedTheme} mode`;

    // Clear previous announcement
    liveRegion.textContent = '';
    
    // Add new announcement after a brief delay to ensure screen readers pick it up
    setTimeout(() => {
      if (liveRegion) {
        liveRegion.textContent = message;
      }
    }, 100);

    // Clear announcement after 3 seconds to avoid clutter
    setTimeout(() => {
      if (liveRegion) {
        liveRegion.textContent = '';
      }
    }, 3100);
  } catch (error) {
    ThemeErrorLogger.log(
      new ThemeError(
        `Failed to announce theme change: ${error.message}`,
        THEME_ERROR_TYPES.DOM_MANIPULATION_ERROR,
        THEME_ERROR_SEVERITY.LOW,
        error
      ),
      { operation: 'announceThemeChange', theme, resolvedTheme }
    );
  }
}

export default {
  ThemeError,
  ThemeErrorLogger,
  SafeStorage,
  SystemThemeDetector,
  SafeThemeApplicator,
  validateTheme,
  resolveTheme,
  announceThemeChange,
  THEME_ERROR_TYPES,
  THEME_ERROR_SEVERITY
};