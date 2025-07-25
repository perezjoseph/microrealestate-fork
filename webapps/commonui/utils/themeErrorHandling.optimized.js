/**
 * Optimized theme error handling utilities
 * Reduced bundle size through selective imports and tree shaking
 */

// Lightweight error types enum (reduced from full object)
export const THEME_ERROR_TYPES = {
  STORAGE: 'STORAGE_ERROR',
  SYSTEM: 'SYSTEM_DETECTION_ERROR', 
  DOM: 'DOM_MANIPULATION_ERROR',
  PROVIDER: 'PROVIDER_ERROR'
};

export const THEME_ERROR_SEVERITY = {
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3,
  CRITICAL: 4
};

/**
 * Lightweight theme error class
 */
export class ThemeError extends Error {
  constructor(message, type = THEME_ERROR_TYPES.PROVIDER, severity = THEME_ERROR_SEVERITY.MEDIUM, originalError = null) {
    super(message);
    this.name = 'ThemeError';
    this.type = type;
    this.severity = severity;
    this.originalError = originalError;
    this.timestamp = Date.now();
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      type: this.type,
      severity: this.severity,
      timestamp: this.timestamp,
      stack: this.stack
    };
  }
}

/**
 * Optimized error logger with throttling
 */
class ErrorLogger {
  constructor() {
    this.errorCounts = new Map();
    this.lastLogTime = new Map();
    this.throttleMs = 1000; // 1 second throttle
  }

  log(error, context = {}) {
    const errorKey = `${error.type}-${error.message}`;
    const now = Date.now();
    const lastLog = this.lastLogTime.get(errorKey) || 0;

    // Throttle identical errors
    if (now - lastLog < this.throttleMs) {
      return;
    }

    this.lastLogTime.set(errorKey, now);
    this.errorCounts.set(errorKey, (this.errorCounts.get(errorKey) || 0) + 1);

    // Only log in development or for critical errors
    if (process.env.NODE_ENV === 'development' || error.severity >= THEME_ERROR_SEVERITY.HIGH) {
      const logMethod = error.severity >= THEME_ERROR_SEVERITY.HIGH ? 'error' : 'warn';
      console[logMethod]('Theme Error:', {
        ...error.toJSON(),
        context,
        count: this.errorCounts.get(errorKey)
      });
    }
  }

  getStats() {
    return {
      totalErrors: Array.from(this.errorCounts.values()).reduce((a, b) => a + b, 0),
      uniqueErrors: this.errorCounts.size,
      errorTypes: Object.fromEntries(this.errorCounts)
    };
  }
}

export const ThemeErrorLogger = new ErrorLogger();

/**
 * Optimized safe storage with minimal overhead
 */
export const SafeStorage = {
  getItem(key) {
    try {
      return localStorage?.getItem(key) || null;
    } catch {
      return null;
    }
  },

  setItem(key, value) {
    try {
      localStorage?.setItem(key, value);
      return true;
    } catch {
      return false;
    }
  },

  removeItem(key) {
    try {
      localStorage?.removeItem(key);
      return true;
    } catch {
      return false;
    }
  }
};

/**
 * Optimized system theme detector with caching
 */
export const SystemThemeDetector = {
  _cachedTheme: null,
  _cacheTime: 0,
  _cacheTTL: 1000, // 1 second cache

  detect() {
    const now = Date.now();
    if (this._cachedTheme && (now - this._cacheTime) < this._cacheTTL) {
      return this._cachedTheme;
    }

    try {
      const isDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
      this._cachedTheme = isDark ? 'dark' : 'light';
      this._cacheTime = now;
      return this._cachedTheme;
    } catch {
      this._cachedTheme = 'light';
      this._cacheTime = now;
      return this._cachedTheme;
    }
  },

  createListener(callback) {
    try {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = (e) => {
        this._cachedTheme = e.matches ? 'dark' : 'light';
        this._cacheTime = Date.now();
        callback(this._cachedTheme);
      };

      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener('change', handler);
        return () => mediaQuery.removeEventListener('change', handler);
      } else {
        // Fallback for older browsers
        mediaQuery.addListener(handler);
        return () => mediaQuery.removeListener(handler);
      }
    } catch {
      return null;
    }
  }
};

/**
 * Optimized theme applicator with batched updates
 */
export const SafeThemeApplicator = {
  _pendingUpdate: null,

  applyTheme(theme) {
    // Cancel any pending update
    if (this._pendingUpdate) {
      cancelAnimationFrame(this._pendingUpdate);
    }

    // Batch DOM updates
    this._pendingUpdate = requestAnimationFrame(() => {
      try {
        const root = document.documentElement;
        if (theme === 'dark') {
          root.classList.add('dark');
        } else {
          root.classList.remove('dark');
        }
        this._pendingUpdate = null;
        return true;
      } catch {
        this._pendingUpdate = null;
        return false;
      }
    });

    return true;
  },

  resetToDefault() {
    try {
      document.documentElement.classList.remove('dark');
      return true;
    } catch {
      return false;
    }
  }
};

/**
 * Lightweight validation functions
 */
export const validateTheme = (theme) => {
  return ['light', 'dark', 'system'].includes(theme);
};

export const resolveTheme = (theme, systemTheme) => {
  return theme === 'system' ? systemTheme : theme;
};

/**
 * Optimized theme change announcer with throttling
 */
let lastAnnouncement = 0;
const ANNOUNCEMENT_THROTTLE = 500; // 500ms

export const announceThemeChange = (theme, resolvedTheme) => {
  const now = Date.now();
  if (now - lastAnnouncement < ANNOUNCEMENT_THROTTLE) {
    return;
  }
  
  lastAnnouncement = now;
  
  try {
    // Create temporary announcement element
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    
    const message = theme === 'system'
      ? `Theme switched to system preference: ${resolvedTheme} mode`
      : `Theme switched to ${resolvedTheme} mode`;
    
    announcement.textContent = message;
    document.body.appendChild(announcement);
    
    // Remove after announcement
    setTimeout(() => {
      if (announcement.parentNode) {
        announcement.parentNode.removeChild(announcement);
      }
    }, 1000);
  } catch {
    // Fail silently for announcements
  }
};

// Export optimized versions as default
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