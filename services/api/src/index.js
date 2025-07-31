import { EnvironmentConfig, logger, Service } from '@microrealestate/common';
import migratedb from '../scripts/migration.js';
import { restoreDB } from '../scripts/dbbackup.js';
import routes from './routes.js';
import {
  DEFAULT_CONFIG,
  validateConfig,
  parseBoolean
} from './config/defaults.js';
import { initializeI18n } from './config/i18n.js';

// Initialize internationalization
initializeI18n();

async function onStartUp(application) {
  const startTime = Date.now();
  logger.info('Starting API service initialization...');

  try {
    const { RESTORE_DB } = Service.getInstance().envConfig.getValues();

    if (RESTORE_DB) {
      logger.info('Restoring database from backup...');
      await restoreDB();
      logger.info('Database restored successfully');
    }

    // Migrate database to new models
    logger.info('Running database migrations...');
    await migratedb();
    logger.info('Database migrations completed');

    // Setup routes
    logger.info('Setting up API routes...');
    application.use(routes());

    const duration = Date.now() - startTime;
    logger.info(`API service initialization completed in ${duration}ms`);
  } catch (error) {
    logger.error('Failed during service startup:', {
      error: error.message,
      stack: error.stack,
      phase: 'onStartUp'
    });
    throw error; // Re-throw to trigger main error handler
  }
}

async function Main() {
  let service;
  try {
    service = await initializeService();
    await service.startUp();
  } catch (err) {
    await handleStartupError(err, service);
  }
}

async function initializeService() {
  const config = {
    DEMO_MODE: parseBoolean(
      process.env.DEMO_MODE,
      DEFAULT_CONFIG.FEATURES.DEMO_MODE
    ),
    RESTORE_DB: parseBoolean(
      process.env.RESTORE_DB,
      DEFAULT_CONFIG.FEATURES.RESTORE_DB
    ),
    EMAILER_URL: process.env.EMAILER_URL || DEFAULT_CONFIG.URLS.EMAILER,
    PDFGENERATOR_URL:
      process.env.PDFGENERATOR_URL || DEFAULT_CONFIG.URLS.PDFGENERATOR
  };

  validateConfig(config);

  const envConfig = new EnvironmentConfig(config);
  const service = Service.getInstance(envConfig);

  await service.init({
    name: 'api',
    useMongo: true,
    useAxios: true,
    onStartUp
  });

  return service;
}

async function handleStartupError(err, service) {
  logger.error('Failed to start API service:', {
    error: err.message,
    stack: err.stack,
    timestamp: new Date().toISOString()
  });

  if (service) {
    try {
      await service.shutDown(1);
    } catch (shutdownErr) {
      logger.error('Error during service shutdown:', shutdownErr);
      process.exit(1);
    }
  } else {
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('Received SIGTERM, initiating graceful shutdown...');
  const service = Service.getInstance();
  if (service) {
    await service.shutDown(0);
  }
});

process.on('SIGINT', async () => {
  logger.info('Received SIGINT, initiating graceful shutdown...');
  const service = Service.getInstance();
  if (service) {
    await service.shutDown(0);
  }
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', {
    error: error.message,
    stack: error.stack
  });
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', {
    promise,
    reason: reason?.message || reason
  });
  process.exit(1);
});

Main();
