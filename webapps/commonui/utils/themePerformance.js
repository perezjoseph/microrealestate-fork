/**
 * Theme Performance Monitoring Utility
 * Tracks theme switching performance and bundle size impact
 */

// Performance metrics storage
let performanceMetrics = {
  themeChanges: [],
  bundleSize: null,
  renderTimes: [],
  memoryUsage: []
};

// Performance thresholds (in milliseconds)
const PERFORMANCE_THRESHOLDS = {
  THEME_SWITCH_MAX: 100, // Theme switch should complete within 100ms
  RENDER_TIME_MAX: 16,   // Component render should be under 16ms (60fps)
  MEMORY_LEAK_THRESHOLD: 50 // Max 50 theme changes before checking for leaks
};

/**
 * Measure theme switching performance
 */
export class ThemePerformanceMonitor {
  static startThemeChange(themeFrom, themeTo) {
    const startTime = performance.now();
    const memoryBefore = this.getMemoryUsage();
    
    return {
      startTime,
      memoryBefore,
      themeFrom,
      themeTo,
      
      // Call this when theme change is complete
      complete: () => {
        const endTime = performance.now();
        const duration = endTime - startTime;
        const memoryAfter = this.getMemoryUsage();
        
        const metrics = {
          duration,
          themeFrom,
          themeTo,
          timestamp: Date.now(),
          memoryBefore,
          memoryAfter,
          memoryDelta: memoryAfter - memoryBefore
        };
        
        performanceMetrics.themeChanges.push(metrics);
        
        // Keep only last 100 measurements to prevent memory leaks
        if (performanceMetrics.themeChanges.length > 100) {
          performanceMetrics.themeChanges = performanceMetrics.themeChanges.slice(-100);
        }
        
        // Log performance warnings
        if (duration > PERFORMANCE_THRESHOLDS.THEME_SWITCH_MAX) {
          console.warn(`Theme switch took ${duration.toFixed(2)}ms (threshold: ${PERFORMANCE_THRESHOLDS.THEME_SWITCH_MAX}ms)`);
        }
        
        // Check for memory leaks
        if (performanceMetrics.themeChanges.length % PERFORMANCE_THRESHOLDS.MEMORY_LEAK_THRESHOLD === 0) {
          this.checkMemoryLeaks();
        }
        
        return metrics;
      }
    };
  }
  
  /**
   * Measure component render performance
   */
  static measureRender(componentName, renderFn) {
    const startTime = performance.now();
    const result = renderFn();
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    performanceMetrics.renderTimes.push({
      componentName,
      duration,
      timestamp: Date.now()
    });
    
    // Keep only last 50 measurements
    if (performanceMetrics.renderTimes.length > 50) {
      performanceMetrics.renderTimes = performanceMetrics.renderTimes.slice(-50);
    }
    
    if (duration > PERFORMANCE_THRESHOLDS.RENDER_TIME_MAX) {
      console.warn(`${componentName} render took ${duration.toFixed(2)}ms (threshold: ${PERFORMANCE_THRESHOLDS.RENDER_TIME_MAX}ms)`);
    }
    
    return result;
  }
  
  /**
   * Get current memory usage (if available)
   */
  static getMemoryUsage() {
    if (typeof window !== 'undefined' && window.performance && window.performance.memory) {
      return window.performance.memory.usedJSHeapSize;
    }
    return 0;
  }
  
  /**
   * Check for potential memory leaks
   */
  static checkMemoryLeaks() {
    const recentChanges = performanceMetrics.themeChanges.slice(-PERFORMANCE_THRESHOLDS.MEMORY_LEAK_THRESHOLD);
    const memoryGrowth = recentChanges.reduce((total, change) => total + change.memoryDelta, 0);
    
    if (memoryGrowth > 1024 * 1024) { // 1MB growth
      console.warn(`Potential memory leak detected: ${(memoryGrowth / 1024 / 1024).toFixed(2)}MB growth over ${PERFORMANCE_THRESHOLDS.MEMORY_LEAK_THRESHOLD} theme changes`);
    }
  }
  
  /**
   * Get performance statistics
   */
  static getStats() {
    const themeChanges = performanceMetrics.themeChanges;
    const renderTimes = performanceMetrics.renderTimes;
    
    if (themeChanges.length === 0) {
      return {
        themeChanges: { count: 0 },
        renderTimes: { count: 0 }
      };
    }
    
    // Calculate theme change statistics
    const themeDurations = themeChanges.map(c => c.duration);
    const themeStats = {
      count: themeChanges.length,
      averageDuration: themeDurations.reduce((a, b) => a + b, 0) / themeDurations.length,
      minDuration: Math.min(...themeDurations),
      maxDuration: Math.max(...themeDurations),
      slowChanges: themeChanges.filter(c => c.duration > PERFORMANCE_THRESHOLDS.THEME_SWITCH_MAX).length
    };
    
    // Calculate render time statistics
    const renderDurations = renderTimes.map(r => r.duration);
    const renderStats = renderDurations.length > 0 ? {
      count: renderTimes.length,
      averageDuration: renderDurations.reduce((a, b) => a + b, 0) / renderDurations.length,
      minDuration: Math.min(...renderDurations),
      maxDuration: Math.max(...renderDurations),
      slowRenders: renderTimes.filter(r => r.duration > PERFORMANCE_THRESHOLDS.RENDER_TIME_MAX).length
    } : { count: 0 };
    
    return {
      themeChanges: themeStats,
      renderTimes: renderStats,
      memoryUsage: this.getMemoryUsage()
    };
  }
  
  /**
   * Reset performance metrics
   */
  static reset() {
    performanceMetrics = {
      themeChanges: [],
      bundleSize: null,
      renderTimes: [],
      memoryUsage: []
    };
  }
  
  /**
   * Log performance report to console
   */
  static logReport() {
    const stats = this.getStats();
    
    console.group('🎨 Theme Performance Report');
    
    if (stats.themeChanges.count > 0) {
      console.log('Theme Changes:', {
        'Total Changes': stats.themeChanges.count,
        'Average Duration': `${stats.themeChanges.averageDuration.toFixed(2)}ms`,
        'Min Duration': `${stats.themeChanges.minDuration.toFixed(2)}ms`,
        'Max Duration': `${stats.themeChanges.maxDuration.toFixed(2)}ms`,
        'Slow Changes': stats.themeChanges.slowChanges
      });
    }
    
    if (stats.renderTimes.count > 0) {
      console.log('Render Performance:', {
        'Total Renders': stats.renderTimes.count,
        'Average Duration': `${stats.renderTimes.averageDuration.toFixed(2)}ms`,
        'Min Duration': `${stats.renderTimes.minDuration.toFixed(2)}ms`,
        'Max Duration': `${stats.renderTimes.maxDuration.toFixed(2)}ms`,
        'Slow Renders': stats.renderTimes.slowRenders
      });
    }
    
    if (stats.memoryUsage > 0) {
      console.log('Memory Usage:', `${(stats.memoryUsage / 1024 / 1024).toFixed(2)}MB`);
    }
    
    console.groupEnd();
  }
}

/**
 * Bundle size analyzer for theme-related code
 */
export class ThemeBundleAnalyzer {
  static analyzeBundle() {
    if (typeof window === 'undefined') return null;
    
    // Estimate bundle size impact of theme system
    const themeModules = [
      'ThemeToggle',
      'ThemeProvider', 
      'useTheme',
      'themeErrorHandling',
      'themePerformance'
    ];
    
    // This is an approximation - in a real implementation,
    // you would integrate with your bundler's analysis tools
    const estimatedSizes = {
      'ThemeToggle': 8.5, // KB
      'ThemeProvider': 6.2,
      'useTheme': 4.8,
      'themeErrorHandling': 12.3,
      'themePerformance': 3.1,
      'icons': 2.4
    };
    
    const totalSize = Object.values(estimatedSizes).reduce((a, b) => a + b, 0);
    
    return {
      modules: estimatedSizes,
      totalSize: `${totalSize.toFixed(1)}KB`,
      gzippedSize: `${(totalSize * 0.3).toFixed(1)}KB` // Rough gzip estimate
    };
  }
  
  static logBundleReport() {
    const analysis = this.analyzeBundle();
    
    if (!analysis) {
      console.log('Bundle analysis not available in server environment');
      return;
    }
    
    console.group('📦 Theme Bundle Analysis');
    console.log('Module Sizes:', analysis.modules);
    console.log('Total Size:', analysis.totalSize);
    console.log('Gzipped Size (estimated):', analysis.gzippedSize);
    console.groupEnd();
  }
}

/**
 * Performance testing utilities
 */
export class ThemePerformanceTester {
  static async runPerformanceTest(iterations = 10) {
    console.log(`🧪 Running theme performance test (${iterations} iterations)...`);
    
    const results = [];
    
    for (let i = 0; i < iterations; i++) {
      const themes = ['light', 'dark', 'system'];
      const randomTheme = themes[Math.floor(Math.random() * themes.length)];
      
      const measurement = ThemePerformanceMonitor.startThemeChange('system', randomTheme);
      
      // Simulate theme change
      await new Promise(resolve => {
        requestAnimationFrame(() => {
          // Simulate DOM updates
          document.documentElement.className = randomTheme === 'dark' ? 'dark' : '';
          resolve();
        });
      });
      
      const result = measurement.complete();
      results.push(result);
      
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    
    const avgDuration = results.reduce((sum, r) => sum + r.duration, 0) / results.length;
    const maxDuration = Math.max(...results.map(r => r.duration));
    const minDuration = Math.min(...results.map(r => r.duration));
    
    console.log('Performance Test Results:', {
      iterations,
      averageDuration: `${avgDuration.toFixed(2)}ms`,
      minDuration: `${minDuration.toFixed(2)}ms`,
      maxDuration: `${maxDuration.toFixed(2)}ms`,
      passedThreshold: maxDuration <= PERFORMANCE_THRESHOLDS.THEME_SWITCH_MAX
    });
    
    return {
      iterations,
      averageDuration: avgDuration,
      minDuration,
      maxDuration,
      passedThreshold: maxDuration <= PERFORMANCE_THRESHOLDS.THEME_SWITCH_MAX,
      results
    };
  }
}

// Development helper to expose performance tools globally
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  window.__THEME_PERFORMANCE__ = {
    monitor: ThemePerformanceMonitor,
    analyzer: ThemeBundleAnalyzer,
    tester: ThemePerformanceTester
  };
}

export default ThemePerformanceMonitor;