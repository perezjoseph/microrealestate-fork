#!/usr/bin/env node

/**
 * Test runner script for comprehensive theme system testing
 * Runs all theme-related tests with proper configuration and reporting
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// ANSI color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

const log = (message, color = 'reset') => {
  console.log(`${colors[color]}${message}${colors.reset}`);
};

const logSection = (title) => {
  log('\n' + '='.repeat(60), 'cyan');
  log(`  ${title}`, 'bright');
  log('='.repeat(60), 'cyan');
};

const logSubsection = (title) => {
  log(`\n${'-'.repeat(40)}`, 'blue');
  log(`  ${title}`, 'blue');
  log('-'.repeat(40), 'blue');
};

// Test suites configuration
const testSuites = [
  {
    name: 'Unit Tests - useTheme Hook',
    pattern: 'components/__tests__/useTheme.test.jsx',
    description: 'Tests theme hook functionality, state management, and error handling'
  },
  {
    name: 'Unit Tests - ThemeToggle Basic',
    pattern: 'components/__tests__/ThemeToggle.basic.test.jsx',
    description: 'Tests basic ThemeToggle component functionality and interactions'
  },
  {
    name: 'Accessibility Tests - ThemeToggle',
    pattern: 'components/__tests__/ThemeToggle.accessibility.test.jsx',
    description: 'Tests keyboard navigation, ARIA attributes, and screen reader support'
  },
  {
    name: 'Accessibility Tests - Comprehensive',
    pattern: 'components/__tests__/ThemeAccessibility.comprehensive.test.jsx',
    description: 'Tests WCAG compliance, contrast ratios, and advanced accessibility features'
  },
  {
    name: 'Integration Tests',
    pattern: 'components/__tests__/ThemeIntegration.test.jsx',
    description: 'Tests theme persistence, cross-component updates, and system integration'
  },
  {
    name: 'SSR and Hydration Tests',
    pattern: 'components/__tests__/ThemeSSR.test.jsx',
    description: 'Tests server-side rendering compatibility and hydration behavior'
  },
  {
    name: 'Error Handling Tests',
    pattern: 'components/__tests__/ThemeErrorHandling.test.jsx',
    description: 'Tests error recovery, fallback mechanisms, and error boundaries'
  }
];

// Tenant app tests
const tenantTestSuites = [
  {
    name: 'Tenant ThemeProvider Tests',
    pattern: 'src/components/providers/__tests__/ThemeProvider.test.tsx',
    description: 'Tests custom theme provider implementation for tenant app',
    cwd: path.join(__dirname, '../../../tenant')
  }
];

// Function to run a single test suite
const runTestSuite = (suite, options = {}) => {
  const { cwd = process.cwd(), verbose = false } = options;
  
  try {
    logSubsection(suite.name);
    log(suite.description, 'yellow');
    
    const jestCommand = [
      'npx jest',
      `--testPathPattern="${suite.pattern}"`,
      '--verbose',
      '--colors',
      '--coverage=false', // Disable coverage for individual runs
      verbose ? '--verbose' : '',
      options.watch ? '--watch' : '',
      options.updateSnapshots ? '--updateSnapshot' : ''
    ].filter(Boolean).join(' ');
    
    log(`\nRunning: ${jestCommand}`, 'blue');
    
    execSync(jestCommand, {
      cwd,
      stdio: 'inherit',
      encoding: 'utf8'
    });
    
    log(`✅ ${suite.name} - PASSED`, 'green');
    return { success: true, suite: suite.name };
    
  } catch (error) {
    log(`❌ ${suite.name} - FAILED`, 'red');
    if (options.verbose) {
      log(`Error: ${error.message}`, 'red');
    }
    return { success: false, suite: suite.name, error: error.message };
  }
};

// Function to run all tests with coverage
const runAllTestsWithCoverage = () => {
  try {
    logSection('Running All Theme Tests with Coverage');
    
    const jestCommand = [
      'npx jest',
      '--testPathPattern="(useTheme|ThemeToggle|ThemeIntegration|ThemeSSR|ThemeErrorHandling|ThemeAccessibility)"',
      '--coverage',
      '--coverageDirectory=coverage/theme-tests',
      '--coverageReporters=text,lcov,html',
      '--colors',
      '--verbose'
    ].join(' ');
    
    log(`Running: ${jestCommand}`, 'blue');
    
    execSync(jestCommand, {
      stdio: 'inherit',
      encoding: 'utf8'
    });
    
    log('\n✅ All tests completed with coverage report', 'green');
    log('📊 Coverage report available in: coverage/theme-tests/', 'cyan');
    
    return true;
  } catch (error) {
    log('\n❌ Some tests failed', 'red');
    return false;
  }
};

// Function to run accessibility validation
const runAccessibilityValidation = () => {
  try {
    logSection('Running Accessibility Validation');
    
    const validationScript = path.join(__dirname, 'validate-accessibility.js');
    if (fs.existsSync(validationScript)) {
      execSync(`node ${validationScript}`, {
        stdio: 'inherit',
        encoding: 'utf8'
      });
      log('✅ Accessibility validation completed', 'green');
    } else {
      log('⚠️  Accessibility validation script not found', 'yellow');
    }
  } catch (error) {
    log('❌ Accessibility validation failed', 'red');
  }
};

// Main execution function
const main = () => {
  const args = process.argv.slice(2);
  const options = {
    verbose: args.includes('--verbose') || args.includes('-v'),
    watch: args.includes('--watch') || args.includes('-w'),
    coverage: args.includes('--coverage') || args.includes('-c'),
    accessibility: args.includes('--accessibility') || args.includes('-a'),
    updateSnapshots: args.includes('--updateSnapshot') || args.includes('-u'),
    suite: args.find(arg => arg.startsWith('--suite='))?.split('=')[1]
  };
  
  log('🎨 Theme System Test Runner', 'bright');
  log('Testing comprehensive dark mode toggle implementation\n', 'cyan');
  
  // If specific suite requested
  if (options.suite) {
    const suite = testSuites.find(s => s.name.toLowerCase().includes(options.suite.toLowerCase()));
    if (suite) {
      runTestSuite(suite, options);
      return;
    } else {
      log(`❌ Suite "${options.suite}" not found`, 'red');
      log('Available suites:', 'yellow');
      testSuites.forEach(s => log(`  - ${s.name}`, 'yellow'));
      return;
    }
  }
  
  // Run all tests with coverage if requested
  if (options.coverage) {
    const success = runAllTestsWithCoverage();
    if (options.accessibility) {
      runAccessibilityValidation();
    }
    process.exit(success ? 0 : 1);
    return;
  }
  
  // Run individual test suites
  logSection('Running CommonUI Theme Tests');
  
  const results = [];
  
  // Run CommonUI tests
  for (const suite of testSuites) {
    const result = runTestSuite(suite, options);
    results.push(result);
    
    if (!result.success && !options.verbose) {
      log('Use --verbose flag for detailed error information', 'yellow');
    }
  }
  
  // Run Tenant app tests
  logSection('Running Tenant App Theme Tests');
  
  for (const suite of tenantTestSuites) {
    const result = runTestSuite(suite, options);
    results.push(result);
  }
  
  // Run accessibility validation if requested
  if (options.accessibility) {
    runAccessibilityValidation();
  }
  
  // Summary
  logSection('Test Results Summary');
  
  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  const total = results.length;
  
  log(`Total Tests: ${total}`, 'blue');
  log(`Passed: ${passed}`, 'green');
  log(`Failed: ${failed}`, failed > 0 ? 'red' : 'green');
  
  if (failed > 0) {
    log('\nFailed Tests:', 'red');
    results.filter(r => !r.success).forEach(r => {
      log(`  ❌ ${r.suite}`, 'red');
    });
  }
  
  // Coverage reminder
  if (!options.coverage) {
    log('\n💡 Run with --coverage flag to generate coverage report', 'cyan');
  }
  
  // Exit with appropriate code
  process.exit(failed > 0 ? 1 : 0);
};

// Help function
const showHelp = () => {
  log('🎨 Theme System Test Runner', 'bright');
  log('\nUsage: node run-theme-tests.js [options]', 'cyan');
  log('\nOptions:', 'yellow');
  log('  --verbose, -v          Show detailed output', 'blue');
  log('  --watch, -w            Run tests in watch mode', 'blue');
  log('  --coverage, -c         Run all tests with coverage report', 'blue');
  log('  --accessibility, -a    Run accessibility validation', 'blue');
  log('  --updateSnapshot, -u   Update test snapshots', 'blue');
  log('  --suite=<name>         Run specific test suite', 'blue');
  log('  --help, -h             Show this help message', 'blue');
  log('\nExamples:', 'yellow');
  log('  node run-theme-tests.js --coverage', 'green');
  log('  node run-theme-tests.js --suite=accessibility', 'green');
  log('  node run-theme-tests.js --watch --verbose', 'green');
  log('  node run-theme-tests.js --accessibility', 'green');
};

// Handle help flag
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  showHelp();
  process.exit(0);
}

// Run main function
main();