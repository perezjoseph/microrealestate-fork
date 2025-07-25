import { ThemeProvider as NextThemesProvider, useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import ThemeErrorBoundary from '@microrealestate/commonui/components/ThemeErrorBoundary';
import {
  ThemeError,
  ThemeErrorLogger,
  SafeThemeApplicator,
  THEME_ERROR_TYPES,
  THEME_ERROR_SEVERITY
} from '@microrealestate/commonui/utils/themeErrorHandling';

/**
 * Theme context bridge component to expose next-themes context globally
 * Includes error handling for context exposure
 */
function ThemeContextBridge({ children }) {
  const themeContext = useTheme();

  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        window.__NEXT_THEMES_CONTEXT__ = themeContext;
      }
    } catch (error) {
      ThemeErrorLogger.log(
        new ThemeError(
          `Failed to expose next-themes context globally: ${error.message}`,
          THEME_ERROR_TYPES.PROVIDER_ERROR,
          THEME_ERROR_SEVERITY.MEDIUM,
          error
        ),
        { operation: 'context-bridge', app: 'landlord' }
      );
    }
  }, [themeContext]);

  return <>{children}</>;
}

/**
 * Enhanced theme provider component for the landlord application
 * Wraps next-themes ThemeProvider with comprehensive error handling
 */
export function ThemeProvider({ children, onError, ...props }) {
  const [mounted, setMounted] = useState(false);
  const [initError, setInitError] = useState(null);

  // Prevent hydration mismatch by only rendering after mount
  useEffect(() => {
    try {
      setMounted(true);
    } catch (error) {
      const themeError = new ThemeError(
        `Theme provider mount failed: ${error.message}`,
        THEME_ERROR_TYPES.PROVIDER_ERROR,
        THEME_ERROR_SEVERITY.HIGH,
        error
      );
      ThemeErrorLogger.log(themeError, { operation: 'provider-mount', app: 'landlord' });
      setInitError(themeError);
      
      // Apply safe fallback theme
      SafeThemeApplicator.resetToDefault();
      setMounted(true);
    }
  }, []);

  // Handle theme provider errors
  const handleThemeError = (error, errorInfo) => {
    const themeError = new ThemeError(
      `Theme provider error: ${error.message}`,
      THEME_ERROR_TYPES.PROVIDER_ERROR,
      THEME_ERROR_SEVERITY.HIGH,
      error
    );
    
    ThemeErrorLogger.log(themeError, { 
      operation: 'provider-error', 
      app: 'landlord',
      errorInfo 
    });

    // Call external error handler if provided
    if (onError) {
      onError(themeError, errorInfo);
    }

    // Apply safe fallback theme
    SafeThemeApplicator.resetToDefault();
  };

  if (!mounted) {
    // Return children without theme provider during SSR to prevent hydration mismatch
    return <>{children}</>;
  }

  // If there was an initialization error, render with error boundary only
  if (initError) {
    return (
      <ThemeErrorBoundary onError={handleThemeError}>
        {children}
      </ThemeErrorBoundary>
    );
  }

  return (
    <ThemeErrorBoundary onError={handleThemeError}>
      <NextThemesProvider
        attribute="class"
        defaultTheme="system"
        enableSystem={true}
        disableTransitionOnChange={false}
        storageKey="mre-landlord-theme"
        {...props}
      >
        <ThemeContextBridge>
          {children}
        </ThemeContextBridge>
      </NextThemesProvider>
    </ThemeErrorBoundary>
  );
}

export default ThemeProvider;
