/**
 * Additional SSR utilities for form components
 * Provides consistent default values and enhanced form state management
 */

import { useCallback, useMemo, useRef, useEffect } from 'react';
// TODO: Create SSRProvider.js file
// import { useSSR } from './SSRProvider.js';

// Temporary stub for useSSR
const useSSR = () => ({ isSSR: typeof window === 'undefined' });

/**
 * Create consistent initial values for form fields across SSR and client
 * @param {Object} options - Configuration options
 * @returns {Object} Utilities for managing initial values
 */
export function useSSRFormInitialValues(options = {}) {
  const {
    fieldName,
    defaultValue = '',
    ssrValue,
    formikField,
    enablePersistence = false,
    storageKey = 'form_values'
  } = options;

  const { isSSR, isClient } = useSSR();
  const hasHydratedRef = useRef(false);

  // Determine the initial value based on environment and configuration
  const initialValue = useMemo(() => {
    // During SSR, prioritize SSR value, then default
    if (isSSR) {
      return ssrValue !== undefined ? ssrValue : defaultValue;
    }

    // On client before hydration, use the same logic as SSR for consistency
    if (!hasHydratedRef.current) {
      return ssrValue !== undefined ? ssrValue : defaultValue;
    }

    // After hydration, use Formik field value or restored value
    if (enablePersistence && isClient) {
      try {
        const stored = localStorage.getItem(`${storageKey}_${fieldName}`);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.value !== undefined) {
            return parsed.value;
          }
        }
      } catch (error) {
        console.warn('Failed to restore form value:', error);
      }
    }

    return formikField?.value || defaultValue;
  }, [isSSR, isClient, ssrValue, defaultValue, formikField?.value, enablePersistence, storageKey, fieldName]);

  // Mark as hydrated after first client render
  useEffect(() => {
    if (isClient && !hasHydratedRef.current) {
      hasHydratedRef.current = true;
    }
  }, [isClient]);

  // Persist value to storage
  const persistValue = useCallback((value) => {
    if (enablePersistence && isClient && fieldName) {
      try {
        localStorage.setItem(`${storageKey}_${fieldName}`, JSON.stringify({
          value,
          timestamp: Date.now()
        }));
      } catch (error) {
        console.warn('Failed to persist form value:', error);
      }
    }
  }, [enablePersistence, isClient, fieldName, storageKey]);

  return {
    initialValue,
    persistValue,
    hasHydrated: hasHydratedRef.current,
    isSSR,
    isClient
  };
}

/**
 * Enhanced debounced validation that's SSR-safe
 * @param {Function} validator - Validation function
 * @param {number} delay - Debounce delay in milliseconds
 * @param {Object} options - Additional options
 * @returns {Function} Debounced validator
 */
export function useSSRSafeDebounce(validator, delay = 300, options = {}) {
  const {
    enableSSRValidation = false,
    maxWait = delay * 3,
    leading = false,
    trailing = true
  } = options;

  const { isSSR } = useSSR();
  const timeoutRef = useRef(null);
  const maxTimeoutRef = useRef(null);
  const lastCallTimeRef = useRef(null);
  const lastArgsRef = useRef(null);
  const mountedRef = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (maxTimeoutRef.current) {
        clearTimeout(maxTimeoutRef.current);
      }
    };
  }, []);

  const debouncedValidator = useCallback(async (...args) => {
    // Skip validation during SSR unless explicitly enabled
    if (isSSR && !enableSSRValidation) {
      return { isValid: true, errors: [] };
    }

    // Skip if component is unmounted
    if (!mountedRef.current) {
      return { isValid: true, errors: [] };
    }

    const now = Date.now();
    lastArgsRef.current = args;

    // Leading edge execution
    if (leading && (!lastCallTimeRef.current || (now - lastCallTimeRef.current) >= delay)) {
      try {
        const result = await validator(...args);
        lastCallTimeRef.current = now;
        return result;
      } catch (error) {
        return { isValid: false, errors: [error.message] };
      }
    }

    // Clear existing timeouts
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    return new Promise((resolve) => {
      // Set up trailing edge execution
      if (trailing) {
        timeoutRef.current = setTimeout(async () => {
          if (!mountedRef.current) {
            resolve({ isValid: true, errors: [] });
            return;
          }

          try {
            const result = await validator(...lastArgsRef.current);
            lastCallTimeRef.current = Date.now();
            
            if (maxTimeoutRef.current) {
              clearTimeout(maxTimeoutRef.current);
              maxTimeoutRef.current = null;
            }
            
            resolve(result);
          } catch (error) {
            resolve({ isValid: false, errors: [error.message] });
          }
        }, delay);
      }

      // Set up max wait timeout
      if (maxWait && !maxTimeoutRef.current) {
        maxTimeoutRef.current = setTimeout(async () => {
          if (!mountedRef.current) {
            resolve({ isValid: true, errors: [] });
            return;
          }

          try {
            const result = await validator(...lastArgsRef.current);
            lastCallTimeRef.current = Date.now();
            
            if (timeoutRef.current) {
              clearTimeout(timeoutRef.current);
              timeoutRef.current = null;
            }
            
            resolve(result);
          } catch (error) {
            resolve({ isValid: false, errors: [error.message] });
          }
        }, maxWait);
      }
    });
  }, [validator, delay, enableSSRValidation, maxWait, leading, trailing, isSSR]);

  // Cancel function
  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (maxTimeoutRef.current) {
      clearTimeout(maxTimeoutRef.current);
      maxTimeoutRef.current = null;
    }
  }, []);

  // Flush function
  const flush = useCallback(async () => {
    if (timeoutRef.current && lastArgsRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
      
      try {
        const result = await validator(...lastArgsRef.current);
        lastCallTimeRef.current = Date.now();
        return result;
      } catch (error) {
        return { isValid: false, errors: [error.message] };
      }
    }
    
    if (maxTimeoutRef.current) {
      clearTimeout(maxTimeoutRef.current);
      maxTimeoutRef.current = null;
    }
    
    return { isValid: true, errors: [] };
  }, [validator]);

  debouncedValidator.cancel = cancel;
  debouncedValidator.flush = flush;

  return debouncedValidator;
}

/**
 * SSR-safe form field error handler
 * @param {Object} options - Configuration options
 * @returns {Object} Error handling utilities
 */
export function useSSRFormErrorHandler(options = {}) {
  const {
    fieldName,
    onError,
    enableErrorPersistence = false,
    errorStorageKey = 'form_errors'
  } = options;

  const { isSSR, isClient } = useSSR();
  const errorsRef = useRef([]);

  // Handle validation errors
  const handleError = useCallback((error, context = {}) => {
    const errorInfo = {
      message: error.message || error,
      timestamp: Date.now(),
      fieldName,
      context,
      environment: isSSR ? 'server' : 'client'
    };

    errorsRef.current.push(errorInfo);

    // Persist error if enabled and on client
    if (enableErrorPersistence && isClient && fieldName) {
      try {
        const existingErrors = JSON.parse(
          localStorage.getItem(`${errorStorageKey}_${fieldName}`) || '[]'
        );
        existingErrors.push(errorInfo);
        
        // Keep only last 10 errors
        const recentErrors = existingErrors.slice(-10);
        localStorage.setItem(`${errorStorageKey}_${fieldName}`, JSON.stringify(recentErrors));
      } catch (storageError) {
        console.warn('Failed to persist form error:', storageError);
      }
    }

    // Call external error handler
    if (onError) {
      onError(errorInfo);
    }

    // Log error in development
    if (process.env.NODE_ENV === 'development') {
      console.warn('Form field error:', errorInfo);
    }
  }, [fieldName, onError, enableErrorPersistence, isClient, errorStorageKey, isSSR]);

  // Get persisted errors
  const getPersistedErrors = useCallback(() => {
    if (!enableErrorPersistence || !isClient || !fieldName) {
      return [];
    }

    try {
      const stored = localStorage.getItem(`${errorStorageKey}_${fieldName}`);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.warn('Failed to retrieve persisted errors:', error);
      return [];
    }
  }, [enableErrorPersistence, isClient, fieldName, errorStorageKey]);

  // Clear persisted errors
  const clearPersistedErrors = useCallback(() => {
    if (!enableErrorPersistence || !isClient || !fieldName) {
      return;
    }

    try {
      localStorage.removeItem(`${errorStorageKey}_${fieldName}`);
    } catch (error) {
      console.warn('Failed to clear persisted errors:', error);
    }
  }, [enableErrorPersistence, isClient, fieldName, errorStorageKey]);

  return {
    handleError,
    getPersistedErrors,
    clearPersistedErrors,
    currentErrors: errorsRef.current,
    isSSR,
    isClient
  };
}

/**
 * Create SSR-safe form field configuration
 * @param {Object} fieldConfig - Field configuration
 * @returns {Object} SSR-safe field configuration
 */
export function createSSRSafeFieldConfig(fieldConfig = {}) {
  const {
    name,
    type = 'text',
    defaultValue = '',
    ssrValue,
    validation,
    debounceMs = 300,
    enablePersistence = false,
    ...otherProps
  } = fieldConfig;

  return {
    name,
    type,
    defaultValue,
    ssrValue,
    validation,
    debounceMs,
    enablePersistence,
    ...otherProps,
    // SSR-safe props
    suppressHydrationWarning: true,
    validateOnChange: true,
    validateOnBlur: true,
    // Accessibility props
    'aria-label': otherProps.label || `${name} field`,
    'aria-required': otherProps.required || false
  };
}

/**
 * Hook for managing form field focus during SSR and hydration
 * @param {Object} options - Configuration options
 * @returns {Object} Focus management utilities
 */
export function useSSRFormFocus(options = {}) {
  const {
    autoFocus = false,
    focusOnError = true,
    focusDelay = 100
  } = options;

  const { isSSR, isClient } = useSSR();
  const fieldRef = useRef(null);
  const hasHydratedRef = useRef(false);

  // Focus field after hydration if autoFocus is enabled
  useEffect(() => {
    if (isClient && !hasHydratedRef.current && autoFocus && fieldRef.current) {
      hasHydratedRef.current = true;
      setTimeout(() => {
        if (fieldRef.current && fieldRef.current.focus) {
          fieldRef.current.focus();
        }
      }, focusDelay);
    }
  }, [isClient, autoFocus, focusDelay]);

  // Focus field on error
  const focusOnErrorHandler = useCallback((hasError) => {
    if (focusOnError && hasError && isClient && fieldRef.current) {
      setTimeout(() => {
        if (fieldRef.current && fieldRef.current.focus) {
          fieldRef.current.focus();
        }
      }, focusDelay);
    }
  }, [focusOnError, isClient, focusDelay]);

  return {
    fieldRef,
    focusOnErrorHandler,
    canFocus: isClient && hasHydratedRef.current,
    isSSR,
    isClient
  };
}

export default {
  useSSRFormInitialValues,
  useSSRSafeDebounce,
  useSSRFormErrorHandler,
  createSSRSafeFieldConfig,
  useSSRFormFocus
};