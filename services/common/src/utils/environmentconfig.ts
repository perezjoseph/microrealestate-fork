import _ from 'lodash';
import { EnvironmentValues } from '@microrealestate/types';
import logger from './logger.js';

// Validation helper for required environment variables
function requireEnvVar(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`Required environment variable ${name} is not set`);
  }
  return value;
}

const baseEnvironmentValues = {
  LOGGER_LEVEL: process.env.LOGGER_LEVEL || 'debug',
  PRODUCTION: process.env.NODE_ENV === 'production',
  PORT: Number(process.env.PORT || 8080),
  
  // Database and cache connections (required)
  MONGO_URL: requireEnvVar('MONGO_URL', process.env.MONGO_URL),
  VALKEY_URL: requireEnvVar('VALKEY_URL', process.env.VALKEY_URL),
  VALKEY_PASSWORD: process.env.VALKEY_PASSWORD,

  // Security tokens (required for production)
  ACCESS_TOKEN_SECRET: requireEnvVar('ACCESS_TOKEN_SECRET', process.env.ACCESS_TOKEN_SECRET),
  REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET,
  APPCREDZ_TOKEN_SECRET: process.env.APPCREDZ_TOKEN_SECRET,
  RESET_TOKEN_SECRET: process.env.RESET_TOKEN_SECRET,
  
  // Encryption keys (required for production)
  CIPHER_KEY: process.env.CIPHER_KEY,
  CIPHER_IV_KEY: process.env.CIPHER_IV_KEY
} as const;

const keysToEscape: string[] = [
  'password',
  'token',
  'secret',
  'cipher',
  'apiKey'
];

const urlsToEscape: string[] = ['url', 'uri', 'endpoint'];

function obfuscateValue<T>(key: string, value: T): T {
  if (typeof value === 'string') {
    const lowerKey = key.toLowerCase();
    
    if (keysToEscape.some(keyToEscape => lowerKey.includes(keyToEscape.toLowerCase()))) {
      return '****' as T;
    }

    if (urlsToEscape.some(urlToEscape => lowerKey.includes(urlToEscape))) {
      return value.replace(/:\/\/.*@/, '://****:****@') as T;
    }
  }

  if (value instanceof Object) {
    const obfuscatedObject: Record<string, T> = {};
    Object.entries(value).forEach(([subKey, subValue]) => {
      obfuscatedObject[subKey] = obfuscateValue(subKey, subValue);
    });
    return obfuscatedObject as T;
  }

  return value;
}

export default class EnvironmentConfig {
  private envValues: Readonly<EnvironmentValues>;
  private obfuscatedValues: Record<string, unknown>;

  constructor(envValues?: EnvironmentValues) {
    this.envValues = envValues 
      ? { ...baseEnvironmentValues, ...envValues }
      : baseEnvironmentValues;
    
    this.obfuscatedValues = _.cloneDeep<EnvironmentValues>(this.envValues);
    Object.entries(this.obfuscatedValues).forEach(([key, value]) => {
      this.obfuscatedValues[key] = obfuscateValue<typeof value>(key, value);
    });
  }

  getValues() {
    return this.envValues;
  }

  getObfuscatedValues() {
    return this.obfuscatedValues;
  }

  log() {
    logger.debug('Environment variables set:');
    Object.entries(this.obfuscatedValues)
      .sort(([key1], [key2]) => key1.localeCompare(key2))
      .filter(([, value]) => {
        return value !== undefined && value !== null;
      })
      .reduce((acc, [key, value]) => {
        acc.push(`${key}: ${JSON.stringify(value)}`);
        return acc;
      }, [] as string[])
      .forEach((configLine) => logger.debug(configLine));
  }
}
