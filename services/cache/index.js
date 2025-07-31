const { createClient } = require('redis');
const logger = require('./logger');

class ValkeyCache {
  constructor() {
    this.client = null;
    this.isConnected = false;
  }

  async connect() {
    try {
      this.client = createClient({
        url: process.env.VALKEY_URL || 'valkey://valkey:6379',
        password: process.env.VALKEY_PASSWORD,
        socket: {
          reconnectStrategy: (retries) => Math.min(retries * 50, 500)
        }
      });

      this.client.on('error', (err) => {
        logger.error('Valkey Client Error:', err);
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        logger.info('Connected to Valkey');
        this.isConnected = true;
      });

      this.client.on('reconnecting', () => {
        logger.info('Reconnecting to Valkey...');
      });

      await this.client.connect();
      return this.client;
    } catch (error) {
      logger.error('Failed to connect to Valkey:', error);
      throw error;
    }
  }

  // Property Management Specific Caching
  async cacheProperty(propertyId, propertyData, ttl = 3600) {
    if (!this.isConnected) return false;
    
    try {
      const key = `property:${propertyId}`;
      await this.client.setEx(key, ttl, JSON.stringify(propertyData));
      logger.info(`Cached property: ${propertyId}`);
      return true;
    } catch (error) {
      logger.error('Error caching property:', error);
      return false;
    }
  }

  async getProperty(propertyId) {
    if (!this.isConnected) return null;
    
    try {
      const key = `property:${propertyId}`;
      const data = await this.client.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      logger.error('Error retrieving property from cache:', error);
      return null;
    }
  }

  // Tenant Caching
  async cacheTenant(tenantId, tenantData, ttl = 1800) {
    if (!this.isConnected) return false;
    
    try {
      const key = `tenant:${tenantId}`;
      await this.client.setEx(key, ttl, JSON.stringify(tenantData));
      logger.info(`Cached tenant: ${tenantId}`);
      return true;
    } catch (error) {
      logger.error('Error caching tenant:', error);
      return false;
    }
  }

  async getTenant(tenantId) {
    if (!this.isConnected) return null;
    
    try {
      const key = `tenant:${tenantId}`;
      const data = await this.client.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      logger.error('Error retrieving tenant from cache:', error);
      return null;
    }
  }

  // Invoice Template Caching
  async cacheInvoiceTemplate(templateId, templateData, ttl = 7200) {
    if (!this.isConnected) return false;
    
    try {
      const key = `invoice_template:${templateId}`;
      await this.client.setEx(key, ttl, JSON.stringify(templateData));
      logger.info(`Cached invoice template: ${templateId}`);
      return true;
    } catch (error) {
      logger.error('Error caching invoice template:', error);
      return false;
    }
  }

  async getInvoiceTemplate(templateId) {
    if (!this.isConnected) return null;
    
    try {
      const key = `invoice_template:${templateId}`;
      const data = await this.client.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      logger.error('Error retrieving invoice template from cache:', error);
      return null;
    }
  }

  // WhatsApp Message Rate Limiting
  async checkWhatsAppRateLimit(phoneNumber, limit = 10, window = 3600) {
    if (!this.isConnected) return true; // Allow if cache unavailable
    
    try {
      const key = `whatsapp_rate:${phoneNumber}`;
      const current = await this.client.incr(key);
      
      if (current === 1) {
        await this.client.expire(key, window);
      }
      
      const allowed = current <= limit;
      if (!allowed) {
        logger.warn(`WhatsApp rate limit exceeded for ${phoneNumber}: ${current}/${limit}`);
      }
      
      return allowed;
    } catch (error) {
      logger.error('Error checking WhatsApp rate limit:', error);
      return true; // Allow on error
    }
  }

  // Session Management with Sliding Expiration
  async setSession(sessionId, sessionData, ttl = 3600) {
    if (!this.isConnected) return false;
    
    try {
      const key = `session:${sessionId}`;
      await this.client.setEx(key, ttl, JSON.stringify({
        ...sessionData,
        lastAccess: Date.now()
      }));
      return true;
    } catch (error) {
      logger.error('Error setting session:', error);
      return false;
    }
  }

  async getSession(sessionId, extendTtl = true) {
    if (!this.isConnected) return null;
    
    try {
      const key = `session:${sessionId}`;
      const data = await this.client.get(key);
      
      if (data && extendTtl) {
        // Implement sliding expiration
        await this.client.expire(key, 3600);
      }
      
      return data ? JSON.parse(data) : null;
    } catch (error) {
      logger.error('Error retrieving session:', error);
      return null;
    }
  }

  // Cache Statistics
  async getCacheStats() {
    if (!this.isConnected) return null;
    
    try {
      const info = await this.client.info('memory');
      const keyspace = await this.client.info('keyspace');
      
      return {
        memory: info,
        keyspace: keyspace,
        connected: this.isConnected
      };
    } catch (error) {
      logger.error('Error getting cache stats:', error);
      return null;
    }
  }

  // Cleanup expired keys
  async cleanup() {
    if (!this.isConnected) return;
    
    try {
      // Get all keys with patterns
      const patterns = ['property:*', 'tenant:*', 'invoice_template:*', 'session:*'];
      
      for (const pattern of patterns) {
        const keys = await this.client.keys(pattern);
        logger.info(`Found ${keys.length} keys matching ${pattern}`);
      }
    } catch (error) {
      logger.error('Error during cleanup:', error);
    }
  }

  async disconnect() {
    if (this.client) {
      await this.client.quit();
      this.isConnected = false;
      logger.info('Disconnected from Valkey');
    }
  }
}

module.exports = new ValkeyCache();

// Start the cache service
async function startCacheService() {
  const cache = module.exports;
  
  try {
    await cache.connect();
    console.log('Cache service started successfully on port', process.env.PORT || 8600);
    
    // Keep the process alive
    process.on('SIGTERM', async () => {
      console.log('Received SIGTERM, shutting down gracefully');
      await cache.disconnect();
      process.exit(0);
    });
    
    process.on('SIGINT', async () => {
      console.log('Received SIGINT, shutting down gracefully');
      await cache.disconnect();
      process.exit(0);
    });
    
    // Keep process alive
    setInterval(() => {
      // Periodic cleanup every 5 minutes
      cache.cleanup();
    }, 5 * 60 * 1000);
    
  } catch (error) {
    console.error('Failed to start cache service:', error);
    process.exit(1);
  }
}

// Start the service if this file is run directly
if (require.main === module) {
  startCacheService();
}
