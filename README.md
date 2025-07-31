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
   # Copy example environment files
   cp .env.example .env
   cp services/whatsapp/.env.example services/whatsapp/.env
   
   # Edit configuration files with your settings
   ```

4. **Start the development environment**
   ```bash
   # Start all services with Docker Compose (recommended for development)
   docker-compose -f docker-compose.yml -f docker-compose.local.yml up -d
   
   # Or start individual services for development
   yarn dev
   
   # Verify all services are running
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

The project uses two Docker Compose files:
- `docker-compose.yml`: Production configuration with pre-built images
- `docker-compose.local.yml`: Development overrides with local volumes and build contexts

Key features of the development setup:
- **Health Checks**: MongoDB and Valkey services include health checks for reliable startup
- **Service Dependencies**: Proper dependency ordering ensures services start in the correct sequence
- **Volume Mounting**: Local code is mounted for hot-reload development
- **Network Isolation**: All services communicate through a dedicated Docker network

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

# Run CI pipeline
yarn ci
```

### Service-Specific Development

```bash
# Navigate to a service
cd services/whatsapp

# Install dependencies
npm install

# Start development server
npm run dev

# Build service
npm run build
```

### Docker Commands

```bash
# Start all services (production)
docker-compose up -d

# Start with local development overrides
docker-compose -f docker-compose.yml -f docker-compose.local.yml up -d

# View logs for specific service
docker-compose logs -f [service-name]

# View logs for all services
docker-compose logs -f

# Stop all services
docker-compose down

# Rebuild and start services
docker-compose up -d --build
```

## 📚 Documentation

### Service Documentation
- [WhatsApp Service](services/whatsapp/README.md) - WhatsApp Business API integration
- [WhatsApp API](services/whatsapp/API.md) - Complete API documentation

### Architecture Documentation
- [Project Structure](.kiro/steering/structure.md) - Detailed project organization
- [Technology Stack](.kiro/steering/tech.md) - Complete technology overview
- [Product Overview](.kiro/steering/product.md) - Business domain and features

### Migration Documentation
- [Configuration Standardization](CONFIGURATION_STANDARDIZATION.md) - Recent environment variable standardization
- [Mongoose Upgrade Notes](MONGOOSE_UPGRADE_NOTES.md) - Mongoose 6.x to 8.x upgrade details
- [WhatsApp Migration](MIGRATION_WHATSAPP.md) - WhatsApp configuration migration guide
- [Database Consolidation](DATABASE_CONSOLIDATION_UPDATE.md) - Database configuration consolidation details

## 🔐 Configuration

### Environment Variables

Key configuration variables for the main services:

#### Database (Consolidated Configuration)
```bash
# Primary database connection (used by all services)
MONGO_URL=mongodb://localhost:27017/mredb

# Cache/Session storage
REDIS_URL=redis://localhost:6379
```

#### WhatsApp Service
```bash
WHATSAPP_API_URL=https://graph.facebook.com/v18.0
WHATSAPP_ACCESS_TOKEN=your_access_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_TEMPLATE_LANGUAGE=es
```

#### Authentication
```bash
ACCESS_TOKEN_SECRET=your_jwt_secret
REFRESH_TOKEN_SECRET=your_refresh_secret
RESET_TOKEN_SECRET=your_reset_secret
APPCREDZ_TOKEN_SECRET=your_appcredz_secret
```

**Note**: All services now use a unified database configuration via `MONGO_URL` for improved consistency and simplified management. Authentication configuration has been standardized to use consistent environment variable names across all services, eliminating duplicate configurations.

See individual service documentation for complete configuration options.

## 🧪 Testing

```bash
# Run all tests
yarn test

# Run tests for specific service
cd services/whatsapp
npm test

# Run linting
yarn lint

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