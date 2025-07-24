import { logger } from '@microrealestate/common';

/**
 * Security monitoring middleware to track suspicious activities
 */
export const securityMonitoring = (req, res, next) => {
  const startTime = Date.now();
  const originalSend = res.send;
  
  // Override res.send to capture response details
  res.send = function(data) {
    const responseTime = Date.now() - startTime;
    const statusCode = res.statusCode;
    
    // Log security-relevant events
    if (statusCode === 401 || statusCode === 403) {
      logger.warn('Authentication/Authorization failure', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        path: req.path,
        method: req.method,
        statusCode,
        responseTime,
        email: req.body?.email,
        timestamp: new Date().toISOString()
      });
    }
    
    if (statusCode === 429) {
      logger.warn('Rate limit exceeded', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        path: req.path,
        method: req.method,
        statusCode,
        responseTime,
        timestamp: new Date().toISOString()
      });
    }
    
    // Log successful authentications for audit trail
    if (statusCode === 200 && req.path.includes('signin')) {
      logger.info('Successful authentication', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        path: req.path,
        method: req.method,
        email: req.body?.email,
        timestamp: new Date().toISOString()
      });
    }
    
    return originalSend.call(this, data);
  };
  
  next();
};

/**
 * Detect suspicious patterns in requests
 */
export const suspiciousActivityDetector = (req, res, next) => {
  const suspiciousPatterns = [
    // SQL injection patterns
    /(\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b)/i,
    // XSS patterns
    /<script[^>]*>.*?<\/script>/gi,
    // Path traversal
    /\.\.[/\\]/,
    // Command injection
    /[;&|`$(){}[\]]/
  ];
  
  const requestData = JSON.stringify({
    body: req.body,
    query: req.query,
    params: req.params
  });
  
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(requestData)) {
      logger.error('Suspicious activity detected', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        path: req.path,
        method: req.method,
        pattern: pattern.toString(),
        data: requestData,
        timestamp: new Date().toISOString()
      });
      
      // You might want to block the request here
      // return res.status(400).json({ error: 'Invalid request' });
      break;
    }
  }
  
  next();
};

/**
 * Track failed login attempts per IP and email
 */
const failedAttempts = new Map();
const FAILED_ATTEMPT_WINDOW = 15 * 60 * 1000; // 15 minutes
const MAX_FAILED_ATTEMPTS = 5;

export const trackFailedAttempts = (req, res, next) => {
  const originalSend = res.send;
  
  res.send = function(data) {
    if (res.statusCode === 401 && req.path.includes('signin')) {
      const key = `${req.ip}:${req.body?.email || 'unknown'}`;
      const now = Date.now();
      
      if (!failedAttempts.has(key)) {
        failedAttempts.set(key, []);
      }
      
      const attempts = failedAttempts.get(key);
      // Remove old attempts outside the window
      const recentAttempts = attempts.filter(time => now - time < FAILED_ATTEMPT_WINDOW);
      recentAttempts.push(now);
      failedAttempts.set(key, recentAttempts);
      
      if (recentAttempts.length >= MAX_FAILED_ATTEMPTS) {
        logger.error('Multiple failed login attempts detected', {
          ip: req.ip,
          email: req.body?.email,
          attempts: recentAttempts.length,
          timeWindow: FAILED_ATTEMPT_WINDOW / 1000 / 60 + ' minutes',
          timestamp: new Date().toISOString()
        });
      }
    }
    
    return originalSend.call(this, data);
  };
  
  next();
};

/**
 * Clean up old failed attempt records periodically
 */
setInterval(() => {
  const now = Date.now();
  for (const [key, attempts] of failedAttempts.entries()) {
    const recentAttempts = attempts.filter(time => now - time < FAILED_ATTEMPT_WINDOW);
    if (recentAttempts.length === 0) {
      failedAttempts.delete(key);
    } else {
      failedAttempts.set(key, recentAttempts);
    }
  }
}, 5 * 60 * 1000); // Clean up every 5 minutes
