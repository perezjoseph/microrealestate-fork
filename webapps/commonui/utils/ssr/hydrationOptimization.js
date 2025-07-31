/**
 * Hydration Performance Optimization Utilities
 * Advanced techniques for optimizing the hydration process
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Progressive Hydration Manager
 * Manages the hydration of components based on priority and visibility
 */
export class ProgressiveHydrationManager {
  constructor(options = {}) {
    this.options = {
      maxConcurrentHydrations: 3,
      hydrationTimeout: 5000,
      priorityThreshold: 0.5,
      useIntersectionObserver: true,
      useIdleCallback: true,
      ...options
    };

    this.hydrationQueue = [];
    this.activeHydrations = new Set();
    this.completedHydrations = new Set();
    this.intersectionObserver = null;
    this.isProcessing = false;

    this.initializeIntersectionObserver();
  }

  initializeIntersectionObserver() {
    if (typeof window === 'undefined' || !this.options.useIntersectionObserver) {
      return;
    }

    if ('IntersectionObserver' in window) {
      this.intersectionObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              const componentId = entry.target.dataset.hydrationId;
              if (componentId) {
                this.prioritizeComponent(componentId);
              }
            }
          });
        },
        {
          rootMargin: '100px',
          threshold: 0.1
        }
      );
    }
  }

  registerComponent(componentId, element, hydrationFn, priority = 0) {
    const component = {
      id: componentId,
      element,
      hydrationFn,
      priority,
      isVisible: false,
      isHydrated: false,
      registeredAt: Date.now()
    };

    this.hydrationQueue.push(component);
    this.sortQueue();

    // Observe element for visibility
    if (this.intersectionObserver && element) {
      element.dataset.hydrationId = componentId;
      this.intersectionObserver.observe(element);
    }

    // Start processing if not already running
    if (!this.isProcessing) {
      this.processQueue();
    }

    return component;
  }

  prioritizeComponent(componentId) {
    const component = this.hydrationQueue.find(c => c.id === componentId);
    if (component && !component.isHydrated) {
      component.priority += 10; // Boost priority for visible components
      component.isVisible = true;
      this.sortQueue();
      
      if (!this.isProcessing) {
        this.processQueue();
      }
    }
  }

  sortQueue() {
    this.hydrationQueue.sort((a, b) => {
      // Prioritize visible components
      if (a.isVisible && !b.isVisible) return -1;
      if (!a.isVisible && b.isVisible) return 1;
      
      // Then by priority
      if (a.priority !== b.priority) return b.priority - a.priority;
      
      // Finally by registration time (FIFO)
      return a.registeredAt - b.registeredAt;
    });
  }

  async processQueue() {
    if (this.isProcessing || typeof window === 'undefined') return;
    
    this.isProcessing = true;

    while (this.hydrationQueue.length > 0 && 
           this.activeHydrations.size < this.options.maxConcurrentHydrations) {
      
      const component = this.hydrationQueue.shift();
      if (!component || component.isHydrated) continue;

      this.hydrateComponent(component);
    }

    this.isProcessing = false;

    // Continue processing if there are more components
    if (this.hydrationQueue.length > 0) {
      this.scheduleNextProcessing();
    }
  }

  async hydrateComponent(component) {
    if (component.isHydrated || this.activeHydrations.has(component.id)) {
      return;
    }

    this.activeHydrations.add(component.id);

    try {
      // Use idle callback for non-critical components
      if (this.options.useIdleCallback && 
          component.priority < this.options.priorityThreshold &&
          'requestIdleCallback' in window) {
        
        await new Promise(resolve => {
          requestIdleCallback(async () => {
            await this.executeHydration(component);
            resolve();
          }, { timeout: this.options.hydrationTimeout });
        });
      } else {
        // Immediate hydration for high-priority components
        await this.executeHydration(component);
      }

      component.isHydrated = true;
      this.completedHydrations.add(component.id);

      // Clean up intersection observer
      if (this.intersectionObserver && component.element) {
        this.intersectionObserver.unobserve(component.element);
      }

    } catch (error) {
      console.error(`Hydration failed for component ${component.id}:`, error);
    } finally {
      this.activeHydrations.delete(component.id);
      
      // Continue processing queue
      if (this.hydrationQueue.length > 0) {
        this.processQueue();
      }
    }
  }

  async executeHydration(component) {
    const startTime = performance.now();
    
    try {
      await component.hydrationFn();
      
      const duration = performance.now() - startTime;
      if (process.env.NODE_ENV === 'development') {
        console.log(`Component ${component.id} hydrated in ${duration.toFixed(2)}ms`);
      }
    } catch (error) {
      throw new Error(`Hydration execution failed: ${error.message}`);
    }
  }

  scheduleNextProcessing() {
    if (this.options.useIdleCallback && 'requestIdleCallback' in window) {
      requestIdleCallback(() => this.processQueue());
    } else {
      setTimeout(() => this.processQueue(), 16); // ~60fps
    }
  }

  getStats() {
    return {
      queued: this.hydrationQueue.length,
      active: this.activeHydrations.size,
      completed: this.completedHydrations.size,
      total: this.hydrationQueue.length + this.activeHydrations.size + this.completedHydrations.size
    };
  }

  destroy() {
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
    }
    
    this.hydrationQueue = [];
    this.activeHydrations.clear();
    this.completedHydrations.clear();
    this.isProcessing = false;
  }
}

/**
 * Hydration-optimized component wrapper
 */
export const HydrationOptimized = ({
  children,
  priority = 0,
  fallback = null,
  onHydrated,
  onError,
  timeout = 5000,
  strategy = 'progressive',
  ...props
}) => {
  const [isHydrated, setIsHydrated] = useState(false);
  const [error, setError] = useState(null);
  const elementRef = useRef(null);
  const componentIdRef = useRef(`hydration-${Math.random().toString(36).substr(2, 9)}`);
  const managerRef = useRef(null);

  // Initialize hydration manager
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (!managerRef.current) {
      managerRef.current = new ProgressiveHydrationManager({
        strategy,
        timeout
      });
    }

    const hydrationFn = async () => {
      try {
        // Simulate component hydration
        await new Promise(resolve => setTimeout(resolve, 0));
        setIsHydrated(true);
        onHydrated?.();
      } catch (err) {
        setError(err);
        onError?.(err);
      }
    };

    managerRef.current.registerComponent(
      componentIdRef.current,
      elementRef.current,
      hydrationFn,
      priority
    );

    return () => {
      if (managerRef.current) {
        managerRef.current.destroy();
      }
    };
  }, [priority, strategy, timeout, onHydrated, onError]);

  // SSR fallback
  if (typeof window === 'undefined') {
    return (
      <div ref={elementRef} {...props}>
        {fallback || children}
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div ref={elementRef} {...props}>
        {fallback || <div>Hydration failed</div>}
      </div>
    );
  }

  // Hydrated state
  if (isHydrated) {
    return (
      <div ref={elementRef} {...props}>
        {children}
      </div>
    );
  }

  // Loading state
  return (
    <div ref={elementRef} {...props}>
      {fallback || <div>Hydrating...</div>}
    </div>
  );
};

/**
 * Selective hydration hook
 * Only hydrates components when they become visible or interactive
 */
export const useSelectiveHydration = (options = {}) => {
  const {
    threshold = 0.1,
    rootMargin = '50px',
    triggerOnInteraction = true,
    priority = 0
  } = options;

  const [shouldHydrate, setShouldHydrate] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const elementRef = useRef(null);
  const observerRef = useRef(null);

  useEffect(() => {
    if (typeof window === 'undefined' || shouldHydrate) return;

    const element = elementRef.current;
    if (!element) return;

    // Intersection Observer for visibility-based hydration
    if ('IntersectionObserver' in window) {
      observerRef.current = new IntersectionObserver(
        (entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              setShouldHydrate(true);
              observerRef.current?.disconnect();
            }
          });
        },
        { threshold, rootMargin }
      );

      observerRef.current.observe(element);
    } else {
      // Fallback: hydrate immediately if IntersectionObserver is not available
      setShouldHydrate(true);
    }

    // Interaction-based hydration
    if (triggerOnInteraction) {
      const handleInteraction = () => {
        setShouldHydrate(true);
        cleanup();
      };

      const events = ['mouseenter', 'touchstart', 'focus'];
      events.forEach(event => {
        element.addEventListener(event, handleInteraction, { once: true, passive: true });
      });

      const cleanup = () => {
        events.forEach(event => {
          element.removeEventListener(event, handleInteraction);
        });
      };

      return cleanup;
    }

    return () => {
      observerRef.current?.disconnect();
    };
  }, [threshold, rootMargin, triggerOnInteraction, shouldHydrate]);

  // Hydration effect
  useEffect(() => {
    if (shouldHydrate && !isHydrated) {
      // Use requestIdleCallback for low-priority hydration
      if (priority < 0.5 && 'requestIdleCallback' in window) {
        requestIdleCallback(() => {
          setIsHydrated(true);
        });
      } else {
        setIsHydrated(true);
      }
    }
  }, [shouldHydrate, isHydrated, priority]);

  return {
    elementRef,
    shouldHydrate,
    isHydrated,
    triggerHydration: () => setShouldHydrate(true)
  };
};

/**
 * Hydration performance monitor
 */
export const useHydrationPerformance = (componentName) => {
  const metricsRef = useRef({
    startTime: null,
    endTime: null,
    duration: null,
    memoryBefore: null,
    memoryAfter: null
  });

  const startMeasurement = useCallback(() => {
    if (typeof window === 'undefined') return;

    metricsRef.current.startTime = performance.now();
    
    // Memory measurement (if available)
    if (performance.memory) {
      metricsRef.current.memoryBefore = performance.memory.usedJSHeapSize;
    }
  }, []);

  const endMeasurement = useCallback(() => {
    if (typeof window === 'undefined' || !metricsRef.current.startTime) return;

    metricsRef.current.endTime = performance.now();
    metricsRef.current.duration = metricsRef.current.endTime - metricsRef.current.startTime;

    // Memory measurement (if available)
    if (performance.memory) {
      metricsRef.current.memoryAfter = performance.memory.usedJSHeapSize;
    }

    // Log metrics in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`Hydration metrics for ${componentName}:`, {
        duration: `${metricsRef.current.duration.toFixed(2)}ms`,
        memoryDelta: metricsRef.current.memoryAfter && metricsRef.current.memoryBefore
          ? `${((metricsRef.current.memoryAfter - metricsRef.current.memoryBefore) / 1024).toFixed(2)}KB`
          : 'N/A'
      });
    }
  }, [componentName]);

  const getMetrics = useCallback(() => {
    return { ...metricsRef.current };
  }, []);

  return {
    startMeasurement,
    endMeasurement,
    getMetrics
  };
};

/**
 * Efficient re-rendering strategies during hydration
 */
export const useHydrationRerender = (dependencies = []) => {
  const [hydrationPhase, setHydrationPhase] = useState('ssr');
  const [renderCount, setRenderCount] = useState(0);
  const isHydratingRef = useRef(false);
  const dependenciesRef = useRef(dependencies);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Detect hydration start
    if (!isHydratingRef.current) {
      isHydratingRef.current = true;
      setHydrationPhase('hydrating');
    }

    // Detect hydration completion
    const timer = setTimeout(() => {
      if (isHydratingRef.current) {
        isHydratingRef.current = false;
        setHydrationPhase('hydrated');
      }
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  // Track dependency changes during hydration
  useEffect(() => {
    const hasChanged = dependencies.some((dep, index) => 
      dep !== dependenciesRef.current[index]
    );

    if (hasChanged && hydrationPhase === 'hydrating') {
      setRenderCount(prev => prev + 1);
      dependenciesRef.current = dependencies;
    }
  }, dependencies);

  // Optimize renders during hydration
  const shouldRender = useCallback((phase = 'all') => {
    switch (phase) {
      case 'ssr':
        return hydrationPhase === 'ssr';
      case 'hydrating':
        return hydrationPhase === 'hydrating';
      case 'hydrated':
        return hydrationPhase === 'hydrated';
      case 'client':
        return hydrationPhase !== 'ssr';
      default:
        return true;
    }
  }, [hydrationPhase]);

  return {
    hydrationPhase,
    renderCount,
    isHydrating: isHydratingRef.current,
    shouldRender
  };
};

/**
 * Memory-efficient state management for SSR
 */
export const useSSRState = (initialState, options = {}) => {
  const {
    persistKey,
    serializeState = JSON.stringify,
    deserializeState = JSON.parse,
    cleanupOnUnmount = true
  } = options;

  const [state, setState] = useState(() => {
    // SSR: use initial state
    if (typeof window === 'undefined') {
      return initialState;
    }

    // Client: try to restore from persistence
    if (persistKey) {
      try {
        const persisted = sessionStorage.getItem(persistKey);
        if (persisted) {
          return deserializeState(persisted);
        }
      } catch (error) {
        console.warn('Failed to restore SSR state:', error);
      }
    }

    return initialState;
  });

  // Persist state changes
  useEffect(() => {
    if (typeof window !== 'undefined' && persistKey) {
      try {
        sessionStorage.setItem(persistKey, serializeState(state));
      } catch (error) {
        console.warn('Failed to persist SSR state:', error);
      }
    }
  }, [state, persistKey, serializeState]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (cleanupOnUnmount && typeof window !== 'undefined' && persistKey) {
        try {
          sessionStorage.removeItem(persistKey);
        } catch (error) {
          console.warn('Failed to cleanup SSR state:', error);
        }
      }
    };
  }, [persistKey, cleanupOnUnmount]);

  return [state, setState];
};

// Global hydration manager instance
let globalHydrationManager = null;

export const getGlobalHydrationManager = () => {
  if (typeof window !== 'undefined' && !globalHydrationManager) {
    globalHydrationManager = new ProgressiveHydrationManager();
  }
  return globalHydrationManager;
};

export default {
  ProgressiveHydrationManager,
  HydrationOptimized,
  useSelectiveHydration,
  useHydrationPerformance,
  useHydrationRerender,
  useSSRState,
  getGlobalHydrationManager
};
