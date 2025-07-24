#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const localesDir = './locales';
const localeFiles = fs.readdirSync(localesDir).filter(file => file.endsWith('.json'));

console.log('🌍 Translation Coverage Report\n');
console.log(`Found ${localeFiles.length} locale files: ${localeFiles.join(', ')}\n`);

// Read all locale files
const locales = {};
for (const file of localeFiles) {
  const locale = file.replace('.json', '');
  const filePath = path.join(localesDir, file);
  try {
    locales[locale] = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    console.error(`❌ Error reading ${file}:`, error.message);
  }
}

// Get all unique keys from all locales
const allKeys = new Set();
Object.values(locales).forEach(locale => {
  Object.keys(locale).forEach(key => allKeys.add(key));
});

console.log(`📊 Total unique translation keys: ${allKeys.size}\n`);

// Check coverage for each locale
const coverage = {};
const missingTranslations = {};

Object.keys(locales).forEach(locale => {
  const keys = Object.keys(locales[locale]);
  const missingKeys = Array.from(allKeys).filter(key => !keys.includes(key));
  
  coverage[locale] = {
    total: allKeys.size,
    translated: keys.length,
    missing: missingKeys.length,
    percentage: Math.round((keys.length / allKeys.size) * 100)
  };
  
  if (missingKeys.length > 0) {
    missingTranslations[locale] = missingKeys;
  }
});

// Display coverage summary
console.log('📈 Translation Coverage Summary:');
console.log('================================');
Object.entries(coverage).forEach(([locale, stats]) => {
  const status = stats.percentage === 100 ? '✅' : '⚠️';
  console.log(`${status} ${locale.padEnd(8)} ${stats.percentage}% (${stats.translated}/${stats.total})`);
});

// Display missing translations
console.log('\n🔍 Missing Translations:');
console.log('========================');

if (Object.keys(missingTranslations).length === 0) {
  console.log('🎉 All locales have complete translations!');
} else {
  Object.entries(missingTranslations).forEach(([locale, missing]) => {
    console.log(`\n❌ ${locale} (missing ${missing.length} keys):`);
    missing.forEach(key => {
      console.log(`   - "${key}"`);
    });
  });
}

// Find keys that exist in some locales but not others
console.log('\n🔄 Translation Key Analysis:');
console.log('============================');

const keyAnalysis = {};
Array.from(allKeys).forEach(key => {
  const localesWithKey = Object.keys(locales).filter(locale => 
    locales[locale].hasOwnProperty(key)
  );
  keyAnalysis[key] = localesWithKey;
});

// Find keys that are not in all locales
const incompleteKeys = Object.entries(keyAnalysis).filter(([key, localesWithKey]) => 
  localesWithKey.length < Object.keys(locales).length
);

if (incompleteKeys.length > 0) {
  console.log('\n⚠️  Keys missing from some locales:');
  incompleteKeys.forEach(([key, localesWithKey]) => {
    const missingFrom = Object.keys(locales).filter(locale => 
      !localesWithKey.includes(locale)
    );
    console.log(`   "${key}"`);
    console.log(`     Present in: ${localesWithKey.join(', ')}`);
    console.log(`     Missing from: ${missingFrom.join(', ')}`);
    console.log('');
  });
}

// Generate template for missing translations
console.log('\n📝 Template for Missing Translations:');
console.log('=====================================');

Object.entries(missingTranslations).forEach(([locale, missing]) => {
  if (missing.length > 0) {
    console.log(`\n// Add to ${locale}.json:`);
    missing.forEach(key => {
      // Try to get the English value as reference
      const englishValue = locales['en'] && locales['en'][key] ? locales['en'][key] : '';
      if (typeof englishValue === 'object') {
        console.log(`  "${key}": ${JSON.stringify(englishValue, null, 2).replace(/\n/g, '\n  ')},`);
      } else {
        console.log(`  "${key}": "${englishValue}",`);
      }
    });
  }
});
