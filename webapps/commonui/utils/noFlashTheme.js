/**
 * No-flash theme application using CSS custom properties
 * Prevents theme flashing during SSR hydration by applying themes before React loads
 */

/**
 * CSS custom properties for theme variables
 */
const THEME_CSS_VARIABLES = {
  light: {
    '--theme-background': '#ffffff',
    '--theme-foreground': '#000000',
    '--theme-primary': '#0066cc',
    '--theme-secondary': '#6b7280',
    '--theme-accent': '#f3f4f6',
    '--theme-accent-foreground': '#111827',
    '--theme-muted': '#f9fafb',
    '--theme-muted-foreground': '#6b7280',
    '--theme-border': '#e5e7eb',
    '--theme-input': '#e5e7eb',
    '--theme-ring': '#3b82f6',
    '--theme-destructive': '#ef4444',
    '--theme-destructive-foreground': '#ffffff'
  },
  dark: {
    '--theme-background': '#0a0a0a',
    '--theme-foreground': '#fafafa',
    '--theme-primary': '#fafafa',
    '--theme-secondary': '#a1a1aa',
    '--theme-accent': '#262626',
    '--theme-accent-foreground': '#fafafa',
    '--theme-muted': '#171717',
    '--theme-muted-foreground': '#a1a1aa',
    '--theme-border': '#262626',
    '--theme-input': '#262626',
    '--theme-ring': '#d4d4d8',
    '--theme-destructive': '#7f1d1d',
    '--theme-destructive-foreground': '#fafafa'
  }
};

/**
 * Generate CSS for theme variables
 * @param {string} theme - Theme name ('light' or 'dark')
 * @returns {string} CSS string with custom properties
 */
function generateThemeCSS(theme) {
  const variables = THEME_CSS_VARIABLES[theme] || THEME_CSS_VARIABLES.light;
  
  const cssVariables = Object.entries(variables)
    .map(([property, value]) => `  ${property}: ${value};`)
    .join('\n');
  
  return `
:root {
${cssVariables}
}

[data-theme="${theme}"] {
${cssVariables}
}

.theme-${theme} {
${cssVariables}
}
`.trim();
}

/**
 * Apply theme CSS variables to document
 * @param {string} theme - Theme to apply
 */
function applyThemeVariables(theme) {
  if (typeof document === 'undefined') {
    return;
  }

  const variables = THEME_CSS_VARIABLES[theme] || THEME_CSS_VARIABLES.light;
  const root = document.documentElement;
  
  Object.entries(variables).forEach(([property, value]) => {
    root.style.setProperty(property, value);
  });
}

/**
 * Create inline CSS for no-flash theme application
 * @param {string} theme - Initial theme
 * @returns {string} Inline CSS string
 */
export function createNoFlashCSS(theme = 'light') {
  const resolvedTheme = theme === 'system' ? 'light' : theme; // Default to light for SSR
  
  return `
<style id="no-flash-theme">
${generateThemeCSS('light')}
${generateThemeCSS('dark')}

/* Transition for smooth theme changes */
*, *::before, *::after {
  transition: background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease;
}

/* Initial theme application */
:root {
  color-scheme: ${resolvedTheme};
}

/* Hide content until theme is applied to prevent flash */
body {
  visibility: hidden;
}

body.theme-loaded {
  visibility: visible;
}

/* System theme media queries */
@media (prefers-color-scheme: dark) {
  :root[data-theme="system"] {
${Object.entries(THEME_CSS_VARIABLES.dark)
  .map(([property, value]) => `    ${property}: ${value};`)
  .join('\n')}
  }
}

@media (prefers-color-scheme: light) {
  :root[data-theme="system"] {
${Object.entries(THEME_CSS_VARIABLES.light)
  .map(([property, value]) => `    ${property}: ${value};`)
  .join('\n')}
  }
}
</style>
`;
}

/**
 * Create enhanced inline script for immediate theme application with SSR support
 * @param {string} [cookieTheme] - Theme from cookies
 * @param {Object} [options={}] - Configuration options
 * @returns {string} Inline script string
 */
export function createNoFlashScript(cookieTheme, options = {}) {
  const {
    enableValidation = true,
    enableMigration = true,
    fallbackTheme = 'system',
    cookieKeys = ['mre-theme-preference', 'theme_preference'],
    storageKeys = ['theme_preference', 'mre-theme-preference', 'theme'],
    enableDebug = process.env.NODE_ENV === 'development'
  } = options;

  return `
<script id="no-flash-script">
(function() {
  var debug = ${enableDebug};
  var startTime = Date.now();
  
  function log(message, data) {
    if (debug) {
      console.log('[NoFlash]', message, data || '');
    }
  }
  
  try {
    // Enhanced theme validation
    function validateTheme(theme) {
      if (!${enableValidation}) return true;
      var validThemes = ['light', 'dark', 'system'];
      return typeof theme === 'string' && validThemes.includes(theme.toLowerCase().trim());
    }
    
    // Enhanced theme retrieval with multiple sources
    function getStoredTheme() {
      var theme = null;
      var source = null;
      
      // Try cookie first (passed from server)
      if (${JSON.stringify(cookieTheme)}) {
        theme = ${JSON.stringify(cookieTheme)};
        source = 'server-cookie';
        if (validateTheme(theme)) {
          log('Theme from server cookie:', theme);
          return { theme: theme, source: source };
        }
      }
      
      // Try cookies from document with multiple keys
      try {
        var cookies = document.cookie.split(';');
        var cookieKeys = ${JSON.stringify(cookieKeys)};
        
        for (var k = 0; k < cookieKeys.length; k++) {
          for (var i = 0; i < cookies.length; i++) {
            var cookie = cookies[i].trim().split('=');
            if (cookie[0] === cookieKeys[k] && cookie[1]) {
              try {
                var decoded = decodeURIComponent(cookie[1]);
                var parsed = JSON.parse(decoded);
                theme = parsed.theme || parsed;
                source = 'document-cookie:' + cookieKeys[k];
                
                if (validateTheme(theme)) {
                  log('Theme from document cookie:', { theme: theme, key: cookieKeys[k] });
                  return { theme: theme, source: source };
                }
              } catch (parseError) {
                log('Error parsing cookie:', parseError.message);
              }
            }
          }
        }
      } catch (cookieError) {
        log('Error reading cookies:', cookieError.message);
      }
      
      // Try localStorage with multiple keys
      if (${enableMigration}) {
        try {
          var storageKeys = ${JSON.stringify(storageKeys)};
          
          for (var j = 0; j < storageKeys.length; j++) {
            var stored = localStorage.getItem(storageKeys[j]);
            if (stored) {
              try {
                var parsed = JSON.parse(stored);
                theme = parsed.theme || parsed;
                source = 'localStorage:' + storageKeys[j];
                
                if (validateTheme(theme)) {
                  log('Theme from localStorage:', { theme: theme, key: storageKeys[j] });
                  return { theme: theme, source: source };
                }
              } catch (parseError) {
                // Try as plain string
                if (validateTheme(stored)) {
                  theme = stored;
                  source = 'localStorage:' + storageKeys[j] + ':plain';
                  log('Theme from localStorage (plain):', { theme: theme, key: storageKeys[j] });
                  return { theme: theme, source: source };
                }
              }
            }
          }
        } catch (storageError) {
          log('Error reading localStorage:', storageError.message);
        }
      }
      
      // Fallback
      theme = ${JSON.stringify(fallbackTheme)};
      source = 'fallback';
      log('Using fallback theme:', theme);
      return { theme: theme, source: source };
    }
    
    // Enhanced system theme detection
    function getSystemTheme() {
      try {
        if (window.matchMedia) {
          var darkQuery = window.matchMedia('(prefers-color-scheme: dark)');
          var lightQuery = window.matchMedia('(prefers-color-scheme: light)');
          
          if (darkQuery.matches) return 'dark';
          if (lightQuery.matches) return 'light';
        }
        return 'light'; // Default fallback
      } catch (e) {
        log('Error detecting system theme:', e.message);
        return 'light';
      }
    }
    
    // Enhanced theme resolution
    function resolveTheme(theme, systemTheme) {
      if (theme === 'system') {
        return systemTheme || 'light';
      }
      return validateTheme(theme) ? theme : 'light';
    }
    
    // Enhanced theme application with CSS custom properties
    function applyTheme(theme, source) {
      var root = document.documentElement;
      var body = document.body;
      
      try {
        // Set data-theme attribute
        root.setAttribute('data-theme', theme);
        
        // Set color-scheme for native form controls
        root.style.colorScheme = theme;
        
        // Apply CSS custom properties
        var variables = getThemeVariables(theme);
        for (var prop in variables) {
          if (variables.hasOwnProperty(prop)) {
            root.style.setProperty(prop, variables[prop]);
          }
        }
        
        // Update theme classes
        body.className = body.className.replace(/theme-\\w+/g, '');
        body.classList.add('theme-' + theme);
        
        // Mark theme as loaded and show content
        body.classList.add('theme-loaded');
        body.style.visibility = 'visible';
        
        // Store application info for debugging
        if (debug) {
          window.__THEME_DEBUG__ = {
            theme: theme,
            source: source,
            appliedAt: Date.now(),
            loadTime: Date.now() - startTime
          };
        }
        
        // Dispatch enhanced event
        try {
          window.dispatchEvent(new CustomEvent('no-flash-theme-applied', {
            detail: { 
              theme: theme, 
              source: source,
              timestamp: Date.now(),
              loadTime: Date.now() - startTime
            }
          }));
        } catch (eventError) {
          log('Error dispatching theme event:', eventError.message);
        }
        
        log('Theme applied successfully:', { theme: theme, source: source });
        
      } catch (applyError) {
        log('Error applying theme:', applyError.message);
        // Fallback: just show content
        body.style.visibility = 'visible';
      }
    }
    
    // Get CSS custom properties for theme
    function getThemeVariables(theme) {
      var lightVars = {
        '--theme-background': '#ffffff',
        '--theme-foreground': '#000000',
        '--theme-primary': '#0066cc',
        '--theme-secondary': '#6b7280',
        '--theme-accent': '#f3f4f6',
        '--theme-accent-foreground': '#111827',
        '--theme-muted': '#f9fafb',
        '--theme-muted-foreground': '#6b7280',
        '--theme-border': '#e5e7eb',
        '--theme-input': '#e5e7eb',
        '--theme-ring': '#3b82f6',
        '--theme-destructive': '#ef4444',
        '--theme-destructive-foreground': '#ffffff'
      };
      
      var darkVars = {
        '--theme-background': '#0a0a0a',
        '--theme-foreground': '#fafafa',
        '--theme-primary': '#fafafa',
        '--theme-secondary': '#a1a1aa',
        '--theme-accent': '#262626',
        '--theme-accent-foreground': '#fafafa',
        '--theme-muted': '#171717',
        '--theme-muted-foreground': '#a1a1aa',
        '--theme-border': '#262626',
        '--theme-input': '#262626',
        '--theme-ring': '#d4d4d8',
        '--theme-destructive': '#7f1d1d',
        '--theme-destructive-foreground': '#fafafa'
      };
      
      return theme === 'dark' ? darkVars : lightVars;
    }
    
    // Main execution
    var storedTheme = getStoredTheme();
    var systemTheme = getSystemTheme();
    var resolvedTheme = resolveTheme(storedTheme, systemTheme);
    
    // Apply theme immediately
    applyTheme(resolvedTheme);
    
    // Listen for system theme changes
    try {
      var mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      var handleSystemThemeChange = function(e) {
        var currentTheme = getStoredTheme();
        if (currentTheme === 'system') {
          var newSystemTheme = e.matches ? 'dark' : 'light';
          applyTheme(newSystemTheme);
        }
      };
      
      if (mediaQuery.addListener) {
        mediaQuery.addListener(handleSystemThemeChange);
      } else if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener('change', handleSystemThemeChange);
      }
    } catch (e) {}
    
  } catch (error) {
    // Fallback: show content and apply light theme
    console.warn('No-flash theme script error:', error);
    document.documentElement.setAttribute('data-theme', 'light');
    document.documentElement.style.colorScheme = 'light';
    document.body.classList.add('theme-light', 'theme-loaded');
  }
})();
</script>
`;
}

/**
 * Remove no-flash elements after React hydration
 */
export function cleanupNoFlashElements() {
  if (typeof document === 'undefined') {
    return;
  }

  // Remove no-flash CSS
  const noFlashCSS = document.getElementById('no-flash-theme');
  if (noFlashCSS) {
    noFlashCSS.remove();
  }

  // Remove no-flash script
  const noFlashScript = document.getElementById('no-flash-script');
  if (noFlashScript) {
    noFlashScript.remove();
  }
}

/**
 * Get current theme from DOM
 * @returns {string} Current theme
 */
export function getCurrentThemeFromDOM() {
  if (typeof document === 'undefined') {
    return 'light';
  }

  const dataTheme = document.documentElement.getAttribute('data-theme');
  if (dataTheme) {
    return dataTheme;
  }

  const themeClass = document.body.className.match(/theme-(\w+)/);
  if (themeClass) {
    return themeClass[1];
  }

  return 'light';
}

/**
 * Sync React theme state with DOM theme
 * @param {string} reactTheme - Theme from React state
 * @param {string} domTheme - Theme from DOM
 * @returns {string} Synchronized theme
 */
export function syncThemeWithDOM(reactTheme, domTheme) {
  // If DOM theme is different from React theme, prefer DOM theme
  // (it was applied by the no-flash script)
  if (domTheme && domTheme !== reactTheme) {
    console.log('Syncing React theme with DOM theme:', domTheme);
    return domTheme;
  }

  return reactTheme;
}

/**
 * Create Next.js compatible no-flash theme setup
 * @param {string} [cookieTheme] - Theme from cookies
 * @returns {Object} Next.js head elements
 */
export function createNextJSNoFlashSetup(cookieTheme) {
  return {
    css: createNoFlashCSS(cookieTheme),
    script: createNoFlashScript(cookieTheme)
  };
}

/**
 * Default theme CSS variables for external use
 */
export { THEME_CSS_VARIABLES };

/**
 * Utility functions
 */
export const noFlashUtils = {
  createCSS: createNoFlashCSS,
  createScript: createNoFlashScript,
  cleanup: cleanupNoFlashElements,
  getCurrentTheme: getCurrentThemeFromDOM,
  syncTheme: syncThemeWithDOM,
  applyVariables: applyThemeVariables,
  generateCSS: generateThemeCSS
};