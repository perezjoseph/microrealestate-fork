#!/usr/bin/env node

/**
 * Test script for WhatsAppConfigService
 *
 * This script tests the hierarchical configuration resolution:
 * 1. Database configuration (for existing organization)
 * 2. Environment variable fallback (for non-existent organization)
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { getWhatsAppConfigService } from './src/standalone/whatsapp-config-service.js';

// Load environment variables
dotenv.config();

async function testConfigService() {
  console.log('🧪 Testing WhatsApp Configuration Service...\n');

  try {
    // Connect to MongoDB
    const mongoUrl = process.env.MONGO_URL || 'mongodb://localhost:27017/mredb';
    console.log(`📡 Connecting to MongoDB: ${mongoUrl}`);
    await mongoose.connect(mongoUrl);
    console.log('✅ Connected to MongoDB\n');

    const configService = getWhatsAppConfigService();

    // Test 1: Get configuration for existing organization (should use database)
    console.log(
      '🔍 Test 1: Getting config for existing organization (Apartamentos)'
    );
    const existingOrgId = '6886c64de6119456418c4819'; // From our migration
    const dbConfig = await configService.getWhatsAppConfig(existingOrgId);

    console.log(`📊 Configuration source: ${dbConfig.source}`);
    console.log(`📊 WhatsApp enabled: ${dbConfig.selected}`);
    console.log(`📊 Default language: ${dbConfig.defaultLanguage}`);
    console.log(`📊 API configured: ${dbConfig.isApiConfigured()}`);
    console.log(`📊 Mode: ${dbConfig.getMode()}`);

    // Test template access
    const invoiceTemplate = configService.getTemplate(dbConfig, 'invoice');
    console.log(
      `📊 Invoice template: ${invoiceTemplate.name} (${invoiceTemplate.language})`
    );
    console.log(
      `📊 Invoice parameters: ${invoiceTemplate.parameters.join(', ')}\n`
    );

    // Test 2: Get configuration for non-existent organization (should use environment)
    console.log('🔍 Test 2: Getting config for non-existent organization');
    const nonExistentOrgId = '507f1f77bcf86cd799439011'; // Random ObjectId
    const envConfig = await configService.getWhatsAppConfig(nonExistentOrgId);

    console.log(`📊 Configuration source: ${envConfig.source}`);
    console.log(`📊 WhatsApp enabled: ${envConfig.selected}`);
    console.log(`📊 Default language: ${envConfig.defaultLanguage}`);
    console.log(`📊 API configured: ${envConfig.isApiConfigured()}`);
    console.log(`📊 Mode: ${envConfig.getMode()}`);

    const envInvoiceTemplate = configService.getTemplate(envConfig, 'invoice');
    console.log(
      `📊 Invoice template: ${envInvoiceTemplate.name} (${envInvoiceTemplate.language})`
    );
    console.log(
      `📊 Invoice parameters: ${envInvoiceTemplate.parameters.join(', ')}\n`
    );

    // Test 3: Check WhatsApp enabled status
    console.log('🔍 Test 3: Checking WhatsApp enabled status');
    const isEnabledExisting =
      await configService.isWhatsAppEnabled(existingOrgId);
    const isEnabledNonExistent =
      await configService.isWhatsAppEnabled(nonExistentOrgId);

    console.log(`📊 Existing org WhatsApp enabled: ${isEnabledExisting}`);
    console.log(
      `📊 Non-existent org WhatsApp enabled: ${isEnabledNonExistent}\n`
    );

    // Test 4: Template types
    console.log('🔍 Test 4: Testing all template types');
    const templateTypes = [
      'invoice',
      'paymentNotice',
      'paymentReminder',
      'finalNotice',
      'login'
    ];

    for (const templateType of templateTypes) {
      const template = configService.getTemplate(dbConfig, templateType);
      console.log(
        `📊 ${templateType}: ${template.name} (${template.parameters.length} params)`
      );
    }

    // Test 5: Cache functionality
    console.log('\n🔍 Test 5: Testing cache functionality');
    console.time('First call (no cache)');
    await configService.getWhatsAppConfig(existingOrgId);
    console.timeEnd('First call (no cache)');

    console.time('Second call (cached)');
    await configService.getWhatsAppConfig(existingOrgId);
    console.timeEnd('Second call (cached)');

    // Clear cache and test again
    configService.clearCache(existingOrgId);
    console.time('After cache clear');
    await configService.getWhatsAppConfig(existingOrgId);
    console.timeEnd('After cache clear');

    console.log('\n🎉 All tests completed successfully!');
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('📡 Disconnected from MongoDB');
  }
}

// Run tests
testConfigService()
  .then(() => {
    console.log('🏁 Test script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Test script failed:', error);
    process.exit(1);
  });
