# WhatsApp Service Authentication Migration Guide

## 🔄 Migration from API Keys to JWT Authentication

The WhatsApp service has been migrated from simple API key authentication to JWT-based authentication that integrates with the main authenticator service.

## 🎯 What Changed

### Before (API Key Only)
- Simple API key validation
- Keys stored in environment variables
- No user context or roles
- No integration with main auth system

### After (JWT + API Key Fallback)
- **Primary**: JWT token authentication (integrates with main authenticator service)
- **Fallback**: API key authentication (for backward compatibility)
- Full user context and role-based access control
- Centralized authentication through main authenticator service

## 🔧 Configuration Changes

### New Environment Variables
```bash
# JWT Authentication (Primary)
ACCESS_TOKEN_SECRET=your_jwt_access_token_secret_here
AUTHENTICATOR_URL=http://localhost:8000

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8080,http://localhost:8200
```

### Required Configuration
1. **ACCESS_TOKEN_SECRET**: Must match the secret used by the main authenticator service
2. **AUTHENTICATOR_URL**: URL of the main authenticator service (optional, for future features)

## 🚀 How to Use

### Method 1: JWT Authentication (Recommended)

#### Step 1: Get JWT Token
```bash
# Login to get JWT token
curl -X POST http://localhost:8000/landlord/signin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password"
  }'

# Response includes accessToken
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Step 2: Use JWT Token
```bash
# Send message with JWT token
curl -X POST http://localhost:8500/send-message \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+1234567890",
    "message": "Hello World",
    "recipientName": "John Doe"
  }'
```

### Method 2: Cookie Authentication (Alternative)

```bash
# Send message with sessionToken cookie (for tenant API compatibility)
curl -X POST http://localhost:8500/send-message \
  -H "Content-Type: application/json" \
  -H "Cookie: sessionToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d '{
    "phoneNumber": "+1234567890",
    "message": "Hello World",
    "recipientName": "John Doe"
  }'
```

## 🔐 Authentication Flow

### JWT Authentication Process
1. **Client** authenticates with main authenticator service
2. **Authenticator** returns JWT access token
3. **Client** sends requests to WhatsApp service with JWT token
4. **WhatsApp Service** validates JWT token using shared secret
5. **WhatsApp Service** extracts user info and roles from token
6. **WhatsApp Service** processes request with user context

### Fallback Process
1. If JWT validation fails or no JWT provided
2. **WhatsApp Service** checks for API key in headers
3. If valid API key found, processes request with limited context
4. If no valid authentication, returns 401 error

## 👥 User Roles and Permissions

### Supported Roles
- **administrator**: Full access to all endpoints
- **renter**: Access to messaging endpoints
- **api_client**: API key users (fallback mode)

### Role-Based Access Control
```javascript
// Send message endpoint
authMiddleware.requireRoles(['administrator', 'renter', 'api_client'])

// Send invoice endpoint  
authMiddleware.requireRoles(['administrator', 'renter', 'api_client'])
```

## 🔍 Token Structure

### JWT Token Payload
```json
{
  "account": {
    "_id": "user_id",
    "email": "user@example.com",
    "phone": "+1234567890",
    "role": "administrator"
  },
  "iat": 1640995200,
  "exp": 1640995230
}
```

### User Context in Request
```javascript
req.user = {
  type: 'user',
  email: 'user@example.com',
  phone: '+1234567890',
  role: 'administrator',
  id: 'user_id'
}
```

## 🛠️ Migration Steps

### For Development
1. **Update Environment Variables**
   ```bash
   # Add to .env file
   ACCESS_TOKEN_SECRET=your_jwt_secret
   AUTHENTICATOR_URL=http://localhost:8000
   ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8080,http://localhost:8200
   ```

2. **Test JWT Authentication**
   ```bash
   # Get token from authenticator
   TOKEN=$(curl -s -X POST http://localhost:8000/landlord/signin \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@example.com","password":"password"}' \
     | jq -r '.accessToken')
   
   # Test WhatsApp service
   curl -X GET http://localhost:8500/health \
     -H "Authorization: Bearer $TOKEN"
   ```

### For Production
1. **Ensure Shared Secret**
   - Same `ACCESS_TOKEN_SECRET` in both authenticator and WhatsApp services
   
2. **Configure CORS**
   ```bash
   ALLOWED_ORIGINS=https://yourdomain.com,https://app.yourdomain.com
   ```

3. **Update Client Applications**
   - Modify clients to use JWT tokens
   - Implement token refresh logic

## 🔧 Troubleshooting

### Common Issues

#### "ACCESS_TOKEN_SECRET not configured"
```bash
# Solution: Set the environment variable
export ACCESS_TOKEN_SECRET=your_jwt_secret
```

#### "Invalid access token"
```bash
# Check token expiration
# JWT tokens expire in 30 seconds by default
# Get a fresh token from authenticator service
```

#### "Authentication configuration invalid for production"
```bash
# Ensure ACCESS_TOKEN_SECRET is set in production
export ACCESS_TOKEN_SECRET=your_jwt_secret
```

### Debug Authentication
```bash
# Check health endpoint for auth status
curl -X GET http://localhost:8500/health

# Response shows authentication methods available
{
  "authentication": {
    "jwtEnabled": true,
    "corsConfigured": true,
    "rateLimitEnabled": true
  }
}
```

## 📊 Comparison

| Feature | Before | After (JWT) |
|---------|--------|-------------|
| User Context | ❌ No | ✅ Full user info |
| Role-Based Access | ❌ No | ✅ Yes |
| Token Expiration | ❌ No | ✅ Yes (30s) |
| Centralized Auth | ❌ No | ✅ Yes |
| Rate Limiting | ❌ No | ✅ Yes |
| Security Headers | ❌ No | ✅ Yes |
| Security Level | 🟡 Medium | 🟢 High |

## 🎉 Benefits

### Security Improvements
- **Token Expiration**: JWT tokens expire automatically
- **User Context**: Full user information available
- **Role-Based Access**: Granular permission control
- **Centralized Authentication**: Single source of truth

### Integration Benefits
- **Unified Authentication**: Same tokens work across all services
- **User Tracking**: Better audit trails with user context
- **Permission Management**: Centralized role management

### Backward Compatibility
- **Cookie Support**: sessionToken cookie support for tenant API compatibility
- **No Breaking Changes**: Existing JWT integrations continue working
- **Flexible Configuration**: Multiple token extraction methods

## 📝 Next Steps

1. **Test the Migration**: Verify both JWT and API key authentication work
2. **Update Clients**: Gradually migrate clients to use JWT tokens
3. **Monitor Usage**: Track authentication method usage
4. **Phase Out API Keys**: Eventually disable API key fallback if desired

The WhatsApp service now provides enterprise-grade authentication while maintaining backward compatibility! 🎉