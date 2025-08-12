# Cache Service

The Cache Service provides Redis-compatible caching functionality for the MicroRealEstate application using Valkey as the backend storage.

## Overview

This service acts as a centralized caching layer for the MicroRealEstate microservices architecture, providing fast data access and session management capabilities.

## Features

- **Valkey/Redis Compatibility**: Full Redis protocol compatibility using Valkey
- **Session Management**: Handles user sessions and authentication tokens
- **Data Caching**: Provides caching for frequently accessed data
- **Health Monitoring**: Built-in health check endpoints
- **Code Quality**: ESLint integration for consistent code standards

## Technology Stack

- **Runtime**: Node.js >=22.17.1
- **Cache Backend**: Valkey (Redis-compatible)
- **Client Library**: redis ^4.6.0
- **Development Tools**: 
  - nodemon ^3.1.4 (hot reload)
  - eslint ^8.57.0 (code linting)

## Configuration

### Environment Variables

```bash
# Service Configuration
NODE_ENV=development
PORT=8600
LOGGER_LEVEL=debug

# Valkey/Redis Connection
VALKEY_URL=redis://valkey:6379
VALKEY_PASSWORD=your_valkey_password

# Authentication
ACCESS_TOKEN_SECRET=your_jwt_secret
```

## Development

### Prerequisites

- Node.js >=22.17.1
- Access to Valkey/Redis instance

### Installation

```bash
# Navigate to cache service
cd services/cache

# Install dependencies
npm install
```

### Running the Service

```bash
# Development mode with hot reload
npm run dev

# Production mode
npm start

# Lint code
npm run lint
```

### Docker Development

The service is configured to run in Docker with the following setup:

```yaml
cache:
  build:
    context: .
    dockerfile: services/cache/Dockerfile
  environment:
    NODE_ENV: development
    PORT: 8600
    VALKEY_URL: redis://valkey:6379
    VALKEY_PASSWORD: ${VALKEY_PASSWORD}
  depends_on:
    valkey:
      condition: service_healthy
```

**Note**: In the simplified development environment (`docker-compose.dev.yml`), the backend uses Redis Alpine for faster startup and lower resource usage, while maintaining full compatibility with the Valkey protocol.

## API Endpoints

### Health Check

```
GET /health
```

Returns the health status of the cache service and its connection to Valkey.

**Response:**
```json
{
  "status": "healthy",
  "service": "cache",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "valkey": "connected"
}
```

## Code Quality

The service includes ESLint configuration for maintaining code quality:

### Linting

```bash
# Run ESLint
npm run lint

# ESLint configuration inherits from services/.eslintrc.json
```

### ESLint Configuration

The service uses the shared ESLint configuration from `services/.eslintrc.json`:

```json
{
  "env": {
    "commonjs": true,
    "node": true,
    "jest": true
  }
}
```

## Architecture Integration

The Cache Service integrates with the MicroRealEstate architecture as follows:

- **Port**: 8600 (internal Docker network)
- **Dependencies**: Valkey/Redis backend
- **Consumers**: All other microservices for caching and session management
- **Health Checks**: Monitored by the monitoring service

## Monitoring

The service provides monitoring capabilities:

- Health check endpoint for service status
- Connection status to Valkey backend
- Request/response logging
- Error tracking and reporting

## Development Guidelines

1. **Code Style**: Follow ESLint configuration for consistent code style
2. **Error Handling**: Implement proper error handling for cache operations
3. **Logging**: Use structured logging for debugging and monitoring
4. **Testing**: Add tests for new functionality (test framework to be implemented)
5. **Documentation**: Update this README when adding new features

## Troubleshooting

### Common Issues

1. **Connection Errors**: Verify Valkey/Redis is running and accessible
2. **Authentication Failures**: Check VALKEY_PASSWORD configuration
3. **Port Conflicts**: Ensure port 8600 is available
4. **Memory Issues**: Monitor Valkey memory usage and configure limits

### Debugging

```bash
# Check service logs
docker-compose logs -f cache

# Check Valkey connection
docker-compose exec valkey redis-cli ping

# Verify environment variables
docker-compose exec cache env | grep VALKEY
```

## Contributing

When contributing to the Cache Service:

1. Run `npm run lint` before committing
2. Follow existing code patterns and structure
3. Add appropriate error handling
4. Update documentation for new features
5. Test cache operations thoroughly

## License

This service is part of the MicroRealEstate project and is licensed under the MIT License.