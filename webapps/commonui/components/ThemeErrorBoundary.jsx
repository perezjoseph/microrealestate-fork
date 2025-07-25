'use client';

import { Component } from 'react';

/**
 * Error boundary specifically for theme-related failures
 * Provides graceful fallbacks and error recovery for theme system
 * 
 * This component catches JavaScript errors anywhere in the theme component tree,
 * logs those errors, and displays a fallback UI instead of crashing the entire app.
 */
class ThemeErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log theme-related errors in development mode
    if (process.env.NODE_ENV === 'development') {
      console.group('🎨 Theme Error Boundary');
      console.error('Theme-related error caught:', error);
      console.error('Error info:', errorInfo);
      console.error('Component stack:', errorInfo.componentStack);
      console.groupEnd();
    }

    // Store error details for potential recovery
    this.setState({
      error,
      errorInfo,
      hasError: true
    });

    // Log to external error reporting service in production
    if (process.env.NODE_ENV === 'production' && this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleRetry = () => {
    const { retryCount } = this.state;
    const maxRetries = this.props.maxRetries || 3;

    if (retryCount < maxRetries) {
      // Reset error state and increment retry count
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: retryCount + 1
      });

      // Apply fallback theme to ensure UI remains functional
      this.applyFallbackTheme();

      if (process.env.NODE_ENV === 'development') {
        console.log(`🎨 Theme Error Boundary: Retry attempt ${retryCount + 1}/${maxRetries}`);
      }
    }
  };

  applyFallbackTheme = () => {
    try {
      // Apply light theme as fallback
      const root = document.documentElement;
      root.classList.remove('dark');
      root.classList.add('light');

      // Update meta theme-color for mobile browsers
      const metaThemeColor = document.querySelector('meta[name="theme-color"]');
      if (metaThemeColor) {
        metaThemeColor.setAttribute('content', '#ffffff');
      }

      // Clear any corrupted theme data from localStorage
      try {
        localStorage.removeItem('mre-theme-preference');
        localStorage.removeItem('mre-landlord-theme');
        localStorage.removeItem('mre-tenant-theme');
      } catch (storageError) {
        // Ignore localStorage errors during cleanup
        if (process.env.NODE_ENV === 'development') {
          console.warn('Failed to clear theme storage during error recovery:', storageError);
        }
      }
    } catch (fallbackError) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to apply fallback theme:', fallbackError);
      }
    }
  };

  componentDidMount() {
    // Apply fallback theme immediately if there's an error on mount
    if (this.state.hasError) {
      this.applyFallbackTheme();
    }
  }

  render() {
    const { hasError, error, retryCount } = this.state;
    const { children, fallbackComponent: FallbackComponent, maxRetries = 3 } = this.props;

    if (hasError) {
      // Custom fallback component provided
      if (FallbackComponent) {
        return (
          <FallbackComponent
            error={error}
            retry={this.handleRetry}
            canRetry={retryCount < maxRetries}
            retryCount={retryCount}
          />
        );
      }

      // Default fallback UI
      return (
        <div className="theme-error-fallback p-4 border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950 rounded-md">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <svg
                className="w-5 h-5 text-red-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                Theme System Error
              </h3>
              <p className="mt-1 text-sm text-red-700 dark:text-red-300">
                There was a problem with the theme system. The application has been reset to light mode.
              </p>
              {process.env.NODE_ENV === 'development' && error && (
                <details className="mt-2">
                  <summary className="text-xs text-red-600 dark:text-red-400 cursor-pointer">
                    Error Details (Development)
                  </summary>
                  <pre className="mt-1 text-xs text-red-600 dark:text-red-400 whitespace-pre-wrap">
                    {error.toString()}
                  </pre>
                </details>
              )}
              {retryCount < maxRetries && (
                <div className="mt-3">
                  <button
                    onClick={this.handleRetry}
                    className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-red-700 bg-red-100 hover:bg-red-200 dark:text-red-200 dark:bg-red-900 dark:hover:bg-red-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                  >
                    Try Again ({maxRetries - retryCount} attempts left)
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    return children;
  }
}

/**
 * Higher-order component to wrap components with theme error boundary
 * 
 * @param {React.Component} WrappedComponent - Component to wrap with error boundary
 * @param {Object} options - Configuration options
 * @returns {React.Component} Component wrapped with theme error boundary
 */
export function withThemeErrorBoundary(WrappedComponent, options = {}) {
  const WithThemeErrorBoundary = (props) => (
    <ThemeErrorBoundary {...options}>
      <WrappedComponent {...props} />
    </ThemeErrorBoundary>
  );

  WithThemeErrorBoundary.displayName = `withThemeErrorBoundary(${WrappedComponent.displayName || WrappedComponent.name})`;

  return WithThemeErrorBoundary;
}

export default ThemeErrorBoundary;