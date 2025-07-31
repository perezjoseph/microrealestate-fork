#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔄 Merging Missing Translations into Locale Files');
console.log('=================================================\n');

const locales = ['de-DE', 'en', 'es-CO', 'es-DO', 'fr-FR', 'pt-BR'];

function mergeTranslations(locale) {
  const localeDir = path.join('./locales', locale);
  const commonFile = path.join(localeDir, 'common.json');
  const missingFile = path.join(localeDir, 'missing_translations.json');

  if (!fs.existsSync(commonFile)) {
    console.log(`❌ ${locale}: common.json not found`);
    return false;
  }

  if (!fs.existsSync(missingFile)) {
    console.log(`⚠️  ${locale}: no missing_translations.json file found`);
    return true;
  }

  try {
    // Read existing translations
    const existingTranslations = JSON.parse(
      fs.readFileSync(commonFile, 'utf8')
    );

    // Read missing translations
    const missingTranslations = JSON.parse(
      fs.readFileSync(missingFile, 'utf8')
    );

    // Count how many will be added
    const newKeys = Object.keys(missingTranslations).filter(
      (key) => !existingTranslations.hasOwnProperty(key)
    );

    if (newKeys.length === 0) {
      console.log(`✅ ${locale}: No new translations to add`);
      return true;
    }

    // Merge translations
    const mergedTranslations = {
      ...existingTranslations,
      ...missingTranslations
    };

    // Create backup
    const backupFile = commonFile + '.backup.' + Date.now();
    fs.copyFileSync(commonFile, backupFile);

    // Write merged translations
    fs.writeFileSync(
      commonFile,
      JSON.stringify(mergedTranslations, null, 2),
      'utf8'
    );

    console.log(`✅ ${locale}: Added ${newKeys.length} new translations`);
    console.log(`   Backup created: ${path.basename(backupFile)}`);

    // Clean up missing translations file
    fs.unlinkSync(missingFile);

    return true;
  } catch (error) {
    console.log(`❌ ${locale}: Error merging translations - ${error.message}`);
    return false;
  }
}

// Process all locales
let successCount = 0;
let totalCount = 0;

for (const locale of locales) {
  totalCount++;
  if (mergeTranslations(locale)) {
    successCount++;
  }
  console.log('');
}

console.log('📊 Summary:');
console.log(`Successfully processed: ${successCount}/${totalCount} locales`);

if (successCount === totalCount) {
  console.log('🎉 All translations merged successfully!');
  console.log('\n💡 Next steps:');
  console.log('1. Run the translation checker to verify completeness');
  console.log('2. Test the application in different languages');
  console.log('3. Review translations for accuracy and context');

  process.exit(0);
} else {
  console.log('❌ Some translations failed to merge');
  process.exit(1);
}
