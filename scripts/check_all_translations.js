#!/usr/bin/env node
/* eslint-env node */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🌍 MicroRealEstate - Complete Translation Coverage Report');
console.log('=========================================================\n');

// Function to run a command and capture output
function runCommand(command, cwd) {
  try {
    const output = execSync(command, { 
      cwd, 
      encoding: 'utf8',
      stdio: 'pipe'
    });
    return { success: true, output };
  } catch (error) {
    return { success: false, output: error.stdout || error.message, error: error.stderr };
  }
}

// Check tenant webapp translations
console.log('🏠 Checking Tenant Webapp Translations...');
console.log('==========================================');

const tenantResult = runCommand('node check_translations.js', './webapps/tenant');
console.log(tenantResult.output);

if (!tenantResult.success) {
  console.log('❌ Tenant webapp has translation issues\n');
} else {
  console.log('✅ Tenant webapp translations checked\n');
}

// Check landlord webapp translations
console.log('🏢 Checking Landlord Webapp Translations...');
console.log('=============================================');

const landlordResult = runCommand('node check_translations.js', './webapps/landlord');
console.log(landlordResult.output);

if (!landlordResult.success) {
  console.log('❌ Landlord webapp has translation issues\n');
} else {
  console.log('✅ Landlord webapp translations checked\n');
}

// Summary
console.log('📊 Overall Summary');
console.log('==================');

const tenantComplete = tenantResult.success;
const landlordComplete = landlordResult.success;

if (tenantComplete && landlordComplete) {
  console.log('🎉 All translations are complete across both webapps!');
  process.exit(0);
} else {
  console.log('❌ Some translations are missing:');
  if (!tenantComplete) {
    console.log('   - Tenant webapp has missing translations');
  }
  if (!landlordComplete) {
    console.log('   - Landlord webapp has missing translations');
  }
  
  console.log('\n💡 Next Steps:');
  console.log('   1. Review the missing translations listed above');
  console.log('   2. Add the missing keys to the respective locale files');
  console.log('   3. Run this script again to verify completeness');
  console.log('   4. Consider using translation services for non-English locales');
  
  process.exit(1);
}
