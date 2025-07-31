/**
 * SSR-compatible form validation utilities
 * Provides consistent validation helpers that work with Formik and React Hook Form
 * Implements consistent error state management across SSR and client
 * Adds validation timing controls to prevent hydration issues
 * Creates form state synchronization utilities for SSR
 */

import { useCallback, useRef, useEffect, useMemo } from 'react';
// TODO: Create SSRProvider.js file
// import { useSSR } from './SSRProvider.js';

// Temporary stub for useSSR
const useSSR = () => ({ isSSR: typeof window === 'undefined' });

/**
 * Validation timing modes for SSR compatibility
 */
export const VALIDATION_MODES = {
  IMMEDIATE: 'immediate',
  DEBOUNCED: 'debounced',
  ON_BLUR: 'onBlur',
  ON_SUBMIT: 'onSubmit',
  SSR_SAFE: 'ssrSafe'
};

/**
 * Default validation configuration
 */
const DEFAULT_VALIDATION_CONFIG = {
  mode: VALIDATION_MODES.SSR_SAFE,
  debounceMs: 300,
  validateOnChange: true,
  validateOnBlur: true,
  validateOnMount: false,
  enableSSRValidation: false,
  suppressHydrationWarning: true
};

/**
 * SSR-safe validation timing controller
 * Prevents validation during SSR and manages timing on client
 */
export class SSRValidationController {
  constructor(config = {}) {
    this.config = { ...DEFAULT_VALIDATION_CONFIG, ...config };
    this.timeouts = new Map();
    this.isSSR = typeof window === 'undefined';
    this.isClient = !this.isSSR;
  }

  /**
   * Schedule validation with SSR-safe timing
   * @param {string} fieldName - Field name
   * @param {Function} validator - Validation function
   * @param {any} value - Value to validate
   * @param {Object} options - Validation options
   */
  scheduleValidation(fieldName, validator, value, options = {}) {
    const { mode = this.config.mode, debounceMs = this.config.debounceMs } = options;

    // Skip validation during SSR unless explicitly enabled
    if (this.isSSR && !this.config.enableSSRValidation) {
      return Promise.resolve({ isValid: true, errors: {} });
    }

    // Clear existing timeout for this field
    if (this.timeouts.has(fieldName)) {
      clearTimeout(this.timeouts.get(fieldName));
    }

    return new Promise((resolve) => {
      const runValidation = () => {
        try {
          const result = validator(value);
          resolve(result);
        } catch (error) {
          resolve({ isValid: false, errors: { [fieldName]: error.message } });
        }
      };

      switch (mode) {
        case VALIDATION_MODES.IMMEDIATE:
          runValidation();
          break;

        case VALIDATION_MODES.DEBOUNCED: {
          const timeout = setTimeout(runValidation, debounceMs);
          this.timeouts.set(fieldName, timeout);
          break;
        }

        case VALIDATION_MODES.SSR_SAFE:
          if (this.isClient) {
            const timeout = setTimeout(runValidation, debounceMs);
            this.timeouts.set(fieldName, timeout);
          } else {
            resolve({ isValid: true, errors: {} });
          }
          break;

        default:
          runValidation();
      }
    });
  }

  /**
   * Cancel validation for a field
   * @param {string} fieldName - Field name
   */
  cancelValidation(fieldName) {
    if (this.timeouts.has(fieldName)) {
      clearTimeout(this.timeouts.get(fieldName));
      this.timeouts.delete(fieldName);
    }
  }

  /**
   * Cancel all pending validations
   */
  cancelAllValidations() {
    this.timeouts.forEach((timeout) => clearTimeout(timeout));
    this.timeouts.clear();
  }

  /**
   * Cleanup resources
   */
  destroy() {
    this.cancelAllValidations();
  }
}

/**
 * Hook for SSR-compatible form validation with Formik
 * @param {Object} options - Validation options
 * @returns {Object} Validation utilities
 */
export function useSSRFormikValidation(options = {}) {
  const { isSSR, isClient } = useSSR();
  const config = useMemo(() => ({ ...DEFAULT_VALIDATION_CONFIG, ...options }), [options]);
  const controllerRef = useRef(null);

  // Initialize validation controller
  if (!controllerRef.current) {
    controllerRef.current = new SSRValidationController(config);
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (controllerRef.current) {
        controllerRef.current.destroy();
      }
    };
  }, []);

  /**
   * Create SSR-safe field validation function
   * @param {string} fieldName - Field name
   * @param {Function} validator - Validation function
   * @returns {Function} Validation function
   */
  const createFieldValidator = useCallback((fieldName, validator) => {
    return async (value) => {
      if (isSSR && !config.enableSSRValidation) {
        return undefined; // No errors during SSR
      }

      try {
        const result = await controllerRef.current.scheduleValidation(
          fieldName,
          validator,
          value,
          { mode: config.mode, debounceMs: config.debounceMs }
        );

        return result.isValid ? undefined : result.errors[fieldName];
      } catch (error) {
        console.warn(`Validation error for field ${fieldName}:`, error);
        return isClient ? error.message : undefined;
      }
    };
  }, [isSSR, isClient, config]);

  /**
   * Create SSR-safe form validation schema
   * @param {Object} validators - Field validators
   * @returns {Function} Schema validation function
   */
  const createValidationSchema = useCallback((validators) => {
    return async (values) => {
      if (isSSR && !config.enableSSRValidation) {
        return {}; // No errors during SSR
      }

      const errors = {};
      const validationPromises = Object.entries(validators).map(async ([fieldName, validator]) => {
        try {
          const result = await controllerRef.current.scheduleValidation(
            fieldName,
            validator,
            values[fieldName],
            { mode: VALIDATION_MODES.IMMEDIATE }
          );

          if (!result.isValid && result.errors[fieldName]) {
            errors[fieldName] = result.errors[fieldName];
          }
        } catch (error) {
          if (isClient) {
            errors[fieldName] = error.message;
          }
        }
      });

      await Promise.all(validationPromises);
      return errors;
    };
  }, [isSSR, isClient, config]);

  /**
   * SSR-safe field change handler
   * @param {string} fieldName - Field name
   * @param {Function} setFieldValue - Formik setFieldValue
   * @param {Function} validator - Optional validator
   * @returns {Function} Change handler
   */
  const createChangeHandler = useCallback((fieldName, setFieldValue, validator) => {
    return async (value) => {
      // Update field value immediately
      setFieldValue(fieldName, value, false);

      // Schedule validation if enabled and on client
      if (validator && config.validateOnChange && isClient) {
        await controllerRef.current.scheduleValidation(
          fieldName,
          validator,
          value,
          { mode: config.mode, debounceMs: config.debounceMs }
        );
      }
    };
  }, [config, isClient]);

  /**
   * SSR-safe field blur handler
   * @param {string} fieldName - Field name
   * @param {Function} setFieldTouched - Formik setFieldTouched
   * @param {Function} validator - Optional validator
   * @returns {Function} Blur handler
   */
  const createBlurHandler = useCallback((fieldName, setFieldTouched, validator) => {
    return async () => {
      // Mark field as touched
      setFieldTouched(fieldName, true, false);

      // Validate on blur if enabled and on client
      if (validator && config.validateOnBlur && isClient) {
        await controllerRef.current.scheduleValidation(
          fieldName,
          validator,
          undefined,
          { mode: VALIDATION_MODES.IMMEDIATE }
        );
      }
    };
  }, [config, isClient]);

  return {
    createFieldValidator,
    createValidationSchema,
    createChangeHandler,
    createBlurHandler,
    cancelValidation: (fieldName) => controllerRef.current?.cancelValidation(fieldName),
    cancelAllValidations: () => controllerRef.current?.cancelAllValidations(),
    isSSR,
    isClient,
    config
  };
}

/**
 * Hook for SSR-compatible form validation with React Hook Form
 * @param {Object} options - Validation options
 * @returns {Object} Validation utilities
 */
export function useSSRReactHookFormValidation(options = {}) {
  const { isSSR, isClient } = useSSR();
  const config = useMemo(() => ({ ...DEFAULT_VALIDATION_CONFIG, ...options }), [options]);
  const controllerRef = useRef(null);

  // Initialize validation controller
  if (!controllerRef.current) {
    controllerRef.current = new SSRValidationController(config);
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (controllerRef.current) {
        controllerRef.current.destroy();
      }
    };
  }, []);

  /**
   * Create SSR-safe validation rules for React Hook Form
   * @param {Function} validator - Validation function
   * @returns {Object} Validation rules
   */
  const createValidationRules = useCallback((validator) => {
    return {
      validate: async (value) => {
        if (isSSR && !config.enableSSRValidation) {
          return true; // Always valid during SSR
        }

        try {
          const result = await controllerRef.current.scheduleValidation(
            'field',
            validator,
            value,
            { mode: VALIDATION_MODES.IMMEDIATE }
          );

          return result.isValid || result.errors.field;
        } catch (error) {
          return isClient ? error.message : true;
        }
      }
    };
  }, [isSSR, isClient, config]);

  /**
   * Create SSR-safe resolver for React Hook Form
   * @param {Object} validators - Field validators
   * @returns {Function} Resolver function
   */
  const createResolver = useCallback((validators) => {
    return async (values) => {
      if (isSSR && !config.enableSSRValidation) {
        return { values, errors: {} }; // No errors during SSR
      }

      const errors = {};
      const validationPromises = Object.entries(validators).map(async ([fieldName, validator]) => {
        try {
          const result = await controllerRef.current.scheduleValidation(
            fieldName,
            validator,
            values[fieldName],
            { mode: VALIDATION_MODES.IMMEDIATE }
          );

          if (!result.isValid && result.errors[fieldName]) {
            errors[fieldName] = { message: result.errors[fieldName] };
          }
        } catch (error) {
          if (isClient) {
            errors[fieldName] = { message: error.message };
          }
        }
      });

      await Promise.all(validationPromises);

      return {
        values: Object.keys(errors).length === 0 ? values : {},
        errors
      };
    };
  }, [isSSR, isClient, config]);

  return {
    createValidationRules,
    createResolver,
    cancelValidation: (fieldName) => controllerRef.current?.cancelValidation(fieldName),
    cancelAllValidations: () => controllerRef.current?.cancelAllValidations(),
    isSSR,
    isClient,
    config
  };
}

/**
 * Form state synchronization utilities for SSR
 */
export class SSRFormStateSynchronizer {
  constructor(options = {}) {
    this.options = {
      storageKey: 'form_state',
      enablePersistence: true,
      syncOnChange: true,
      syncOnBlur: false,
      ...options
    };
    this.isSSR = typeof window === 'undefined';
    this.storage = this.isSSR ? null : localStorage;
  }

  /**
   * Synchronize form state between server and client
   * @param {Object} serverState - Server-side form state
   * @param {Object} clientState - Client-side form state
   * @returns {Object} Synchronized state
   */
  synchronizeState(serverState, clientState) {
    if (this.isSSR) {
      return serverState;
    }

    // Merge states with client taking precedence for user input
    const synchronized = {
      ...serverState,
      ...clientState,
      // Preserve server-side validation errors if client doesn't have them
      errors: {
        ...serverState.errors,
        ...clientState.errors
      },
      // Preserve server-side touched state
      touched: {
        ...serverState.touched,
        ...clientState.touched
      }
    };

    return synchronized;
  }

  /**
   * Persist form state to storage
   * @param {string} formId - Form identifier
   * @param {Object} state - Form state to persist
   */
  persistState(formId, state) {
    if (this.isSSR || !this.options.enablePersistence || !this.storage) {
      return;
    }

    try {
      const key = `${this.options.storageKey}_${formId}`;
      this.storage.setItem(key, JSON.stringify({
        ...state,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.warn('Failed to persist form state:', error);
    }
  }

  /**
   * Restore form state from storage
   * @param {string} formId - Form identifier
   * @returns {Object|null} Restored state or null
   */
  restoreState(formId) {
    if (this.isSSR || !this.options.enablePersistence || !this.storage) {
      return null;
    }

    try {
      const key = `${this.options.storageKey}_${formId}`;
      const stored = this.storage.getItem(key);
      
      if (stored) {
        const parsed = JSON.parse(stored);
        
        // Check if state is not too old (24 hours)
        if (Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000) {
          return parsed;
        } else {
          this.clearState(formId);
        }
      }
    } catch (error) {
      console.warn('Failed to restore form state:', error);
    }

    return null;
  }

  /**
   * Clear persisted form state
   * @param {string} formId - Form identifier
   */
  clearState(formId) {
    if (this.isSSR || !this.storage) {
      return;
    }

    try {
      const key = `${this.options.storageKey}_${formId}`;
      this.storage.removeItem(key);
    } catch (error) {
      console.warn('Failed to clear form state:', error);
    }
  }
}

/**
 * Hook for form state synchronization
 * @param {string} formId - Form identifier
 * @param {Object} options - Synchronization options
 * @returns {Object} Synchronization utilities
 */
export function useSSRFormStateSynchronization(formId, options = {}) {
  const { isSSR } = useSSR();
  const synchronizerRef = useRef(null);

  // Initialize synchronizer
  if (!synchronizerRef.current) {
    synchronizerRef.current = new SSRFormStateSynchronizer(options);
  }

  const synchronizer = synchronizerRef.current;

  /**
   * Synchronize form state
   * @param {Object} serverState - Server state
   * @param {Object} clientState - Client state
   * @returns {Object} Synchronized state
   */
  const synchronizeState = useCallback((serverState, clientState) => {
    return synchronizer.synchronizeState(serverState, clientState);
  }, [synchronizer]);

  /**
   * Persist current form state
   * @param {Object} state - Form state
   */
  const persistState = useCallback((state) => {
    synchronizer.persistState(formId, state);
  }, [synchronizer, formId]);

  /**
   * Restore form state
   * @returns {Object|null} Restored state
   */
  const restoreState = useCallback(() => {
    return synchronizer.restoreState(formId);
  }, [synchronizer, formId]);

  /**
   * Clear form state
   */
  const clearState = useCallback(() => {
    synchronizer.clearState(formId);
  }, [synchronizer, formId]);

  return {
    synchronizeState,
    persistState,
    restoreState,
    clearState,
    isSSR
  };
}

/**
 * Utility to create SSR-safe initial form values
 * @param {Object} defaultValues - Default form values
 * @param {Object} ssrValues - SSR-provided values
 * @param {Object} options - Options
 * @returns {Object} Initial values
 */
export function createSSRSafeInitialValues(defaultValues, ssrValues = {}, options = {}) {
  // TODO: Implement useSSR hook
  const isSSR = typeof window === 'undefined';
  const { prioritizeSSR = true, validateValues = true } = options;

  // During SSR, use SSR values or defaults
  if (isSSR) {
    const values = { ...defaultValues, ...ssrValues };
    // Use validateValues for future validation logic
    return validateValues ? values : values;
  }

  // On client, decide priority
  if (prioritizeSSR) {
    return { ...defaultValues, ...ssrValues };
  } else {
    return { ...ssrValues, ...defaultValues };
  }
}

/**
 * Export validation modes and utilities
 */
export {
  DEFAULT_VALIDATION_CONFIG
};