import React from 'react';
import { SSRError, SSR_ERROR_SEVERITY } from './SSRError.js';

/**
 * Fallback strategies for component failures
 */
export const FALLBACK_STRATEGIES = {
  PLACEHOLDER: 'PLACEHOLDER',
  SKELETON: 'SKELETON',
  HIDDEN: 'HIDDEN',
  ERROR_MESSAGE: 'ERROR_MESSAGE',
  RETRY: 'RETRY'
};

/**
 * Generic fallback component with multiple strategies
 */
export function SSRFallback({ 
  strategy = FALLBACK_STRATEGIES.PLACEHOLDER,
  error,
  retry,
  retryCount = 0,
  maxRetries = 3,
  componentName = 'Component',
  className = '',
  children,
  ...props 
}) {
  const renderFallback = () => {
    switch (strategy) {
      case FALLBACK_STRATEGIES.SKELETON:
        return (
          <div 
            className={`ssr-skeleton ${className}`}
            role="status"
            aria-label={`Loading ${componentName}`}
            {...props}
          >
            <div className="ssr-skeleton-content">
              <div className="ssr-skeleton-line"></div>
              <div className="ssr-skeleton-line short"></div>
              <div className="ssr-skeleton-line"></div>
            </div>
          </div>
        );

      case FALLBACK_STRATEGIES.HIDDEN:
        return (
          <div 
            className={`ssr-hidden ${className}`}
            style={{ display: 'none' }}
            aria-hidden="true"
            {...props}
          />
        );

      case FALLBACK_STRATEGIES.ERROR_MESSAGE:
        return (
          <div 
            className={`ssr-error-message ${className}`}
            role="alert"
            {...props}
          >
            <div className="ssr-error-icon">⚠️</div>
            <div className="ssr-error-text">
              <p>Unable to load {componentName}</p>
              {process.env.NODE_ENV === 'development' && error && (
                <small>{error.message}</small>
              )}
            </div>
            {retry && retryCount < maxRetries && (
              <button 
                onClick={retry}
                className="ssr-error-retry"
                type="button"
              >
                Retry
              </button>
            )}
          </div>
        );

      case FALLBACK_STRATEGIES.RETRY:
        return (
          <div 
            className={`ssr-retry-fallback ${className}`}
            role="status"
            {...props}
          >
            <div className="ssr-retry-content">
              <p>Loading {componentName}...</p>
              {retry && (
                <button 
                  onClick={retry}
                  className="ssr-retry-button"
                  type="button"
                >
                  Retry ({maxRetries - retryCount} attempts remaining)
                </button>
              )}
            </div>
          </div>
        );

      case FALLBACK_STRATEGIES.PLACEHOLDER:
      default:
        return (
          <div 
            className={`ssr-placeholder ${className}`}
            role="status"
            aria-label={`Loading ${componentName}`}
            {...props}
          >
            {children || (
              <div className="ssr-placeholder-content">
                <div className="ssr-placeholder-icon">📦</div>
                <p>Loading {componentName}...</p>
              </div>
            )}
          </div>
        );
    }
  };

  return renderFallback();
}

/**
 * Theme-specific fallback component
 */
export function ThemeFallback({ 
  theme = 'light',
  className = '',
  children,
  ...props 
}) {
  return (
    <div 
      className={`theme-fallback theme-fallback--${theme} ${className}`}
      data-theme={theme}
      role="status"
      aria-label="Loading theme"
      {...props}
    >
      {children || (
        <div className="theme-fallback-content">
          <div className="theme-fallback-icon">🎨</div>
          <p>Loading theme...</p>
        </div>
      )}
    </div>
  );
}

/**
 * Form field fallback component
 */
export function FormFieldFallback({ 
  fieldType = 'input',
  label,
  placeholder,
  className = '',
  ...props 
}) {
  return (
    <div 
      className={`form-field-fallback ${className}`}
      role="status"
      aria-label={`Loading ${fieldType} field`}
      {...props}
    >
      {label && (
        <label className="form-field-fallback-label">
          {label}
        </label>
      )}
      <div className="form-field-fallback-input">
        <div className="form-field-fallback-placeholder">
          {placeholder || `Loading ${fieldType}...`}
        </div>
      </div>
    </div>
  );
}

/**
 * Higher-order component that provides graceful fallback mechanisms
 */
export function withGracefulFallback(
  Component, 
  fallbackStrategy = FALLBACK_STRATEGIES.PLACEHOLDER,
  options = {}
) {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    componentName = Component.displayName || Component.name || 'Component',
    onError,
    onRetry,
    onMaxRetriesReached
  } = options;

  const WrappedComponent = React.forwardRef((props, ref) => {
    const [error, setError] = React.useState(null);
    const [retryCount, setRetryCount] = React.useState(0);
    const [isRetrying, setIsRetrying] = React.useState(false);

    const handleError = React.useCallback((error, errorInfo) => {
      const ssrError = error instanceof SSRError 
        ? error 
        : new SSRError(
            error.message || 'Component render failed',
            'COMPONENT_RENDER',
            SSR_ERROR_SEVERITY.MEDIUM,
            { componentName, ...errorInfo }
          );

      setError(ssrError);

      if (onError) {
        onError(ssrError, errorInfo);
      }
    }, [onError]);

    const handleRetry = React.useCallback(async () => {
      if (retryCount >= maxRetries) {
        if (onMaxRetriesReached) {
          onMaxRetriesReached(error, retryCount);
        }
        return;
      }

      setIsRetrying(true);
      
      if (onRetry) {
        onRetry(retryCount + 1);
      }

      // Add delay before retry
      if (retryDelay > 0) {
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }

      setError(null);
      setRetryCount(prev => prev + 1);
      setIsRetrying(false);
    }, [error, retryCount, maxRetries, retryDelay, onRetry, onMaxRetriesReached]);

    // Reset error and retry count when props change
    React.useEffect(() => {
      setError(null);
      setRetryCount(0);
    }, [props]);

    if (error && !isRetrying) {
      return (
        <SSRFallback
          strategy={fallbackStrategy}
          error={error}
          retry={retryCount < maxRetries ? handleRetry : null}
          retryCount={retryCount}
          maxRetries={maxRetries}
          componentName={componentName}
          {...props}
        />
      );
    }

    if (isRetrying) {
      return (
        <SSRFallback
          strategy={FALLBACK_STRATEGIES.RETRY}
          retry={handleRetry}
          retryCount={retryCount}
          maxRetries={maxRetries}
          componentName={componentName}
          {...props}
        />
      );
    }

    try {
      return <Component {...props} ref={ref} />;
    } catch (error) {
      // Catch synchronous errors
      React.useEffect(() => {
        handleError(error);
      }, [error, handleError]);

      return (
        <SSRFallback
          strategy={fallbackStrategy}
          error={error}
          retry={retryCount < maxRetries ? handleRetry : null}
          retryCount={retryCount}
          maxRetries={maxRetries}
          componentName={componentName}
          {...props}
        />
      );
    }
  });

  WrappedComponent.displayName = `withGracefulFallback(${componentName})`;
  
  return WrappedComponent;
}

/**
 * Hook for managing component fallback state
 */
export function useFallbackState(initialStrategy = FALLBACK_STRATEGIES.PLACEHOLDER) {
  const [fallbackStrategy, setFallbackStrategy] = React.useState(initialStrategy);
  const [error, setError] = React.useState(null);
  const [retryCount, setRetryCount] = React.useState(0);

  const triggerFallback = React.useCallback((error, strategy = fallbackStrategy) => {
    setError(error);
    setFallbackStrategy(strategy);
  }, [fallbackStrategy]);

  const clearFallback = React.useCallback(() => {
    setError(null);
    setRetryCount(0);
  }, []);

  const retry = React.useCallback(() => {
    setRetryCount(prev => prev + 1);
    setError(null);
  }, []);

  return {
    fallbackStrategy,
    error,
    retryCount,
    hasFallback: error !== null,
    triggerFallback,
    clearFallback,
    retry,
    setFallbackStrategy
  };
}

/**
 * Conditional fallback component that renders based on conditions
 */
export function ConditionalFallback({
  condition,
  fallbackStrategy = FALLBACK_STRATEGIES.PLACEHOLDER,
  children,
  ...fallbackProps
}) {
  if (condition) {
    return (
      <SSRFallback 
        strategy={fallbackStrategy}
        {...fallbackProps}
      />
    );
  }

  return children;
}