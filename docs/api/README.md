# API Documentation

MicroRealEstate provides a comprehensive REST API for property management operations. All APIs are accessible through the API Gateway at `http://localhost:8080/api`.

## API Overview

### Base URL
```
http://localhost:8080/api
```

### Authentication
All API endpoints (except authentication endpoints) require a valid JWT token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

### Response Format
All API responses follow a consistent JSON format:
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully",
  "timestamp": "2025-01-08T10:30:00Z"
}
```

Error responses:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": { ... }
  },
  "timestamp": "2025-01-08T10:30:00Z"
}
```

## Service APIs

### Core Services

#### [Authentication API](./authenticator.md)
**Base Path**: `/api/auth`
- User registration and login
- JWT token management
- Password reset and recovery
- User profile management

#### [Main API](./main-api.md)
**Base Path**: `/api/v1`
- Property management
- Tenant management
- Lease agreements
- Rent collection
- Financial reporting

#### [Tenant API](./tenant-api.md)
**Base Path**: `/api/tenant`
- Tenant self-service operations
- Payment history
- Maintenance requests
- Document access

### Utility Services

#### [PDF Generator API](./pdf-generator.md)
**Base Path**: `/api/pdf`
- Invoice generation
- Lease agreement documents
- Financial reports
- Custom document templates

#### [Email Service API](./emailer.md)
**Base Path**: `/api/email`
- Send notifications
- Email templates
- Delivery status tracking
- Bulk email operations

#### [WhatsApp API](./whatsapp.md)
**Base Path**: `/api/whatsapp`
- Send WhatsApp messages
- Message templates
- Delivery status
- Webhook handling

#### [Cache API](./cache.md)
**Base Path**: `/api/cache`
- Session management
- Data caching
- Cache invalidation
- Performance optimization

## Common Patterns

### Pagination
List endpoints support pagination with query parameters:
```
GET /api/v1/properties?page=1&limit=20&sort=createdAt&order=desc
```

Response includes pagination metadata:
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### Filtering
Most list endpoints support filtering:
```
GET /api/v1/tenants?status=active&propertyId=123&search=john
```

### Sorting
Sort by any field with direction:
```
GET /api/v1/properties?sort=rent&order=desc
```

### Field Selection
Select specific fields to reduce payload:
```
GET /api/v1/properties?fields=name,address,rent
```

## HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | OK - Request successful |
| 201 | Created - Resource created successfully |
| 400 | Bad Request - Invalid request data |
| 401 | Unauthorized - Authentication required |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource not found |
| 409 | Conflict - Resource already exists |
| 422 | Unprocessable Entity - Validation error |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error - Server error |

## Rate Limiting

API endpoints are protected by rate limiting:
- **Authentication endpoints**: 5 requests per minute per IP
- **General endpoints**: 100 requests per minute per user
- **Bulk operations**: 10 requests per minute per user

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1641648000
```

## Error Handling

### Validation Errors
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": {
      "email": ["Email is required"],
      "rent": ["Rent must be a positive number"]
    }
  }
}
```

### Authentication Errors
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid or expired token"
  }
}
```

### Not Found Errors
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Property not found",
    "details": {
      "propertyId": "123"
    }
  }
}
```

## API Versioning

APIs use URL-based versioning:
- Current version: `v1`
- Future versions: `v2`, `v3`, etc.
- Legacy support maintained for at least 2 versions

## Content Types

### Request Content Types
- `application/json` - JSON data (default)
- `multipart/form-data` - File uploads
- `application/x-www-form-urlencoded` - Form data

### Response Content Types
- `application/json` - JSON responses (default)
- `application/pdf` - PDF documents
- `text/csv` - CSV exports
- `application/octet-stream` - File downloads

## CORS Policy

Cross-Origin Resource Sharing (CORS) is configured to allow:
- All origins in development mode
- Specific domains in production
- Credentials included for authenticated requests

## API Testing

### Development Tools
- **Postman Collection**: Available in `/docs/api/postman/`
- **OpenAPI Spec**: Available at `/api/docs`
- **Interactive Docs**: Available at `/api/swagger`

### Example Requests

#### Authentication
```bash
# Login
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password"}'
```

#### Get Properties
```bash
# Get all properties
curl -X GET http://localhost:8080/api/v1/properties \
  -H "Authorization: Bearer <token>"
```

#### Create Tenant
```bash
# Create new tenant
curl -X POST http://localhost:8080/api/v1/tenants \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"name": "John Doe", "email": "john@example.com", "phone": "+1234567890"}'
```

## SDK and Client Libraries

### JavaScript/TypeScript
```bash
npm install @microrealestate/api-client
```

### Usage Example
```javascript
import { MicroRealEstateAPI } from '@microrealestate/api-client';

const api = new MicroRealEstateAPI({
  baseURL: 'http://localhost:8080/api',
  token: 'your-jwt-token'
});

const properties = await api.properties.list();
const tenant = await api.tenants.create({
  name: 'John Doe',
  email: 'john@example.com'
});
```

## Next Steps

- Explore specific [service APIs](./authenticator.md)
- Learn about [authentication flows](./authenticator.md#authentication-flows)
- Check out [API examples](./examples/)
- Set up [API monitoring](../deployment/monitoring.md)