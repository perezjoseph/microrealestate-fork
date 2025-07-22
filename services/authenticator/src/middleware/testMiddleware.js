// Simple test middleware to verify middleware execution
export const testMiddleware = (req, res, next) => {
  console.log('🧪 TEST MIDDLEWARE EXECUTED for path:', req.path, 'method:', req.method);
  console.log('🧪 Request IP:', req.ip);
  console.log('🧪 Request headers:', JSON.stringify(req.headers, null, 2));
  next();
};

export const simpleRateLimit = (req, res, next) => {
  // Simple in-memory rate limiting for testing
  if (!global.requestCounts) {
    global.requestCounts = {};
  }
  
  const key = req.ip + ':' + req.path;
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute window
  const maxRequests = 3; // Allow only 3 requests per minute
  
  if (!global.requestCounts[key]) {
    global.requestCounts[key] = [];
  }
  
  // Clean old requests
  global.requestCounts[key] = global.requestCounts[key].filter(time => now - time < windowMs);
  
  console.log('🧪 SIMPLE RATE LIMIT CHECK for key:', key, 'current count:', global.requestCounts[key].length);
  
  if (global.requestCounts[key].length >= maxRequests) {
    console.log('🚨 SIMPLE RATE LIMIT TRIGGERED for key:', key);
    return res.status(429).json({
      error: 'Simple rate limit exceeded - too many requests',
      retryAfter: 60
    });
  }
  
  global.requestCounts[key].push(now);
  console.log('✅ SIMPLE RATE LIMIT PASSED for key:', key, 'new count:', global.requestCounts[key].length);
  next();
};

console.log('✅ Test middleware loaded successfully');
