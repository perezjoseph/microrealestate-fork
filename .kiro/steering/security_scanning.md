Define security coding style for the project ---
inclusion: always
---

# Security Standards & Guidelines

## Authentication & Authorization

### JWT Token Security
- **Token Expiration**: Set appropriate TTL (15min access, 7d refresh)
- **Secret Management**: Use strong secrets (min 256-bit) from environment variables
- **Token Validation**: Always validate tokens in gateway and service layers
- **Scope Limitation**: Implement role-based access control (landlord/tenant/admin)

```typescript
// Required JWT validation pattern
import jwt from 'jsonwebtoken';
import { ServiceError } from '@microrealestate/common/utils/serviceerror';

const validateToken = (token: string) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    throw new ServiceError('INVALID_TOKEN', 'Token validation failed', 401);
  }
};
```

### OTP Security (WhatsApp Integration)
- **Rate Limiting**: Max 3 OTP requests per phone number per hour
- **Expiration**: 5-minute OTP validity window
- **Secure Storage**: Store OTP hashes in Valkey with TTL
- **Attempt Limiting**: Lock account after 5 failed attempts

```typescript
// OTP security pattern
const otpAttempts = await RedisClient.get(`otp_attempts:${phoneNumber}`);
if (otpAttempts && parseInt(otpAttempts) >= 5) {
  throw new ServiceError('OTP_LOCKED', 'Too many attempts', 429);
}
```

## Input Validation & Sanitization

### Required Validation Patterns
- **MongoDB Injection**: Use parameterized queries only
- **XSS Prevention**: Sanitize all user inputs before storage/display
- **Phone Numbers**: Validate E.164 format for international numbers
- **File Uploads**: Validate file types, size limits, and scan for malware

```typescript
// Input validation example
import validator from 'validator';

const validateInput = (data: any) => {
  if (!validator.isEmail(data.email)) {
    throw new ServiceError('INVALID_EMAIL', 'Invalid email format', 400);
  }
  // Sanitize HTML content
  data.description = validator.escape(data.description);
};
```

### File Upload Security
- **Allowed Types**: PDF, images (PNG, JPG) only for documents
- **Size Limits**: Max 10MB per file, 50MB total per request
- **Virus Scanning**: Implement file scanning before storage
- **Secure Storage**: Use signed URLs for S3/cloud storage access

## API Security

### Rate Limiting (Required)
- **Authentication endpoints**: 5 requests/minute per IP
- **API endpoints**: 100 requests/minute per authenticated user
- **WhatsApp OTP**: 3 requests/hour per phone number
- **File uploads**: 10 requests/hour per user

```typescript
// Rate limiting middleware
import rateLimit from 'express-rate-limit';

const authLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5,
  message: 'Too many authentication attempts'
});
```

### CORS Configuration
- **Allowed Origins**: Specific domains only (no wildcards in production)
- **Credentials**: Enable only for authenticated endpoints
- **Headers**: Restrict to necessary headers only

```typescript
// CORS security configuration
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true,
  optionsSuccessStatus: 200
};
```

## Data Protection

### Sensitive Data Handling
- **PII Encryption**: Encrypt tenant personal data at rest
- **Payment Info**: Never store full payment details (use tokens)
- **Audit Logging**: Log all access to sensitive data
- **Data Retention**: Implement automatic cleanup policies

### Database Security
- **Connection Security**: Use TLS for MongoDB connections
- **Access Control**: Implement database-level user permissions
- **Backup Encryption**: Encrypt database backups
- **Query Monitoring**: Log and monitor suspicious queries

```typescript
// Secure MongoDB connection
const mongoOptions = {
  ssl: true,
  sslValidate: true,
  authSource: 'admin',
  retryWrites: true
};
```

## Environment & Infrastructure Security

### Environment Variables
- **Secret Management**: Never commit secrets to version control
- **Rotation Policy**: Rotate secrets every 90 days
- **Access Control**: Limit environment variable access
- **Validation**: Validate all required environment variables on startup

### Docker Security
- **Base Images**: Use official, minimal base images (Alpine Linux)
- **User Privileges**: Run containers as non-root user
- **Network Isolation**: Use Docker networks for service communication
- **Image Scanning**: Scan images for vulnerabilities before deployment

```dockerfile
# Secure Dockerfile pattern
FROM node:22-alpine
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
USER nodejs
WORKDIR /app
```

### Network Security
- **HTTPS Only**: Enforce TLS 1.2+ for all external communication
- **Internal Communication**: Use service mesh or encrypted channels
- **Firewall Rules**: Restrict access to necessary ports only
- **VPN Access**: Require VPN for administrative access

## Monitoring & Incident Response

### Security Logging (Mandatory)
- **Authentication Events**: Log all login attempts (success/failure)
- **Authorization Failures**: Log unauthorized access attempts
- **Data Access**: Log access to sensitive tenant/property data
- **System Changes**: Log configuration and user permission changes

```typescript
// Security event logging
import logger from '@microrealestate/common/utils/logger';

const logSecurityEvent = (event: string, userId: string, details: any) => {
  logger.warn('SECURITY_EVENT', {
    event,
    userId,
    timestamp: new Date().toISOString(),
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    ...details
  });
};
```

### Vulnerability Management
- **Dependency Scanning**: Run `yarn audit` in CI/CD pipeline
- **Regular Updates**: Update dependencies monthly (security patches immediately)
- **Penetration Testing**: Quarterly security assessments
- **Bug Bounty**: Implement responsible disclosure program

### Incident Response
- **Detection**: Automated alerts for security events
- **Response Time**: 4-hour response for critical security issues
- **Communication**: Predefined notification channels
- **Recovery**: Documented rollback and recovery procedures

## Compliance & Privacy

### Data Privacy (GDPR/CCPA)
- **Data Minimization**: Collect only necessary tenant information
- **Consent Management**: Explicit consent for data processing
- **Right to Deletion**: Implement data deletion workflows
- **Data Portability**: Provide data export functionality

### Multi-tenancy Security
- **Data Isolation**: Strict tenant data separation
- **Cross-tenant Validation**: Prevent data leakage between tenants
- **Realm-based Access**: Enforce realm-level permissions
- **Audit Trails**: Per-tenant audit logging

## Security Checklist for New Features

1. **Input Validation**: All user inputs validated and sanitized
2. **Authentication**: Proper JWT token validation
3. **Authorization**: Role-based access control implemented
4. **Rate Limiting**: Appropriate rate limits applied
5. **Logging**: Security events logged
6. **Error Handling**: No sensitive data in error messages
7. **Testing**: Security test cases included
8. **Documentation**: Security considerations documented