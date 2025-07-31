#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const localesDir = './locales';

// Function to recursively get all keys from a nested object
function getAllKeys(obj, prefix = '') {
  const keys = new Set();

  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    keys.add(fullKey);

    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      const nestedKeys = getAllKeys(value, fullKey);
      nestedKeys.forEach((k) => keys.add(k));
    }
  }

  return keys;
}

// Function to check if a nested key exists in an object
function hasNestedKey(obj, keyPath) {
  const keys = keyPath.split('.');
  let current = obj;

  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = current[key];
    } else {
      return false;
    }
  }

  return true;
}

// Function to get nested value from object
function getNestedValue(obj, keyPath) {
  const keys = keyPath.split('.');
  let current = obj;

  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = current[key];
    } else {
      return undefined;
    }
  }

  return current;
}

// Get all locale directories
const localeDirs = fs
  .readdirSync(localesDir)
  .filter((dir) => fs.statSync(path.join(localesDir, dir)).isDirectory());

console.log('🌍 Landlord Translation Coverage Report\n');
console.log(
  `Found ${localeDirs.length} locale directories: ${localeDirs.join(', ')}\n`
);

// Read all locale files
const locales = {};
for (const dir of localeDirs) {
  const commonFile = path.join(localesDir, dir, 'common.json');
  if (fs.existsSync(commonFile)) {
    try {
      locales[dir] = JSON.parse(fs.readFileSync(commonFile, 'utf8'));
    } catch (error) {
      console.error(`❌ Error reading ${dir}/common.json:`, error.message);
    }
  } else {
    console.warn(`⚠️  Missing common.json in ${dir} directory`);
  }
}

// Get all unique keys from all locales
const allKeys = new Set();
Object.values(locales).forEach((locale) => {
  const keys = getAllKeys(locale);
  keys.forEach((key) => allKeys.add(key));
});

console.log(`📊 Total unique translation keys: ${allKeys.size}\n`);

// Check coverage for each locale
const coverage = {};
const missingTranslations = {};

Object.keys(locales).forEach((locale) => {
  const localeKeys = getAllKeys(locales[locale]);
  const missingKeys = Array.from(allKeys).filter((key) => !localeKeys.has(key));

  coverage[locale] = {
    total: allKeys.size,
    translated: localeKeys.size,
    missing: missingKeys.length,
    percentage: Math.round((localeKeys.size / allKeys.size) * 100)
  };

  if (missingKeys.length > 0) {
    missingTranslations[locale] = missingKeys;
  }
});

// Display coverage summary
console.log('📈 Translation Coverage Summary:');
console.log('================================');
Object.entries(coverage).forEach(([locale, stats]) => {
  const status = stats.percentage === 100 ? '✅' : '❌';
  console.log(
    `${status} ${locale.padEnd(8)} ${stats.percentage}% (${stats.translated}/${stats.total})`
  );
});

// Display missing translations
console.log('\n🔍 Missing Translations:');
console.log('========================');

if (Object.keys(missingTranslations).length === 0) {
  console.log('🎉 All locales have complete translations!');
} else {
  Object.entries(missingTranslations).forEach(([locale, missing]) => {
    console.log(`\n❌ ${locale} (missing ${missing.length} keys):`);
    missing.forEach((key) => {
      console.log(`   - "${key}"`);
    });
  });
}

// Find keys that exist in some locales but not others
console.log('\n🔍 Translation Key Analysis:');
console.log('============================');

const keyAnalysis = {};
Array.from(allKeys).forEach((key) => {
  const localesWithKey = Object.keys(locales).filter((locale) =>
    hasNestedKey(locales[locale], key)
  );
  keyAnalysis[key] = localesWithKey;
});

// Find keys that are not in all locales
const incompleteKeys = Object.entries(keyAnalysis).filter(
  ([key, localesWithKey]) => localesWithKey.length < Object.keys(locales).length
);

if (incompleteKeys.length > 0) {
  console.log('\n⚠️  Keys missing from some locales:');
  incompleteKeys.forEach(([key, localesWithKey]) => {
    const missingFrom = Object.keys(locales).filter(
      (locale) => !localesWithKey.includes(locale)
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
    console.log(`\n// Add to ${locale}/common.json:`);

    // Group keys by their parent object for better organization
    const keysByParent = {};
    missing.forEach((key) => {
      const parts = key.split('.');
      const parentKey = parts.slice(0, -1).join('.');
      const leafKey = parts[parts.length - 1];

      if (!keysByParent[parentKey]) {
        keysByParent[parentKey] = [];
      }
      keysByParent[parentKey].push({ fullKey: key, leafKey });
    });

    Object.entries(keysByParent).forEach(([parentKey, keys]) => {
      if (parentKey) {
        console.log(`\n  // In ${parentKey} object:`);
      }

      keys.forEach(({ fullKey, leafKey }) => {
        // Try to get the English value as reference
        const englishValue = locales['en']
          ? getNestedValue(locales['en'], fullKey)
          : '';
        if (typeof englishValue === 'object' && englishValue !== null) {
          console.log(
            `  "${leafKey}": ${JSON.stringify(englishValue, null, 2).replace(/\n/g, '\n  ')},`
          );
        } else {
          console.log(`  "${leafKey}": "${englishValue || ''}",`);
        }
      });
    });
  }
});

// Summary statistics
console.log('\n📊 Summary Statistics:');
console.log('======================');
const totalKeys = allKeys.size;
const totalTranslations = Object.values(coverage).reduce(
  (sum, stats) => sum + stats.translated,
  0
);
const maxPossibleTranslations = totalKeys * Object.keys(locales).length;
const overallPercentage = Math.round(
  (totalTranslations / maxPossibleTranslations) * 100
);

console.log(`Total unique keys: ${totalKeys}`);
console.log(`Total locales: ${Object.keys(locales).length}`);
console.log(`Overall translation coverage: ${overallPercentage}%`);
console.log(
  `Total translations: ${totalTranslations}/${maxPossibleTranslations}`
);

// Exit with error code if translations are incomplete
const hasIncompleteTranslations = Object.values(coverage).some(
  (stats) => stats.percentage < 100
);
if (hasIncompleteTranslations) {
  console.log('\n❌ Some translations are incomplete!');
  process.exit(1);
} else {
  console.log('\n✅ All translations are complete!');
  process.exit(0);
}
