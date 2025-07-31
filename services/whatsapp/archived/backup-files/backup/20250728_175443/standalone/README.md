# WhatsApp Service Authentication

This directory contains the authentication middleware for the WhatsApp service, providing JWT-based authentication with role-based access control.

## Architecture Overview

The authentication system is built using several design patterns:

- **Strategy Pattern**: Different authentication strategies (JWT, API Key, etc.)
- **Factory Pattern**: Clean middleware creation and configuration
- **Error Handling**: Centralized error definitions and handling
- **Security**: Rate limiting, input validation, and request sanitization

## Quick Start

### Basic Usage (Recommended)

```javascript
import { createAuthMiddleware } from './auth-middleware-factory.js';

// Create authentication middleware
const auth = createAuthMiddleware({
    accessTokenSecret: process.env.ACCESS_TOKEN_SECRET,
    authenticatorUrl: process.env.AUTHENTICATOR_URL
});

// Use in Express routes
app.use('/api', auth.authenticate);
app.use('/admin', auth.authenticate, auth.requireRoles(['administrator']));
```

### Legacy Usage (Backward Compatibility)

```javascript
import AuthMiddleware from './auth-middleware.js';

const authMiddleware = new AuthMiddleware();

app.use('/api', authMiddleware.authenticateJWT);
app.use('/admin', authMiddleware.authenticateJWT, authMiddleware.requireRoles(['administrator']));
```

## Components

### AuthMiddlewareFactory

The main factory for creating authentication middleware:

```javascript
import { AuthMiddlewareFactory } from './auth-middleware-factory.js';

const factory = new AuthMiddlewareFactory({
    accessTokenSecret: 'your-secret-key',
    authenticatorUrl: 'http://localhost:8000'
});

// Create middleware
const authMiddleware = factory.createAuthMiddleware();
const adminMiddleware = factory.createRoleMiddleware(['administrator']);

// Use in routes
app.use('/api', authMiddleware);
app.use('/admin', authMiddleware, adminMiddleware);
```

### Authentication Strategies

Different authentication methods can be used:

```javascript
import { JWTAuthStrategy } from './auth-strategies.js';

const jwtStrategy = new JWTAuthStrategy(process.env.ACCESS_TOKEN_SECRET);

// Manual authentication
const result = jwtStrategy.authenticate(req);
if (result.success) {
    req.user = result.user;
}
```

### Error Handling

Centralized error handling with structured responses:

```javascript
import { AuthErrorFactory } from './auth-errors.js';

// Create specific errors
const error = AuthErrorFactory.missingToken();
res.status(error.statusCode).json(error.toJSON());

// Custom errors
const customError = new AuthError('CUSTOM_ERROR', 'Custom message', 400);
```

## Configuration

### Environment Variables

```bash
ACCESS_TOKEN_SECRET=your-jwt-secret-key
AUTHENTICATOR_URL=http://localhost:8000
```

### Validation

```javascript
const auth = createAuthMiddleware();
const config = auth.validateConfig();

if (!config.valid) {
    console.error('Configuration issues:', config.issues);
}
```

## Security Features

### Rate Limiting

```javascript
import { checkRateLimit } from './security.js';

const rateLimit = checkRateLimit(req.ip, 5, 15 * 60 * 1000);
if (rateLimit.isLimited) {
    return res.status(429).json({
        error: 'Too many requests',
        retryAfter: rateLimit.retryAfter
    });
}
```

### Input Validation

```javascript
import { isValidJWTFormat, sanitizeForLogging } from './validation.js';

if (!isValidJWTFormat(token)) {
    logger.warn('Invalid token format', { 
        ip: sanitizeForLogging(req.ip) 
    });
}
```

## User Types

The system supports three types of authenticated entities:

### User Tokens
```javascript
{
    type: 'user',
    email: 'user@example.com',
    phone: '+1234567890',
    role: 'administrator',
    id: 'user-id'
}
```

### Application Tokens
```javascript
{
    type: 'application',
    clientId: 'app-client-id',
    role: 'administrator'
}
```

### Service Tokens
```javascript
{
    type: 'service',
    serviceId: 'service-id',
    realmId: 'realm-id',
    role: 'administrator'
}
```

## Role-Based Access Control

```javascript
// Single role
app.use('/admin', auth.authenticate, auth.requireRoles(['administrator']));

// Multiple roles
app.use('/api', auth.authenticate, auth.requireRoles(['administrator', 'manager']));

// Custom role middleware
const customRoleCheck = (req, res, next) => {
    if (req.user.type === 'service' || req.user.role === 'administrator') {
        return next();
    }
    res.status(403).json({ error: 'Insufficient permissions' });
};
```

## Health Checks

```javascript
app.get('/health/auth', (req, res) => {
    const auth = createAuthMiddleware();
    const status = auth.getAuthStatus();
    
    res.json({
        status: status.jwtEnabled ? 'healthy' : 'unhealthy',
        ...status
    });
});
```

## Migration Guide

### From Legacy AuthMiddleware

1. **Replace imports**:
   ```javascript
   // Old
   import AuthMiddleware from './auth-middleware.js';
   
   // New
   import { createAuthMiddleware } from './auth-middleware-factory.js';
   ```

2. **Update instantiation**:
   ```javascript
   // Old
   const auth = new AuthMiddleware();
   
   // New
   const auth = createAuthMiddleware();
   ```

3. **Update method calls**:
   ```javascript
   // Old
   app.use(auth.authenticateJWT);
   app.use(auth.requireRoles(['admin']));
   
   // New
   app.use(auth.authenticate);
   app.use(auth.requireRoles(['admin']));
   ```

## Testing

```javascript
import { createAuthMiddleware } from './auth-middleware-factory.js';

describe('Authentication', () => {
    const auth = createAuthMiddleware({
        accessTokenSecret: 'test-secret'
    });

    it('should authenticate valid JWT', async () => {
        const req = {
            headers: { authorization: 'Bearer valid-jwt-token' }
        };
        const res = { status: jest.fn(), json: jest.fn() };
        const next = jest.fn();

        auth.authenticate(req, res, next);
        expect(next).toHaveBeenCalled();
    });
});
```

## Best Practices

1. **Always validate configuration** before starting the server
2. **Use role-based access control** for sensitive endpoints
3. **Log authentication events** for security monitoring
4. **Implement rate limiting** to prevent brute force attacks
5. **Sanitize sensitive data** in logs
6. **Use HTTPS** in production
7. **Rotate JWT secrets** regularly
8. **Monitor authentication failures** for security threats

## Troubleshooting

### Common Issues

1. **"Authentication service not properly configured"**
   - Check that `ACCESS_TOKEN_SECRET` is set
   - Verify the secret is at least 32 characters long

2. **"Invalid access token format"**
   - Ensure the token is a valid JWT with 3 parts
   - Check that the Authorization header uses "Bearer " prefix

3. **"Token expired"**
   - Implement token refresh logic
   - Check token expiration times

4. **"Insufficient permissions"**
   - Verify user roles in the JWT payload
   - Check role requirements for the endpoint

### Debug Mode

Enable debug logging:

```javascript
process.env.LOG_LEVEL = 'debug';
```

This will provide detailed authentication flow information.