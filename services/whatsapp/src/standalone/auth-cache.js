/**
 * Authentication caching utilities
 */

/**
 * Simple in-memory cache for JWT verification results
 * In production, consider using Redis for distributed caching
 */
class AuthCache {
  constructor(options = {}) {
    this.cache = new Map();
    this.maxSize = options.maxSize || 1000;
    this.ttl = options.ttl || 5 * 60 * 1000; // 5 minutes default
    this.cleanupInterval = options.cleanupInterval || 60 * 1000; // 1 minute
    this.hitCount = 0;
    this.missCount = 0;

    // Start cleanup interval
    this.startCleanup();
  }

  /**
   * Get cached JWT verification result
   * @param {string} tokenHash - Hash of the JWT token
   * @returns {Object|null} Cached result or null
   */
  get(tokenHash) {
    const entry = this.cache.get(tokenHash);

    if (!entry) {
      this.missCount++;
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(tokenHash);
      this.missCount++;
      return null;
    }

    // Update access time for LRU
    entry.lastAccessed = Date.now();
    this.hitCount++;
    return entry.data;
  }

  /**
   * Cache JWT verification result
   * @param {string} tokenHash - Hash of the JWT token
   * @param {Object} data - Verification result to cache
   */
  set(tokenHash, data) {
    // Implement simple LRU eviction
    if (this.cache.size >= this.maxSize) {
      this.evictOldest();
    }

    this.cache.set(tokenHash, {
      data,
      createdAt: Date.now(),
      lastAccessed: Date.now(),
      expiresAt: Date.now() + this.ttl
    });
  }

  /**
   * Remove entry from cache
   * @param {string} tokenHash - Hash of the JWT token
   */
  delete(tokenHash) {
    this.cache.delete(tokenHash);
  }

  /**
   * Clear all cached entries
   */
  clear() {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   * @returns {Object} Cache statistics
   */
  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: this.hitCount / (this.hitCount + this.missCount) || 0,
      hits: this.hitCount || 0,
      misses: this.missCount || 0
    };
  }

  /**
   * Evict oldest entry (LRU)
   */
  evictOldest() {
    let oldestKey = null;
    let oldestTime = Date.now();

    for (const [key, entry] of this.cache) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  /**
   * Start periodic cleanup of expired entries
   */
  startCleanup() {
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.cleanupInterval);
  }

  /**
   * Stop periodic cleanup
   */
  stopCleanup() {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }

  /**
   * Remove expired entries
   */
  cleanup() {
    const now = Date.now();
    const expiredKeys = [];

    for (const [key, entry] of this.cache) {
      if (now > entry.expiresAt) {
        expiredKeys.push(key);
      }
    }

    expiredKeys.forEach((key) => this.cache.delete(key));
  }

  /**
   * Create a hash of the token for caching (without exposing the actual token)
   * @param {string} token - JWT token
   * @returns {string} Hash of the token
   */
  static hashToken(token) {
    if (!token || typeof token !== 'string') {
      throw new Error('Token must be a non-empty string');
    }

    // Use crypto module for secure hashing
    try {
      const crypto = require('crypto');
      return crypto
        .createHash('sha256')
        .update(token)
        .digest('hex')
        .substring(0, 16);
    } catch (error) {
      // Fallback to simple hash if crypto is not available
      let hash = 0;
      for (let i = 0; i < token.length; i++) {
        const char = token.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash; // Convert to 32-bit integer
      }
      return hash.toString(36);
    }
  }
}

// Singleton instance
let authCacheInstance = null;

/**
 * Get or create auth cache instance
 * @param {Object} options - Cache options
 * @returns {AuthCache} Cache instance
 */
export function getAuthCache(options = {}) {
  if (!authCacheInstance) {
    authCacheInstance = new AuthCache(options);
  }
  return authCacheInstance;
}

export { AuthCache };
