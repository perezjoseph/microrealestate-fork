'use client';

import { useState, useEffect } from 'react';
import { ThemeErrorLogger } from '../utils/themeErrorHandling';

/**
 * Development-only component for debugging theme errors
 * Shows recent theme errors and provides debugging tools
 * Only renders in development mode
 */
export function ThemeErrorDebugger({ className = '' }) {
  const [errors, setErrors] = useState([]);
  const [isVisible, setIsVisible] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || process.env.NODE_ENV !== 'development') return;

    // Load initial errors
    const loadErrors = () => {
      const recentErrors = ThemeErrorLogger.getRecentErrors();
      setErrors(recentErrors);
    };

    loadErrors();

    // Set up periodic refresh to catch new errors
    const interval = setInterval(loadErrors, 2000);

    return () => clearInterval(interval);
  }, [mounted]);

  // Don't render in production or during SSR
  if (!mounted || process.env.NODE_ENV !== 'development') {
    return null;
  }

  const handleClearErrors = () => {
    ThemeErrorLogger.clearErrors();
    setErrors([]);
  };

  const handleToggleVisibility = () => {
    setIsVisible(!isVisible);
  };

  const getErrorSeverityColor = (severity) => {
    switch (severity) {
      case 'critical':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'high':
        return 'text-red-500 bg-red-50 border-red-200';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  return (
    <div className={`fixed bottom-4 right-4 z-50 ${className}`}>
      {/* Toggle Button */}
      <button
        onClick={handleToggleVisibility}
        className={`mb-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
          errors.length > 0
            ? 'bg-red-100 text-red-800 hover:bg-red-200 border border-red-300'
            : 'bg-gray-100 text-gray-800 hover:bg-gray-200 border border-gray-300'
        }`}
        title={`Theme Debugger (${errors.length} errors)`}
      >
        🎨 {errors.length > 0 && <span className="ml-1 font-bold">({errors.length})</span>}
      </button>

      {/* Error Panel */}
      {isVisible && (
        <div className="w-96 max-h-96 bg-white border border-gray-300 rounded-lg shadow-lg overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">Theme Error Debugger</h3>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleClearErrors}
                className="text-xs px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded text-gray-700"
                disabled={errors.length === 0}
              >
                Clear
              </button>
              <button
                onClick={handleToggleVisibility}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Error List */}
          <div className="max-h-80 overflow-y-auto">
            {errors.length === 0 ? (
              <div className="p-4 text-center text-gray-500 text-sm">
                No theme errors recorded
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {errors.map((errorData, index) => (
                  <div key={index} className="p-3">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className={`inline-block px-2 py-1 rounded text-xs font-medium border ${getErrorSeverityColor(errorData.error.severity)}`}>
                          {errorData.error.severity?.toUpperCase() || 'UNKNOWN'}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {formatTimestamp(errorData.timestamp)}
                        </div>
                      </div>
                      <div className="text-xs text-gray-400">
                        {errorData.error.type}
                      </div>
                    </div>
                    
                    <div className="text-sm text-gray-900 mb-2">
                      {errorData.error.message}
                    </div>

                    {errorData.context && Object.keys(errorData.context).length > 0 && (
                      <details className="text-xs">
                        <summary className="cursor-pointer text-gray-600 hover:text-gray-800">
                          Context
                        </summary>
                        <pre className="mt-1 p-2 bg-gray-100 rounded text-xs overflow-x-auto">
                          {JSON.stringify(errorData.context, null, 2)}
                        </pre>
                      </details>
                    )}

                    {errorData.error.originalError && (
                      <details className="text-xs mt-2">
                        <summary className="cursor-pointer text-gray-600 hover:text-gray-800">
                          Original Error
                        </summary>
                        <pre className="mt-1 p-2 bg-red-50 rounded text-xs overflow-x-auto">
                          {errorData.error.originalError.stack || errorData.error.originalError.message}
                        </pre>
                      </details>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 text-xs text-gray-500">
            Development mode only • Auto-refreshes every 2s
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Hook to access theme error debugging information
 * Only works in development mode
 */
export function useThemeErrorDebugger() {
  const [errors, setErrors] = useState([]);

  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;

    const loadErrors = () => {
      const recentErrors = ThemeErrorLogger.getRecentErrors();
      setErrors(recentErrors);
    };

    loadErrors();
    const interval = setInterval(loadErrors, 1000);

    return () => clearInterval(interval);
  }, []);

  const clearErrors = () => {
    ThemeErrorLogger.clearErrors();
    setErrors([]);
  };

  return {
    errors,
    clearErrors,
    hasErrors: errors.length > 0,
    errorCount: errors.length
  };
}

export default ThemeErrorDebugger;