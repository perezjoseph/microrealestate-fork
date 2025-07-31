'use client';

import React, { createContext, useContext, useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useSSR, useSSRStorage } from '../utils/ssr/SSRProvider.js';
import { 
  resolveTheme, 
  validateTheme, 
  SafeThemeApplicator,
  SystemThemeDetector,
  ThemeError,
  ThemeErrorLogger,
  THEME_ERROR_TYPES,
  THEME_ERROR_SEVERITY
} from '../utils/themeErrorHandling.js';
import { createThemeStorage } from '../utils/themeStorage.js';
import { noFlashUtils, syncThemeWithDOM, getCurrentThemeFromDOM } from '../utils/noFlashTheme.js';

/**
 * SSR Theme Context
 */
const SSRThemeContext = createContext(null);

/**
 * Default theme context value for SSR safety
 */
const DEFAULT_THEME_CONTEXT = {
  theme: 'system',
  setTheme: () => {},
  resolvedTheme: 'light',
  systemTheme: 'light',
  isLoading: true,
  error: null,
  isSSR: true,
  isInitialized: false
};

/**
 * SSR-compatible theme provider with cookie integration and initial data injection
 * Implements theme resolution logic that works consistently on server and client
 * Includes theme loading states and error handling for SSR scenarios
 * Creates theme context that gracefully handles missing providers
 * 
 * @param {Object} props - Provider props
 * @param {React.ReactNode} props.children - Child components
 * @param {string} [props.defaultTheme='system'] - Default theme
 * @param {string} [props.storageKey='theme_preference'] - Storage key for theme persistence
 * @param {boolean} [props.enableSystem=true] - Enable system theme detection
 * @param {string} [props.attribute='data-theme'] - HTML attribute to set theme
 * @param {Object} [props.value] - Custom theme values mapping
 * @param {string} [props.cookieTheme] - Initial theme from cookies (for SSR)
 * @param {boolean} [props.enableCookies=true] - Enable cookie-based persistence
 * @param {Object} [props.cookieOptions] - Cookie configuration options
 * @param {Function} [props.onThemeChange] - Theme change callback
 * @param {Function} [props.onError] - Error callback
 * @param {boolean} [props.suppressHydrationWarning=false] - Suppress hydration warnings
 */
export function SSRThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = 'theme_preference',
  enableSystem = true,
  attribute = 'data-theme',
  value = {},
  cookieTheme,
  enableCookies = true,
  cookieOptions = {},
  onThemeChange,
  onError,
  suppressHydrationWarning = false,
  ...props
}) {
  // SSR context and enhanced theme storage
  const { isSSR, isClient, isHydrating, capabilities } = useSSR();
  const enhancedThemeStorage = useMemo(() => createThemeStorage({
    storageKey,
    cookieKey: storageKey,
    enableValidation: true,
    enableSanitization: true,
    enableMigration: true,
    fallbackTheme: defaultTheme,
    ...cookieOptions
  }), [storageKey, defaultTheme, cookieOptions]);
  
  // State management
  const [theme, setThemeState] = useState(() => {
    // Initialize with cookie theme or default for SSR consistency
    return cookieTheme || defaultTheme;
  });
  
  const [resolvedTheme, setResolvedTheme] = useState(() => {
    const systemTheme = isSSR ? 'light' : getSystemTheme();
    return resolveTheme(cookieTheme || defaultTheme, systemTheme);
  });
  
  const [systemTheme, setSystemTheme] = useState(() => {
    return isSSR ? 'light' : getSystemTheme();
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Refs for cleanup and state management
  const initializationRef = useRef(false);
  const systemThemeListenerRef = useRef(null);
  const themeAppliedRef = useRef(false);

  /**
   * Get system theme preference with SSR-safe fallbacks
   * @returns {string} System theme
   */
  function getSystemTheme() {
    if (!enableSystem) {
      return 'light';
    }
    
    if (isSSR) {
      // SSR fallback - could be enhanced with user-agent hints
      return 'light';
    }
    
    // Try to get from DOM first (set by no-flash script)
    if (isClient) {
      const domTheme = getCurrentThemeFromDOM();
      if (domTheme === 'dark' || domTheme === 'light') {
        return domTheme;
      }
    }
    
    // Fallback to system detection
    return SystemThemeDetector.detect();
  }

  /**
   * Apply theme to DOM with error handling
   * @param {string} newResolvedTheme - Theme to apply
   */
  const applyTheme = useCallback((newResolvedTheme) => {
    if (isSSR) {
      return; // Skip DOM manipulation during SSR
    }

    try {
      const themeValue = value[newResolvedTheme] || newResolvedTheme;
      
      // Apply theme attribute to document element
      if (attribute && typeof document !== 'undefined') {
        document.documentElement.setAttribute(attribute, themeValue);
      }
      
      // Apply CSS custom properties for no-flash theme
      noFlashUtils.applyVariables(newResolvedTheme);
      
      // Apply theme using SafeThemeApplicator for additional safety
      const success = SafeThemeApplicator.applyTheme(newResolvedTheme);
      
      if (!success) {
        throw new Error('Failed to apply theme using SafeThemeApplicator');
      }
      
      themeAppliedRef.current = true;
      
      // Dispatch theme change event
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('ssr-theme-applied', {
          detail: { theme: newResolvedTheme, attribute, value: themeValue }
        }));
      }
    } catch (applyError) {
      const themeError = new ThemeError(
        `Failed to apply theme: ${applyError.message}`,
        THEME_ERROR_TYPES.DOM_MANIPULATION_ERROR,
        THEME_ERROR_SEVERITY.HIGH,
        applyError
      );
      
      ThemeErrorLogger.log(themeError, { 
        operation: 'applyTheme', 
        theme: newResolvedTheme,
        attribute,
        value: value[newResolvedTheme]
      });
      
      setError(themeError);
      
      if (onError) {
        onError(themeError);
      }
    }
  }, [isSSR, attribute, value, onError]);

  /**
   * Save theme to storage with enhanced security and validation
   * @param {string} newTheme - Theme to save
   */
  const saveTheme = useCallback(async (newTheme) => {
    try {
      const success = enhancedThemeStorage.setTheme(newTheme, {
        cookie: cookieOptions
      });
      
      if (!success) {
        throw new Error('Failed to save theme to storage');
      }
    } catch (saveError) {
      const themeError = new ThemeError(
        `Failed to save theme: ${saveError.message}`,
        THEME_ERROR_TYPES.STORAGE_ERROR,
        THEME_ERROR_SEVERITY.MEDIUM,
        saveError
      );
      
      ThemeErrorLogger.log(themeError, { 
        operation: 'saveTheme', 
        theme: newTheme,
        storageKey
      });
      
      setError(themeError);
      
      if (onError) {
        onError(themeError);
      }
    }
  }, [enhancedThemeStorage, cookieOptions, storageKey, onError]);

  /**
   * Load theme from storage with enhanced validation and migration
   * @returns {Promise<string>} Loaded theme
   */
  const loadTheme = useCallback(async () => {
    try {
      // Migrate theme from localStorage to cookies if needed
      if (isClient) {
        enhancedThemeStorage.migrateTheme();
      }
      
      // Get theme with fallback priority
      const loadedTheme = enhancedThemeStorage.getTheme();
      
      if (loadedTheme && validateTheme(loadedTheme)) {
        return loadedTheme;
      } else if (loadedTheme) {
        ThemeErrorLogger.log(
          new ThemeError(
            `Invalid theme value in storage: ${loadedTheme}`,
            THEME_ERROR_TYPES.STORAGE_ERROR,
            THEME_ERROR_SEVERITY.LOW
          ),
          { operation: 'loadTheme', storedValue: loadedTheme }
        );
      }
    } catch (loadError) {
      ThemeErrorLogger.log(
        new ThemeError(
          `Failed to load theme from storage: ${loadError.message}`,
          THEME_ERROR_TYPES.STORAGE_ERROR,
          THEME_ERROR_SEVERITY.LOW,
          loadError
        ),
        { operation: 'loadTheme', storageKey }
      );
    }
    
    return defaultTheme;
  }, [enhancedThemeStorage, isClient, defaultTheme, storageKey]);

  /**
   * Set theme with comprehensive error handling and state management
   * @param {string} newTheme - New theme to set
   */
  const setTheme = useCallback(async (newTheme) => {
    try {
      if (!validateTheme(newTheme)) {
        const themeError = new ThemeError(
          `Invalid theme value: ${newTheme}`,
          THEME_ERROR_TYPES.PROVIDER_ERROR,
          THEME_ERROR_SEVERITY.MEDIUM
        );
        
        ThemeErrorLogger.log(themeError, { operation: 'setTheme', newTheme });
        setError(themeError);
        
        if (onError) {
          onError(themeError);
        }
        return;
      }

      // Update theme state
      setThemeState(newTheme);
      
      // Calculate resolved theme
      const currentSystemTheme = getSystemTheme();
      const newResolvedTheme = resolveTheme(newTheme, currentSystemTheme);
      
      setResolvedTheme(newResolvedTheme);
      setSystemTheme(currentSystemTheme);
      
      // Apply theme to DOM
      applyTheme(newResolvedTheme);
      
      // Save theme to storage
      await saveTheme(newTheme);
      
      // Call theme change callback
      if (onThemeChange) {
        onThemeChange(newTheme, newResolvedTheme);
      }
      
      // Clear any previous errors on successful theme change
      setError(null);
      
      // Dispatch theme change event
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('ssr-theme-changed', {
          detail: { 
            theme: newTheme, 
            resolvedTheme: newResolvedTheme,
            systemTheme: currentSystemTheme
          }
        }));
      }
    } catch (setThemeError) {
      const themeError = new ThemeError(
        `Failed to set theme: ${setThemeError.message}`,
        THEME_ERROR_TYPES.PROVIDER_ERROR,
        THEME_ERROR_SEVERITY.HIGH,
        setThemeError
      );
      
      ThemeErrorLogger.log(themeError, { operation: 'setTheme', newTheme });
      setError(themeError);
      
      if (onError) {
        onError(themeError);
      }
    }
  }, [applyTheme, saveTheme, onThemeChange, onError]);

  // Initialize theme provider with enhanced SSR support
  useEffect(() => {
    if (initializationRef.current) {
      return;
    }
    
    initializationRef.current = true;
    
    const initializeTheme = async () => {
      try {
        setIsLoading(true);
        
        // Enhanced theme loading with priority order and validation
        let loadedTheme = await loadTheme();
        
        // Priority order for theme resolution:
        // 1. Cookie theme (from SSR)
        // 2. Loaded theme (from storage)
        // 3. Default theme
        let finalTheme = loadedTheme;
        
        if (cookieTheme) {
          // Validate cookie theme
          if (validateTheme(cookieTheme)) {
            finalTheme = cookieTheme;
            
            // If cookie theme differs from storage, synchronize
            if (loadedTheme !== cookieTheme) {
              finalTheme = enhancedThemeStorage.synchronizeTheme(cookieTheme, loadedTheme);
              
              // Save synchronized theme back to storage
              if (isClient) {
                await saveTheme(finalTheme);
              }
            }
          } else {
            ThemeErrorLogger.log(
              new ThemeError(
                `Invalid cookie theme: ${cookieTheme}`,
                THEME_ERROR_TYPES.STORAGE_ERROR,
                THEME_ERROR_SEVERITY.LOW
              ),
              { operation: 'initializeTheme', cookieTheme }
            );
          }
        }
        
        // Get system theme with enhanced detection
        const currentSystemTheme = getSystemTheme();
        
        // Resolve theme with validation
        let initialResolvedTheme = resolveTheme(finalTheme, currentSystemTheme);
        
        // Update state atomically
        setThemeState(finalTheme);
        setResolvedTheme(initialResolvedTheme);
        setSystemTheme(currentSystemTheme);
        
        // Enhanced DOM synchronization for SSR/client consistency
        if (isClient) {
          const domTheme = getCurrentThemeFromDOM();
          
          if (domTheme && domTheme !== initialResolvedTheme) {
            // DOM theme takes precedence (applied by no-flash script)
            const syncedTheme = syncThemeWithDOM(initialResolvedTheme, domTheme);
            
            if (syncedTheme !== initialResolvedTheme) {
              console.log('Syncing theme with DOM:', { 
                react: initialResolvedTheme, 
                dom: domTheme, 
                synced: syncedTheme 
              });
              
              setResolvedTheme(syncedTheme);
              initialResolvedTheme = syncedTheme;
              
              // Update theme state if needed
              if (finalTheme === 'system' && syncedTheme !== currentSystemTheme) {
                setSystemTheme(syncedTheme);
              }
            }
          }
          
          // Apply theme with error handling
          applyTheme(initialResolvedTheme);
          
          // Enhanced cleanup with delay for better UX
          const cleanupDelay = isHydrating ? 200 : 100;
          setTimeout(() => {
            try {
              noFlashUtils.cleanup();
              
              // Dispatch initialization complete event
              window.dispatchEvent(new CustomEvent('ssr-theme-initialized', {
                detail: { 
                  theme: finalTheme, 
                  resolvedTheme: initialResolvedTheme,
                  systemTheme: currentSystemTheme,
                  source: cookieTheme ? 'cookie' : 'storage'
                }
              }));
            } catch (cleanupError) {
              console.warn('Error during theme initialization cleanup:', cleanupError);
            }
          }, cleanupDelay);
        }
        
        // Mark as initialized
        setIsInitialized(true);
        setIsLoading(false);
        
        // Call initialization callback with enhanced context
        if (onThemeChange) {
          onThemeChange(finalTheme, initialResolvedTheme, {
            systemTheme: currentSystemTheme,
            source: cookieTheme ? 'cookie' : 'storage',
            synchronized: cookieTheme && loadedTheme !== cookieTheme,
            domSynced: isClient && getCurrentThemeFromDOM() !== initialResolvedTheme
          });
        }
        
        // Log successful initialization in development
        if (process.env.NODE_ENV === 'development') {
          console.log('SSR Theme Provider initialized:', {
            theme: finalTheme,
            resolvedTheme: initialResolvedTheme,
            systemTheme: currentSystemTheme,
            cookieTheme,
            loadedTheme,
            isSSR,
            isClient,
            isHydrating
          });
        }
        
      } catch (initError) {
        const themeError = new ThemeError(
          `Failed to initialize SSR theme provider: ${initError.message}`,
          THEME_ERROR_TYPES.PROVIDER_ERROR,
          THEME_ERROR_SEVERITY.CRITICAL,
          initError
        );
        
        ThemeErrorLogger.log(themeError, { 
          operation: 'initializeTheme',
          cookieTheme,
          defaultTheme,
          isSSR,
          isClient,
          isHydrating
        });
        
        setError(themeError);
        setIsLoading(false);
        
        if (onError) {
          onError(themeError);
        }
        
        // Enhanced fallback with state recovery
        try {
          if (isClient) {
            SafeThemeApplicator.resetToDefault();
          }
          
          // Set safe fallback state
          setThemeState(defaultTheme);
          setResolvedTheme('light');
          setSystemTheme('light');
          setIsInitialized(true);
          
          // Apply fallback theme
          if (isClient) {
            applyTheme('light');
          }
          
        } catch (fallbackError) {
          console.error('Critical error in theme provider fallback:', fallbackError);
        }
      }
    };

    initializeTheme();
  }, [
    cookieTheme, 
    loadTheme, 
    saveTheme, 
    applyTheme, 
    isClient, 
    isHydrating, 
    onThemeChange, 
    onError, 
    defaultTheme,
    enhancedThemeStorage
  ]);

  // Set up system theme change listener
  useEffect(() => {
    if (!enableSystem || !isClient || !isInitialized) {
      return;
    }

    const cleanup = SystemThemeDetector.createListener((newSystemTheme) => {
      try {
        setSystemTheme(newSystemTheme);
        
        // Only update resolved theme if current theme is 'system'
        if (theme === 'system') {
          setResolvedTheme(newSystemTheme);
          applyTheme(newSystemTheme);
          
          // Dispatch system theme change event
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('ssr-system-theme-changed', {
              detail: { systemTheme: newSystemTheme }
            }));
          }
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
        
        if (onError) {
          onError(themeError);
        }
      }
    });

    systemThemeListenerRef.current = cleanup;

    return cleanup || (() => {});
  }, [enableSystem, isClient, isInitialized, theme, applyTheme, onError]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (systemThemeListenerRef.current) {
        try {
          systemThemeListenerRef.current();
        } catch (cleanupError) {
          console.warn('Error during theme provider cleanup:', cleanupError);
        }
      }
    };
  }, []);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    // Core theme state
    theme,
    setTheme,
    resolvedTheme,
    systemTheme,
    isLoading,
    error,
    
    // Environment state
    isSSR,
    isClient,
    isHydrating,
    isInitialized,
    
    // Configuration
    enableSystem,
    attribute,
    storageKey,
    defaultTheme,
    enableCookies,
    
    // Theme utilities
    getThemeValue: (themeName) => value[themeName] || themeName,
    isSystemTheme: theme === 'system',
    isDarkTheme: resolvedTheme === 'dark',
    isLightTheme: resolvedTheme === 'light',
    
    // Enhanced error handling
    clearError: () => setError(null),
    hasError: !!error,
    errorSeverity: error?.severity || null,
    
    // Storage utilities
    hasStorage: !!enhancedThemeStorage,
    storageInfo: enhancedThemeStorage?.getStorageInfo() || null,
    
    // Enhanced storage operations with error handling
    migrateTheme: () => {
      try {
        return enhancedThemeStorage.migrateTheme();
      } catch (error) {
        console.warn('Error migrating theme:', error);
        return false;
      }
    },
    
    clearTheme: () => {
      try {
        enhancedThemeStorage.clear();
        setThemeState(defaultTheme);
        setResolvedTheme('light');
        setError(null);
        return true;
      } catch (error) {
        console.warn('Error clearing theme:', error);
        return false;
      }
    },
    
    synchronizeTheme: (serverTheme, clientTheme) => {
      try {
        return enhancedThemeStorage.synchronizeTheme(serverTheme, clientTheme);
      } catch (error) {
        console.warn('Error synchronizing theme:', error);
        return clientTheme || serverTheme || defaultTheme;
      }
    },
    
    // Theme validation utilities
    validateTheme: (themeValue) => validateTheme(themeValue),
    
    // System theme utilities
    getSystemTheme: () => getSystemTheme(),
    
    // DOM utilities
    getCurrentDOMTheme: () => {
      try {
        return getCurrentThemeFromDOM();
      } catch (error) {
        console.warn('Error getting DOM theme:', error);
        return 'light';
      }
    },
    
    // Force theme refresh (useful for debugging)
    refreshTheme: async () => {
      try {
        const currentTheme = await loadTheme();
        const currentSystemTheme = getSystemTheme();
        const currentResolvedTheme = resolveTheme(currentTheme, currentSystemTheme);
        
        setThemeState(currentTheme);
        setResolvedTheme(currentResolvedTheme);
        setSystemTheme(currentSystemTheme);
        
        if (isClient) {
          applyTheme(currentResolvedTheme);
        }
        
        return { theme: currentTheme, resolvedTheme: currentResolvedTheme };
      } catch (error) {
        console.warn('Error refreshing theme:', error);
        return null;
      }
    },
    
    // Debug utilities (development only)
    ...(process.env.NODE_ENV === 'development' && {
      debug: {
        cookieTheme,
        initialData,
        themeApplied: themeAppliedRef.current,
        initializationTime: Date.now() - (contextValue?.initializedAt || Date.now()),
        errorHistory: error ? [error] : []
      }
    })
  }), [
    theme, 
    setTheme, 
    resolvedTheme, 
    systemTheme, 
    isLoading, 
    error, 
    isSSR, 
    isClient, 
    isHydrating, 
    isInitialized,
    enableSystem,
    attribute,
    storageKey,
    defaultTheme,
    enableCookies,
    value,
    enhancedThemeStorage,
    cookieTheme,
    loadTheme,
    applyTheme
  ]);

  // Enhanced loading state with better UX
  if (isLoading && !isInitialized) {
    const loadingContextValue = {
      ...DEFAULT_THEME_CONTEXT,
      isLoading: true,
      theme: cookieTheme || defaultTheme,
      resolvedTheme: cookieTheme === 'system' ? 'light' : (cookieTheme || 'light'),
      initialData: { fallbackTheme: defaultTheme, ...initialData }
    };
    
    return (
      <SSRThemeContext.Provider value={loadingContextValue}>
        {children}
      </SSRThemeContext.Provider>
    );
  }

  // Enhanced error state with recovery options
  if (error && error.severity === THEME_ERROR_SEVERITY.CRITICAL) {
    const errorContextValue = {
      ...DEFAULT_THEME_CONTEXT,
      error,
      isLoading: false,
      theme: defaultTheme,
      resolvedTheme: 'light',
      systemTheme: 'light',
      
      // Recovery utilities
      retry: () => {
        setError(null);
        setIsLoading(true);
        setIsInitialized(false);
        initializationRef.current = false;
      },
      
      reset: () => {
        setError(null);
        setThemeState(defaultTheme);
        setResolvedTheme('light');
        setSystemTheme('light');
        setIsLoading(false);
        setIsInitialized(true);
        
        if (isClient) {
          SafeThemeApplicator.resetToDefault();
          enhancedThemeStorage.clear();
        }
      }
    };
    
    return (
      <SSRThemeContext.Provider value={errorContextValue}>
        {children}
      </SSRThemeContext.Provider>
    );
  }

  // Main provider content
  return (
    <SSRThemeContext.Provider value={contextValue}>
      {children}
    </SSRThemeContext.Provider>
  );
}

/**
 * Hook to use SSR theme context
 * @returns {Object} Theme context value
 */
export function useSSRTheme() {
  const context = useContext(SSRThemeContext);
  
  if (!context) {
    // Return safe defaults if no provider is found
    console.warn('useSSRTheme must be used within an SSRThemeProvider. Using fallback values.');
    return {
      ...DEFAULT_THEME_CONTEXT,
      error: new ThemeError(
        'useSSRTheme used outside of SSRThemeProvider',
        THEME_ERROR_TYPES.PROVIDER_ERROR,
        THEME_ERROR_SEVERITY.MEDIUM
      )
    };
  }
  
  return context;
}

/**
 * Higher-order component to provide SSR theme context
 * @param {React.ComponentType} Component - Component to wrap
 * @param {Object} themeOptions - Theme provider options
 * @returns {React.ComponentType} Wrapped component
 */
export function withSSRTheme(Component, themeOptions = {}) {
  const WrappedComponent = React.forwardRef((props, ref) => (
    <SSRThemeProvider {...themeOptions}>
      <Component {...props} ref={ref} />
    </SSRThemeProvider>
  ));

  WrappedComponent.displayName = `withSSRTheme(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

/**
 * Component to conditionally render based on theme
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Content to render
 * @param {string} [props.theme] - Theme to match
 * @param {string} [props.resolvedTheme] - Resolved theme to match
 * @param {boolean} [props.dark] - Render only in dark theme
 * @param {boolean} [props.light] - Render only in light theme
 * @param {boolean} [props.system] - Render only when system theme is active
 * @param {React.ReactNode} [props.fallback] - Fallback content
 * @returns {React.ReactElement} Conditional content
 */
export function SSRThemeConditional({ 
  children, 
  theme, 
  resolvedTheme, 
  dark = false, 
  light = false, 
  system = false, 
  fallback = null 
}) {
  const { theme: currentTheme, resolvedTheme: currentResolvedTheme } = useSSRTheme();
  
  const shouldRender = (
    (theme && currentTheme === theme) ||
    (resolvedTheme && currentResolvedTheme === resolvedTheme) ||
    (dark && currentResolvedTheme === 'dark') ||
    (light && currentResolvedTheme === 'light') ||
    (system && currentTheme === 'system')
  );
  
  return shouldRender ? children : fallback;
}

// Export context for advanced use cases
export { SSRThemeContext };