# Technology Stack

## Architecture
- **Microservices Architecture**: Multiple independent services communicating via HTTP
- **Containerized Deployment**: Docker containers orchestrated with Docker Compose
- **API Gateway Pattern**: Central gateway routing requests to appropriate services

## Backend Technologies
- **Runtime**: Node.js (>=22.17.1)
- **Package Manager**: Yarn 3.3.0 with workspaces
- **Database**: MongoDB 7 with Mongoose 6.13.6 (Common Service) / 8.16.5 (WhatsApp Service) ODM for data persistence
  - **Configuration**: Unified database connection (`mredb`) across all services
- **Cache**: Valkey (Redis-compatible) for session management and caching
- **Authentication**: JWT tokens with refresh token rotation
- **API Framework**: Express.js with TypeScript support

## Frontend Technologies
- **Framework**: Next.js 14.2.26 (React 18.2.0)
- **UI Libraries**: 
  - Material-UI 4.12.4 (legacy components)
  - Radix UI (modern components)
  - Tailwind CSS 3.4.10 for styling
- **State Management**: MobX 6.12.3
- **Forms**: Formik with Yup validation
- **Internationalization**: next-translate

## Key Libraries & Tools
- **PDF Generation**: Puppeteer, pdfjs-dist
- **Email**: Nodemailer with multiple provider support (Gmail, Mailgun, SMTP)
- **WhatsApp**: Facebook Graph API integration (axios 1.8.4, express 4.21.1)
- **Testing**: Jest, ESLint, Prettier
- **Build Tools**: TypeScript 5.5.4, Babel

## Service-Specific Dependencies

### WhatsApp Service
- **axios**: 1.8.4 - HTTP client for WhatsApp Business API
- **express**: 4.21.1 - Web framework with comprehensive middleware stack
- **mongoose**: 8.16.5 - MongoDB ODM for message logging and configuration
- **cors**: 2.8.5 - Cross-origin resource sharing middleware
- **jsonwebtoken**: 9.0.0 - JWT token handling for authentication
- **body-parser**: 1.20.2 - Request body parsing middleware (standalone mode)
- **express-rate-limit**: 7.1.5 - Rate limiting protection against abuse
- **helmet**: 7.1.0 - Security headers middleware for HTTP security
- **express-validator**: 7.0.1 - Input validation and sanitization
- **nodemon**: 3.1.4 - Development hot reload (dev dependency)

### Cache Service
- **redis**: 4.6.10 - Redis client for Valkey/Redis caching operations
- **nodemon**: 3.1.4 - Development hot reload (dev dependency)
- **eslint**: 8.57.0 - Code linting and quality assurance (dev dependency)

### Common Service
- **mongoose**: 6.13.6 - MongoDB ODM shared across all services
- **express**: 4.21.1 - Web framework foundation
- **jsonwebtoken**: 9.0.0 - JWT authentication utilities
- **bcrypt**: 5.1.1 - Password hashing and validation
- **winston**: 3.13.1 - Structured logging framework
- **redis**: 4.6.10 - Redis client for caching operations

## Development Commands

### Root Level Commands
```bash
# Development mode (starts all services)
yarn dev

# Build all services
yarn build

# Start production services
yarn start

# Stop all services
yarn stop

# Lint all workspaces
yarn lint

# Format code across all workspaces
yarn format

# Run CI pipeline
yarn ci
```

### Service-Specific Commands
```bash
# Build individual service (from service directory)
npm run build

# Development mode with hot reload
npm run dev

# Lint specific service
npm run lint

# Format specific service
npm run format
```

### Docker Commands
```bash
# Start all services in production mode
docker-compose up -d

# Start with local development overrides
docker-compose docker-compose.local.yml up -d

# View logs
docker-compose logs -f [service-name]

# Stop all services
docker-compose down
```

## Environment Configuration
- Environment variables managed through `.env` files
- Separate configurations for development and production
- Docker Compose handles service orchestration and networking
- All services communicate through internal Docker network
- **Database Configuration**: Unified `MONGO_URL` used by all services for consistency (consolidated December 2024)

## Code Quality
- **ESLint**: Consistent code style across all workspaces (now includes all services including cache)
- **Prettier**: Automated code formatting
- **Husky**: Git hooks for pre-commit linting and formatting
- **TypeScript**: Type safety for backend services and shared types