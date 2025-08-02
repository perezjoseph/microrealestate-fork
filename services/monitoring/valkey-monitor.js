const express = require('express');
const rateLimit = require('express-rate-limit');
const { createClient } = require('redis');

const app = express();
const port = process.env.MONITOR_PORT || 8800;

// Rate limiting configuration
const createRateLimiter = (windowMs, max, message) => rateLimit({
  windowMs,
  max,
  message: { error: message },
  standardHeaders: true,
  legacyHeaders: false,
});

// Different rate limits for different endpoints
const generalLimiter = createRateLimiter(15 * 60 * 1000, 100, 'Too many requests, please try again later'); // 100 requests per 15 minutes
const statsLimiter = createRateLimiter(1 * 60 * 1000, 30, 'Too many stats requests, please try again later'); // 30 requests per minute
const healthLimiter = createRateLimiter(1 * 60 * 1000, 60, 'Too many health check requests'); // 60 requests per minute

let valkeyClient;

// Initialize Valkey connection
async function initValkey() {
  try {
    valkeyClient = createClient({
      url: process.env.VALKEY_URL || 'valkey://valkey:6379',
      password: process.env.VALKEY_PASSWORD
    });
    
    await valkeyClient.connect();
    console.log('Valkey Monitor connected to Valkey');
  } catch (error) {
    console.error('Failed to connect to Valkey:', error);
  }
}

// Middleware
app.use(express.json());
app.use(generalLimiter); // Apply general rate limiting to all routes

// Health check
app.get('/health', healthLimiter, (req, res) => {
  res.json({
    status: 'OK',
    service: 'Valkey Monitor',
    timestamp: new Date().toISOString(),
    valkeyConnected: valkeyClient?.isReady || false
  });
});

// Valkey statistics
app.get('/valkey/stats', statsLimiter, async (req, res) => {
  try {
    if (!valkeyClient?.isReady) {
      return res.status(503).json({ error: 'Valkey not connected' });
    }

    const [info, keyspace, memory] = await Promise.all([
      valkeyClient.info(),
      valkeyClient.info('keyspace'),
      valkeyClient.info('memory')
    ]);

    // Get key counts by pattern
    const patterns = ['property:*', 'tenant:*', 'session:*', 'whatsapp_rate:*', 'invoice_template:*'];
    const keyCounts = {};
    
    for (const pattern of patterns) {
      try {
        const keys = await valkeyClient.keys(pattern);
        keyCounts[pattern] = keys.length;
      } catch (error) {
        keyCounts[pattern] = 'error';
      }
    }

    res.json({
      timestamp: new Date().toISOString(),
      connection: {
        status: 'connected',
        uptime: info.match(/uptime_in_seconds:(\d+)/)?.[1] || 'unknown'
      },
      memory: {
        used: memory.match(/used_memory_human:([^\r\n]+)/)?.[1] || 'unknown',
        peak: memory.match(/used_memory_peak_human:([^\r\n]+)/)?.[1] || 'unknown',
        rss: memory.match(/used_memory_rss_human:([^\r\n]+)/)?.[1] || 'unknown'
      },
      keyspace: keyspace,
      keyCounts,
      performance: {
        commands_processed: info.match(/total_commands_processed:(\d+)/)?.[1] || 'unknown',
        connections_received: info.match(/total_connections_received:(\d+)/)?.[1] || 'unknown',
        connected_clients: info.match(/connected_clients:(\d+)/)?.[1] || 'unknown'
      }
    });
  } catch (error) {
    console.error('Error getting Valkey stats:', error);
    res.status(500).json({ error: 'Failed to get Valkey statistics' });
  }
});

// Get cached properties
app.get('/cache/properties', statsLimiter, async (req, res) => {
  try {
    if (!valkeyClient?.isReady) {
      return res.status(503).json({ error: 'Valkey not connected' });
    }

    const keys = await valkeyClient.keys('property:*');
    const properties = [];

    for (const key of keys.slice(0, 10)) { // Limit to first 10
      try {
        const data = await valkeyClient.get(key);
        const ttl = await valkeyClient.ttl(key);
        properties.push({
          key,
          ttl,
          data: data ? JSON.parse(data) : null
        });
      } catch (error) {
        properties.push({ key, error: error.message });
      }
    }

    res.json({
      total: keys.length,
      showing: properties.length,
      properties
    });
  } catch (error) {
    console.error('Error getting cached properties:', error);
    res.status(500).json({ error: 'Failed to get cached properties' });
  }
});

// Clear cache by pattern
app.delete('/cache/:pattern', statsLimiter, async (req, res) => {
  try {
    if (!valkeyClient?.isReady) {
      return res.status(503).json({ error: 'Valkey not connected' });
    }

    const pattern = req.params.pattern + ':*';
    const keys = await valkeyClient.keys(pattern);
    
    if (keys.length > 0) {
      await valkeyClient.del(keys);
    }

    res.json({
      message: `Cleared ${keys.length} keys matching pattern: ${pattern}`,
      clearedKeys: keys.length
    });
  } catch (error) {
    console.error('Error clearing cache:', error);
    res.status(500).json({ error: 'Failed to clear cache' });
  }
});

// WhatsApp rate limit status
app.get('/whatsapp/rate-limits', async (req, res) => {
  try {
    if (!valkeyClient?.isReady) {
      return res.status(503).json({ error: 'Valkey not connected' });
    }

    const keys = await valkeyClient.keys('whatsapp_rate:*');
    const rateLimits = [];

    for (const key of keys) {
      try {
        const count = await valkeyClient.get(key);
        const ttl = await valkeyClient.ttl(key);
        rateLimits.push({
          phoneNumber: key.replace('whatsapp_rate:', ''),
          count: parseInt(count),
          ttl,
          resetIn: ttl > 0 ? `${Math.floor(ttl / 60)}m ${ttl % 60}s` : 'expired'
        });
      } catch (error) {
        rateLimits.push({ key, error: error.message });
      }
    }

    res.json({
      total: keys.length,
      rateLimits: rateLimits.sort((a, b) => b.count - a.count)
    });
  } catch (error) {
    console.error('Error getting WhatsApp rate limits:', error);
    res.status(500).json({ error: 'Failed to get WhatsApp rate limits' });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Valkey Monitor running on port ${port}`);
  initValkey();
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Shutting down Valkey Monitor...');
  if (valkeyClient) {
    await valkeyClient.quit();
  }
  process.exit(0);
});
