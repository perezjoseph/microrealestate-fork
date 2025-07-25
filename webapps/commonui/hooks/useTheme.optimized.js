import { useCallback, useEffect, useState, useRef, useMemo } from 'react';
import {
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
} from '../utils/themeErrorHandling';

// Cache for theme context detection to avoid repeated checks
let contextCache = null;
let contextCacheTime = 0;
const CONTEXT_CACHE_TTL = 5000; // 5 seconds

/**
 * Performance-optimized unified theme hook
 * Features:
 * - Memoized context detection with caching
 * - Reduced re-renders through careful state management
 * - Optimized event listeners with cleanup
 * - Minimal DOM manipulations
 * - Efficient error handling with throttling
 */
export function useTheme() {
  const [hookResult, setHookResult] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState(null);
  
  // Use ref to track initialization to prevent multiple initializations
  const initializationRef = useRef(false);

  // Memoized context detection with caching
  const detectThemeContext = useCallback(() => {
    const now = Date.now();
    
    // Return cached result if still valid
    if (contextCache && (now - contextCacheTime) < CONTEXT_CACHE_TTL) {
      return contextCache;
    }

    try {
      // Check if we're in a browser environment
      if (typeof window === 'undefined') {
        contextCache = { type: 'ssr', context: null };
        contextCacheTime = now;
        return contextCache;
      }

      // Try to use next-themes first (for landlord app)
      if (window.__NEXT_THEMES_CONTEXT__ && typeof window.__NEXT_THEMES_CONTEXT__.setTheme === 'function') {
        contextCache = { type: 'next-themes', context: window.__NEXT_THEMES_CONTEXT__ };
        contextCacheTime = now;
        return contextCache;
      }

      // Check for custom theme provider in global context
      if (window.__THEME_CONTEXT__) {
        contextCache = { type: 'custom', context: window.__THEME_CONTEXT__ };
        contextCacheTime = now;
        return contextCache;
      }

      // Use fallback implementation
      contextCache = { type: 'fallback', context: null };
      contextCacheTime = now;
      return contextCache;
    } catch (detectionError) {
      ThemeErrorLogger.log(
        new ThemeError(
          'Context detection failed',
          THEME_ERROR_TYPES.PROVIDER_ERROR,
          THEME_ERROR_SEVERITY.LOW,
          detectionError
        ),
        { operation: 'context-detection' }
      );
      
      contextCache = { type: 'fallback', context: null };
      contextCacheTime = now;
      return contextCache;
    }
  }, []);

  useEffect(() => {
    // Prevent multiple initializations
    if (initializationRef.current) return;
    initializationRef.current = true;

    try {
      const { type, context } = detectThemeContext();

      if (type === 'ssr') {
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

      if (type === 'next-themes' && context) {
        setHookResult({
          theme: context.theme || 'system',
          setTheme: context.setTheme,
          resolvedTheme: context.resolvedTheme || 'light',
          systemTheme: context.systemTheme || 'light',
          isLoading: false,
          error: null
        });
        setIsInitialized(true);
        return;
      }

      if (type === 'custom' && context) {
        setHookResult({
          ...context,
          isLoading: false,
          error: null
        });
        setIsInitialized(true);
        return;
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
  }, [detectThemeContext]);

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
 * Performance-optimized fallback theme implementation
 * Features:
 * - Debounced storage operations
 * - Throttled system theme detection
 * - Optimized DOM updates
 * - Efficient event listener management
 */
function useFallbackTheme() {
  const [theme, setThemeState] = useState('system');
  const [resolvedTheme, setResolvedTheme] = useState('light');
  const [systemTheme, setSystemTheme] = useState('light');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Refs for optimization
  const storageTimeoutRef = useRef(null);
  const systemThemeListenerRef = useRef(null);
  const lastStorageWrite = useRef(0);
  const lastSystemThemeCheck = useRef(0);

  // Debounced storage operations to reduce I/O
  const debouncedSaveTheme = useCallback((newTheme) => {
    if (storageTimeoutRef.current) {
      clearTimeout(storageTimeoutRef.current);
    }

    storageTimeoutRef.current = setTimeout(() => {
      const now = Date.now();
      // Throttle storage writes to max once per 100ms
      if (now - lastStorageWrite.current < 100) return;
      
      lastStorageWrite.current = now;
      const success = SafeStorage.setItem(
        'mre-theme-preference',
        JSON.stringify({
          theme: newTheme,
          timestamp: now
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
    }, 50); // 50ms debounce
  }, []);

  // Throttled system theme detection
  const getSystemTheme = useCallback(() => {
    const now = Date.now();
    // Throttle system theme checks to max once per 100ms
    if (now - lastSystemThemeCheck.current < 100) {
      return systemTheme;
    }
    
    lastSystemThemeCheck.current = now;
    return SystemThemeDetector.detect();
  }, [systemTheme]);

  // Optimized theme application with batching
  const applyTheme = useCallback((newResolvedTheme) => {
    // Use requestAnimationFrame to batch DOM updates
    requestAnimationFrame(() => {
      const success = SafeThemeApplicator.applyTheme(newResolvedTheme);
      if (!success) {
        const themeError = new ThemeError(
          'Failed to apply theme to DOM',
          THEME_ERROR_TYPES.DOM_MANIPULATION_ERROR,
          THEME_ERROR_SEVERITY.HIGH
        );
        setError(themeError);
      }
    });
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

  // Optimized set theme function with batching
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

        // Batch state updates
        const currentSystemTheme = getSystemTheme();
        const newResolvedTheme = resolveTheme(newTheme, currentSystemTheme);

        // Update states in a single batch
        setThemeState(newTheme);
        setResolvedTheme(newResolvedTheme);
        
        // Debounced storage save
        debouncedSaveTheme(newTheme);
        
        // Batched DOM update
        applyTheme(newResolvedTheme);

        // Announce theme change (throttled internally)
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
    [getSystemTheme, applyTheme, debouncedSaveTheme]
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

      // Batch initial state updates
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

  // Optimized system theme change listener with throttling
  useEffect(() => {
    const cleanup = SystemThemeDetector.createListener((newSystemTheme) => {
      try {
        // Throttle system theme updates
        const now = Date.now();
        if (now - lastSystemThemeCheck.current < 200) return;
        lastSystemThemeCheck.current = now;

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

    systemThemeListenerRef.current = cleanup;

    return () => {
      if (cleanup && typeof cleanup === 'function') {
        cleanup();
      }
      if (storageTimeoutRef.current) {
        clearTimeout(storageTimeoutRef.current);
      }
    };
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

export default useTheme;