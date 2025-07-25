/**
 * Accessibility utilities for theme system
 * Includes WCAG AA contrast validation and color utilities
 */

/**
 * Convert HSL color values to RGB
 * @param {number} h - Hue (0-360)
 * @param {number} s - Saturation (0-100)
 * @param {number} l - Lightness (0-100)
 * @returns {Array} RGB values [r, g, b]
 */
function hslToRgb(h, s, l) {
  h = h / 360;
  s = s / 100;
  l = l / 100;

  const hue2rgb = (p, q, t) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  };

  let r, g, b;

  if (s === 0) {
    r = g = b = l; // achromatic
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }

  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

/**
 * Parse CSS HSL color string to RGB values
 * @param {string} hslString - HSL string like "222.2 84% 4.9%"
 * @returns {Array} RGB values [r, g, b]
 */
function parseHslString(hslString) {
  const parts = hslString.trim().split(/\s+/);
  if (parts.length !== 3) {
    throw new Error(`Invalid HSL string: ${hslString}`);
  }

  const h = parseFloat(parts[0]);
  const s = parseFloat(parts[1].replace('%', ''));
  const l = parseFloat(parts[2].replace('%', ''));

  return hslToRgb(h, s, l);
}

/**
 * Calculate relative luminance of a color
 * @param {Array} rgb - RGB values [r, g, b]
 * @returns {number} Relative luminance (0-1)
 */
function getRelativeLuminance(rgb) {
  const [r, g, b] = rgb.map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Calculate contrast ratio between two colors
 * @param {Array} color1 - RGB values [r, g, b]
 * @param {Array} color2 - RGB values [r, g, b]
 * @returns {number} Contrast ratio (1-21)
 */
function getContrastRatio(color1, color2) {
  const lum1 = getRelativeLuminance(color1);
  const lum2 = getRelativeLuminance(color2);
  
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check if contrast ratio meets WCAG AA standards
 * @param {number} ratio - Contrast ratio
 * @param {string} level - 'AA' or 'AAA'
 * @param {string} size - 'normal' or 'large'
 * @returns {boolean} Whether the ratio meets the standard
 */
function meetsWCAGStandard(ratio, level = 'AA', size = 'normal') {
  const standards = {
    AA: {
      normal: 4.5,
      large: 3.0
    },
    AAA: {
      normal: 7.0,
      large: 4.5
    }
  };

  return ratio >= standards[level][size];
}

/**
 * Validate theme colors for WCAG AA compliance
 * @param {Object} lightTheme - Light theme color variables
 * @param {Object} darkTheme - Dark theme color variables
 * @returns {Object} Validation results
 */
export function validateThemeContrast(lightTheme, darkTheme) {
  const results = {
    light: {},
    dark: {},
    overall: { passed: true, issues: [] }
  };

  const validateTheme = (theme, themeName) => {
    const themeResults = {};
    
    try {
      // Key color combinations to test
      const combinations = [
        { fg: 'foreground', bg: 'background', name: 'Body text' },
        { fg: 'primary-foreground', bg: 'primary', name: 'Primary button' },
        { fg: 'secondary-foreground', bg: 'secondary', name: 'Secondary button' },
        { fg: 'accent-foreground', bg: 'accent', name: 'Accent elements' },
        { fg: 'muted-foreground', bg: 'background', name: 'Muted text' },
        { fg: 'card-foreground', bg: 'card', name: 'Card content' },
        { fg: 'destructive-foreground', bg: 'destructive', name: 'Error messages' },
        { fg: 'success-foreground', bg: 'success', name: 'Success messages' },
        { fg: 'warning-foreground', bg: 'warning', name: 'Warning messages' }
      ];

      combinations.forEach(({ fg, bg, name }) => {
        if (theme[fg] && theme[bg]) {
          try {
            const fgRgb = parseHslString(theme[fg]);
            const bgRgb = parseHslString(theme[bg]);
            const ratio = getContrastRatio(fgRgb, bgRgb);
            
            const passed = meetsWCAGStandard(ratio, 'AA', 'normal');
            const passedLarge = meetsWCAGStandard(ratio, 'AA', 'large');
            
            themeResults[`${fg}-${bg}`] = {
              name,
              ratio: Math.round(ratio * 100) / 100,
              passed,
              passedLarge,
              foreground: theme[fg],
              background: theme[bg]
            };

            if (!passed) {
              results.overall.passed = false;
              results.overall.issues.push({
                theme: themeName,
                combination: name,
                ratio: Math.round(ratio * 100) / 100,
                required: 4.5,
                foreground: theme[fg],
                background: theme[bg]
              });
            }
          } catch (error) {
            console.warn(`Failed to validate ${name} in ${themeName} theme:`, error);
          }
        }
      });
    } catch (error) {
      console.error(`Failed to validate ${themeName} theme:`, error);
    }

    return themeResults;
  };

  results.light = validateTheme(lightTheme, 'light');
  results.dark = validateTheme(darkTheme, 'dark');

  return results;
}

/**
 * Get theme colors from CSS custom properties
 * @param {string} theme - 'light' or 'dark'
 * @returns {Object} Theme color values
 */
export function getThemeColors(theme = 'light') {
  if (typeof window === 'undefined') {
    return {};
  }

  const root = document.documentElement;
  const computedStyle = getComputedStyle(root);
  
  // Temporarily apply theme class to get colors
  const originalClasses = root.className;
  root.className = theme === 'dark' ? 'dark' : '';
  
  const colors = {};
  const colorVars = [
    'background', 'foreground', 'card', 'card-foreground',
    'popover', 'popover-foreground', 'primary', 'primary-foreground',
    'secondary', 'secondary-foreground', 'muted', 'muted-foreground',
    'accent', 'accent-foreground', 'destructive', 'destructive-foreground',
    'success', 'success-foreground', 'warning', 'warning-foreground',
    'border', 'input', 'ring'
  ];

  colorVars.forEach(varName => {
    const value = computedStyle.getPropertyValue(`--${varName}`).trim();
    if (value) {
      colors[varName] = value;
    }
  });

  // Restore original classes
  root.className = originalClasses;
  
  return colors;
}

/**
 * Run contrast validation on current theme setup
 * @returns {Object} Validation results
 */
export function validateCurrentThemes() {
  const lightColors = getThemeColors('light');
  const darkColors = getThemeColors('dark');
  
  return validateThemeContrast(lightColors, darkColors);
}

/**
 * Generate accessibility report for theme system
 * @returns {Object} Comprehensive accessibility report
 */
export function generateAccessibilityReport() {
  const contrastResults = validateCurrentThemes();
  
  const report = {
    timestamp: new Date().toISOString(),
    wcagLevel: 'AA',
    contrast: contrastResults,
    recommendations: [],
    summary: {
      totalTests: 0,
      passed: 0,
      failed: 0,
      passRate: 0
    }
  };

  // Calculate summary statistics
  ['light', 'dark'].forEach(theme => {
    Object.values(contrastResults[theme]).forEach(result => {
      if (typeof result === 'object' && result.ratio) {
        report.summary.totalTests++;
        if (result.passed) {
          report.summary.passed++;
        } else {
          report.summary.failed++;
        }
      }
    });
  });

  report.summary.passRate = report.summary.totalTests > 0 
    ? Math.round((report.summary.passed / report.summary.totalTests) * 100)
    : 0;

  // Generate recommendations
  if (contrastResults.overall.issues.length > 0) {
    report.recommendations.push({
      type: 'contrast',
      priority: 'high',
      message: `${contrastResults.overall.issues.length} color combinations do not meet WCAG AA standards`,
      issues: contrastResults.overall.issues
    });
  }

  if (report.summary.passRate < 100) {
    report.recommendations.push({
      type: 'general',
      priority: 'medium',
      message: 'Consider adjusting color values to improve contrast ratios',
      suggestion: 'Increase lightness difference between foreground and background colors'
    });
  }

  return report;
}

/**
 * Log accessibility report to console (development only)
 */
export function logAccessibilityReport() {
  if (process.env.NODE_ENV !== 'development') {
    return;
  }

  const report = generateAccessibilityReport();
  
  console.group('🎨 Theme Accessibility Report');
  console.log(`WCAG ${report.wcagLevel} Compliance: ${report.summary.passRate}% (${report.summary.passed}/${report.summary.totalTests})`);
  
  if (report.contrast.overall.passed) {
    console.log('✅ All color combinations meet WCAG AA standards');
  } else {
    console.warn('⚠️ Some color combinations need improvement:');
    report.contrast.overall.issues.forEach(issue => {
      console.warn(`  ${issue.combination}: ${issue.ratio}:1 (needs ${issue.required}:1)`);
    });
  }

  if (report.recommendations.length > 0) {
    console.group('📋 Recommendations');
    report.recommendations.forEach(rec => {
      const icon = rec.priority === 'high' ? '🔴' : '🟡';
      console.log(`${icon} ${rec.message}`);
    });
    console.groupEnd();
  }

  console.groupEnd();
  
  return report;
}

export default {
  validateThemeContrast,
  validateCurrentThemes,
  generateAccessibilityReport,
  logAccessibilityReport,
  getThemeColors,
  getContrastRatio,
  meetsWCAGStandard
};