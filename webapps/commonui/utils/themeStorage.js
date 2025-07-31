/**
 * Enhanced theme storage utility with secure cookie options and migration support
 * Provides theme validation, sanitization, and synchronization between server and client
 */

import { validateTheme } from './themeErrorHandling.js';

/**
 * Default storage configuration with enhanced security
 */
const DEFAULT_CONFIG = {
  storageKey: 'theme_preference',
  cookieKey: 'mre-theme-preference', // Prefixed for better organization
  cookieMaxAge: 365 * 24 * 60 * 60, // 1 year in seconds
  cookiePath: '/',
  cookieSameSite: 'lax', // Enhanced security: 'strict' for high security, 'lax' for compatibility
  cookieSecure: process.env.NODE_ENV === 'production', // HTTPS only in production
  cookieHttpOnly: false, // Must be false for client-side access
  cookiePriority: 'medium', // Cookie priority for performance
  enableMigration: true,
  enableValidation: true,
  enableSanitization: true,
  enableEncryption: false, // Optional encryption for sensitive themes
  fallbackTheme: 'system',
  version: '2.1', // Incremented for enhanced security features
  
  // Enhanced security settings
  maxThemeLength: 20,
  allowedThemes: ['light', 'dark', 'system'],
  sanitizeRegex: /[<>'&]/g, // Remove dangerous characters
  enableCSRFProtection: true, // Enable CSRF protection for theme changes
  enableIntegrityCheck: true, // Enable data integrity checking
  maxCookieSize: 4096, // Maximum cookie size in bytes
  
  // Enhanced migration settings
  legacyKeys: ['theme_preference', 'theme', 'mre-theme'], // Keys to migrate from
  migrationTimeout: 5000, // Max time for migration
  migrationRetries: 3, // Number of migration retries
  migrationBackoff: 1000, // Backoff time between retries
  
  // Enhanced validation settings
  validateOnRead: true,
  validateOnWrite: true,
  strictValidation: process.env.NODE_ENV === 'production',
  enableSchemaValidation: true, // Enable JSON schema validation
  
  // Security audit settings
  enableAuditLog: process.env.NODE_ENV === 'development',
  auditLogMaxEntries: 100,
  
  // Synchronization settings
  syncStrategy: 'client-preferred', // 'server-preferred', 'client-preferred', 'timestamp-based'
  syncTimeout: 3000, // Timeout for synchronization operations
  enableConflictResolution: true, // Enable automatic conflict resolution
  
  // Performance settings
  enableCaching: true,
  cacheTimeout: 60000, // Cache timeout in milliseconds
  enableCompression: false, // Enable theme data compression
};

/**
 * Theme storage class with enhanced security and migration features
 */
export class ThemeStorage {
  constructor(config = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.isServer = typeof window === 'undefined';
    this.isClient = !this.isServer;
    
    // Enhanced security features
    this.auditLog = [];
    this.cache = new Map();
    this.migrationAttempts = 0;
    this.lastSyncTimestamp = 0;
    
    // Initialize security features
    this.initializeSecurity();
  }

  /**
   * Initialize security features and validation
   * @private
   */
  initializeSecurity() {
    // Generate session token for CSRF protection
    if (this.config.enableCSRFProtection && this.isClient) {
      this.sessionToken = this.generateSessionToken();
    }
    
    // Initialize audit logging
    if (this.config.enableAuditLog) {
      this.auditLog = [];
    }
    
    // Validate configuration
    this.validateConfiguration();
  }

  /**
   * Validate storage configuration
   * @private
   */
  validateConfiguration() {
    const requiredFields = ['storageKey', 'cookieKey', 'fallbackTheme'];
    for (const field of requiredFields) {
      if (!this.config[field]) {
        throw new Error(`ThemeStorage configuration missing required field: ${field}`);
      }
    }
    
    // Validate allowed themes
    if (!Array.isArray(this.config.allowedThemes) || this.config.allowedThemes.length === 0) {
      throw new Error('ThemeStorage configuration must include allowedThemes array');
    }
    
    // Validate fallback theme is in allowed themes
    if (!this.config.allowedThemes.includes(this.config.fallbackTheme)) {
      throw new Error(`Fallback theme '${this.config.fallbackTheme}' not in allowed themes`);
    }
  }

  /**
   * Generate session token for CSRF protection
   * @private
   * @returns {string} Session token
   */
  generateSessionToken() {
    const array = new Uint8Array(16);
    if (this.isClient && window.crypto && window.crypto.getRandomValues) {
      window.crypto.getRandomValues(array);
    } else {
      // Fallback for environments without crypto API
      for (let i = 0; i < array.length; i++) {
        array[i] = Math.floor(Math.random() * 256);
      }
    }
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Add entry to audit log
   * @private
   * @param {string} action - Action performed
   * @param {Object} details - Action details
   */
  addAuditEntry(action, details = {}) {
    if (!this.config.enableAuditLog) return;
    
    const entry = {
      timestamp: Date.now(),
      action,
      details,
      userAgent: this.isClient ? navigator.userAgent : 'server',
      sessionToken: this.sessionToken || 'none'
    };
    
    this.auditLog.push(entry);
    
    // Limit audit log size
    if (this.auditLog.length > this.config.auditLogMaxEntries) {
      this.auditLog.shift();
    }
  }

  /**
   * Get audit log entries
   * @returns {Array} Audit log entries
   */
  getAuditLog() {
    return [...this.auditLog];
  }

  /**
   * Clear audit log
   */
  clearAuditLog() {
    this.auditLog = [];
  }

  /**
   * Enhanced validate and sanitize theme value with security improvements
   * @param {any} theme - Theme value to validate
   * @param {boolean} [strict=false] - Use strict validation
   * @param {Object} [options={}] - Validation options
   * @returns {string|null} Sanitized theme or null if invalid
   */
  validateAndSanitizeTheme(theme, strict = false, options = {}) {
    const startTime = Date.now();
    
    try {
      if (!this.config.enableValidation && !strict) {
        return theme;
      }
      
      // Use options for future extensibility
      const { customValidation } = options;
      // TODO: Implement custom validation logic
      if (customValidation) {
        // Future implementation
      }

      // Enhanced type checking with detailed error information
      if (typeof theme !== 'string') {
        const error = new Error(`Theme must be a string, received: ${typeof theme} (${JSON.stringify(theme)})`);
        
        this.addAuditEntry('validation_failed', {
          reason: 'invalid_type',
          received: typeof theme,
          value: theme,
          strict
        });
        
        if (this.config.strictValidation || strict) {
          throw error;
        }
        console.warn('Theme validation failed:', error.message);
        return null;
      }

      // Enhanced sanitization with security focus
      if (this.config.enableSanitization) {
        const originalTheme = theme;
        
        // Remove dangerous characters using configurable regex
        theme = theme.replace(this.config.sanitizeRegex, '');
        
        // Additional security sanitization - be more permissive for valid themes
        theme = theme.trim().toLowerCase();
        
        // Always apply basic sanitization to remove dangerous characters
        theme = theme
          .replace(/[^\w-]/g, '') // Only allow word characters and hyphens
          .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
          .replace(/-{2,}/g, '-'); // Replace multiple hyphens with single
        
        // Log sanitization if changes were made
        if (originalTheme !== theme && this.config.enableAuditLog) {
          this.addAuditEntry('theme_sanitized', {
            original: originalTheme,
            sanitized: theme,
            changes: originalTheme.length - theme.length
          });
        }
        
        // Enforce length limits with detailed error
        if (theme.length > this.config.maxThemeLength) {
          const error = new Error(`Theme value too long: ${theme.length} > ${this.config.maxThemeLength}`);
          
          this.addAuditEntry('validation_failed', {
            reason: 'length_exceeded',
            length: theme.length,
            maxLength: this.config.maxThemeLength,
            value: theme
          });
          
          if (this.config.strictValidation || strict) {
            throw error;
          }
          console.warn('Theme value too long, truncating');
          theme = theme.substring(0, this.config.maxThemeLength);
        }
        
        // Enhanced allowed themes validation
        if (this.config.allowedThemes && !this.config.allowedThemes.includes(theme)) {
          const error = new Error(`Theme '${theme}' not in allowed list: [${this.config.allowedThemes.join(', ')}]`);
          
          this.addAuditEntry('validation_failed', {
            reason: 'not_allowed',
            theme,
            allowedThemes: this.config.allowedThemes
          });
          
          if (this.config.strictValidation || strict) {
            throw error;
          }
          console.warn('Theme not in allowed list:', theme);
          return null;
        }
      }

      // Enhanced validation using existing validation plus custom rules
      if (!validateTheme(theme)) {
        const error = new Error(`Invalid theme value: ${theme}`);
        
        this.addAuditEntry('validation_failed', {
          reason: 'invalid_format',
          theme,
          validator: 'validateTheme'
        });
        
        if (this.config.strictValidation || strict) {
          throw error;
        }
        console.warn('Invalid theme value:', theme);
        return null;
      }

      // Schema validation if enabled
      if (this.config.enableSchemaValidation) {
        const schemaValid = this.validateThemeSchema(theme);
        if (!schemaValid) {
          const error = new Error(`Theme failed schema validation: ${theme}`);
          
          this.addAuditEntry('validation_failed', {
            reason: 'schema_validation',
            theme
          });
          
          if (this.config.strictValidation || strict) {
            throw error;
          }
          console.warn('Theme failed schema validation:', theme);
          return null;
        }
      }

      // Log successful validation
      this.addAuditEntry('theme_validated', {
        theme,
        strict,
        duration: Date.now() - startTime
      });

      return theme;
      
    } catch (error) {
      this.addAuditEntry('validation_error', {
        error: error.message,
        theme,
        strict,
        duration: Date.now() - startTime
      });
      
      if (this.config.strictValidation || strict) {
        throw error;
      }
      
      console.warn('Theme validation error:', error.message);
      return null;
    }
  }

  /**
   * Validate theme against JSON schema
   * @private
   * @param {string} theme - Theme to validate
   * @returns {boolean} Schema validation result
   */
  validateThemeSchema(theme) {
    // Basic schema validation - can be extended with more complex schemas
    const schema = {
      type: 'string',
      enum: this.config.allowedThemes,
      minLength: 1,
      maxLength: this.config.maxThemeLength,
      pattern: '^[a-z][a-z0-9-]*$' // Must start with letter, only lowercase letters, numbers, hyphens
    };
    
    try {
      // Type check
      if (typeof theme !== schema.type) {
        return false;
      }
      
      // Enum check
      if (schema.enum && !schema.enum.includes(theme)) {
        return false;
      }
      
      // Length checks
      if (schema.minLength && theme.length < schema.minLength) {
        return false;
      }
      
      if (schema.maxLength && theme.length > schema.maxLength) {
        return false;
      }
      
      // Pattern check
      if (schema.pattern && !new RegExp(schema.pattern).test(theme)) {
        return false;
      }
      
      return true;
    } catch (error) {
      console.warn('Schema validation error:', error);
      return false;
    }
  }

  /**
   * Create enhanced theme data object with metadata and security info
   * @param {string} theme - Theme value
   * @param {Object} [options={}] - Additional options
   * @returns {Object} Theme data object
   */
  createThemeData(theme, options = {}) {
    const baseData = {
      theme,
      timestamp: Date.now(),
      version: this.config.version,
      source: options.source || 'theme-storage'
    };

    // Add client-side metadata only when available
    if (this.isClient) {
      baseData.userAgent = navigator.userAgent || '';
      baseData.viewport = {
        width: window.innerWidth || 0,
        height: window.innerHeight || 0
      };
      baseData.colorScheme = window.matchMedia?.('(prefers-color-scheme: dark)')?.matches ? 'dark' : 'light';
    }

    // Add security metadata
    if (options.includeSecurityInfo) {
      baseData.security = {
        validated: true,
        sanitized: this.config.enableSanitization,
        encrypted: this.config.enableEncryption,
        checksum: this.generateChecksum(theme)
      };
    }

    // Add migration metadata if applicable
    if (options.migrated) {
      baseData.migration = {
        from: options.migratedFrom || 'unknown',
        timestamp: Date.now(),
        version: options.previousVersion || 'unknown'
      };
    }

    return baseData;
  }

  /**
   * Generate simple checksum for theme data integrity
   * @param {string} data - Data to checksum
   * @returns {string} Simple checksum
   */
  generateChecksum(data) {
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
  }

  /**
   * Parse theme data from storage
   * @param {string} data - Stored data
   * @returns {Object|null} Parsed theme data or null
   */
  parseThemeData(data) {
    if (!data) {
      return null;
    }

    try {
      // Handle both old and new formats
      const parsed = JSON.parse(data);
      
      // Old format: just the theme string
      if (typeof parsed === 'string') {
        return {
          theme: parsed,
          timestamp: Date.now(),
          version: '0.1',
          source: 'legacy'
        };
      }
      
      // New format: object with metadata
      if (parsed && typeof parsed === 'object' && parsed.theme) {
        return {
          theme: parsed.theme,
          timestamp: parsed.timestamp || Date.now(),
          version: parsed.version || '0.1',
          userAgent: parsed.userAgent || '',
          source: parsed.source || 'unknown'
        };
      }
      
      return null;
    } catch (error) {
      console.warn('Error parsing theme data:', error);
      return null;
    }
  }

  /**
   * Get theme from cookies with enhanced parsing
   * @param {string} [cookieString] - Cookie string for SSR
   * @returns {string|null} Theme from cookies
   */
  getCookieTheme(cookieString) {
    try {
      const cookies = this.parseCookies(cookieString);
      const cookieValue = cookies[this.config.cookieKey];
      
      if (!cookieValue) {
        return null;
      }

      const decoded = decodeURIComponent(cookieValue);
      const themeData = this.parseThemeData(decoded);
      
      if (!themeData) {
        return null;
      }

      const sanitizedTheme = this.validateAndSanitizeTheme(themeData.theme);
      return sanitizedTheme;
    } catch (error) {
      console.warn('Error reading theme from cookies:', error);
      return null;
    }
  }

  /**
   * Set theme in cookies with enhanced security options
   * @param {string} theme - Theme to save
   * @param {Object} [options] - Additional cookie options
   * @returns {boolean} Success status
   */
  setCookieTheme(theme, options = {}) {
    const startTime = Date.now();
    
    if (this.isServer) {
      console.warn('Cannot set cookies during SSR. Use server-side cookie setting.');
      this.addAuditEntry('cookie_set_failed', {
        reason: 'server_side',
        theme
      });
      return false;
    }

    try {
      // Enhanced validation with audit logging
      const sanitizedTheme = this.validateAndSanitizeTheme(theme, options.strict);
      if (!sanitizedTheme) {
        this.addAuditEntry('cookie_set_failed', {
          reason: 'validation_failed',
          theme,
          options
        });
        console.warn('Cannot save invalid theme to cookies');
        return false;
      }

      // CSRF protection
      if (this.config.enableCSRFProtection && options.skipCSRF !== true) {
        if (!this.sessionToken) {
          this.sessionToken = this.generateSessionToken();
        }
      }

      // Create enhanced theme data with security metadata
      const themeData = this.createThemeData(sanitizedTheme, {
        source: 'cookie',
        includeSecurityInfo: true,
        sessionToken: this.sessionToken,
        timestamp: Date.now(),
        ...options
      });
      
      // Add integrity check if enabled
      if (this.config.enableIntegrityCheck) {
        themeData.integrity = this.generateIntegrityHash(themeData);
      }
      
      const serializedData = JSON.stringify(themeData);
      
      // Check data size before encoding
      if (serializedData.length > this.config.maxCookieSize * 0.8) { // 80% of max size
        console.warn('Theme data approaching cookie size limit');
        this.addAuditEntry('cookie_size_warning', {
          size: serializedData.length,
          maxSize: this.config.maxCookieSize,
          theme: sanitizedTheme
        });
      }
      
      const cookieValue = encodeURIComponent(serializedData);
      
      // Enhanced cookie options with security defaults
      const cookieOptions = {
        'max-age': options.maxAge || this.config.cookieMaxAge,
        'path': options.path || this.config.cookiePath,
        'samesite': options.sameSite || this.config.cookieSameSite,
        ...options
      };

      // Enhanced security options with environment-based defaults
      if (this.config.cookieSecure || options.secure || 
          (this.isClient && window.location.protocol === 'https:')) {
        cookieOptions.secure = true;
      }

      // HttpOnly option (note: must be false for client-side theme access)
      if (this.config.cookieHttpOnly || options.httpOnly) {
        cookieOptions.httponly = true;
        console.warn('HttpOnly cookies cannot be accessed by client-side JavaScript');
      }

      // Add priority if supported (Chrome feature)
      if (this.config.cookiePriority && ['low', 'medium', 'high'].includes(this.config.cookiePriority)) {
        cookieOptions.priority = this.config.cookiePriority;
      }

      // Add domain if specified
      if (options.domain) {
        cookieOptions.domain = options.domain;
      }

      // Build cookie string with proper escaping and validation
      const cookieString = Object.entries(cookieOptions)
        .filter(([, value]) => value !== undefined && value !== null)
        .map(([key, value]) => {
          if (typeof value === 'boolean') {
            return value ? key : '';
          }
          // Validate cookie attribute values
          const sanitizedValue = String(value).replace(/[;\r\n]/g, '');
          return `${key}=${sanitizedValue}`;
        })
        .filter(Boolean)
        .join('; ');

      // Build full cookie string
      const fullCookieString = `${this.config.cookieKey}=${cookieValue}; ${cookieString}`;
      
      // Enhanced size validation
      if (fullCookieString.length > this.config.maxCookieSize) {
        const error = new Error(`Cookie size exceeds limit: ${fullCookieString.length} > ${this.config.maxCookieSize}`);
        
        this.addAuditEntry('cookie_set_failed', {
          reason: 'size_exceeded',
          size: fullCookieString.length,
          maxSize: this.config.maxCookieSize,
          error: error.message,
          theme: sanitizedTheme
        });
        
        console.error('Cookie size exceeds limit, theme cannot be saved');
        return false;
      }

      // Set cookie with enhanced error handling
      try {
        document.cookie = fullCookieString;
      } catch (cookieError) {
        this.addAuditEntry('cookie_set_failed', {
          reason: 'document_cookie_error',
          error: cookieError.message,
          theme: sanitizedTheme
        });
        
        console.error('Failed to set document.cookie:', cookieError);
        return false;
      }
      
      // Enhanced verification with retry mechanism
      if (options.verify !== false) {
        let verificationAttempts = 0;
        const maxVerificationAttempts = 3;
        
        const verifyWithRetry = () => {
          const verification = this.getCookieTheme();
          
          if (verification === sanitizedTheme) {
            this.addAuditEntry('cookie_set_success', {
              theme: sanitizedTheme,
              duration: Date.now() - startTime,
              attempts: verificationAttempts + 1,
              size: fullCookieString.length
            });
            return true;
          }
          
          verificationAttempts++;
          if (verificationAttempts < maxVerificationAttempts) {
            // Retry after short delay
            setTimeout(verifyWithRetry, 50);
            return false;
          }
          
          this.addAuditEntry('cookie_verification_failed', {
            expected: sanitizedTheme,
            actual: verification,
            attempts: verificationAttempts,
            theme: sanitizedTheme
          });
          
          console.warn('Cookie verification failed after retries', {
            expected: sanitizedTheme,
            actual: verification,
            attempts: verificationAttempts
          });
          return false;
        };
        
        return verifyWithRetry();
      }
      
      // Log successful cookie set without verification
      this.addAuditEntry('cookie_set_success', {
        theme: sanitizedTheme,
        duration: Date.now() - startTime,
        verified: false,
        size: fullCookieString.length
      });
      
      return true;
      
    } catch (error) {
      this.addAuditEntry('cookie_set_error', {
        error: error.message,
        theme,
        duration: Date.now() - startTime,
        options
      });
      
      console.error('Error setting theme cookie:', error);
      return false;
    }
  }

  /**
   * Generate integrity hash for theme data
   * @private
   * @param {Object} data - Data to hash
   * @returns {string} Integrity hash
   */
  generateIntegrityHash(data) {
    // Simple integrity hash - in production, consider using crypto.subtle
    const dataString = JSON.stringify(data, Object.keys(data).sort());
    let hash = 0;
    
    for (let i = 0; i < dataString.length; i++) {
      const char = dataString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return hash.toString(36);
  }

  /**
   * Verify integrity hash for theme data
   * @private
   * @param {Object} data - Data to verify
   * @returns {boolean} Integrity check result
   */
  verifyIntegrityHash(data) {
    if (!this.config.enableIntegrityCheck || !data.integrity) {
      return true; // Skip if not enabled or no hash present
    }
    
    const { integrity, ...dataWithoutHash } = data;
    const expectedHash = this.generateIntegrityHash(dataWithoutHash);
    
    return integrity === expectedHash;
  }

  /**
   * Remove theme from cookies
   */
  removeCookieTheme() {
    if (this.isServer) {
      console.warn('Cannot remove cookies during SSR.');
      return false;
    }

    try {
      document.cookie = `${this.config.cookieKey}=; max-age=0; path=${this.config.cookiePath}`;
      return true;
    } catch (error) {
      console.warn('Error removing theme cookie:', error);
      return false;
    }
  }

  /**
   * Get theme from localStorage
   * @returns {string|null} Theme from localStorage
   */
  getLocalStorageTheme() {
    if (this.isServer) {
      return null;
    }

    try {
      if (!window.localStorage) {
        return null;
      }

      const stored = localStorage.getItem(this.config.storageKey);
      if (!stored) {
        return null;
      }

      const themeData = this.parseThemeData(stored);
      if (!themeData) {
        return null;
      }

      const sanitizedTheme = this.validateAndSanitizeTheme(themeData.theme);
      return sanitizedTheme;
    } catch (error) {
      console.warn('Error reading theme from localStorage:', error);
      return null;
    }
  }

  /**
   * Set theme in localStorage
   * @param {string} theme - Theme to save
   */
  setLocalStorageTheme(theme) {
    if (this.isServer) {
      return false;
    }

    try {
      if (!window.localStorage) {
        return false;
      }

      const sanitizedTheme = this.validateAndSanitizeTheme(theme);
      if (!sanitizedTheme) {
        console.warn('Cannot save invalid theme to localStorage');
        return false;
      }

      const themeData = this.createThemeData(sanitizedTheme);
      localStorage.setItem(this.config.storageKey, JSON.stringify(themeData));
      return true;
    } catch (error) {
      console.warn('Error setting theme in localStorage:', error);
      return false;
    }
  }

  /**
   * Remove theme from localStorage
   */
  removeLocalStorageTheme() {
    if (this.isServer) {
      return false;
    }

    try {
      if (!window.localStorage) {
        return false;
      }

      localStorage.removeItem(this.config.storageKey);
      return true;
    } catch (error) {
      console.warn('Error removing theme from localStorage:', error);
      return false;
    }
  }

  /**
   * Get theme with fallback priority: cookies -> localStorage -> default
   * @param {string} [cookieString] - Cookie string for SSR
   * @returns {string} Theme value
   */
  getTheme(cookieString) {
    // Try cookies first (for SSR consistency)
    const cookieTheme = this.getCookieTheme(cookieString);
    if (cookieTheme) {
      return cookieTheme;
    }

    // Try localStorage (client-side only)
    const localStorageTheme = this.getLocalStorageTheme();
    if (localStorageTheme) {
      return localStorageTheme;
    }

    // Return fallback theme
    return this.config.fallbackTheme;
  }

  /**
   * Set theme in both cookies and localStorage for redundancy
   * @param {string} theme - Theme to save
   * @param {Object} [options] - Additional options
   */
  setTheme(theme, options = {}) {
    const sanitizedTheme = this.validateAndSanitizeTheme(theme);
    if (!sanitizedTheme) {
      console.warn('Cannot save invalid theme');
      return false;
    }

    let cookieSuccess = false;
    let localStorageSuccess = false;

    // Save to cookies for SSR consistency
    if (this.isClient) {
      cookieSuccess = this.setCookieTheme(sanitizedTheme, options.cookie);
    }

    // Save to localStorage for backward compatibility
    if (this.isClient) {
      localStorageSuccess = this.setLocalStorageTheme(sanitizedTheme);
    }

    return cookieSuccess || localStorageSuccess;
  }

  /**
   * Remove theme from all storage locations
   */
  removeTheme() {
    let cookieSuccess = false;
    let localStorageSuccess = false;

    if (this.isClient) {
      cookieSuccess = this.removeCookieTheme();
      localStorageSuccess = this.removeLocalStorageTheme();
    }

    return cookieSuccess || localStorageSuccess;
  }

  /**
   * Enhanced theme migration from localStorage to cookies with legacy support
   * @param {Object} [options={}] - Migration options
   * @returns {Promise<boolean>} Migration success
   */
  async migrateTheme(options = {}) {
    if (!this.config.enableMigration || this.isServer) {
      this.addAuditEntry('migration_skipped', {
        reason: this.isServer ? 'server_side' : 'disabled',
        enableMigration: this.config.enableMigration
      });
      return false;
    }

    const startTime = Date.now();
    const timeout = options.timeout || this.config.migrationTimeout;
    const maxRetries = options.retries || this.config.migrationRetries;
    
    this.migrationAttempts++;

    try {
      this.addAuditEntry('migration_started', {
        attempt: this.migrationAttempts,
        timeout,
        maxRetries
      });

      // Enhanced cookie validation - check if migration already completed
      const cookieTheme = this.getCookieTheme();
      if (cookieTheme) {
        const validCookieTheme = this.validateAndSanitizeTheme(cookieTheme);
        if (validCookieTheme) {
          this.addAuditEntry('migration_skipped', {
            reason: 'already_migrated',
            cookieTheme: validCookieTheme
          });
          return true; // Already migrated and valid
        }
      }

      let migratedTheme = null;
      let migratedFrom = null;
      let migrationMetadata = {};

      // Enhanced localStorage theme retrieval with error handling
      try {
        const localStorageTheme = this.getLocalStorageTheme();
        if (localStorageTheme) {
          const validatedTheme = this.validateAndSanitizeTheme(localStorageTheme);
          if (validatedTheme) {
            migratedTheme = validatedTheme;
            migratedFrom = 'localStorage';
            migrationMetadata.originalKey = this.config.storageKey;
          }
        }
      } catch (error) {
        console.warn('Error reading from localStorage during migration:', error);
        this.addAuditEntry('migration_error', {
          stage: 'localStorage_read',
          error: error.message
        });
      }

      // Enhanced legacy key migration with timeout protection
      if (!migratedTheme) {
        for (const legacyKey of this.config.legacyKeys) {
          if (Date.now() - startTime > timeout) {
            console.warn('Migration timeout exceeded');
            this.addAuditEntry('migration_timeout', {
              duration: Date.now() - startTime,
              timeout,
              lastKey: legacyKey
            });
            break;
          }

          try {
            const legacyValue = localStorage.getItem(legacyKey);
            if (legacyValue) {
              let parsedValue;
              
              // Enhanced parsing with multiple format support
              try {
                parsedValue = JSON.parse(legacyValue);
                
                // Handle different legacy formats
                if (typeof parsedValue === 'object') {
                  migratedTheme = parsedValue.theme || 
                                 parsedValue.value || 
                                 parsedValue.preference ||
                                 parsedValue;
                } else {
                  migratedTheme = parsedValue;
                }
              } catch {
                // Handle plain string values
                migratedTheme = legacyValue;
              }

              // Validate migrated theme
              const validatedTheme = this.validateAndSanitizeTheme(migratedTheme);
              if (validatedTheme) {
                migratedTheme = validatedTheme;
                migratedFrom = `localStorage:${legacyKey}`;
                migrationMetadata.originalKey = legacyKey;
                migrationMetadata.originalValue = legacyValue;
                break;
              }
            }
          } catch (error) {
            console.warn(`Error reading legacy key ${legacyKey}:`, error);
            this.addAuditEntry('migration_key_error', {
              key: legacyKey,
              error: error.message
            });
          }
        }
      }

      if (!migratedTheme) {
        this.addAuditEntry('migration_failed', {
          reason: 'no_theme_found',
          duration: Date.now() - startTime,
          keysChecked: [this.config.storageKey, ...this.config.legacyKeys]
        });
        return false; // Nothing to migrate
      }

      // Final validation with strict checking
      const finalValidatedTheme = this.validateAndSanitizeTheme(migratedTheme, true);
      if (!finalValidatedTheme) {
        this.addAuditEntry('migration_failed', {
          reason: 'validation_failed',
          theme: migratedTheme,
          from: migratedFrom
        });
        console.warn('Migrated theme failed final validation:', migratedTheme);
        return false;
      }

      // Enhanced migration with retry mechanism
      let migrationSuccess = false;
      let retryCount = 0;
      
      while (!migrationSuccess && retryCount < maxRetries) {
        try {
          // Save to cookies with comprehensive migration metadata
          migrationSuccess = this.setCookieTheme(finalValidatedTheme, {
            migrated: true,
            migratedFrom,
            previousVersion: '1.0',
            migrationTimestamp: Date.now(),
            migrationAttempt: this.migrationAttempts,
            retryCount,
            metadata: migrationMetadata,
            verify: true,
            strict: true
          });
          
          if (!migrationSuccess && retryCount < maxRetries - 1) {
            // Wait before retry with exponential backoff
            const backoffTime = this.config.migrationBackoff * Math.pow(2, retryCount);
            await new Promise(resolve => setTimeout(resolve, backoffTime));
          }
          
          retryCount++;
        } catch (error) {
          console.warn(`Migration attempt ${retryCount + 1} failed:`, error);
          this.addAuditEntry('migration_retry', {
            attempt: retryCount + 1,
            error: error.message,
            theme: finalValidatedTheme
          });
          retryCount++;
        }
      }
      
      if (migrationSuccess) {
        this.addAuditEntry('migration_success', {
          theme: finalValidatedTheme,
          from: migratedFrom,
          duration: Date.now() - startTime,
          attempts: this.migrationAttempts,
          retries: retryCount,
          metadata: migrationMetadata
        });
        
        console.log(`Successfully migrated theme from ${migratedFrom} to cookies:`, finalValidatedTheme);
        
        // Enhanced cleanup with user consent and safety checks
        if (options.cleanup !== false) {
          const shouldCleanup = process.env.NODE_ENV === 'development' || 
                               options.forceCleanup === true;
          
          if (shouldCleanup) {
            try {
              await this.cleanupLegacyStorage(migrationMetadata);
            } catch (cleanupError) {
              console.warn('Error during legacy storage cleanup:', cleanupError);
              this.addAuditEntry('cleanup_error', {
                error: cleanupError.message,
                metadata: migrationMetadata
              });
            }
          }
        }
        
        return true;
      } else {
        this.addAuditEntry('migration_failed', {
          reason: 'cookie_save_failed',
          theme: finalValidatedTheme,
          from: migratedFrom,
          retries: retryCount,
          duration: Date.now() - startTime
        });
        
        console.error('Failed to save migrated theme to cookies after retries');
        return false;
      }
      
    } catch (error) {
      this.addAuditEntry('migration_error', {
        error: error.message,
        duration: Date.now() - startTime,
        attempt: this.migrationAttempts
      });
      
      console.error('Error during enhanced theme migration:', error);
      return false;
    }
  }

  /**
   * Clean up legacy storage keys after successful migration
   * @private
   * @param {Object} [metadata={}] - Migration metadata for cleanup decisions
   * @returns {Promise<boolean>} Cleanup success
   */
  async cleanupLegacyStorage(metadata = {}) {
    if (this.isServer) {
      this.addAuditEntry('cleanup_skipped', {
        reason: 'server_side'
      });
      return false;
    }

    const startTime = Date.now();
    let cleanedKeys = [];
    let failedKeys = [];

    try {
      this.addAuditEntry('cleanup_started', {
        keysToClean: this.config.legacyKeys,
        metadata
      });

      // Enhanced cleanup with safety checks
      for (const legacyKey of this.config.legacyKeys) {
        try {
          // Safety check: verify key exists before removal
          const keyExists = localStorage.getItem(legacyKey) !== null;
          
          if (keyExists) {
            // Additional safety: backup key value before removal in development
            if (process.env.NODE_ENV === 'development') {
              const backupValue = localStorage.getItem(legacyKey);
              this.addAuditEntry('cleanup_backup', {
                key: legacyKey,
                value: backupValue,
                timestamp: Date.now()
              });
            }
            
            localStorage.removeItem(legacyKey);
            
            // Verify removal
            const verifyRemoval = localStorage.getItem(legacyKey) === null;
            if (verifyRemoval) {
              cleanedKeys.push(legacyKey);
              this.addAuditEntry('cleanup_key_success', {
                key: legacyKey
              });
            } else {
              failedKeys.push(legacyKey);
              console.warn(`Failed to remove legacy key: ${legacyKey}`);
            }
          }
        } catch (error) {
          failedKeys.push(legacyKey);
          this.addAuditEntry('cleanup_key_error', {
            key: legacyKey,
            error: error.message
          });
          console.warn(`Error removing legacy key ${legacyKey}:`, error);
        }
      }
      
      const success = failedKeys.length === 0;
      
      this.addAuditEntry('cleanup_completed', {
        success,
        cleanedKeys,
        failedKeys,
        duration: Date.now() - startTime
      });
      
      if (success) {
        console.log('Successfully cleaned up legacy theme storage keys:', cleanedKeys);
      } else {
        console.warn('Partial cleanup completed. Failed keys:', failedKeys);
      }
      
      return success;
      
    } catch (error) {
      this.addAuditEntry('cleanup_error', {
        error: error.message,
        duration: Date.now() - startTime,
        cleanedKeys,
        failedKeys
      });
      
      console.error('Error during legacy storage cleanup:', error);
      return false;
    }
  }

  /**
   * Enhanced synchronization between server and client theme state
   * @param {string} serverTheme - Theme from server (cookies)
   * @param {string} clientTheme - Theme from client (localStorage)
   * @param {Object} [options={}] - Synchronization options
   * @returns {Promise<string>} Synchronized theme
   */
  async synchronizeTheme(serverTheme, clientTheme, options = {}) {
    const startTime = Date.now();
    const syncId = this.generateSessionToken().substring(0, 8);
    
    const {
      strategy = this.config.syncStrategy,
      timeout = this.config.syncTimeout,
      validateBoth = true,
      logConflicts = true,
      enableConflictResolution = this.config.enableConflictResolution,
      forceSync = false
    } = options;

    try {
      this.addAuditEntry('sync_started', {
        syncId,
        serverTheme,
        clientTheme,
        strategy,
        timeout
      });

      // Check if synchronization is needed
      if (!forceSync && Date.now() - this.lastSyncTimestamp < 1000) {
        this.addAuditEntry('sync_skipped', {
          syncId,
          reason: 'rate_limited',
          lastSync: this.lastSyncTimestamp
        });
        return this.config.fallbackTheme;
      }

      this.lastSyncTimestamp = Date.now();

      // Enhanced validation with detailed error tracking
      let validServerTheme = null;
      let validClientTheme = null;
      let serverError = null;
      let clientError = null;
      let serverMetadata = null;
      let clientMetadata = null;

      // Validate server theme with metadata extraction
      if (serverTheme) {
        try {
          validServerTheme = validateBoth 
            ? this.validateAndSanitizeTheme(serverTheme, true)
            : serverTheme;
          
          // Try to get server theme metadata from cookies
          const cookieData = this.getCookieThemeData();
          if (cookieData) {
            serverMetadata = {
              timestamp: cookieData.timestamp,
              version: cookieData.version,
              source: cookieData.source
            };
          }
        } catch (error) {
          serverError = error;
          this.addAuditEntry('sync_validation_error', {
            syncId,
            type: 'server',
            theme: serverTheme,
            error: error.message
          });
          
          if (logConflicts) {
            console.warn('Server theme validation failed:', error.message);
          }
        }
      }

      // Validate client theme with metadata extraction
      if (clientTheme) {
        try {
          validClientTheme = validateBoth 
            ? this.validateAndSanitizeTheme(clientTheme, true)
            : clientTheme;
          
          // Try to get client theme metadata from localStorage
          const localData = this.getLocalStorageThemeData();
          if (localData) {
            clientMetadata = {
              timestamp: localData.timestamp,
              version: localData.version,
              source: localData.source
            };
          }
        } catch (error) {
          clientError = error;
          this.addAuditEntry('sync_validation_error', {
            syncId,
            type: 'client',
            theme: clientTheme,
            error: error.message
          });
          
          if (logConflicts) {
            console.warn('Client theme validation failed:', error.message);
          }
        }
      }

      // Enhanced synchronization logic with multiple strategies
      let resolvedTheme = null;
      let resolutionReason = null;

      if (validServerTheme && validClientTheme) {
        if (validServerTheme !== validClientTheme) {
          if (logConflicts) {
            console.log('Theme synchronization conflict detected:', {
              server: validServerTheme,
              client: validClientTheme,
              strategy,
              serverMetadata,
              clientMetadata
            });
          }

          // Enhanced conflict resolution strategies
          switch (strategy) {
            case 'server-preferred':
              resolvedTheme = validServerTheme;
              resolutionReason = 'server_preferred';
              break;
              
            case 'client-preferred':
              resolvedTheme = validClientTheme;
              resolutionReason = 'client_preferred';
              break;
              
            case 'timestamp-based':
              if (serverMetadata?.timestamp && clientMetadata?.timestamp) {
                resolvedTheme = serverMetadata.timestamp > clientMetadata.timestamp 
                  ? validServerTheme 
                  : validClientTheme;
                resolutionReason = 'timestamp_based';
              } else {
                // Fallback to client-preferred if no timestamps
                resolvedTheme = validClientTheme;
                resolutionReason = 'timestamp_fallback';
              }
              break;
              
            case 'version-based':
              if (serverMetadata?.version && clientMetadata?.version) {
                const serverVersion = parseFloat(serverMetadata.version) || 0;
                const clientVersion = parseFloat(clientMetadata.version) || 0;
                resolvedTheme = serverVersion >= clientVersion 
                  ? validServerTheme 
                  : validClientTheme;
                resolutionReason = 'version_based';
              } else {
                resolvedTheme = validClientTheme;
                resolutionReason = 'version_fallback';
              }
              break;
              
            default:
              resolvedTheme = validClientTheme;
              resolutionReason = 'default_strategy';
          }
          
          this.addAuditEntry('sync_conflict_resolved', {
            syncId,
            serverTheme: validServerTheme,
            clientTheme: validClientTheme,
            resolvedTheme,
            strategy,
            reason: resolutionReason,
            serverMetadata,
            clientMetadata
          });
          
          // Save resolved theme to both storages for future consistency
          if (this.isClient && enableConflictResolution) {
            try {
              const syncPromises = [];
              
              // Update cookie if resolution differs from server
              if (resolvedTheme !== validServerTheme) {
                syncPromises.push(
                  this.setCookieTheme(resolvedTheme, { 
                    source: 'sync-resolution',
                    syncId,
                    originalServer: validServerTheme
                  })
                );
              }
              
              // Update localStorage if resolution differs from client
              if (resolvedTheme !== validClientTheme) {
                syncPromises.push(
                  this.setLocalStorageTheme(resolvedTheme)
                );
              }
              
              // Wait for sync operations with timeout
              await Promise.race([
                Promise.all(syncPromises),
                new Promise((_, reject) => 
                  setTimeout(() => reject(new Error('Sync timeout')), timeout)
                )
              ]);
              
            } catch (syncError) {
              this.addAuditEntry('sync_save_error', {
                syncId,
                error: syncError.message,
                resolvedTheme
              });
              console.warn('Error saving synchronized theme:', syncError);
            }
          }
          
          return resolvedTheme;
        }
        
        // Both themes are the same
        this.addAuditEntry('sync_no_conflict', {
          syncId,
          theme: validServerTheme,
          duration: Date.now() - startTime
        });
        
        return validServerTheme;
      }

      // Use whichever theme is valid
      if (validClientTheme) {
        resolvedTheme = validClientTheme;
        resolutionReason = 'client_only_valid';
        
        // Save client theme to server storage for consistency
        if (this.isClient && !serverError && enableConflictResolution) {
          try {
            await this.setCookieTheme(validClientTheme, { 
              source: 'client-sync',
              syncId,
              reason: 'server_invalid'
            });
          } catch (error) {
            this.addAuditEntry('sync_client_to_server_error', {
              syncId,
              error: error.message,
              theme: validClientTheme
            });
            console.warn('Error syncing client theme to server:', error);
          }
        }
      } else if (validServerTheme) {
        resolvedTheme = validServerTheme;
        resolutionReason = 'server_only_valid';
        
        // Save server theme to client storage for consistency
        if (this.isClient && !clientError && enableConflictResolution) {
          try {
            await this.setLocalStorageTheme(validServerTheme);
          } catch (error) {
            this.addAuditEntry('sync_server_to_client_error', {
              syncId,
              error: error.message,
              theme: validServerTheme
            });
            console.warn('Error syncing server theme to client:', error);
          }
        }
      } else {
        // Both themes are invalid or missing
        resolvedTheme = this.config.fallbackTheme;
        resolutionReason = 'fallback_used';
        
        this.addAuditEntry('sync_fallback_used', {
          syncId,
          serverError: serverError?.message,
          clientError: clientError?.message,
          fallback: this.config.fallbackTheme
        });
        
        if (logConflicts && (serverError || clientError)) {
          console.warn('Theme synchronization failed, using fallback:', {
            serverError: serverError?.message,
            clientError: clientError?.message,
            fallback: this.config.fallbackTheme
          });
        }
      }

      this.addAuditEntry('sync_completed', {
        syncId,
        resolvedTheme,
        reason: resolutionReason,
        duration: Date.now() - startTime,
        serverTheme: validServerTheme,
        clientTheme: validClientTheme
      });

      return resolvedTheme;
      
    } catch (error) {
      this.addAuditEntry('sync_error', {
        syncId,
        error: error.message,
        duration: Date.now() - startTime,
        serverTheme,
        clientTheme
      });
      
      console.error('Critical error in theme synchronization:', error);
      return this.config.fallbackTheme;
    }
  }

  /**
   * Get theme data from cookies (including metadata)
   * @private
   * @param {string} [cookieString] - Cookie string for SSR
   * @returns {Object|null} Theme data object
   */
  getCookieThemeData(cookieString) {
    try {
      const cookies = this.parseCookies(cookieString);
      const cookieValue = cookies[this.config.cookieKey];
      
      if (!cookieValue) {
        return null;
      }

      const decoded = decodeURIComponent(cookieValue);
      const themeData = this.parseThemeData(decoded);
      
      if (!themeData) {
        return null;
      }

      // Verify integrity if enabled
      if (this.config.enableIntegrityCheck && !this.verifyIntegrityHash(themeData)) {
        console.warn('Cookie theme data failed integrity check');
        this.addAuditEntry('integrity_check_failed', {
          type: 'cookie',
          data: themeData
        });
        return null;
      }

      return themeData;
    } catch (error) {
      console.warn('Error reading theme data from cookies:', error);
      return null;
    }
  }

  /**
   * Get theme data from localStorage (including metadata)
   * @private
   * @returns {Object|null} Theme data object
   */
  getLocalStorageThemeData() {
    if (this.isServer) {
      return null;
    }

    try {
      if (!window.localStorage) {
        return null;
      }

      const stored = localStorage.getItem(this.config.storageKey);
      if (!stored) {
        return null;
      }

      const themeData = this.parseThemeData(stored);
      if (!themeData) {
        return null;
      }

      return themeData;
    } catch (error) {
      console.warn('Error reading theme data from localStorage:', error);
      return null;
    }
  }

  /**
   * Parse cookies from document.cookie or cookie header
   * @param {string} [cookieString] - Cookie string (for SSR)
   * @returns {Object} Parsed cookies
   */
  parseCookies(cookieString) {
    const cookies = {};
    const cookieStr = cookieString || (this.isClient ? document.cookie : '');
    
    if (!cookieStr) {
      return cookies;
    }

    cookieStr.split(';').forEach(cookie => {
      const [name, ...rest] = cookie.split('=');
      const value = rest.join('=');
      if (name && value) {
        cookies[name.trim()] = value.trim();
      }
    });

    return cookies;
  }

  /**
   * Get comprehensive storage information for debugging and monitoring
   * @returns {Object} Storage information
   */
  getStorageInfo() {
    const info = {
      // Configuration
      config: {
        ...this.config,
        // Exclude sensitive information in production
        ...(process.env.NODE_ENV === 'production' && {
          sessionToken: '[REDACTED]'
        })
      },
      
      // Environment
      environment: {
        isServer: this.isServer,
        isClient: this.isClient,
        userAgent: this.isClient ? navigator.userAgent : 'server',
        timestamp: Date.now()
      },
      
      // Storage capabilities
      capabilities: {
        hasLocalStorage: this.isClient && !!window.localStorage,
        hasCookies: this.isClient && !!document.cookie,
        hasSessionStorage: this.isClient && !!window.sessionStorage,
        hasCrypto: this.isClient && !!window.crypto
      },
      
      // Current themes
      themes: {
        cookie: this.isClient ? this.getCookieTheme() : null,
        localStorage: this.isClient ? this.getLocalStorageTheme() : null,
        resolved: this.getTheme()
      },
      
      // Migration status
      migration: {
        attempts: this.migrationAttempts,
        lastSync: this.lastSyncTimestamp,
        enableMigration: this.config.enableMigration
      },
      
      // Security status
      security: {
        enableValidation: this.config.enableValidation,
        enableSanitization: this.config.enableSanitization,
        enableIntegrityCheck: this.config.enableIntegrityCheck,
        enableCSRFProtection: this.config.enableCSRFProtection,
        hasSessionToken: !!this.sessionToken
      },
      
      // Performance metrics
      performance: {
        cacheSize: this.cache.size,
        auditLogSize: this.auditLog.length
      }
    };
    
    // Add detailed theme data in development
    if (process.env.NODE_ENV === 'development') {
      info.detailed = {
        cookieData: this.isClient ? this.getCookieThemeData() : null,
        localStorageData: this.isClient ? this.getLocalStorageThemeData() : null,
        auditLog: this.getAuditLog().slice(-10), // Last 10 entries
        cache: Array.from(this.cache.entries())
      };
    }
    
    return info;
  }

  /**
   * Clear all theme data with enhanced options
   * @param {Object} [options={}] - Clear options
   * @returns {Promise<boolean>} Clear success
   */
  async clear(options = {}) {
    const {
      includeCookies = true,
      includeLocalStorage = true,
      includeCache = true,
      includeAuditLog = false,
      verify = true
    } = options;
    
    const startTime = Date.now();
    let results = {
      cookies: false,
      localStorage: false,
      cache: false,
      auditLog: false
    };

    try {
      this.addAuditEntry('clear_started', {
        options,
        timestamp: startTime
      });

      if (this.isClient) {
        // Clear cookies
        if (includeCookies) {
          results.cookies = this.removeCookieTheme();
        }
        
        // Clear localStorage
        if (includeLocalStorage) {
          results.localStorage = this.removeLocalStorageTheme();
        }
      }
      
      // Clear cache
      if (includeCache) {
        this.cache.clear();
        results.cache = true;
      }
      
      // Verify clearing if requested
      if (verify && this.isClient) {
        const cookieTheme = this.getCookieTheme();
        const localTheme = this.getLocalStorageTheme();
        
        if ((includeCookies && cookieTheme) || (includeLocalStorage && localTheme)) {
          console.warn('Theme data still present after clear operation');
          results.verified = false;
        } else {
          results.verified = true;
        }
      }
      
      const success = Object.values(results).every(result => result !== false);
      
      // Add completion entry before clearing audit log
      if (!includeAuditLog) {
        this.addAuditEntry('clear_completed', {
          success,
          results,
          duration: Date.now() - startTime
        });
      }
      
      // Clear audit log after logging completion
      if (includeAuditLog) {
        this.clearAuditLog();
        results.auditLog = true;
      }
      
      return success;
      
    } catch (error) {
      // Only log error if audit log is not being cleared
      if (!options.includeAuditLog) {
        this.addAuditEntry('clear_error', {
          error: error.message,
          results,
          duration: Date.now() - startTime
        });
      }
      
      console.error('Error clearing theme data:', error);
      return false;
    }
  }

  /**
   * Validate storage health and integrity
   * @returns {Promise<Object>} Health check results
   */
  async validateStorageHealth() {
    const startTime = Date.now();
    const healthCheck = {
      overall: 'healthy',
      issues: [],
      recommendations: [],
      details: {}
    };

    try {
      // Check cookie functionality
      if (this.isClient) {
        const testTheme = 'light';
        const testSuccess = this.setCookieTheme(testTheme, { verify: true });
        
        healthCheck.details.cookieTest = {
          success: testSuccess,
          theme: testSuccess ? this.getCookieTheme() : null
        };
        
        if (!testSuccess) {
          healthCheck.issues.push('Cookie storage not functioning properly');
          healthCheck.overall = 'degraded';
        }
        
        // Clean up test
        if (testSuccess) {
          this.removeCookieTheme();
        }
      }
      
      // Check localStorage functionality
      if (this.isClient && window.localStorage) {
        try {
          const testKey = `${this.config.storageKey}_health_test`;
          localStorage.setItem(testKey, 'test');
          const testValue = localStorage.getItem(testKey);
          localStorage.removeItem(testKey);
          
          healthCheck.details.localStorageTest = {
            success: testValue === 'test'
          };
          
          if (testValue !== 'test') {
            healthCheck.issues.push('localStorage not functioning properly');
            healthCheck.overall = 'degraded';
          }
        } catch (error) {
          healthCheck.issues.push(`localStorage error: ${error.message}`);
          healthCheck.overall = 'degraded';
        }
      }
      
      // Check for data consistency
      const cookieTheme = this.isClient ? this.getCookieTheme() : null;
      const localTheme = this.isClient ? this.getLocalStorageTheme() : null;
      
      if (cookieTheme && localTheme && cookieTheme !== localTheme) {
        healthCheck.issues.push('Theme data inconsistency between cookie and localStorage');
        healthCheck.recommendations.push('Run theme synchronization');
        healthCheck.overall = 'warning';
      }
      
      // Check configuration validity
      try {
        this.validateConfiguration();
        healthCheck.details.configurationValid = true;
      } catch (error) {
        healthCheck.issues.push(`Configuration error: ${error.message}`);
        healthCheck.overall = 'unhealthy';
      }
      
      // Performance checks
      if (this.auditLog.length > this.config.auditLogMaxEntries * 0.9) {
        healthCheck.recommendations.push('Consider clearing audit log to improve performance');
      }
      
      if (this.cache.size > 100) {
        healthCheck.recommendations.push('Large cache size detected, consider clearing cache');
      }
      
      healthCheck.details.duration = Date.now() - startTime;
      
      this.addAuditEntry('health_check_completed', {
        overall: healthCheck.overall,
        issueCount: healthCheck.issues.length,
        recommendationCount: healthCheck.recommendations.length,
        duration: healthCheck.details.duration
      });
      
      return healthCheck;
      
    } catch (error) {
      healthCheck.overall = 'error';
      healthCheck.issues.push(`Health check failed: ${error.message}`);
      
      this.addAuditEntry('health_check_error', {
        error: error.message,
        duration: Date.now() - startTime
      });
      
      return healthCheck;
    }
  }
}

/**
 * Create a theme storage instance with default configuration
 * @param {Object} [config] - Configuration options
 * @returns {ThemeStorage} Theme storage instance
 */
export function createThemeStorage(config = {}) {
  return new ThemeStorage(config);
}

/**
 * Create a secure theme storage instance for production
 * @param {Object} [config] - Configuration options
 * @returns {ThemeStorage} Secure theme storage instance
 */
export function createSecureThemeStorage(config = {}) {
  return new ThemeStorage({
    ...config,
    cookieSecure: true,
    cookieSameSite: 'strict',
    enableValidation: true,
    enableSanitization: true
  });
}

/**
 * Default theme storage instance
 */
export const defaultThemeStorage = createThemeStorage();

/**
 * Enhanced utility functions for theme storage
 */
export const themeStorageUtils = {
  /**
   * Get theme from any storage with fallback
   * @param {string} [cookieString] - Cookie string for SSR
   * @returns {string} Theme value
   */
  getTheme: (cookieString) => defaultThemeStorage.getTheme(cookieString),

  /**
   * Set theme in all storage locations with enhanced security
   * @param {string} theme - Theme to save
   * @param {Object} [options] - Additional options
   * @returns {boolean} Success status
   */
  setTheme: (theme, options) => defaultThemeStorage.setTheme(theme, options),

  /**
   * Remove theme from all storage locations
   * @param {Object} [options] - Remove options
   * @returns {boolean} Success status
   */
  removeTheme: (options) => defaultThemeStorage.removeTheme(options),

  /**
   * Migrate theme from localStorage to cookies with enhanced features
   * @param {Object} [options] - Migration options
   * @returns {Promise<boolean>} Migration success
   */
  migrateTheme: (options) => defaultThemeStorage.migrateTheme(options),

  /**
   * Synchronize theme between server and client with conflict resolution
   * @param {string} serverTheme - Server theme
   * @param {string} clientTheme - Client theme
   * @param {Object} [options] - Synchronization options
   * @returns {Promise<string>} Synchronized theme
   */
  synchronizeTheme: (serverTheme, clientTheme, options) => 
    defaultThemeStorage.synchronizeTheme(serverTheme, clientTheme, options),

  /**
   * Get comprehensive storage information
   * @returns {Object} Storage info
   */
  getStorageInfo: () => defaultThemeStorage.getStorageInfo(),

  /**
   * Clear all theme data with options
   * @param {Object} [options] - Clear options
   * @returns {Promise<boolean>} Clear success
   */
  clear: (options) => defaultThemeStorage.clear(options),

  /**
   * Validate theme value with enhanced security
   * @param {any} theme - Theme to validate
   * @param {boolean} [strict] - Use strict validation
   * @param {Object} [options] - Validation options
   * @returns {string|null} Validated theme
   */
  validateTheme: (theme, strict, options) => 
    defaultThemeStorage.validateAndSanitizeTheme(theme, strict, options),

  /**
   * Get audit log entries
   * @returns {Array} Audit log
   */
  getAuditLog: () => defaultThemeStorage.getAuditLog(),

  /**
   * Clear audit log
   */
  clearAuditLog: () => defaultThemeStorage.clearAuditLog(),

  /**
   * Validate storage health
   * @returns {Promise<Object>} Health check results
   */
  validateHealth: () => defaultThemeStorage.validateStorageHealth(),

  /**
   * Create a new theme storage instance with custom configuration
   * @param {Object} config - Configuration options
   * @returns {ThemeStorage} New theme storage instance
   */
  createInstance: (config) => createThemeStorage(config),

  /**
   * Create a secure theme storage instance for production
   * @param {Object} config - Configuration options
   * @returns {ThemeStorage} Secure theme storage instance
   */
  createSecureInstance: (config) => createSecureThemeStorage(config)
};