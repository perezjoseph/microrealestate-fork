/**
 * SSR Error Handling System
 * 
 * Comprehensive error handling utilities for SSR/hydration issues
 */

// Core error classes and types
export {
  SSRError,
  SSR_ERROR_TYPES,
  SSR_ERROR_SEVERITY
} from './SSRError.js';

// Error boundary components
export {
  SSRErrorBoundary,
  useSSRErrorHandler,
  withSSRErrorBoundary
} from './SSRErrorBoundary.jsx';

// Error reporting and logging
export {
  reportSSRError,
  createErrorLogger,
  withErrorHandling,
  withAsyncErrorHandling,
  initializeErrorReporting,
  getErrorStats
} from './errorReporting.js';

// Fallback mechanisms
export {
  SSRFallback,
  ThemeFallback,
  FormFieldFallback,
  withGracefulFallback,
  useFallbackState,
  ConditionalFallback,
  FALLBACK_STRATEGIES
} from './fallbackMechanisms.jsx';

// Import functions for use in this file
import { 
  createErrorLogger, 
  initializeErrorReporting 
} from './errorReporting.js';
import { withGracefulFallback } from './fallbackMechanisms.jsx';
import { withSSRErrorBoundary } from './SSRErrorBoundary.jsx';

// Convenience exports for common patterns
export const createSSRErrorHandler = (componentName, context = {}) => {
  const logger = createErrorLogger(componentName, context);
  
  return {
    ...logger,
    wrapComponent: (Component, fallbackStrategy) => 
      withGracefulFallback(Component, fallbackStrategy, { 
        componentName,
        onError: logger.logError
      }),
    wrapWithBoundary: (Component, boundaryProps = {}) =>
      withSSRErrorBoundary(Component, {
        onError: logger.logError,
        ...boundaryProps
      })
  };
};

// Initialize error reporting on import in browser environment
if (typeof window !== 'undefined') {
  initializeErrorReporting();
}