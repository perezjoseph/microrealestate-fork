# MicroRealEstate

An open-source property management application that helps landlords manage their property rents and tenant relationships with automated WhatsApp and email notifications.


## 🏠 Overview

MicroRealEstate is a comprehensive property management solution built with a microservices architecture. It provides landlords with tools to manage properties, track rent payments, and communicate with tenants through automated notifications via WhatsApp Business API and email.

## ✨ Key Features

- **Property & Tenant Management**: Complete property portfolio and tenant relationship management
- **Rent Collection & Tracking**: Automated rent collection with payment tracking and reporting
- **WhatsApp Integration**: Automated payment notices and reminders via WhatsApp Business API with comprehensive middleware stack
- **Email Notifications**: Multi-provider email support (Gmail, Mailgun, SMTP)
- **PDF Generation**: Automated invoice and document generation
- **Multi-tenant Architecture**: Separate portals for landlords and tenants
- **Multilingual Support**: Spanish and English language support
- **Real-time Monitoring**: System health monitoring and logging

## 🏗️ Architecture

MicroRealEstate follows a microservices architecture with the following services:

- **Gateway** (8080): API gateway and reverse proxy
- **Authenticator** (8000): Authentication and user management
- **API** (8200): Main business logic and data management
- **Tenant API** (8250): Tenant-specific endpoints
- **PDF Generator** (8300): Document generation service
- **Emailer** (8400): Email notification service
- **WhatsApp** (8500): WhatsApp Business API integration with enhanced security middleware
- **Cache** (8600): Redis-compatible caching service
- **Monitoring** (8800): System monitoring and health checks

## 🚀 Quick Start

### Prerequisites

- **Node.js**: >=22.17.1
- **Yarn**: 3.3.0
- **Docker**: Latest version
- **Docker Compose**: Latest version

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/microrealestate/microrealestate.git
   cd microrealestate
   ```

2. **Install dependencies**
   ```bash
   yarn install
   ```

3. **Configure environment variables**
   ```bash
   # Copy base configuration to create your local environment
   cp base.env .env
   
   # Edit .env with your specific settings (required for security tokens and passwords)
   # See CONFIGURATION_STANDARDIZATION.md for detailed configuration guide
   ```

4. **Start the development environment**
   ```bash
   # Recommended: Start with simplified development setup (includes hot-reload)
   docker-compose -f docker-compose.dev.yml up -d
   
   # Alternative: Start all services with microservices architecture
   docker-compose -f docker-compose.microservices.base.yml -f docker-compose.microservices.dev.yml up -d
   
   # Or start individual services for development
   yarn dev
   
   # Verify all services are running and healthy
   docker-compose ps
   ```

5. **Access the applications**
   - **Landlord Portal**: http://localhost:8080/landlord
   - **Tenant Portal**: http://localhost:8080/tenant
   - **API Gateway**: http://localhost:8080

## 🛠️ Technology Stack

### Backend
- **Runtime**: Node.js 22.17.1+
- **Framework**: Express.js with TypeScript support
- **Database**: MongoDB 7 with Mongoose 6.13.6 (Common Service) / 8.16.5 (WhatsApp Service)
- **Cache**: Valkey (Redis-compatible)
- **Authentication**: JWT with refresh token rotation
- **Package Manager**: Yarn 3.3.0 with workspaces

### Frontend
- **Framework**: Next.js 14.2.26 (React 18.2.0)
- **UI Libraries**: Material-UI 4.12.4, Radix UI, Tailwind CSS 3.4.10
- **State Management**: MobX 6.12.3
- **Forms**: Formik with Yup validation
- **Internationalization**: next-translate

### Key Integrations
- **WhatsApp**: Facebook Graph API with enhanced security middleware
- **Email**: Nodemailer with multiple providers
- **PDF Generation**: Puppeteer, pdfjs-dist
- **Monitoring**: Custom health checks and logging

## 📁 Project Structure

```
microrealestate/
├── services/               # Backend microservices
│   ├── api/               # Main business logic API
│   ├── authenticator/     # Authentication service
│   ├── gateway/           # API gateway
│   ├── whatsapp/          # WhatsApp integration
│   ├── emailer/           # Email service
│   └── ...
├── webapps/               # Frontend applications
│   ├── landlord/          # Landlord management portal
│   ├── tenant/            # Tenant self-service portal
│   └── commonui/          # Shared UI components
├── types/                 # Shared TypeScript definitions
├── cli/                   # Development CLI tools
└── docker-compose.yml     # Container orchestration
```

## 🔧 Development

### Docker Compose Configuration

The project uses multiple Docker Compose files for different deployment scenarios:

#### Base Infrastructure (`docker-compose.microservices.base.yml`)
- **Valkey (Redis-compatible)**: Caching and session storage with health checks
- **MongoDB**: Primary database with health checks and optimized configuration
- **Shared Network**: Common network configuration for service communication

#### Development Configuration (`docker-compose.microservices.dev.yml`)
- Extends base infrastructure with all application services
- Local build contexts for development with hot-reload
- Volume mounting for real-time code changes
- Debug logging and development-optimized settings

#### Production Configuration (`docker-compose.prod.yml`)
- Pre-built Docker images from GitHub Container Registry
- Production-optimized settings and logging levels
- Reverse proxy configuration with Caddy
- Health checks and restart policies

#### Simplified Development (`docker-compose.dev.yml`)
- **Streamlined Setup**: Single-file configuration for rapid development
- **Valkey Integration**: Uses Valkey 7.2-alpine for Redis-compatible caching
- **Environment Variable Consistency**: All services use standardized environment variables without hardcoded defaults
- **Hot-Reload Support**: Volume mounting for real-time code changes across all services
- **Flexible Configuration**: Fully configurable through environment variables for different development scenarios
- **Health Checks**: Comprehensive health checks for database and cache services
- **Service Dependencies**: Proper dependency ordering ensures reliable startup sequence

#### Recent Configuration Improvements (Latest Update)
- **Standardized Environment Variables**: Removed hardcoded defaults in favor of environment variable consistency
- **Flexible Port Configuration**: All service ports now configurable via environment variables
- **Unified Database URLs**: Consistent MongoDB and Valkey URL configuration across all services
- **Enhanced Service Communication**: Internal service URLs now use environment variables for better flexibility
- **Improved Development Experience**: Better alignment between development and production configurations

Key features across all configurations:
- **Health Checks**: MongoDB and Valkey services include comprehensive health checks
- **Service Dependencies**: Proper dependency ordering ensures reliable startup sequence
- **Network Isolation**: All services communicate through dedicated Docker networks
- **Modular Architecture**: Base infrastructure can be extended for different deployment needs
- **Environment Flexibility**: Consistent environment variable usage across all deployment scenarios

### Available Commands

```bash
# Development mode (all services)
yarn dev

# Build all services
yarn build

# Start production services
yarn start

# Stop all services
yarn stop

# Lint all workspaces
yarn lint

# Format code
yarn format
```

### Service-Specific Development

```bash
# Navigate to a service
cd services/cache

# Install dependencies
npm install

# Start development server
npm run dev

# Build service
npm run build

# Lint service code
npm run lint
```

### Docker Commands

```bash
# Production deployment with pre-built images
docker-compose -f docker-compose.microservices.base.yml -f docker-compose.prod.yml up -d

# Development with local builds and hot-reload (full microservices)
docker-compose -f docker-compose.microservices.base.yml -f docker-compose.microservices.dev.yml up -d

# Alternative local development setup (simplified with hot-reload)
docker-compose -f docker-compose.dev.yml up -d

# View logs for specific service
docker-compose logs -f [service-name]

# View logs for all services
docker-compose logs -f

# Stop all services
docker-compose down

# Rebuild and start services (development)
docker-compose -f docker-compose.microservices.base.yml -f docker-compose.microservices.dev.yml up -d --build

# Rebuild simplified development setup
docker-compose -f docker-compose.dev.yml up -d --build

# Check service health status
docker-compose ps
```

## 📚 Documentation

### Service Documentation
- [Cache Service](services/cache/README.md) - Valkey/Redis caching service with ESLint integration
- [WhatsApp Service](services/whatsapp/README.md) - WhatsApp Business API integration
- [WhatsApp API](services/whatsapp/API.md) - Complete API documentation

### Architecture Documentation
- [Development Guide](DEVELOPMENT_GUIDE.md) - Complete development workflow and hot-reload setup
- [Docker Compose Architecture](DOCKER_COMPOSE_ARCHITECTURE.md) - Comprehensive Docker configuration and deployment guide
- [Project Structure](.kiro/steering/structure.md) - Detailed project organization
- [Technology Stack](.kiro/steering/tech.md) - Complete technology overview
- [Product Overview](.kiro/steering/product.md) - Business domain and features

### Migration Documentation
- [Configuration Standardization](CONFIGURATION_STANDARDIZATION.md) - **NEW**: Environment variable standardization guide (January 2025)
- [Frontend Demo Mode Update](FRONTEND_DEMO_MODE_UPDATE.md) - **NEW**: Demo mode configuration for frontend services (January 2025)
- [Docker Compose Migration](DOCKER_COMPOSE_MIGRATION.md) - Migration guide for new modular Docker Compose architecture
- [Mongoose Upgrade Notes](MONGOOSE_UPGRADE_NOTES.md) - Mongoose 6.x to 8.x upgrade details
- [WhatsApp Migration](MIGRATION_WHATSAPP.md) - WhatsApp configuration migration guide
- [Database Consolidation](DATABASE_CONSOLIDATION_UPDATE.md) - Database configuration consolidation details

## 🔐 Configuration

### Environment Variables

Key configuration variables for the main services:

#### Core Infrastructure
```bash
# Database configuration (unified across all services)
MONGO_URL=mongodb://mongo:27017/demodb
MONGO_PORT=27017

# Cache/Session storage (Valkey - Redis compatible)
VALKEY_URL=redis://valkey:6379
VALKEY_PORT=6379
VALKEY_PASSWORD=your_valkey_password

# General service configuration
NODE_ENV=development
LOGGER_LEVEL=debug
```

#### Service Ports (All Configurable)
```bash
GATEWAY_PORT=8080
AUTHENTICATOR_PORT=8000
API_PORT=8200
TENANTAPI_PORT=8250
PDFGENERATOR_PORT=8300
EMAILER_PORT=8400
WHATSAPP_PORT=8500
CACHE_PORT=8600
MONITORING_PORT=8800
LANDLORD_FRONTEND_PORT=8180
TENANT_FRONTEND_PORT=8190
```

#### Service URLs (Internal Docker Network)
```bash
AUTHENTICATOR_URL=http://authenticator:8000
API_URL=http://api:8200/api/v2
TENANTAPI_URL=http://tenantapi:8250/tenantapi
PDFGENERATOR_URL=http://pdfgenerator:8300/pdfgenerator
EMAILER_URL=http://emailer:8400/emailer
WHATSAPP_URL=http://whatsapp:8500
DOCKER_GATEWAY_URL=http://gateway:8080
LANDLORD_FRONTEND_URL=http://landlord-frontend:8180
TENANT_FRONTEND_URL=http://tenant-frontend:8190
```

#### Authentication & Security
```bash
ACCESS_TOKEN_SECRET=your_jwt_secret
REFRESH_TOKEN_SECRET=your_refresh_secret
RESET_TOKEN_SECRET=your_reset_secret
APPCREDZ_TOKEN_SECRET=your_appcredz_secret
CIPHER_KEY=your_cipher_key_32_chars
CIPHER_IV_KEY=your_cipher_iv_16_chars
```

#### WhatsApp Business API
```bash
WHATSAPP_API_URL=https://graph.facebook.com/v18.0
WHATSAPP_ACCESS_TOKEN=your_access_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_BUSINESS_ACCOUNT_ID=your_business_account_id
WHATSAPP_TEMPLATE_LANGUAGE=es
WHATSAPP_LOGIN_TEMPLATE_NAME=otpcode
WHATSAPP_WEBHOOK_VERIFY_TOKEN=your_webhook_token
```

#### Application Configuration
```bash
APP_DOMAIN=localhost:8080
APP_PROTOCOL=http
CORS_ENABLED=true
SIGNUP=true
DEMO_MODE=true                    # Enable demo mode across all services (backend and frontend)
RESTORE_DB=true
ALLOW_SENDING_EMAILS=true
```

#### Frontend Configuration
```bash
LANDLORD_BASE_PATH=/landlord
TENANT_BASE_PATH=/tenant
LANDLORD_APP_URL=http://localhost:8080/landlord
TENANT_APP_URL=http://localhost:8080/tenant
GATEWAY_URL=http://localhost:8080
```

**Recent Configuration Updates**:
- **Standardized Environment Variables**: All hardcoded values replaced with configurable environment variables
- **Flexible Port Configuration**: Every service port is now configurable via environment variables
- **Consistent Service URLs**: Internal service communication uses environment variables for better flexibility
- **Unified Database Configuration**: All services use consistent `MONGO_URL` and `VALKEY_URL` patterns
- **Enhanced Development Experience**: Better alignment between `base.env`, `.env`, and Docker Compose configurations
- **Demo Mode Configuration**: Added `DEMO_MODE` environment variable to all services (authenticator, frontend) for consistent demo mode control across development and production

See individual service documentation for complete configuration options.

## 🧪 Testing

```bash
# Run all tests
yarn test

# Run tests for specific service
cd services/whatsapp
npm test

# Run linting (all services)
yarn lint

# Run linting for specific service
cd services/cache
npm run lint

# Run formatting check
yarn format:check
```

## 📊 Monitoring

The system includes comprehensive monitoring:

- **Health Checks**: Each service provides `/health` endpoints
- **Logging**: Structured logging with request context
- **Metrics**: Service performance and usage metrics
- **Error Tracking**: Detailed error reporting and tracking

Access monitoring dashboard at: http://localhost:8800

## 🚀 CI/CD Pipeline

The project uses GitHub Actions for automated testing, building, and deployment:

### Workflows

- **`docker-images.yml`**: Main CI/CD pipeline that builds and publishes Docker images on push to master and releases
- **`pr-ci.yml`**: Pull request validation with linting and testing
- **`release.yml`**: Automated release creation with deployment packages
- **`codeql-analysis.yml`**: Security analysis and vulnerability scanning

### Docker Images

All services are automatically built and published to GitHub Container Registry:

```bash
# Pull latest images for production deployment
docker pull ghcr.io/perezjoseph/microrealestate-fork/api:latest
docker pull ghcr.io/perezjoseph/microrealestate-fork/gateway:latest
docker pull ghcr.io/perezjoseph/microrealestate-fork/whatsapp:latest
# ... and all other services

# Start production environment with latest images
docker-compose -f docker-compose.microservices.base.yml -f docker-compose.prod.yml pull
docker-compose -f docker-compose.microservices.base.yml -f docker-compose.prod.yml up -d
```

### Release Process

1. Create a version tag: `git tag v1.2.3 && git push origin v1.2.3`
2. GitHub Actions automatically builds and publishes Docker images
3. Release notes and deployment packages are generated
4. Images are tagged with both version and `latest`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow existing code structure and patterns
- Add tests for new functionality
- Update documentation for changes
- Ensure all services pass health checks
- Follow ESLint and Prettier configurations
- All services now include ESLint for consistent code quality

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: Check service-specific README files
- **Issues**: Report bugs and feature requests on GitHub
- **Discussions**: Join community discussions for help and ideas

## 🙏 Acknowledgments

- Built with modern web technologies and best practices
- Inspired by the need for affordable property management solutions
- Community-driven development and feedback

---

**MicroRealEstate** - Making property management accessible and automated.
