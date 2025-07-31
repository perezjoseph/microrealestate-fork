/**
 * SSR Migration Utilities
 * Tools to help migrate existing components to SSR compatibility
 */

import React from 'react';
import { renderToString } from 'react-dom/server';

/**
 * SSR Compatibility Checker
 * Analyzes components for potential SSR issues
 */
export class SSRCompatibilityChecker {
  constructor(options = {}) {
    this.options = {
      checkBrowserAPIs: true,
      checkRandomValues: true,
      checkDateObjects: true,
      checkEventHandlers: true,
      checkRefs: true,
      checkEffects: true,
      verbose: false,
      ...options
    };
    
    this.issues = [];
    this.warnings = [];
    this.suggestions = [];
  }

  /**
   * Check a component for SSR compatibility issues
   */
  checkComponent(Component, props = {}) {
    this.issues = [];
    this.warnings = [];
    this.suggestions = [];

    try {
      // Test server-side rendering
      this.testServerRendering(Component, props);
      
      // Analyze component code (if available)
      if (Component.toString) {
        this.analyzeComponentCode(Component.toString());
      }

      // Check for common patterns
      this.checkCommonPatterns(Component, props);

    } catch (error) {
      this.issues.push({
        type: 'render_error',
        severity: 'high',
        message: `Component failed to render on server: ${error.message}`,
        suggestion: 'Wrap component with SSRErrorBoundary or fix server-side rendering issues'
      });
    }

    return this.generateReport();
  }

  testServerRendering(Component, props) {
    // Mock server environment
    const originalWindow = global.window;
    const originalDocument = global.document;
    const originalNavigator = global.navigator;

    try {
      // Remove browser globals
      delete global.window;
      delete global.document;
      delete global.navigator;

      // Try to render
      const html = renderToString(<Component {...props} />);
      
      if (!html || html.trim() === '') {
        this.warnings.push({
          type: 'empty_render',
          severity: 'medium',
          message: 'Component renders empty content on server',
          suggestion: 'Ensure component has meaningful server-side output'
        });
      }

    } finally {
      // Restore globals
      global.window = originalWindow;
      global.document = originalDocument;
      global.navigator = originalNavigator;
    }
  }

  analyzeComponentCode(componentCode) {
    const patterns = [
      {
        regex: /window\./g,
        type: 'browser_api',
        severity: 'high',
        message: 'Direct window object access detected',
        suggestion: 'Use environment detection or SSR-safe alternatives'
      },
      {
        regex: /document\./g,
        type: 'browser_api',
        severity: 'high',
        message: 'Direct document object access detected',
        suggestion: 'Use environment detection or SSR-safe alternatives'
      },
      {
        regex: /localStorage/g,
        type: 'browser_api',
        severity: 'high',
        message: 'localStorage usage detected',
        suggestion: 'Use SSRStorageAdapter or environment detection'
      },
      {
        regex: /sessionStorage/g,
        type: 'browser_api',
        severity: 'high',
        message: 'sessionStorage usage detected',
        suggestion: 'Use SSRStorageAdapter or environment detection'
      },
      {
        regex: /Math\.random\(\)/g,
        type: 'random_value',
        severity: 'medium',
        message: 'Math.random() usage detected',
        suggestion: 'Use consistent initial values or defer random generation to client'
      },
      {
        regex: /new Date\(\)/g,
        type: 'date_object',
        severity: 'medium',
        message: 'new Date() without arguments detected',
        suggestion: 'Use consistent date values or defer to client-side'
      },
      {
        regex: /addEventListener/g,
        type: 'event_handler',
        severity: 'low',
        message: 'addEventListener usage detected',
        suggestion: 'Ensure event listeners are only added on client-side'
      },
      {
        regex: /useRef\(/g,
        type: 'ref_usage',
        severity: 'low',
        message: 'useRef usage detected',
        suggestion: 'Ensure refs are handled safely during SSR'
      },
      {
        regex: /useEffect\(/g,
        type: 'effect_usage',
        severity: 'low',
        message: 'useEffect usage detected',
        suggestion: 'Ensure effects don\'t cause hydration mismatches'
      }
    ];

    patterns.forEach(pattern => {
      const matches = componentCode.match(pattern.regex);
      if (matches) {
        this.issues.push({
          type: pattern.type,
          severity: pattern.severity,
          message: `${pattern.message} (${matches.length} occurrence${matches.length > 1 ? 's' : ''})`,
          suggestion: pattern.suggestion,
          occurrences: matches.length
        });
      }
    });
  }

  checkCommonPatterns(Component) {
    // Check for common SSR anti-patterns
    const componentString = Component.toString();
    
    // Use props for future analysis (currently unused)
    // const hasProps = props && Object.keys(props).length > 0;

    // Check for conditional rendering based on browser APIs
    if (componentString.includes('typeof window') && 
        !componentString.includes('useSSRContext')) {
      this.suggestions.push({
        type: 'improvement',
        severity: 'low',
        message: 'Manual window detection found',
        suggestion: 'Consider using useSSRContext hook for better environment detection'
      });
    }

    // Check for theme-related code without SSR theme provider
    if ((componentString.includes('theme') || componentString.includes('dark') || componentString.includes('light')) &&
        !componentString.includes('SSRTheme')) {
      this.suggestions.push({
        type: 'improvement',
        severity: 'medium',
        message: 'Theme-related code detected',
        suggestion: 'Consider using SSRThemeProvider for consistent theme handling'
      });
    }

    // Check for form-related code
    if ((componentString.includes('input') || componentString.includes('form') || componentString.includes('Field')) &&
        !componentString.includes('OptimizedInputField')) {
      this.suggestions.push({
        type: 'improvement',
        severity: 'low',
        message: 'Form-related code detected',
        suggestion: 'Consider using OptimizedInputField for better SSR compatibility'
      });
    }
  }

  generateReport() {
    const highIssues = this.issues.filter(issue => issue.severity === 'high');
    const mediumIssues = this.issues.filter(issue => issue.severity === 'medium');
    const lowIssues = this.issues.filter(issue => issue.severity === 'low');

    const score = this.calculateCompatibilityScore();

    return {
      score,
      status: this.getCompatibilityStatus(score),
      issues: {
        high: highIssues,
        medium: mediumIssues,
        low: lowIssues,
        total: this.issues.length
      },
      warnings: this.warnings,
      suggestions: this.suggestions,
      summary: this.generateSummary(score, highIssues.length, mediumIssues.length, lowIssues.length)
    };
  }

  calculateCompatibilityScore() {
    const highWeight = 10;
    const mediumWeight = 5;
    const lowWeight = 1;

    const highIssues = this.issues.filter(issue => issue.severity === 'high').length;
    const mediumIssues = this.issues.filter(issue => issue.severity === 'medium').length;
    const lowIssues = this.issues.filter(issue => issue.severity === 'low').length;

    const totalPenalty = (highIssues * highWeight) + (mediumIssues * mediumWeight) + (lowIssues * lowWeight);
    const maxScore = 100;

    return Math.max(0, maxScore - totalPenalty);
  }

  getCompatibilityStatus(score) {
    if (score >= 90) return 'excellent';
    if (score >= 75) return 'good';
    if (score >= 50) return 'fair';
    if (score >= 25) return 'poor';
    return 'critical';
  }

  generateSummary(score, high, medium, low) {
    const status = this.getCompatibilityStatus(score);
    
    let summary = `SSR Compatibility Score: ${score}/100 (${status.toUpperCase()})`;
    
    if (high > 0) {
      summary += `\n⚠️  ${high} critical issue${high > 1 ? 's' : ''} found`;
    }
    
    if (medium > 0) {
      summary += `\n⚡ ${medium} medium issue${medium > 1 ? 's' : ''} found`;
    }
    
    if (low > 0) {
      summary += `\nℹ️  ${low} minor issue${low > 1 ? 's' : ''} found`;
    }

    if (high === 0 && medium === 0 && low === 0) {
      summary += '\n✅ No issues detected!';
    }

    return summary;
  }
}

/**
 * Batch check multiple components
 */
export const checkMultipleComponents = (components, options = {}) => {
  const checker = new SSRCompatibilityChecker(options);
  const results = {};

  Object.entries(components).forEach(([name, Component]) => {
    try {
      results[name] = checker.checkComponent(Component);
    } catch (error) {
      results[name] = {
        score: 0,
        status: 'error',
        error: error.message,
        issues: { high: [], medium: [], low: [], total: 0 },
        warnings: [],
        suggestions: [],
        summary: `Error checking component: ${error.message}`
      };
    }
  });

  return results;
};

/**
 * Generate migration plan based on compatibility check
 */
export const generateMigrationPlan = (compatibilityReport) => {
  const plan = {
    priority: 'low',
    estimatedEffort: 'small',
    steps: [],
    resources: []
  };

  const { issues, suggestions } = compatibilityReport;
  const highIssues = issues.high.length;
  const mediumIssues = issues.medium.length;

  // Determine priority
  if (highIssues > 0) {
    plan.priority = 'high';
    plan.estimatedEffort = highIssues > 5 ? 'large' : 'medium';
  } else if (mediumIssues > 0) {
    plan.priority = 'medium';
    plan.estimatedEffort = mediumIssues > 3 ? 'medium' : 'small';
  }

  // Generate steps
  if (highIssues > 0) {
    plan.steps.push({
      step: 1,
      title: 'Fix Critical SSR Issues',
      description: 'Address browser API usage and rendering errors',
      tasks: issues.high.map(issue => ({
        task: issue.message,
        suggestion: issue.suggestion
      }))
    });
  }

  if (mediumIssues > 0) {
    plan.steps.push({
      step: plan.steps.length + 1,
      title: 'Address Medium Priority Issues',
      description: 'Fix potential hydration mismatches and inconsistencies',
      tasks: issues.medium.map(issue => ({
        task: issue.message,
        suggestion: issue.suggestion
      }))
    });
  }

  if (suggestions.length > 0) {
    plan.steps.push({
      step: plan.steps.length + 1,
      title: 'Implement Improvements',
      description: 'Apply suggested enhancements for better SSR compatibility',
      tasks: suggestions.map(suggestion => ({
        task: suggestion.message,
        suggestion: suggestion.suggestion
      }))
    });
  }

  // Add resources
  plan.resources = [
    'SSR Implementation Guide: /utils/ssr/SSR_IMPLEMENTATION_GUIDE.md',
    'SSR Testing Utilities: /utils/ssr/__tests__/ssrTestUtils.js',
    'SSR Components: /components/SSRThemeProvider.jsx',
    'Migration Examples: /utils/ssr/migrationExamples.js'
  ];

  return plan;
};

/**
 * Auto-fix simple SSR issues
 */
export const autoFixSSRIssues = (componentCode) => {
  let fixedCode = componentCode;
  const fixes = [];

  // Fix direct window access
  if (fixedCode.includes('window.')) {
    fixedCode = fixedCode.replace(
      /window\./g,
      'typeof window !== "undefined" && window.'
    );
    fixes.push('Added window existence check');
  }

  // Fix direct document access
  if (fixedCode.includes('document.')) {
    fixedCode = fixedCode.replace(
      /document\./g,
      'typeof document !== "undefined" && document.'
    );
    fixes.push('Added document existence check');
  }

  // Fix localStorage access
  if (fixedCode.includes('localStorage')) {
    fixedCode = fixedCode.replace(
      /localStorage/g,
      'typeof window !== "undefined" && window.localStorage'
    );
    fixes.push('Added localStorage existence check');
  }

  // Fix sessionStorage access
  if (fixedCode.includes('sessionStorage')) {
    fixedCode = fixedCode.replace(
      /sessionStorage/g,
      'typeof window !== "undefined" && window.sessionStorage'
    );
    fixes.push('Added sessionStorage existence check');
  }

  return {
    fixedCode,
    fixes,
    hasChanges: fixes.length > 0
  };
};

/**
 * Generate SSR-compatible component wrapper
 */
export const generateSSRWrapper = (componentName, options = {}) => {
  const {
    useTheme = false,
    useForm = false,
    useBrowserAPIs = false,
    customFallback = null
  } = options;

  const imports = [
    "import React, { useState, useEffect } from 'react';",
    "import { useSSRContext, HydrationSafe } from '@commonui/utils/ssr';"
  ];

  if (useTheme) {
    imports.push("import { useSSRTheme } from '@commonui/utils/ssr';");
  }

  if (useForm) {
    imports.push("import { SSRFormWrapper } from '@commonui/components/FormFields';");
  }

  const template = `${imports.join('\n')}

const ${componentName}SSR = ({ 
  children, 
  ssrFallback = null,
  ...props 
}) => {
  const { isSSR, isClient, capabilities } = useSSRContext();
  const [isHydrated, setIsHydrated] = useState(false);
  ${useTheme ? 'const { theme, isHydrated: themeHydrated } = useSSRTheme();' : ''}

  // Client-side initialization
  useEffect(() => {
    if (isClient) {
      setIsHydrated(true);
    }
  }, [isClient]);

  // SSR fallback
  const renderSSRFallback = () => {
    return ssrFallback || ${customFallback || '(\n      <div className="ssr-fallback">\n        Loading...\n      </div>\n    )'};
  };

  ${useBrowserAPIs ? `
  // Browser API safety checks
  const safeLocalStorage = capabilities.localStorage ? localStorage : null;
  const safeSessionStorage = capabilities.sessionStorage ? sessionStorage : null;
  ` : ''}

  return (
    <HydrationSafe
      fallback={renderSSRFallback}
      suppressHydrationWarning={true}
    >
      <div {...props}>
        {isHydrated ? children : <div>Hydrating...</div>}
      </div>
    </HydrationSafe>
  );
};

export default ${componentName}SSR;`;

  return template;
};

/**
 * Development mode SSR warnings
 */
export const createSSRWarningSystem = () => {
  if (process.env.NODE_ENV !== 'development') {
    return { warn: () => {}, error: () => {}, info: () => {} };
  }

  const warnings = new Set();
  const errors = new Set();

  return {
    warn(message, component = 'Unknown') {
      const key = `${component}:${message}`;
      if (!warnings.has(key)) {
        console.warn(`🔶 SSR Warning [${component}]:`, message);
        warnings.add(key);
      }
    },

    error(message, component = 'Unknown') {
      const key = `${component}:${message}`;
      if (!errors.has(key)) {
        console.error(`🔴 SSR Error [${component}]:`, message);
        errors.add(key);
      }
    },

    info(message, component = 'Unknown') {
      console.info(`ℹ️ SSR Info [${component}]:`, message);
    },

    getStats() {
      return {
        warnings: warnings.size,
        errors: errors.size
      };
    }
  };
};

/**
 * SSR debugging utilities
 */
export const ssrDebugUtils = {
  // Log component render differences
  logRenderDifference(componentName, ssrHTML, clientHTML) {
    if (process.env.NODE_ENV === 'development') {
      console.group(`🔍 SSR Debug: ${componentName}`);
      console.log('SSR HTML:', ssrHTML);
      console.log('Client HTML:', clientHTML);
      console.log('Match:', ssrHTML === clientHTML);
      console.groupEnd();
    }
  },

  // Monitor hydration performance
  monitorHydrationPerformance(componentName, startTime, endTime) {
    if (process.env.NODE_ENV === 'development') {
      const duration = endTime - startTime;
      console.log(`⚡ Hydration Performance [${componentName}]: ${duration.toFixed(2)}ms`);
      
      if (duration > 100) {
        console.warn(`⚠️ Slow hydration detected for ${componentName}: ${duration.toFixed(2)}ms`);
      }
    }
  },

  // Track SSR capability usage
  trackCapabilityUsage(capability, component) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔧 Capability Usage [${component}]: ${capability}`);
    }
  }
};

// Convenience function for quick compatibility check
export const checkSSRCompatibility = (Component, props = {}) => {
  const checker = new SSRCompatibilityChecker();
  return checker.checkComponent(Component, props);
};

export default {
  SSRCompatibilityChecker,
  checkMultipleComponents,
  generateMigrationPlan,
  autoFixSSRIssues,
  generateSSRWrapper,
  createSSRWarningSystem,
  ssrDebugUtils,
  checkSSRCompatibility
};
