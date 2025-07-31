# WhatsApp Service

The WhatsApp service provides integration with WhatsApp Business API for automated notifications and communication in the MicroRealEstate platform.

## Overview

This service enables landlords to send automated payment notices, invoice notifications, and reminders to tenants via WhatsApp. It supports both WhatsApp Business API integration and fallback URL generation for manual sending.

## Features

- **WhatsApp Business API Integration**: Send messages directly through Facebook's Graph API
- **JWT Authentication**: Integrated with main authenticator service for secure access
- **Template Message Support**: Use approved WhatsApp Business templates for structured messages
- **Fallback URL Generation**: Generate WhatsApp Web URLs when API is unavailable
- **Multi-Strategy Message Delivery**: Automatic fallback between template, text, and URL methods
- **Role-Based Access Control**: Support for administrator, renter, and api_client roles
- **Multilingual Support**: Spanish and English message templates
- **Invoice Notifications**: Specialized invoice delivery with payment details
- **Rate Limiting**: Protection against abuse with configurable limits
- **Security Headers**: Comprehensive HTTP security via Helmet middleware
- **Input Validation**: Request sanitization and validation

## Architecture

The service follows a strategy pattern for message delivery with multiple fallback options:

1. **Template Messages** (Primary): Use approved WhatsApp Business templates
2. **Text Messages** (Fallback): Send plain text messages via API
3. **URL Generation** (Final Fallback): Generate WhatsApp Web URLs for manual sending

## Dependencies

### Production Dependencies
```json
{
  "@microrealestate/common": "*",
  "axios": "1.8.4",
  "cors": "2.8.5",
  "express": "4.21.1",
  "express-rate-limit": "7.1.5",
  "express-validator": "7.0.1",
  "helmet": "7.1.0",
  "jsonwebtoken": "9.0.0"
}
```

### Development Dependencies
```json
{
  "@typescript-eslint/eslint-plugin": "7.15.0",
  "@typescript-eslint/parser": "7.15.0",
  "eslint": "8.57.0",
  "eslint-config-prettier": "9.1.0",
  "eslint-plugin-import": "2.29.1",
  "nodemon": "3.1.4",
  "npm-run-all": "4.1.5",
  "rimraf": "6.0.1",
  "typescript": "5.5.4"
}
```

### Core Service Dependencies
- **@microrealestate/common**: Shared utilities, middleware, and types from the main microservices architecture
- **axios**: 1.8.4 - HTTP client for WhatsApp Business API integration
- **express**: 4.21.1 - Web framework with comprehensive middleware stack
- **cors**: 2.8.5 - Cross-origin resource sharing middleware
- **jsonwebtoken**: 9.0.0 - JWT token handling for authentication

### Security & Middleware Features
The service includes comprehensive security middleware for production-ready deployment:
- **express-rate-limit**: 7.1.5 - Rate limiting protection against abuse and DoS attacks
- **helmet**: 7.1.0 - Security headers middleware for enhanced HTTP security
- **express-validator**: 7.0.1 - Input validation and sanitization middleware
- **CORS Protection**: Configurable cross-origin resource sharing policies

### Development & Build Tools
- **TypeScript**: 5.5.4 - Type safety and modern JavaScript features
- **ESLint**: 8.57.0 - Code linting with TypeScript support
- **Prettier**: Code formatting integration
- **nodemon**: 3.1.4 - Development hot reload
- **npm-run-all**: 4.1.5 - Parallel script execution for build processes
- **rimraf**: 6.0.1 - Cross-platform file deletion for clean builds

## Environment Configuration

### Authentication Configuration

#### JWT Authentication (Primary)
```bash
# JWT Authentication - Required for integration with main authentication service
ACCESS_TOKEN_SECRET=your-jwt-secret-key-here
AUTHENTICATOR_URL=http://localhost:8000

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8080,http://localhost:8200
```

### Required Variables

```bash
# WhatsApp Business API Configuration
WHATSAPP_API_URL=https://graph.facebook.com/v18.0
WHATSAPP_ACCESS_TOKEN=your_access_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_BUSINESS_ACCOUNT_ID=your_business_account_id

# Template Configuration
WHATSAPP_TEMPLATE_LANGUAGE=es
WHATSAPP_INVOICE_TEMPLATE=factura2
WHATSAPP_PAYMENT_NOTICE_TEMPLATE=payment_notice
WHATSAPP_PAYMENT_REMINDER_TEMPLATE=payment_reminder
WHATSAPP_FINAL_NOTICE_TEMPLATE=final_notice

# Webhook Configuration
WHATSAPP_WEBHOOK_VERIFY_TOKEN=your_webhook_verify_token

# Service Configuration
PORT=8500
ACCESS_TOKEN_SECRET=your_jwt_secret
```

### Optional Variables

```bash
# Default template name (fallback)
WHATSAPP_TEMPLATE_NAME=invoice
```

## API Endpoints

All endpoints require JWT authentication via `Authorization: Bearer <token>` header.

### Health Check
```
GET /health
```
Returns service status and configuration information. No authentication required.

### Send Simple Message
```
POST /send-message
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "phoneNumber": "+1234567890",
  "message": "Hello, this is a test message",
  "recipientName": "John Doe" // optional
}
```

**Required Roles**: `administrator`, `renter`

### Send Invoice
```
POST /send-invoice
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "phoneNumbers": ["+1234567890", "+0987654321"],
  "tenantName": "John Doe",
  "invoicePeriod": "January 2024",
  "totalAmount": "1500.00",
  "currency": "USD",
  "invoiceUrl": "https://example.com/invoice/123",
  "organizationName": "Property Management Co",
  "dueDate": "2024-02-15"
}
```

**Required Roles**: `administrator`, `renter`

### Authentication Flow

1. **Get JWT Token** from authenticator service:
   ```bash
   curl -X POST http://localhost:8000/landlord/signin \
     -H "Content-Type: application/json" \
     -d '{"email":"user@example.com","password":"password"}'
   ```

2. **Use JWT Token** with WhatsApp service:
   ```bash
   curl -X POST http://localhost:8500/send-message \
     -H "Authorization: Bearer <jwt-token>" \
     -H "Content-Type: application/json" \
     -d '{"phoneNumber":"+1234567890","message":"Hello"}'
   ```

## Message Templates

The service supports multilingual message templates for different notification types:

### Spanish Templates
- **invoice**: New invoice notification
- **payment_reminder**: Payment reminder notice
- **final_notice**: Final payment warning

### English Templates
- **invoice**: New invoice notification
- **payment_reminder**: Payment reminder notice
- **final_notice**: Final payment warning

## Development

### Available Scripts

```bash
# Build all dependencies and transpile TypeScript
npm run build

# Start development server with hot reload and TypeScript watching
npm run dev

# Start production server
npm start

# Lint code with ESLint
npm run lint

# Format code with Prettier
npm run format

# Clean build artifacts
npm run clean
```

### Local Development Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Build shared dependencies**
   ```bash
   npm run build
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

The development server will:
- Build shared TypeScript types and common utilities
- Start file watchers for automatic rebuilds
- Launch the service with hot reload via nodemon
- Enable debugging on port 9229

### Docker Development
```bash
# Build and start with Docker Compose
docker-compose up whatsapp

# View logs
docker-compose logs -f whatsapp
```

### TypeScript Integration

The service now integrates with the main microservices architecture:

- **Shared Types**: Uses `@microrealestate/types` for consistent type definitions
- **Common Utilities**: Leverages `@microrealestate/common` for shared middleware and utilities
- **Build Process**: Automatically transpiles TypeScript dependencies during development
- **Type Safety**: Full TypeScript support with ESLint integration

## Error Handling

The service implements comprehensive error handling with specific error types:

- **ValidationError**: Invalid request parameters
- **ConfigurationError**: Missing or invalid configuration
- **APIError**: WhatsApp Business API errors
- **WhatsAppError**: General service errors

Common Facebook API error codes are mapped to user-friendly messages:
- `131030`: Phone number not in allowed list
- `190`: Access token expired or invalid
- `132000`: Template not found or not approved

## Message Delivery Strategies

### Template Message Strategy
Uses approved WhatsApp Business templates with structured parameters. Requires template approval from Facebook.

### Text Message Strategy
Sends plain text messages through the WhatsApp Business API. Fallback when templates fail.

### URL Fallback Strategy
Generates WhatsApp Web URLs for manual sending. Always available as final fallback.

## Webhook Integration

The service supports WhatsApp webhook integration for:
- Message delivery status updates
- Incoming message handling
- Real-time status tracking

## Security

- **JWT Authentication**: Required for all endpoints except health check
- **Role-Based Access Control**: Support for administrator, renter, and api_client roles
- **Rate Limiting**: 10 messages per minute, 100 requests per 15 minutes
- **Security Headers**: Comprehensive HTTP security via Helmet middleware
- **CORS Protection**: Configurable allowed origins
- **Input Validation**: Request sanitization and validation
- **Phone Number Validation**: Format validation for all phone numbers

## Monitoring

The service provides:
- Health check endpoint for monitoring
- Structured logging with request context
- Message delivery tracking
- Error reporting with detailed context

## Testing

The service is designed for production use with comprehensive error handling and validation. The service now includes full TypeScript support and ESLint integration for code quality.

### Code Quality Tools
- **ESLint**: TypeScript-aware linting with import validation
- **Prettier**: Automated code formatting
- **TypeScript**: Type safety across the entire service

### Manual Testing
Use the health endpoint and API endpoints with proper JWT authentication to verify functionality.

### Development Quality Assurance
```bash
# Run linting
npm run lint

# Format code
npm run format

# Build and validate TypeScript
npm run build
```

## Troubleshooting

### Common Issues

1. **Phone number not in allowed list (Error 131030)**
   - Add phone numbers to WhatsApp Business API configuration
   - Verify phone numbers are in correct format

2. **Template not found (Error 132000)**
   - Ensure templates are approved in Facebook Business Manager
   - Verify template names match configuration

3. **Access token expired (Error 190)**
   - Refresh WhatsApp Business API access token
   - Update WHATSAPP_ACCESS_TOKEN environment variable

### Debug Mode

Enable debug logging by setting log level in the common service configuration.

## Contributing

1. Follow the existing code structure and patterns
2. Add appropriate error handling for new features
3. Update message templates for new notification types
4. Maintain backward compatibility with existing API endpoints
5. Add tests for new functionality

## License

MIT License - see LICENSE file for details.