'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import ThemeErrorBoundary from '@microrealestate/commonui/components/ThemeErrorBoundary';
import {
  resolveTheme,
  SafeStorage,
  SafeThemeApplicator,
  SystemThemeDetector,
  THEME_ERROR_SEVERITY,
  THEME_ERROR_TYPES,
  ThemeError,
  ThemeErrorLogger,
  validateTheme
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
 * Enhanced custom theme provider for the tenant application
 * Implements theme persistence with comprehensive error handling and fallbacks
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

  // Get resolved theme based on current theme and system preference
  const resolvedTheme: ResolvedTheme = resolveTheme(theme, systemTheme) as ResolvedTheme;

  // System theme detection with error handling
  useEffect(() => {
    try {
      // Set initial system theme
      const initialSystemTheme = SystemThemeDetector.detect();
      setSystemTheme(initialSystemTheme as ResolvedTheme);

      // Listen for system theme changes
      const cleanup = SystemThemeDetector.createListener((newSystemTheme) => {
        setSystemTheme(newSystemTheme as ResolvedTheme);
      });

      return cleanup || (() => {});
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
  }, []);

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

  // Apply theme to document and save to localStorage with error handling
  useEffect(() => {
    if (!mounted) return;

    try {
      // Apply theme to DOM
      const success = SafeThemeApplicator.applyTheme(resolvedTheme);
      if (!success) {
        const themeError = new ThemeError(
          'Failed to apply theme to DOM',
          THEME_ERROR_TYPES.DOM_MANIPULATION_ERROR,
          THEME_ERROR_SEVERITY.HIGH
        );
        setError(themeError);
      }

      // Save theme preference to localStorage
      const saveSuccess = SafeStorage.setItem(storageKey, theme);
      if (!saveSuccess) {
        const themeError = new ThemeError(
          'Failed to save theme preference',
          THEME_ERROR_TYPES.STORAGE_ERROR,
          THEME_ERROR_SEVERITY.LOW
        );
        setError(themeError);
      }
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
  }, [theme, resolvedTheme, mounted, storageKey]);

  const setTheme = (newTheme: Theme) => {
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
  };

  // Handle theme provider errors
  const handleThemeError = (error: Error, errorInfo?: any) => {
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
  };

  const contextValue: ThemeContextValue = {
    theme,
    setTheme,
    resolvedTheme,
    systemTheme,
    error
  };

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
 * Hook to access theme context with error handling
 * Provides consistent interface for theme state and theme switching functions
 */
export function useTheme(): ThemeContextValue {
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
}

export default ThemeProvider;
