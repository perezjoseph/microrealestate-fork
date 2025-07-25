#!/usr/bin/env node

/**
 * Accessibility validation script for theme system
 * Run this script to validate WCAG AA compliance and generate reports
 */

const fs = require('fs');
const path = require('path');

// Color contrast validation functions
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
    r = g = b = l;
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }

  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

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

function getRelativeLuminance(rgb) {
  const [r, g, b] = rgb.map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function getContrastRatio(color1, color2) {
  const lum1 = getRelativeLuminance(color1);
  const lum2 = getRelativeLuminance(color2);
  
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  
  return (lighter + 0.05) / (darker + 0.05);
}

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

// Parse CSS files to extract theme colors
function parseThemeColors(cssContent) {
  const lightColors = {};
  const darkColors = {};

  // Extract :root colors (light theme)
  const rootMatch = cssContent.match(/:root\s*{([^}]+)}/);
  if (rootMatch) {
    const rootContent = rootMatch[1];
    const colorMatches = rootContent.match(/--([^:]+):\s*([^;]+);/g);
    if (colorMatches) {
      colorMatches.forEach(match => {
        const [, name, value] = match.match(/--([^:]+):\s*([^;]+);/);
        if (name && value && !name.includes('chart') && !name.includes('radius')) {
          lightColors[name.trim()] = value.trim();
        }
      });
    }
  }

  // Extract .dark colors (dark theme)
  const darkMatch = cssContent.match(/\.dark\s*{([^}]+)}/);
  if (darkMatch) {
    const darkContent = darkMatch[1];
    const colorMatches = darkContent.match(/--([^:]+):\s*([^;]+);/g);
    if (colorMatches) {
      colorMatches.forEach(match => {
        const [, name, value] = match.match(/--([^:]+):\s*([^;]+);/);
        if (name && value && !name.includes('chart') && !name.includes('radius')) {
          darkColors[name.trim()] = value.trim();
        }
      });
    }
  }

  return { lightColors, darkColors };
}

// Validate theme colors
function validateThemeContrast(lightTheme, darkTheme) {
  const results = {
    light: {},
    dark: {},
    overall: { passed: true, issues: [] }
  };

  const validateTheme = (theme, themeName) => {
    const themeResults = {};
    
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
          console.warn(`Failed to validate ${name} in ${themeName} theme:`, error.message);
        }
      }
    });

    return themeResults;
  };

  results.light = validateTheme(lightTheme, 'light');
  results.dark = validateTheme(darkTheme, 'dark');

  return results;
}

// Generate accessibility report
function generateReport(results) {
  const report = {
    timestamp: new Date().toISOString(),
    wcagLevel: 'AA',
    summary: {
      totalTests: 0,
      passed: 0,
      failed: 0,
      passRate: 0
    },
    themes: {
      light: results.light,
      dark: results.dark
    },
    issues: results.overall.issues,
    recommendations: []
  };

  // Calculate summary
  ['light', 'dark'].forEach(theme => {
    Object.values(results[theme]).forEach(result => {
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
  if (results.overall.issues.length > 0) {
    report.recommendations.push({
      type: 'contrast',
      priority: 'high',
      message: `${results.overall.issues.length} color combinations do not meet WCAG AA standards`,
      details: results.overall.issues
    });
  }

  return report;
}

// Main validation function
function validateAccessibility() {
  console.log('🎨 Theme Accessibility Validation\n');

  try {
    // Read CSS files
    const tenantCssPath = path.join(__dirname, '../../tenant/src/app/globals.css');
    const landlordCssPath = path.join(__dirname, '../../landlord/src/styles/globals.css');

    let cssContent = '';
    
    if (fs.existsSync(tenantCssPath)) {
      cssContent = fs.readFileSync(tenantCssPath, 'utf8');
      console.log('✅ Found tenant CSS file');
    } else if (fs.existsSync(landlordCssPath)) {
      cssContent = fs.readFileSync(landlordCssPath, 'utf8');
      console.log('✅ Found landlord CSS file');
    } else {
      console.error('❌ No CSS files found');
      process.exit(1);
    }

    // Parse theme colors
    const { lightColors, darkColors } = parseThemeColors(cssContent);
    
    console.log(`📊 Found ${Object.keys(lightColors).length} light theme colors`);
    console.log(`📊 Found ${Object.keys(darkColors).length} dark theme colors\n`);

    // Validate contrast
    const results = validateThemeContrast(lightColors, darkColors);
    const report = generateReport(results);

    // Display results
    console.log('📋 WCAG AA Compliance Report');
    console.log('═'.repeat(50));
    console.log(`Overall Pass Rate: ${report.summary.passRate}% (${report.summary.passed}/${report.summary.totalTests})`);
    console.log(`Passed: ${report.summary.passed}`);
    console.log(`Failed: ${report.summary.failed}\n`);

    if (report.issues.length === 0) {
      console.log('✅ All color combinations meet WCAG AA standards!\n');
    } else {
      console.log('⚠️  Issues found:');
      console.log('-'.repeat(30));
      report.issues.forEach(issue => {
        console.log(`❌ ${issue.theme} theme - ${issue.combination}`);
        console.log(`   Contrast: ${issue.ratio}:1 (needs ${issue.required}:1)`);
        console.log(`   Colors: ${issue.foreground} on ${issue.background}\n`);
      });
    }

    // Detailed results
    console.log('📊 Detailed Results');
    console.log('═'.repeat(50));
    
    ['light', 'dark'].forEach(themeName => {
      console.log(`\n${themeName.toUpperCase()} THEME:`);
      console.log('-'.repeat(20));
      
      Object.entries(report.themes[themeName]).forEach(([key, result]) => {
        if (result.ratio) {
          const status = result.passed ? '✅' : '❌';
          console.log(`${status} ${result.name}: ${result.ratio}:1`);
        }
      });
    });

    // Recommendations
    if (report.recommendations.length > 0) {
      console.log('\n💡 Recommendations');
      console.log('═'.repeat(50));
      report.recommendations.forEach(rec => {
        const icon = rec.priority === 'high' ? '🔴' : '🟡';
        console.log(`${icon} ${rec.message}`);
      });
    }

    // Save report
    const reportPath = path.join(__dirname, '../accessibility-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📄 Full report saved to: ${reportPath}`);

    // Exit with appropriate code
    process.exit(report.summary.passRate === 100 ? 0 : 1);

  } catch (error) {
    console.error('❌ Validation failed:', error.message);
    process.exit(1);
  }
}

// Run validation
if (require.main === module) {
  validateAccessibility();
}

module.exports = {
  validateAccessibility,
  validateThemeContrast,
  parseThemeColors,
  getContrastRatio,
  meetsWCAGStandard
};