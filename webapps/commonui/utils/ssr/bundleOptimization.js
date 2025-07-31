/**
 * Bundle Optimization Utilities for SSR
 * Tree-shakeable utilities to prevent SSR code from bloating client bundles
 */

import React from 'react';

/**
 * Conditional SSR code loader
 * Only includes SSR-specific code when actually running on server
 */
export const conditionalSSRImport = (ssrModule, clientModule = null) => {
  if (typeof window === 'undefined') {
    // Server-side: load SSR module
    return ssrModule;
  } else {
    // Client-side: load client module or return null
    return clientModule;
  }
};

/**
 * Lazy SSR utility loader
 * Dynamically imports SSR utilities only when needed
 */
export const lazySSRUtils = {
  async getEnvironmentDetection() {
    if (typeof window === 'undefined') {
      // TODO: Create environmentDetection.js file
      return null;
    }
    return null;
  },

  async getSSRStorageAdapter() {
    if (typeof window === 'undefined') {
      // TODO: Create SSRStorageAdapter.js file
      return null;
    }
    return null;
  },

  async getSSRErrorUtils() {
    if (typeof window === 'undefined') {
      // TODO: Create SSRErrorUtils.js file
      return null;
    }
    return null;
  },

  async getFormSSRUtils() {
    if (typeof window === 'undefined') {
      const { formSSRUtils } = await import('./formSSRUtils');
      return formSSRUtils;
    }
    return null;
  }
};

/**
 * SSR-only code wrapper
 * Ensures code only runs on server and is tree-shaken on client
 */
export const ssrOnly = (fn) => {
  if (typeof window === 'undefined') {
    return fn();
  }
  return undefined;
};

/**
 * Client-only code wrapper
 * Ensures code only runs on client and is tree-shaken on server
 */
export const clientOnly = (fn) => {
  if (typeof window !== 'undefined') {
    return fn();
  }
  return undefined;
};

/**
 * Conditional code execution based on environment
 */
export const conditional = {
  ssr: ssrOnly,
  client: clientOnly,
  both: (fn) => fn(),
  
  // Environment-specific imports
  async importSSR(modulePath) {
    if (typeof window === 'undefined') {
      return await import(modulePath);
    }
    return null;
  },

  async importClient(modulePath) {
    if (typeof window !== 'undefined') {
      return await import(modulePath);
    }
    return null;
  }
};

/**
 * Bundle size analyzer for SSR utilities
 */
export const bundleAnalyzer = {
  // Track which SSR utilities are being used
  usageTracker: new Set(),

  track(utilityName) {
    if (process.env.NODE_ENV === 'development') {
      this.usageTracker.add(utilityName);
    }
  },

  getUsage() {
    return Array.from(this.usageTracker);
  },

  // Warn about potential bundle bloat
  warnIfClientBundle() {
    if (typeof window !== 'undefined' && this.usageTracker.size > 0) {
      console.warn(
        'SSR utilities detected in client bundle:',
        this.getUsage(),
        'Consider using dynamic imports or conditional loading'
      );
    }
  }
};

/**
 * Optimized SSR component wrapper
 * Prevents SSR-specific props from reaching client components
 */
export const optimizedSSRWrapper = (Component, ssrProps = []) => {
  const WrappedComponent = React.forwardRef((props, ref) => {
    const isSSR = typeof window === 'undefined';
    
    // Filter out SSR-specific props on client
    const filteredProps = isSSR ? props : Object.keys(props).reduce((acc, key) => {
      if (!ssrProps.includes(key)) {
        acc[key] = props[key];
      }
      return acc;
    }, {});

    return <Component ref={ref} {...filteredProps} />;
  });
  
  WrappedComponent.displayName = `OptimizedSSR(${Component.displayName || Component.name || 'Component'})`;
  return WrappedComponent;
};

/**
 * SSR code splitting utilities
 */
export const ssrCodeSplitting = {
  // Create SSR-specific chunks
  createSSRChunk(chunkName, importFn) {
    if (typeof window === 'undefined') {
      return importFn();
    }
    return Promise.resolve(null);
  },

  // Preload SSR chunks during build
  preloadSSRChunks(chunks) {
    if (typeof window === 'undefined') {
      return Promise.all(chunks.map(chunk => chunk()));
    }
    return Promise.resolve([]);
  },

  // Dynamic SSR component loading
  loadSSRComponent(importFn, fallback = null) {
    if (typeof window === 'undefined') {
      return React.lazy(importFn);
    }
    return () => fallback;
  }
};

/**
 * Memory-efficient SSR state management
 */
export const ssrStateManager = {
  // Lightweight state container for SSR
  createSSRState(initialState = {}) {
    if (typeof window === 'undefined') {
      return {
        state: initialState,
        setState: (newState) => {
          Object.assign(this.state, newState);
        },
        getState: () => this.state,
        cleanup: () => {
          this.state = {};
        }
      };
    }
    return null;
  },

  // Efficient state serialization for hydration
  serializeState(state) {
    if (typeof window === 'undefined') {
      try {
        return JSON.stringify(state, (key, value) => {
          // Handle special cases that don't serialize well
          if (value instanceof Date) {
            return { __type: 'Date', value: value.toISOString() };
          }
          if (value instanceof RegExp) {
            return { __type: 'RegExp', value: value.toString() };
          }
          if (typeof value === 'function') {
            return { __type: 'Function', value: value.toString() };
          }
          return value;
        });
      } catch (error) {
        console.warn('SSR state serialization failed:', error);
        return '{}';
      }
    }
    return null;
  },

  // Efficient state deserialization on client
  deserializeState(serializedState) {
    if (typeof window !== 'undefined' && serializedState) {
      try {
        return JSON.parse(serializedState, (key, value) => {
          // Handle special cases
          if (value && typeof value === 'object' && value.__type) {
            switch (value.__type) {
              case 'Date':
                return new Date(value.value);
              case 'RegExp': {
                const match = value.value.match(/^\/(.*)\/([gimuy]*)$/);
                return match ? new RegExp(match[1], match[2]) : new RegExp(value.value);
              }
              case 'Function':
                // Don't deserialize functions for security
                return () => {};
              default:
                return value;
            }
          }
          return value;
        });
      } catch (error) {
        console.warn('SSR state deserialization failed:', error);
        return {};
      }
    }
    return {};
  }
};

/**
 * Progressive hydration utilities
 */
export const progressiveHydration = {
  // Create hydration priority queue
  createPriorityQueue() {
    const queue = [];
    let isProcessing = false;

    return {
      add(component, priority = 0) {
        queue.push({ component, priority });
        queue.sort((a, b) => b.priority - a.priority);
        
        if (!isProcessing) {
          this.process();
        }
      },

      async process() {
        if (typeof window === 'undefined') return;
        
        isProcessing = true;
        
        while (queue.length > 0) {
          const { component } = queue.shift();
          
          // Use requestIdleCallback for non-blocking hydration
          await new Promise(resolve => {
            if ('requestIdleCallback' in window) {
              requestIdleCallback(() => {
                component.hydrate();
                resolve();
              });
            } else {
              setTimeout(() => {
                component.hydrate();
                resolve();
              }, 0);
            }
          });
        }
        
        isProcessing = false;
      }
    };
  },

  // Intersection observer-based hydration
  createIntersectionHydrator(options = {}) {
    if (typeof window === 'undefined') return null;

    const {
      rootMargin = '50px',
      threshold = 0.1
    } = options;

    const observer = new IntersectionObserver((entries) => {
      // Use priority for scheduling hydration (future implementation)
      // const schedulePriority = priority;
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const component = entry.target.__component;
          if (component && !component.isHydrated) {
            component.hydrate();
            observer.unobserve(entry.target);
          }
        }
      });
    }, { rootMargin, threshold });

    return {
      observe(element, component) {
        element.__component = component;
        observer.observe(element);
      },
      
      unobserve(element) {
        observer.unobserve(element);
      },
      
      disconnect() {
        observer.disconnect();
      }
    };
  }
};

/**
 * SSR performance monitoring
 */
export const ssrPerformanceMonitor = {
  metrics: new Map(),

  startTiming(label) {
    if (typeof window === 'undefined') {
      this.metrics.set(label, { start: process.hrtime() });
    }
  },

  endTiming(label) {
    if (typeof window === 'undefined') {
      const metric = this.metrics.get(label);
      if (metric) {
        const [seconds, nanoseconds] = process.hrtime(metric.start);
        const duration = seconds * 1000 + nanoseconds / 1000000;
        metric.duration = duration;
        metric.end = process.hrtime();
      }
    }
  },

  getMetrics() {
    if (typeof window === 'undefined') {
      const results = {};
      this.metrics.forEach((value, key) => {
        results[key] = value.duration || 0;
      });
      return results;
    }
    return {};
  },

  logMetrics() {
    if (typeof window === 'undefined' && process.env.NODE_ENV === 'development') {
      const metrics = this.getMetrics();
      console.log('SSR Performance Metrics:', metrics);
    }
  }
};

/**
 * Shared utilities to prevent code duplication
 */
export const sharedSSRUtils = {
  // Common environment checks
  isSSR: typeof window === 'undefined',
  isClient: typeof window !== 'undefined',
  isDev: process.env.NODE_ENV === 'development',
  isProd: process.env.NODE_ENV === 'production',

  // Common capability detection
  hasCapability(capability) {
    if (typeof window === 'undefined') return false;
    
    switch (capability) {
      case 'localStorage':
        return typeof window.localStorage !== 'undefined';
      case 'sessionStorage':
        return typeof window.sessionStorage !== 'undefined';
      case 'IntersectionObserver':
        return 'IntersectionObserver' in window;
      case 'ResizeObserver':
        return 'ResizeObserver' in window;
      case 'matchMedia':
        return typeof window.matchMedia === 'function';
      default:
        return false;
    }
  },

  // Common error handling
  handleSSRError(error, context = 'SSR') {
    if (typeof window === 'undefined') {
      console.error(`${context} Error:`, error);
    } else {
      console.warn(`${context} Error (client):`, error);
    }
  },

  // Common cleanup utilities
  createCleanupManager() {
    const cleanupFunctions = [];

    return {
      add(cleanupFn) {
        cleanupFunctions.push(cleanupFn);
      },

      cleanup() {
        cleanupFunctions.forEach(fn => {
          try {
            fn();
          } catch (error) {
            this.handleSSRError(error, 'Cleanup');
          }
        });
        cleanupFunctions.length = 0;
      }
    };
  }
};

// Initialize bundle analyzer in development
if (process.env.NODE_ENV === 'development') {
  bundleAnalyzer.track('bundleOptimization');
  
  // Warn about client bundle usage
  if (typeof window !== 'undefined') {
    setTimeout(() => {
      bundleAnalyzer.warnIfClientBundle();
    }, 1000);
  }
}

export default {
  conditionalSSRImport,
  lazySSRUtils,
  ssrOnly,
  clientOnly,
  conditional,
  bundleAnalyzer,
  optimizedSSRWrapper,
  ssrCodeSplitting,
  ssrStateManager,
  progressiveHydration,
  ssrPerformanceMonitor,
  sharedSSRUtils
};
