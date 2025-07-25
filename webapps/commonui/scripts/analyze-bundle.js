#!/usr/bin/env node

/**
 * Bundle size analyzer for theme-related code
 * Helps monitor and optimize bundle size impact
 */

const fs = require('fs');
const path = require('path');
// const { execSync } = require('child_process'); // Unused for now

// Configuration
const THEME_FILES = [
  'components/ThemeToggle.jsx',
  'components/ThemeToggle.optimized.jsx',
  'components/LazyThemeToggle.jsx',
  'components/icons/SunIcon.jsx',
  'components/icons/MoonIcon.jsx',
  'components/icons/SystemIcon.jsx',
  'hooks/useTheme.js',
  'hooks/useTheme.optimized.js',
  'utils/themeErrorHandling.js',
  'utils/themeErrorHandling.optimized.js',
  'utils/themePerformance.js'
];

const COMMONUI_ROOT = path.resolve(__dirname, '..');

/**
 * Calculate file sizes
 */
function calculateFileSizes() {
  const sizes = {};
  let totalSize = 0;

  THEME_FILES.forEach(file => {
    const filePath = path.join(COMMONUI_ROOT, file);
    
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      const sizeKB = (stats.size / 1024).toFixed(2);
      sizes[file] = `${sizeKB}KB`;
      totalSize += stats.size;
    } else {
      sizes[file] = 'Not found';
    }
  });

  return {
    files: sizes,
    totalSize: `${(totalSize / 1024).toFixed(2)}KB`,
    totalSizeBytes: totalSize
  };
}

/**
 * Estimate gzipped sizes
 */
function estimateGzippedSizes(sizes) {
  const gzippedSizes = {};
  let totalGzipped = 0;

  Object.entries(sizes.files).forEach(([file, size]) => {
    if (size !== 'Not found') {
      const sizeBytes = parseFloat(size) * 1024;
      // Rough gzip compression estimate (typically 70-80% reduction for JS)
      const gzippedBytes = sizeBytes * 0.25;
      gzippedSizes[file] = `${(gzippedBytes / 1024).toFixed(2)}KB`;
      totalGzipped += gzippedBytes;
    } else {
      gzippedSizes[file] = 'Not found';
    }
  });

  return {
    files: gzippedSizes,
    totalSize: `${(totalGzipped / 1024).toFixed(2)}KB`,
    totalSizeBytes: totalGzipped
  };
}

/**
 * Analyze code complexity
 */
function analyzeComplexity() {
  const complexity = {};

  THEME_FILES.forEach(file => {
    const filePath = path.join(COMMONUI_ROOT, file);
    
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Simple complexity metrics
      const lines = content.split('\n').length;
      const functions = (content.match(/function|=>/g) || []).length;
      const imports = (content.match(/import/g) || []).length;
      const exports = (content.match(/export/g) || []).length;
      
      complexity[file] = {
        lines,
        functions,
        imports,
        exports,
        complexity: Math.round((functions + imports) / lines * 100) || 0
      };
    }
  });

  return complexity;
}

/**
 * Compare optimized vs original versions
 */
function compareOptimizations() {
  const comparisons = [
    {
      original: 'components/ThemeToggle.jsx',
      optimized: 'components/ThemeToggle.optimized.jsx'
    },
    {
      original: 'hooks/useTheme.js',
      optimized: 'hooks/useTheme.optimized.js'
    },
    {
      original: 'utils/themeErrorHandling.js',
      optimized: 'utils/themeErrorHandling.optimized.js'
    }
  ];

  const results = [];

  comparisons.forEach(({ original, optimized }) => {
    const originalPath = path.join(COMMONUI_ROOT, original);
    const optimizedPath = path.join(COMMONUI_ROOT, optimized);

    if (fs.existsSync(originalPath) && fs.existsSync(optimizedPath)) {
      const originalStats = fs.statSync(originalPath);
      const optimizedStats = fs.statSync(optimizedPath);
      
      const originalSize = originalStats.size;
      const optimizedSize = optimizedStats.size;
      const reduction = originalSize - optimizedSize;
      const reductionPercent = ((reduction / originalSize) * 100).toFixed(1);

      results.push({
        file: original.replace('components/', '').replace('hooks/', '').replace('utils/', ''),
        originalSize: `${(originalSize / 1024).toFixed(2)}KB`,
        optimizedSize: `${(optimizedSize / 1024).toFixed(2)}KB`,
        reduction: `${(reduction / 1024).toFixed(2)}KB`,
        reductionPercent: `${reductionPercent}%`,
        improved: reduction > 0
      });
    }
  });

  return results;
}

/**
 * Check for potential optimizations
 */
function checkOptimizations() {
  const suggestions = [];

  THEME_FILES.forEach(file => {
    const filePath = path.join(COMMONUI_ROOT, file);
    
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Check for potential optimizations
      if (content.includes('console.log') && !content.includes('NODE_ENV')) {
        suggestions.push(`${file}: Remove console.log statements or add NODE_ENV checks`);
      }
      
      if (content.includes('import *') && !file.includes('optimized')) {
        suggestions.push(`${file}: Consider using named imports instead of wildcard imports`);
      }
      
      if (content.match(/useCallback|useMemo/g)?.length > 10) {
        suggestions.push(`${file}: High number of useCallback/useMemo - verify they're all necessary`);
      }
      
      if (content.includes('lodash') && !content.includes('lodash/')) {
        suggestions.push(`${file}: Use specific lodash imports to reduce bundle size`);
      }
    }
  });

  return suggestions;
}

/**
 * Generate performance report
 */
function generateReport() {
  console.log('🎨 Theme Bundle Analysis Report');
  console.log('================================\n');

  // File sizes
  const sizes = calculateFileSizes();
  console.log('📦 File Sizes (Uncompressed):');
  Object.entries(sizes.files).forEach(([file, size]) => {
    console.log(`  ${file.padEnd(40)} ${size}`);
  });
  console.log(`  ${'TOTAL'.padEnd(40)} ${sizes.totalSize}\n`);

  // Gzipped sizes
  const gzippedSizes = estimateGzippedSizes(sizes);
  console.log('🗜️  Estimated Gzipped Sizes:');
  Object.entries(gzippedSizes.files).forEach(([file, size]) => {
    console.log(`  ${file.padEnd(40)} ${size}`);
  });
  console.log(`  ${'TOTAL'.padEnd(40)} ${gzippedSizes.totalSize}\n`);

  // Optimization comparisons
  const comparisons = compareOptimizations();
  if (comparisons.length > 0) {
    console.log('⚡ Optimization Results:');
    comparisons.forEach(comp => {
      const status = comp.improved ? '✅' : '❌';
      console.log(`  ${status} ${comp.file}`);
      console.log(`     Original: ${comp.originalSize} → Optimized: ${comp.optimizedSize}`);
      console.log(`     Reduction: ${comp.reduction} (${comp.reductionPercent})\n`);
    });
  }

  // Code complexity
  const complexity = analyzeComplexity();
  console.log('🔍 Code Complexity:');
  Object.entries(complexity).forEach(([file, metrics]) => {
    console.log(`  ${file}:`);
    console.log(`    Lines: ${metrics.lines}, Functions: ${metrics.functions}, Complexity: ${metrics.complexity}%`);
  });
  console.log('');

  // Optimization suggestions
  const suggestions = checkOptimizations();
  if (suggestions.length > 0) {
    console.log('💡 Optimization Suggestions:');
    suggestions.forEach(suggestion => {
      console.log(`  • ${suggestion}`);
    });
    console.log('');
  }

  // Summary
  console.log('📊 Summary:');
  console.log(`  Total theme code size: ${sizes.totalSize} (${gzippedSizes.totalSize} gzipped)`);
  console.log(`  Number of theme files: ${THEME_FILES.length}`);
  console.log(`  Optimization suggestions: ${suggestions.length}`);
  
  // Performance thresholds
  const totalSizeKB = sizes.totalSizeBytes / 1024;
  const gzippedSizeKB = gzippedSizes.totalSizeBytes / 1024;
  
  console.log('\n🎯 Performance Thresholds:');
  console.log(`  Bundle size target: <50KB (current: ${totalSizeKB.toFixed(1)}KB) ${totalSizeKB < 50 ? '✅' : '❌'}`);
  console.log(`  Gzipped size target: <15KB (current: ${gzippedSizeKB.toFixed(1)}KB) ${gzippedSizeKB < 15 ? '✅' : '❌'}`);
}

/**
 * Watch mode for continuous monitoring
 */
function watchMode() {
  console.log('👀 Watching theme files for changes...\n');
  
  const chokidar = require('chokidar');
  
  const watcher = chokidar.watch(
    THEME_FILES.map(file => path.join(COMMONUI_ROOT, file)),
    { ignoreInitial: true }
  );

  watcher.on('change', (filePath) => {
    console.clear();
    console.log(`📝 File changed: ${path.relative(COMMONUI_ROOT, filePath)}\n`);
    generateReport();
  });

  // Initial report
  generateReport();
}

// CLI interface
const args = process.argv.slice(2);

if (args.includes('--watch')) {
  try {
    watchMode();
  } catch (error) {
    console.log('Watch mode requires chokidar. Install with: npm install chokidar');
    generateReport();
  }
} else {
  generateReport();
}

// Export for programmatic use
module.exports = {
  calculateFileSizes,
  estimateGzippedSizes,
  analyzeComplexity,
  compareOptimizations,
  checkOptimizations,
  generateReport
};