'use client';

import { useState, useEffect } from 'react';
import { useTheme } from '../hooks/useTheme';
import ThemeErrorBoundary from './ThemeErrorBoundary';
import ThemeErrorDebugger from './ThemeErrorDebugger';
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
} from '../utils/themeErrorHandling';

/**
 * Component to test and demonstrate theme error handling
 * Only renders in development mode
 */
function ErrorTrigger({ errorType }) {
  const { setTheme } = useTheme();

  const triggerError = () => {
    switch (errorType) {
      case 'storage':
        // Simulate localStorage error
        const originalSetItem = localStorage.setItem;
        localStorage.setItem = () => {
          throw new Error('Storage quota exceeded');
        };
        setTheme('dark');
        localStorage.setItem = originalSetItem;
        break;

      case 'dom':
        // Simulate DOM manipulation error
        const originalClassList = document.documentElement.classList;
        document.documentElement.classList = {
          ...originalClassList,
          add: () => {
            throw new Error('DOM manipulation failed');
          }
        };
        setTheme('light');
        document.documentElement.classList = originalClassList;
        break;

      case 'invalid-theme':
        // Try to set invalid theme
        setTheme('invalid-theme');
        break;

      case 'system-detection':
        // Simulate system detection error
        const originalMatchMedia = window.matchMedia;
        window.matchMedia = () => {
          throw new Error('matchMedia not supported');
        };
        SystemThemeDetector.detect();
        window.matchMedia = originalMatchMedia;
        break;

      case 'component-error':
        // Trigger a component error
        throw new Error('Component rendering error');

      default:
        console.log('Unknown error type');
    }
  };

  return (
    <button
      onClick={triggerError}
      className="px-3 py-1 bg-red-100 text-red-800 rounded text-sm hover:bg-red-200"
    >
      Trigger {errorType} Error
    </button>
  );
}

function ThemeErrorHandlingDemo() {
  const [mounted, setMounted] = useState(false);
  const { theme, resolvedTheme, error } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Only render in development mode
  if (!mounted || process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
          Theme Error Handling Demo
        </h1>
        
        <div className="space-y-6">
          {/* Current Theme Status */}
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <h2 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
              Current Theme Status
            </h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Theme:</span> {theme}
              </div>
              <div>
                <span className="font-medium">Resolved:</span> {resolvedTheme}
              </div>
              <div className="col-span-2">
                <span className="font-medium">Error:</span>{' '}
                {error ? (
                  <span className="text-red-600">
                    {error.message} ({error.type})
                  </span>
                ) : (
                  <span className="text-green-600">None</span>
                )}
              </div>
            </div>
          </div>

          {/* Error Triggers */}
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              Error Triggers
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <ErrorTrigger errorType="storage" />
              <ErrorTrigger errorType="dom" />
              <ErrorTrigger errorType="invalid-theme" />
              <ErrorTrigger errorType="system-detection" />
              <ThemeErrorBoundary>
                <ErrorTrigger errorType="component-error" />
              </ThemeErrorBoundary>
            </div>
          </div>

          {/* Manual Error Logging Test */}
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              Manual Error Logging
            </h2>
            <div className="space-y-2">
              <button
                onClick={() => {
                  ThemeErrorLogger.log(
                    new ThemeError(
                      'Test error message',
                      THEME_ERROR_TYPES.PROVIDER_ERROR,
                      THEME_ERROR_SEVERITY.MEDIUM
                    ),
                    { test: 'context', timestamp: Date.now() }
                  );
                }}
                className="px-3 py-1 bg-blue-100 text-blue-800 rounded text-sm hover:bg-blue-200 mr-2"
              >
                Log Test Error
              </button>
              <button
                onClick={() => ThemeErrorLogger.clearErrors()}
                className="px-3 py-1 bg-gray-100 text-gray-800 rounded text-sm hover:bg-gray-200"
              >
                Clear Error Log
              </button>
            </div>
          </div>

          {/* Safe Storage Test */}
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              Safe Storage Test
            </h2>
            <div className="space-y-2">
              <div className="text-sm">
                <span className="font-medium">Storage Available:</span>{' '}
                {SafeStorage.isAvailable() ? 'Yes' : 'No'}
              </div>
              <div className="space-x-2">
                <button
                  onClick={() => {
                    const success = SafeStorage.setItem('test-key', 'test-value');
                    alert(`Set item: ${success ? 'Success' : 'Failed'}`);
                  }}
                  className="px-3 py-1 bg-green-100 text-green-800 rounded text-sm hover:bg-green-200"
                >
                  Test Set Item
                </button>
                <button
                  onClick={() => {
                    const value = SafeStorage.getItem('test-key', 'fallback');
                    alert(`Get item: ${value}`);
                  }}
                  className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded text-sm hover:bg-yellow-200"
                >
                  Test Get Item
                </button>
              </div>
            </div>
          </div>

          {/* System Theme Detection Test */}
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              System Theme Detection
            </h2>
            <div className="space-y-2">
              <div className="text-sm">
                <span className="font-medium">Detected System Theme:</span>{' '}
                {SystemThemeDetector.detect()}
              </div>
              <button
                onClick={() => {
                  const cleanup = SystemThemeDetector.createListener((theme) => {
                    alert(`System theme changed to: ${theme}`);
                    cleanup();
                  });
                  alert('System theme listener created. Change your system theme to test.');
                }}
                className="px-3 py-1 bg-purple-100 text-purple-800 rounded text-sm hover:bg-purple-200"
              >
                Test System Theme Listener
              </button>
            </div>
          </div>

          {/* Theme Validation Test */}
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              Theme Validation
            </h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>validateTheme('light'): {validateTheme('light').toString()}</div>
              <div>validateTheme('dark'): {validateTheme('dark').toString()}</div>
              <div>validateTheme('system'): {validateTheme('system').toString()}</div>
              <div>validateTheme('invalid'): {validateTheme('invalid').toString()}</div>
            </div>
          </div>

          {/* Theme Resolution Test */}
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              Theme Resolution
            </h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>resolveTheme('system', 'dark'): {resolveTheme('system', 'dark')}</div>
              <div>resolveTheme('system', 'light'): {resolveTheme('system', 'light')}</div>
              <div>resolveTheme('dark', 'light'): {resolveTheme('dark', 'light')}</div>
              <div>resolveTheme('light', 'dark'): {resolveTheme('light', 'dark')}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Error Debugger */}
      <ThemeErrorDebugger />
    </div>
  );
}

export default ThemeErrorHandlingDemo;