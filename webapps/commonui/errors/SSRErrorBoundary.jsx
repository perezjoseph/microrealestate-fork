import React from 'react';
import { SSRError, SSR_ERROR_SEVERITY } from './SSRError.js';
import { reportSSRError } from './errorReporting.js';

/**
 * Error boundary specifically designed for SSR/hydration issues
 */
export class SSRErrorBoundary extends React.Component {
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
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error, errorInfo) {
    const { onError, maxRetries = 3 } = this.props;
    
    // Enhance error with SSR context if it's not already an SSRError
    const ssrError = error instanceof SSRError 
      ? error 
      : new SSRError(
          error.message || 'Unknown SSR error',
          'COMPONENT_RENDER',
          SSR_ERROR_SEVERITY.HIGH,
          {
            originalError: error.name,
            componentStack: errorInfo.componentStack,
            retryCount: this.state.retryCount
          }
        );

    this.setState({
      error: ssrError,
      errorInfo
    });

    // Report error if it should be reported
    if (ssrError.shouldReport()) {
      reportSSRError(ssrError, errorInfo);
    }

    // Call custom error handler if provided
    if (onError) {
      onError(ssrError, errorInfo);
    }

    // Log error in development
    if (process.env.NODE_ENV === 'development') {
      console.error('SSR Error Boundary caught an error:', ssrError);
      console.error('Error Info:', errorInfo);
    }
  }

  handleRetry = () => {
    const { maxRetries = 3 } = this.props;
    const newRetryCount = this.state.retryCount + 1;

    if (newRetryCount <= maxRetries) {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: newRetryCount
      });
    }
  };

  render() {
    const { 
      children, 
      fallback: FallbackComponent,
      showRetry = true,
      maxRetries = 3
    } = this.props;
    
    const { hasError, error, retryCount } = this.state;

    if (hasError) {
      // Use custom fallback component if provided
      if (FallbackComponent) {
        return (
          <FallbackComponent 
            error={error}
            retry={showRetry && retryCount < maxRetries ? this.handleRetry : null}
            retryCount={retryCount}
          />
        );
      }

      // Default fallback UI
      return (
        <div className="ssr-error-boundary" role="alert">
          <div className="ssr-error-content">
            <h3>Something went wrong</h3>
            <p>
              {process.env.NODE_ENV === 'development' 
                ? error?.message || 'An error occurred during rendering'
                : 'An unexpected error occurred. Please try again.'
              }
            </p>
            {showRetry && retryCount < maxRetries && (
              <button 
                onClick={this.handleRetry}
                className="ssr-error-retry-button"
                type="button"
              >
                Try Again ({maxRetries - retryCount} attempts remaining)
              </button>
            )}
            {process.env.NODE_ENV === 'development' && error && (
              <details className="ssr-error-details">
                <summary>Error Details</summary>
                <pre>{JSON.stringify(error.toJSON?.() || error, null, 2)}</pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return children;
  }
}

/**
 * Hook-based error boundary for functional components
 */
export function useSSRErrorHandler() {
  const [error, setError] = React.useState(null);

  const resetError = React.useCallback(() => {
    setError(null);
  }, []);

  const handleError = React.useCallback((error, errorInfo = {}) => {
    const ssrError = error instanceof SSRError 
      ? error 
      : new SSRError(
          error.message || 'Unknown SSR error',
          'COMPONENT_RENDER',
          SSR_ERROR_SEVERITY.MEDIUM,
          { originalError: error.name, ...errorInfo }
        );

    setError(ssrError);

    // Report error if it should be reported
    if (ssrError.shouldReport()) {
      reportSSRError(ssrError, errorInfo);
    }
  }, []);

  // Effect to handle uncaught errors in useEffect hooks
  React.useEffect(() => {
    const handleUnhandledRejection = (event) => {
      handleError(new Error(event.reason), { type: 'unhandledRejection' });
    };

    const handleError = (event) => {
      handleError(event.error, { type: 'error' });
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('unhandledrejection', handleUnhandledRejection);
      window.addEventListener('error', handleError);

      return () => {
        window.removeEventListener('unhandledrejection', handleUnhandledRejection);
        window.removeEventListener('error', handleError);
      };
    }
  }, [handleError]);

  return {
    error,
    handleError,
    resetError,
    hasError: error !== null
  };
}

/**
 * Higher-order component to wrap components with SSR error boundary
 */
export function withSSRErrorBoundary(Component, errorBoundaryProps = {}) {
  const WrappedComponent = React.forwardRef((props, ref) => (
    <SSRErrorBoundary {...errorBoundaryProps}>
      <Component {...props} ref={ref} />
    </SSRErrorBoundary>
  ));

  WrappedComponent.displayName = `withSSRErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}