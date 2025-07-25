# MicroRealEstate Developer Guide

## Architecture Overview

MicroRealEstate follows a microservices architecture with separate frontend applications and backend services:

[<img src="./pictures/overview.png" alt="drawing" width="770"/>](./pictures/overview.png)

## Services and Applications

| Applications and Services                  | Description                                                                    | Development Status |
| :----------------------------------------- | :----------------------------------------------------------------------------- | :----------------: |
| [Landlord UI](../webapps/landlord)         | Landlord web application (Next.js Pages Router)                               |     Available      |
| [Tenant UI](../webapps/tenant)             | Tenant web application (Next.js App Router)                                   |     Available      |
| [Gateway](../services/gateway)             | Exposes UI and services, handles CORS and reverse proxies                      |     Available      |
| [Authenticator](../services/authenticator) | Handles login/logout and tokens management                                     |     Available      |
| [API](../services/api)                     | Landlord REST API                                                              |     Available      |
| [TenantAPI](../services/tenantapi)         | Tenant REST API                                                                |     Available      |
| [WhatsApp](../services/whatsapp)           | WhatsApp Business API integration                                              |     Available      |
| [Emailer](../services/emailer)             | Generates and sends emails with Gmail or Mailgun                              |     Available      |
| [PDFGenerator](../services/pdfgenerator)   | Generates PDF documents (letters, contracts, invoices...)                      |     Available      |
| [ResetService](../services/resetservice)   | Uses to erase all data, only active in DEV and CI environments                 |     Available      |

## Development Setup

### Prerequisites

- [Docker and Compose installed](https://docs.docker.com/compose/install/)
- [Run the Docker daemon as a non-root user](https://docs.docker.com/engine/security/rootless)
- [Node.js version 20.x installed](https://nodejs.org/en/download/package-manager)
- [VS Code installed](https://code.visualstudio.com/) (recommended)
- [Git installed](https://git-scm.com/downloads)

### Clone and Setup

```shell
git clone https://github.com/perezjoseph/microrealestate-whatsapp.git
cd microrealestate
yarn install
```

## Development Modes

### Development Mode with Hot Reload

```shell
yarn dev
```

**Features:**
- Hot reload for all services
- Debug ports exposed
- Live log streaming
- Automatic service restart on code changes

**Access Points:**
- **Landlord Interface**: http://localhost:8080/landlord
- **Tenant Interface**: http://localhost:8080/tenant
- **API Gateway**: http://localhost:8080
- **WhatsApp Service**: http://localhost:8500

### CI Mode (Testing)

```shell
yarn build  # Build all services
yarn ci     # Start in CI mode
```

**Features:**
- Production-like environment
- No hot reload
- Optimized builds
- Suitable for testing

### Production Mode

```shell
yarn build  # Build all services
yarn start  # Start in production mode
```

**Features:**
- Production optimizations
- Minimal logging
- Performance optimized
- Security hardened

## Debugging

### VS Code Debug Configuration

Access the debug functionality in VS Code through the debug bar:

![Activity Bar](./pictures/vscode-debugbar.png)

**Available Debug Targets:**
- Docker: Attach to Gateway
- Docker: Attach to Authenticator
- Docker: Attach to API
- Docker: Attach to Emailer
- Docker: Attach to PDFGenerator
- Docker: Attach to ResetService
- Docker: Attach to WhatsApp

[VS Code Debugging Documentation](https://code.visualstudio.com/Docs/editor/debugging#_debug-actions)

### Debug Ports

| Service | Debug Port |
|---------|------------|
| Gateway | 9225 |
| Authenticator | 9226 |
| API | 9229 |
| TenantAPI | 9240 |
| Emailer | 9228 |
| PDFGenerator | 9227 |
| WhatsApp | 9231 |

## Testing

### End-to-End Testing with Cypress

```shell
# Headless mode (CI/CD)
yarn e2e:ci

# With browser visible
yarn e2e:run

# Interactive Cypress UI
yarn e2e:open
```

### Unit Testing

```shell
# Run all unit tests
yarn test

# Run tests for specific service
yarn workspace @microrealestate/api test

# Run tests for tenant webapp (includes phone validation tests)
yarn workspace @microrealestate/tenant test
```

#### Phone Validation Testing

The tenant webapp includes comprehensive unit tests for phone validation utilities:

```shell
# Run phone validation tests specifically
cd webapps/tenant
yarn test src/utils/phone/__tests__/
```

**Test Coverage:**
- **CountryData.test.ts**: Country detection, localStorage integration, browser locale detection
- **PhoneValidator.test.ts**: Phone number validation, E.164 formatting, Dominican Republic special handling

**Test Environment Setup:**
- Jest configuration with TypeScript support
- Browser environment mocking (localStorage, navigator)
- Automatic mock cleanup between tests

### Integration Testing

```shell
# Test service endpoints
yarn test:integration

# Test database connections
yarn test:db
```

## Development Workflow

### 1. Code Changes

Make changes to any service or frontend application:

```shell
# Backend services
cd services/[service-name]
# Make changes...

# Frontend applications
cd webapps/[app-name]
# Make changes...
```

### 2. Local Testing

```shell
# Start development environment
yarn dev

# Run tests
yarn test
yarn e2e:ci
```

### 3. Build Verification

```shell
# Build all services
yarn build

# Test production build
yarn ci
```

## Service Development

### Backend Services Structure

```
services/[service-name]/
├── src/
│   ├── index.js          # Main entry point
│   ├── routes/           # API routes
│   ├── models/           # Data models
│   ├── services/         # Business logic
│   └── utils/            # Utilities
├── Dockerfile            # Docker configuration
├── package.json          # Dependencies
└── README.md            # Service documentation
```

### Frontend Applications Structure

```
webapps/[app-name]/
├── src/                  # Source code
├── public/               # Static assets
├── pages/                # Next.js pages (landlord)
├── app/                  # Next.js app router (tenant)
├── components/           # React components
├── styles/               # CSS/styling
├── Dockerfile            # Docker configuration
├── next.config.js        # Next.js configuration
└── package.json          # Dependencies
```

### Adding New Services

1. **Create service directory:**
   ```shell
   mkdir services/new-service
   cd services/new-service
   ```

2. **Initialize package:**
   ```shell
   npm init -y
   yarn add @microrealestate/common
   ```

3. **Create Dockerfile:**
   ```dockerfile
   FROM node:20-alpine
   # ... service-specific configuration
   ```

4. **Add to docker-compose.yml:**
   ```yaml
   new-service:
     build:
       context: .
       dockerfile: ./services/new-service/Dockerfile
     # ... configuration
   ```

## Environment Configuration

### Development Environment

```bash
# .env.development
NODE_ENV=development
LOGGER_LEVEL=debug
MONGO_URL=mongodb://mongo/mredb_dev
REDIS_URL=redis://valkey:6379
```

### Testing Environment

```bash
# .env.test
NODE_ENV=test
LOGGER_LEVEL=error
MONGO_URL=mongodb://mongo/mredb_test
REDIS_URL=redis://valkey:6379
```

### Production Environment

```bash
# .env.production
NODE_ENV=production
LOGGER_LEVEL=info
MONGO_URL=mongodb://mongo/mredb
REDIS_URL=redis://valkey:6379
```

## Database Development

### MongoDB Operations

```shell
# Connect to MongoDB
docker compose exec mongo mongosh mredb

# Run database migrations
yarn migrate

# Seed development data
yarn seed:dev
```

### Valkey/Redis Operations

```shell
# Connect to Valkey
docker compose exec valkey valkey-cli

# Monitor commands
docker compose exec valkey valkey-cli monitor

# Check memory usage
docker compose exec valkey valkey-cli info memory
```

## Code Quality

### Linting

```shell
# Lint all code
yarn lint

# Fix linting issues
yarn lint:fix

# Lint specific service
yarn workspace @microrealestate/api lint
```

### Formatting

```shell
# Format all code
yarn format

# Check formatting
yarn format:check
```

### Type Checking

```shell
# TypeScript type checking
yarn type-check

# Watch mode
yarn type-check:watch
```

## Performance Monitoring

### Service Metrics

```shell
# View service logs
docker compose logs [service-name]

# Monitor resource usage
docker stats

# Check service health
curl http://localhost:8080/health
```

### Database Performance

```shell
# MongoDB performance
docker compose exec mongo mongosh --eval "db.stats()"

# Valkey performance
docker compose exec valkey valkey-cli info stats
```

## Troubleshooting

### Common Issues

#### Port Conflicts
```shell
# Check port usage
netstat -tulpn | grep :8080

# Kill process using port
sudo kill -9 $(lsof -t -i:8080)
```

#### Docker Issues
```shell
# Clean Docker system
docker system prune -a

# Rebuild specific service
docker compose build --no-cache [service-name]

# Reset volumes
docker compose down -v
```

#### Database Issues
```shell
# Reset MongoDB
docker compose down
docker volume rm microrealestate_mongodb_data
docker compose up -d mongo

# Reset Valkey
docker compose down
docker volume rm microrealestate_valkey_data
docker compose up -d valkey
```

### Debug Logs

```shell
# Enable debug logging
export LOGGER_LEVEL=debug

# Service-specific debugging
docker compose logs -f [service-name]

# Real-time log monitoring
docker compose logs -f --tail=100
```

## Contributing

### Code Style

- Use ESLint and Prettier configurations
- Follow conventional commit messages
- Write tests for new features
- Update documentation

### Pull Request Process

1. Fork the repository
2. Create feature branch
3. Make changes with tests
4. Run full test suite
5. Submit pull request

### Development Best Practices

- **Microservices**: Keep services focused and independent
- **Error Handling**: Implement comprehensive error handling
- **Logging**: Use structured logging with appropriate levels
- **Security**: Follow security best practices
- **Performance**: Monitor and optimize performance
- **Documentation**: Keep documentation up to date

---

**Last Updated**: July 2025  
**Maintainer**: Joseph Pérez