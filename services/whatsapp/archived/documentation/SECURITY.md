# WhatsApp Service Security Guide

## 🔒 Security Features Implemented

### Authentication & Authorization
- **JWT Authentication**: Primary authentication method integrated with main authentication service
- **Role-Based Access Control**: `administrator` and `renter` roles can access messaging endpoints
- **Organization Validation**: Multi-tenant security with organization ID validation
- **Token Types**: Supports user tokens, application tokens (M2M), and service tokens
- **Legacy API Key Support**: Deprecated API key authentication maintained for backward compatibility
- **Request Tracking**: Each request gets a unique ID for audit trails

### Rate Limiting
- **General Rate Limit**: 100 requests per 15 minutes per IP
- **Message Rate Limit**: 10 messages per minute per IP
- **Configurable Limits**: Rate limits can be adjusted via environment variables

### Input Validation & Sanitization
- **Comprehensive Validation**: All inputs are validated and sanitized
- **Length Limits**: Maximum lengths enforced on all text fields
- **Phone Number Validation**: Proper phone number format validation
- **URL Validation**: Invoice URLs are validated for proper format
- **XSS Prevention**: Input sanitization removes potentially dangerous content

### CORS Protection
- **Configurable Origins**: Only specified origins are allowed
- **Credential Support**: Secure credential handling for authenticated requests
- **Method Restrictions**: Only GET and POST methods allowed

### Security Headers
- **Helmet.js**: Comprehensive security headers
- **Content Security Policy**: Prevents XSS attacks
- **Frame Options**: Prevents clickjacking
- **Content Type Options**: Prevents MIME type sniffing

### Data Protection
- **PII Sanitization**: Phone numbers and personal data are sanitized in logs
- **Error Message Sanitization**: Generic error messages in production
- **Request ID Tracking**: Unique request IDs for audit trails
- **Sensitive Data Masking**: API keys and tokens are masked in logs

## 🚀 Quick Setup

### 1. Install Dependencies
```bash
cd services/whatsapp
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
# Edit .env with your configuration

# Required for JWT Authentication
ACCESS_TOKEN_SECRET=your-jwt-secret-from-authenticator-service

# Optional: Legacy API Key Authentication (Deprecated)
WHATSAPP_API_KEYS=key1,key2,key3
```

### 3. Required Environment Variables
```bash
# Security (Required)
WHATSAPP_API_KEYS=your_api_key_here
ALLOWED_ORIGINS=https://yourdomain.com

# WhatsApp API (Optional - service works in URL-only mode without these)
WHATSAPP_ACCESS_TOKEN=your_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_id
```

### 4. Start the Service
```bash
npm start
```

## 🔑 API Authentication

### Using API Key in Header
```bash
curl -X POST http://localhost:8500/send-message \
  -H "X-API-Key: your_api_key_here" \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber":"+1234567890","message":"Hello"}'
```

### Using Bearer Token
```bash
curl -X POST http://localhost:8500/send-message \
  -H "Authorization: Bearer your_api_key_here" \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber":"+1234567890","message":"Hello"}'
```

## 📊 Rate Limits

| Endpoint | Limit | Window |
|----------|-------|--------|
| All endpoints | 100 requests | 15 minutes |
| `/send-message` | 10 requests | 1 minute |
| `/send-invoice` | 10 requests | 1 minute |
| `/health` | No additional limit | - |

## 🛡️ Security Best Practices

### API Key Management
- **Generate Strong Keys**: Use cryptographically secure random strings
- **Rotate Regularly**: Change API keys periodically
- **Environment Specific**: Use different keys for dev/staging/production
- **Secure Storage**: Store keys in environment variables, not in code

### Network Security
- **Use HTTPS**: Always use HTTPS in production
- **Firewall Rules**: Restrict access to known IP ranges if possible
- **VPN Access**: Consider VPN access for sensitive environments

### Monitoring & Logging
- **Monitor Failed Attempts**: Watch for repeated authentication failures
- **Log Analysis**: Regularly review logs for suspicious activity
- **Alert Setup**: Set up alerts for unusual traffic patterns

### Production Deployment
- **Environment Variables**: Set `NODE_ENV=production`
- **Security Configuration**: Ensure all security environment variables are set
- **HTTPS Enforcement**: Use reverse proxy (nginx) to enforce HTTPS
- **Regular Updates**: Keep dependencies updated

## 🚨 Security Checklist

### Pre-Production
- [ ] API keys configured and secure
- [ ] CORS origins properly configured
- [ ] HTTPS enforced
- [ ] Rate limits appropriate for your use case
- [ ] Monitoring and alerting set up
- [ ] Security headers verified
- [ ] Error handling tested

### Post-Deployment
- [ ] Monitor authentication failures
- [ ] Review access logs regularly
- [ ] Test rate limiting behavior
- [ ] Verify CORS configuration
- [ ] Check security headers with tools like securityheaders.com

## 🔍 Security Testing

### Test Authentication
```bash
# Should fail without API key
curl -X POST http://localhost:8500/send-message

# Should fail with invalid API key
curl -X POST http://localhost:8500/send-message \
  -H "X-API-Key: invalid_key"

# Should succeed with valid API key
curl -X POST http://localhost:8500/send-message \
  -H "X-API-Key: valid_key" \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber":"+1234567890","message":"Test"}'
```

### Test Rate Limiting
```bash
# Send multiple requests quickly to test rate limiting
for i in {1..15}; do
  curl -X POST http://localhost:8500/send-message \
    -H "X-API-Key: your_key" \
    -H "Content-Type: application/json" \
    -d '{"phoneNumber":"+1234567890","message":"Test '$i'"}' &
done
```

### Test CORS
```bash
# Test from different origins
curl -X POST http://localhost:8500/send-message \
  -H "Origin: https://unauthorized-domain.com" \
  -H "X-API-Key: your_key"
```

## 📋 Troubleshooting

### Common Issues

#### "API key required" Error
- Check that you're sending the API key in the header
- Verify the header name is correct (`X-API-Key` or `Authorization`)
- Ensure the API key is in the `WHATSAPP_API_KEYS` environment variable

#### "Not allowed by CORS" Error
- Add your domain to the `ALLOWED_ORIGINS` environment variable
- Ensure the origin header matches exactly (including protocol and port)

#### Rate Limit Exceeded
- Wait for the rate limit window to reset
- Consider requesting higher limits if legitimate
- Check if multiple clients are using the same IP

#### "Security configuration invalid for production"
- Set `WHATSAPP_API_KEYS` environment variable
- Set `ALLOWED_ORIGINS` environment variable
- Ensure `NODE_ENV=production` is set

## 🔄 Security Updates

This service includes security middleware that should be regularly updated:

```bash
npm update helmet express-rate-limit depd
```

Monitor security advisories for:
- Express.js
- Helmet.js
- express-rate-limit
- axios
- depd

## 📞 Support

For security-related issues or questions:
1. Check this documentation first
2. Review the logs for specific error messages
3. Test with the provided examples
4. Check environment variable configuration

Remember: Never share API keys or access tokens in support requests!