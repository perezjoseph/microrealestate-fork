import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  announceThemeChange,
  resolveTheme,
  SafeStorage,
  SafeThemeApplicator,
  SystemThemeDetector,
  THEME_ERROR_SEVERITY,
  THEME_ERROR_TYPES,
  ThemeError,
  ThemeErrorLogger,
  validateTheme
} from '../utils/themeErrorHandling';

/**
 * Unified theme hook that works with both next-themes and custom provider
 * Provides consistent interface for theme state and theme switching functions
 * Includes comprehensive error handling and fallback mechanisms
 *
 * This hook automatically detects which theme provider is available:
 * - next-themes (for landlord app)
 * - Custom theme provider (for tenant app)
 * - Fallback implementation with localStorage persistence and error recovery
 */
export function useTheme() {
  const [hookResult, setHookResult] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState(null);
  
  // Use ref to prevent multiple initializations
  const initializationRef = useRef(false);

  useEffect(() => {
    // Prevent multiple initializations
    if (initializationRef.current) return;
    initializationRef.current = true;

    try {
      // Check if we're in a browser environment
      if (typeof window === 'undefined') {
        setHookResult({
          theme: 'system',
          setTheme: () => {},
          resolvedTheme: 'light',
          systemTheme: 'light',
          isLoading: false,
          error: null
        });
        setIsInitialized(true);
        return;
      }

      // Try to use next-themes first (for landlord app)
      let nextThemeContext = null;
      try {
        // Check if next-themes is available and we're in a theme context
        if (typeof window !== 'undefined' && window.__NEXT_THEMES_CONTEXT__) {
          nextThemeContext = window.__NEXT_THEMES_CONTEXT__;
        }
      } catch (contextError) {
        ThemeErrorLogger.log(
          new ThemeError(
            'Failed to access next-themes context',
            THEME_ERROR_TYPES.PROVIDER_ERROR,
            THEME_ERROR_SEVERITY.LOW,
            contextError
          ),
          { operation: 'next-themes-detection' }
        );
      }

      if (nextThemeContext && typeof nextThemeContext.setTheme === 'function') {
        setHookResult({
          theme: nextThemeContext.theme || 'system',
          setTheme: nextThemeContext.setTheme,
          resolvedTheme: nextThemeContext.resolvedTheme || 'light',
          systemTheme: nextThemeContext.systemTheme || 'light',
          isLoading: false,
          error: null
        });
        setIsInitialized(true);
        return;
      }

      // Check for custom theme provider in global context
      if (typeof window !== 'undefined' && window.__THEME_CONTEXT__) {
        try {
          const context = window.__THEME_CONTEXT__;
          setHookResult({
            ...context,
            isLoading: false,
            error: null
          });
          setIsInitialized(true);
          return;
        } catch (contextError) {
          ThemeErrorLogger.log(
            new ThemeError(
              'Failed to access custom theme context',
              THEME_ERROR_TYPES.PROVIDER_ERROR,
              THEME_ERROR_SEVERITY.LOW,
              contextError
            ),
            { operation: 'custom-provider-detection' }
          );
        }
      }

      // Use fallback implementation
      setHookResult('fallback');
      setIsInitialized(true);
    } catch (initError) {
      const themeError = new ThemeError(
        `Theme hook initialization failed: ${initError.message}`,
        THEME_ERROR_TYPES.PROVIDER_ERROR,
        THEME_ERROR_SEVERITY.HIGH,
        initError
      );
      
      ThemeErrorLogger.log(themeError, { operation: 'useTheme-initialization' });
      setError(themeError);
      
      // Set fallback state
      setHookResult('fallback');
      setIsInitialized(true);
    }
  }, []);

  // Use fallback theme if no provider is available
  const fallbackTheme = useFallbackTheme();

  // Memoize the return value to prevent unnecessary re-renders
  return useMemo(() => {
    if (!isInitialized) {
      return {
        theme: 'system',
        setTheme: () => {},
        resolvedTheme: 'light',
        systemTheme: 'light',
        isLoading: true,
        error: null
      };
    }

    if (hookResult === 'fallback') {
      return {
        ...fallbackTheme,
        error: error || fallbackTheme.error
      };
    }

    return {
      ...hookResult,
      error: error || hookResult.error
    };
  }, [isInitialized, hookResult, fallbackTheme, error]);
}

/**
 * Fallback theme implementation with comprehensive error handling
 * Used when no theme provider is available
 */
function useFallbackTheme() {
  const [theme, setThemeState] = useState('system');
  const [resolvedTheme, setResolvedTheme] = useState('light');
  const [systemTheme, setSystemTheme] = useState('light');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Get system theme preference with error handling
  const getSystemTheme = useCallback(() => {
    return SystemThemeDetector.detect();
  }, []);

  // Apply theme to DOM with error handling
  const applyTheme = useCallback((newResolvedTheme) => {
    const success = SafeThemeApplicator.applyTheme(newResolvedTheme);
    if (!success) {
      const themeError = new ThemeError(
        'Failed to apply theme to DOM',
        THEME_ERROR_TYPES.DOM_MANIPULATION_ERROR,
        THEME_ERROR_SEVERITY.HIGH
      );
      setError(themeError);
    }
  }, []);

  // Load theme from localStorage with error handling
  const loadTheme = useCallback(() => {
    try {
      const stored = SafeStorage.getItem('mre-theme-preference');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (validateTheme(parsed.theme)) {
          return parsed.theme;
        } else {
          ThemeErrorLogger.log(
            new ThemeError(
              `Invalid theme value in storage: ${parsed.theme}`,
              THEME_ERROR_TYPES.STORAGE_ERROR,
              THEME_ERROR_SEVERITY.LOW
            ),
            { operation: 'loadTheme', storedValue: parsed.theme }
          );
        }
      }
    } catch (parseError) {
      ThemeErrorLogger.log(
        new ThemeError(
          `Failed to parse theme from storage: ${parseError.message}`,
          THEME_ERROR_TYPES.STORAGE_ERROR,
          THEME_ERROR_SEVERITY.LOW,
          parseError
        ),
        { operation: 'loadTheme' }
      );
    }
    return 'system';
  }, []);

  // Save theme to localStorage with error handling
  const saveTheme = useCallback((newTheme) => {
    const success = SafeStorage.setItem(
      'mre-theme-preference',
      JSON.stringify({
        theme: newTheme,
        timestamp: Date.now()
      })
    );
    
    if (!success) {
      const themeError = new ThemeError(
        'Failed to save theme preference',
        THEME_ERROR_TYPES.STORAGE_ERROR,
        THEME_ERROR_SEVERITY.LOW
      );
      setError(themeError);
    }
  }, []);

  // Set theme function with comprehensive error handling
  const setTheme = useCallback(
    (newTheme) => {
      try {
        if (!validateTheme(newTheme)) {
          const themeError = new ThemeError(
            `Invalid theme value: ${newTheme}`,
            THEME_ERROR_TYPES.PROVIDER_ERROR,
            THEME_ERROR_SEVERITY.MEDIUM
          );
          ThemeErrorLogger.log(themeError, { operation: 'setTheme', newTheme });
          setError(themeError);
          return;
        }

        setThemeState(newTheme);
        saveTheme(newTheme);

        const currentSystemTheme = getSystemTheme();
        const newResolvedTheme = resolveTheme(newTheme, currentSystemTheme);

        setResolvedTheme(newResolvedTheme);
        applyTheme(newResolvedTheme);

        // Announce theme change to screen readers
        announceThemeChange(newTheme, newResolvedTheme);

        // Clear any previous errors on successful theme change
        setError(null);
      } catch (setThemeError) {
        const themeError = new ThemeError(
          `Failed to set theme: ${setThemeError.message}`,
          THEME_ERROR_TYPES.PROVIDER_ERROR,
          THEME_ERROR_SEVERITY.HIGH,
          setThemeError
        );
        ThemeErrorLogger.log(themeError, { operation: 'setTheme', newTheme });
        setError(themeError);
      }
    },
    [getSystemTheme, applyTheme, saveTheme]
  );

  // Initialize theme on mount with error handling
  useEffect(() => {
    try {
      const initialSystemTheme = getSystemTheme();
      const initialTheme = loadTheme();
      const initialResolvedTheme = resolveTheme(
        initialTheme,
        initialSystemTheme
      );

      setSystemTheme(initialSystemTheme);
      setThemeState(initialTheme);
      setResolvedTheme(initialResolvedTheme);
      applyTheme(initialResolvedTheme);
      setIsLoading(false);
    } catch (initError) {
      const themeError = new ThemeError(
        `Failed to initialize fallback theme: ${initError.message}`,
        THEME_ERROR_TYPES.PROVIDER_ERROR,
        THEME_ERROR_SEVERITY.CRITICAL,
        initError
      );
      ThemeErrorLogger.log(themeError, { operation: 'fallback-initialization' });
      setError(themeError);
      
      // Apply safe fallback
      SafeThemeApplicator.resetToDefault();
      setIsLoading(false);
    }
  }, [getSystemTheme, loadTheme, applyTheme]);

  // Listen for system theme changes with error handling
  useEffect(() => {
    const cleanup = SystemThemeDetector.createListener((newSystemTheme) => {
      try {
        setSystemTheme(newSystemTheme);

        // Only update resolved theme if current theme is 'system'
        if (theme === 'system') {
          setResolvedTheme(newSystemTheme);
          applyTheme(newSystemTheme);
        }
      } catch (listenerError) {
        const themeError = new ThemeError(
          `Error in system theme change handler: ${listenerError.message}`,
          THEME_ERROR_TYPES.SYSTEM_DETECTION_ERROR,
          THEME_ERROR_SEVERITY.MEDIUM,
          listenerError
        );
        ThemeErrorLogger.log(themeError, { operation: 'system-theme-listener' });
        setError(themeError);
      }
    });

    return cleanup || (() => {});
  }, [theme, applyTheme]);

  // Memoize the return value to prevent unnecessary re-renders
  return useMemo(() => ({
    theme,
    setTheme,
    resolvedTheme,
    systemTheme,
    isLoading,
    error
  }), [theme, setTheme, resolvedTheme, systemTheme, isLoading, error]);
}

// Note: announceThemeChange is now imported from themeErrorHandling.js

export default useTheme;
