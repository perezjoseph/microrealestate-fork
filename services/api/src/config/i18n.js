import i18n from 'i18n';
import { fileURLToPath } from 'url';
import path from 'path';
import { logger } from '@microrealestate/common';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Supported locales for the API service
 */
export const SUPPORTED_LOCALES = ['en', 'fr-FR', 'pt-BR', 'de-DE', 'es-CO'];

/**
 * Initializes internationalization configuration
 */
export function initializeI18n() {
  try {
    i18n.configure({
      locales: SUPPORTED_LOCALES,
      directory: path.join(__dirname, '..', 'locales'),
      updateFiles: false,
      defaultLocale: 'en',
      objectNotation: true
    });

    logger.info(
      `i18n initialized with locales: ${SUPPORTED_LOCALES.join(', ')}`
    );
  } catch (error) {
    logger.error('Failed to initialize i18n:', error);
    throw error;
  }
}

export default i18n;
