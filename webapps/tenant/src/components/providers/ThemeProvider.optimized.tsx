'use client';

import { createContext, useContext, useEffect, useState, useCallback, useRef, useMemo } from 'react';
import type { ReactNode } from 'react';
import ThemeErrorBoundary from '@microrealestate/commonui/components/ThemeErrorBoundary';
import {
  ThemeError,
  ThemeErrorLogger,
  SafeStorage,
  SystemThemeDetector,
  SafeThemeApplicator,
  validateTheme,
  resolveTheme,
  THEME_ERROR_TYPES,
  THEME_ERROR_SEVERITY
} from '@microrealestate/commonui/utils/themeErrorHandling';

type Theme = 'light' | 'dark' | 'system';
type ResolvedTheme = 'light' | 'dark';

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: ResolvedTheme;
  systemTheme: ResolvedTheme;
  error?: ThemeError | null;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
  onError?: (error: ThemeError, errorInfo?: any) => void;
}

/**
 * Performance-optimized custom theme provider for the tenant application
 * Features:
 * - Debounced storage operations to reduce I/O
 * - Batched DOM updates using requestAnimationFrame
 * - Throttled system theme detection
 * - Memoized context values to prevent unnecessary re-renders
 * - Optimized event listener management with cleanup
 */
export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = 'mre-tenant-theme',
  onError
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(defaultTheme);
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>('light');
  const [mounted, setMounted] = useState(false);
  const [error, setError] = useState<ThemeError | null>(null);

  // Refs for performance optimization
  const storageTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const domUpdateFrameRef = useRef<number | null>(null);
  const lastStorageWrite = useRef(0);
  const lastSystemThemeCheck = useRef(0);
  const systemThemeListenerRef = useRef<(() => void) | null>(null);

  // Memoized resolved theme to prevent recalculation
  const resolvedTheme: ResolvedTheme = useMemo(() => {
    return resolveTheme(theme, systemTheme) as ResolvedTheme;
  }, [theme, systemTheme]);

  // Debounced storage save to reduce I/O operations
  const debouncedSaveTheme = useCallback((newTheme: Theme) => {
    if (storageTimeoutRef.current) {
      clearTimeout(storageTimeoutRef.current);
    }

    storageTimeoutRef.current = setTimeout(() => {
      const now = Date.now();
      // Throttle storage writes to max once per 100ms
      if (now - lastStorageWrite.current < 100) return;
      
      lastStorageWrite.current = now;
      const success = SafeStorage.setItem(storageKey, newTheme);
      
      if (!success) {
        const themeError = new ThemeError(
          'Failed to save theme preference',
          THEME_ERROR_TYPES.STORAGE_ERROR,
          THEME_ERROR_SEVERITY.LOW
        );
        setError(themeError);
      }
    }, 50); // 50ms debounce
  }, [storageKey]);

  // Batched DOM theme application using requestAnimationFrame
  const applyThemeToDOM = useCallback((newResolvedTheme: ResolvedTheme) => {
    if (domUpdateFrameRef.current) {
      cancelAnimationFrame(domUpdateFrameRef.current);
    }

    domUpdateFrameRef.current = requestAnimationFrame(() => {
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

  // Throttled system theme detection
  const getSystemTheme = useCallback((): ResolvedTheme => {
    const now = Date.now();
    // Throttle system theme checks to max once per 100ms
    if (now - lastSystemThemeCheck.current < 100) {
      return systemTheme;
    }
    
    lastSystemThemeCheck.current = now;
    return SystemThemeDetector.detect() as ResolvedTheme;
  }, [systemTheme]);

  // System theme detection with error handling and optimization
  useEffect(() => {
    try {
      // Set initial system theme
      const initialSystemTheme = getSystemTheme();
      setSystemTheme(initialSystemTheme);

      // Create optimized system theme listener
      const cleanup = SystemThemeDetector.createListener((newSystemTheme) => {
        // Throttle system theme updates to prevent excessive re-renders
        const now = Date.now();
        if (now - lastSystemThemeCheck.current < 200) return;
        lastSystemThemeCheck.current = now;

        setSystemTheme(newSystemTheme as ResolvedTheme);
      });

      systemThemeListenerRef.current = cleanup;

      return () => {
        if (cleanup && typeof cleanup === 'function') {
          cleanup();
        }
      };
    } catch (detectionError) {
      const themeError = new ThemeError(
        `System theme detection failed: ${detectionError.message}`,
        THEME_ERROR_TYPES.SYSTEM_DETECTION_ERROR,
        THEME_ERROR_SEVERITY.MEDIUM,
        detectionError
      );
      ThemeErrorLogger.log(themeError, { operation: 'system-detection', app: 'tenant' });
      setError(themeError);
      
      // Fallback to light theme
      setSystemTheme('light');
    }
  }, [getSystemTheme]);

  // Load theme from localStorage on mount with error handling
  useEffect(() => {
    try {
      const savedTheme = SafeStorage.getItem(storageKey);
      if (savedTheme && validateTheme(savedTheme)) {
        setThemeState(savedTheme as Theme);
      } else if (savedTheme) {
        ThemeErrorLogger.log(
          new ThemeError(
            `Invalid theme value in storage: ${savedTheme}`,
            THEME_ERROR_TYPES.STORAGE_ERROR,
            THEME_ERROR_SEVERITY.LOW
          ),
          { operation: 'load-theme', app: 'tenant', savedTheme }
        );
      }
    } catch (loadError) {
      const themeError = new ThemeError(
        `Failed to load theme from storage: ${loadError.message}`,
        THEME_ERROR_TYPES.STORAGE_ERROR,
        THEME_ERROR_SEVERITY.MEDIUM,
        loadError
      );
      ThemeErrorLogger.log(themeError, { operation: 'load-theme', app: 'tenant' });
      setError(themeError);
    } finally {
      setMounted(true);
    }
  }, [storageKey]);

  // Apply theme to document with optimization
  useEffect(() => {
    if (!mounted) return;

    try {
      // Batch DOM update and storage save
      applyThemeToDOM(resolvedTheme);
      debouncedSaveTheme(theme);
    } catch (applyError) {
      const themeError = new ThemeError(
        `Theme application failed: ${applyError.message}`,
        THEME_ERROR_TYPES.DOM_MANIPULATION_ERROR,
        THEME_ERROR_SEVERITY.HIGH,
        applyError
      );
      ThemeErrorLogger.log(themeError, { operation: 'apply-theme', app: 'tenant' });
      setError(themeError);
    }
  }, [theme, resolvedTheme, mounted, applyThemeToDOM, debouncedSaveTheme]);

  // Optimized setTheme function with validation and error handling
  const setTheme = useCallback((newTheme: Theme) => {
    try {
      if (!validateTheme(newTheme)) {
        const themeError = new ThemeError(
          `Invalid theme value: ${newTheme}`,
          THEME_ERROR_TYPES.PROVIDER_ERROR,
          THEME_ERROR_SEVERITY.MEDIUM
        );
        ThemeErrorLogger.log(themeError, { operation: 'set-theme', app: 'tenant', newTheme });
        setError(themeError);
        return;
      }

      setThemeState(newTheme);
      // Clear any previous errors on successful theme change
      setError(null);
    } catch (setThemeError) {
      const themeError = new ThemeError(
        `Failed to set theme: ${setThemeError.message}`,
        THEME_ERROR_TYPES.PROVIDER_ERROR,
        THEME_ERROR_SEVERITY.HIGH,
        setThemeError
      );
      ThemeErrorLogger.log(themeError, { operation: 'set-theme', app: 'tenant', newTheme });
      setError(themeError);
    }
  }, []);

  // Handle theme provider errors
  const handleThemeError = useCallback((error: Error, errorInfo?: any) => {
    const themeError = new ThemeError(
      `Theme provider error: ${error.message}`,
      THEME_ERROR_TYPES.PROVIDER_ERROR,
      THEME_ERROR_SEVERITY.HIGH,
      error
    );
    
    ThemeErrorLogger.log(themeError, { 
      operation: 'provider-error', 
      app: 'tenant',
      errorInfo 
    });

    setError(themeError);

    // Call external error handler if provided
    if (onError) {
      onError(themeError, errorInfo);
    }

    // Apply safe fallback theme
    SafeThemeApplicator.resetToDefault();
  }, [onError]);

  // Cleanup timeouts and animation frames on unmount
  useEffect(() => {
    return () => {
      if (storageTimeoutRef.current) {
        clearTimeout(storageTimeoutRef.current);
      }
      if (domUpdateFrameRef.current) {
        cancelAnimationFrame(domUpdateFrameRef.current);
      }
      if (systemThemeListenerRef.current && typeof systemThemeListenerRef.current === 'function') {
        systemThemeListenerRef.current();
      }
    };
  }, []);

  // Memoized context value to prevent unnecessary re-renders
  const contextValue: ThemeContextValue = useMemo(() => ({
    theme,
    setTheme,
    resolvedTheme,
    systemTheme,
    error
  }), [theme, setTheme, resolvedTheme, systemTheme, error]);

  // Expose context globally for unified hook with error handling
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        (window as any).__THEME_CONTEXT__ = contextValue;
      }
    } catch (exposeError) {
      ThemeErrorLogger.log(
        new ThemeError(
          `Failed to expose theme context globally: ${exposeError.message}`,
          THEME_ERROR_TYPES.PROVIDER_ERROR,
          THEME_ERROR_SEVERITY.MEDIUM,
          exposeError
        ),
        { operation: 'context-expose', app: 'tenant' }
      );
    }
  }, [contextValue]);

  // Prevent hydration mismatch by not rendering theme-dependent content until mounted
  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <ThemeErrorBoundary onError={handleThemeError}>
      <ThemeContext.Provider value={contextValue}>
        {children}
      </ThemeContext.Provider>
    </ThemeErrorBoundary>
  );
}

/**
 * Optimized hook to access theme context with error handling
 * Memoized to prevent unnecessary re-renders
 */
export const useTheme = (): ThemeContextValue => {
  const context = useContext(ThemeContext);

  if (context === undefined) {
    const themeError = new ThemeError(
      'useTheme must be used within a ThemeProvider',
      THEME_ERROR_TYPES.PROVIDER_ERROR,
      THEME_ERROR_SEVERITY.HIGH
    );
    ThemeErrorLogger.log(themeError, { operation: 'useTheme-hook', app: 'tenant' });
    throw themeError;
  }

  return context;
};

export default ThemeProvider;