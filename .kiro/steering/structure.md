# Project Structure

## Root Directory Organization

```
microrealestate/
├── cli/                    # Command-line interface for development
├── docs/                  # Project documentation and guides
├── services/               # Backend microservices
├── webapps/               # Frontend applications
├── types/                 # Shared TypeScript type definitions
├── config/                # Configuration files (Valkey, Logstash)
├── data/                  # Local development data (MongoDB, Valkey)
├── backup/                # Database backup files
├── docker-compose.yml     # Production container orchestration
├── docker-compose.local.yml # Local development overrides
└── package.json           # Root workspace configuration
```

## Services Architecture (`services/`)

Each service is an independent Node.js application with TypeScript support:

- **`api/`** - Main business logic API (port 8200)
- **`authenticator/`** - Authentication and user management (port 8000)
- **`cache/`** - Caching service using Valkey (port 8600)
- **`common/`** - Shared utilities and middleware
- **`emailer/`** - Email notification service (port 8400)
- **`gateway/`** - API gateway and reverse proxy (port 8080)
- **`monitoring/`** - System monitoring and health checks (port 8800)
- **`pdfgenerator/`** - PDF document generation (port 8300)
- **`tenantapi/`** - Tenant-specific API endpoints (port 8250)
- **`whatsapp/`** - WhatsApp Business API integration with enhanced middleware (port 8500)

### Service Structure Pattern
```
services/[service-name]/
├── src/
│   ├── index.js           # Entry point
│   ├── routes/            # Express route handlers
│   ├── models/            # Database models
│   └── utils/             # Service-specific utilities
├── package.json           # Service dependencies
└── Dockerfile             # Container configuration
```

## Frontend Applications (`webapps/`)

- **`landlord/`** - Landlord management portal (Next.js)
- **`tenant/`** - Tenant self-service portal (Next.js)
- **`commonui/`** - Shared UI components and utilities
- **`performance-tools/`** - Development and testing tools

### Frontend Structure Pattern
```
webapps/[app-name]/
├── src/
│   ├── components/        # React components
│   ├── pages/            # Next.js pages
│   ├── utils/            # Client-side utilities
│   └── styles/           # CSS and styling
├── public/               # Static assets
├── package.json          # App dependencies
└── next.config.js        # Next.js configuration
```

## Shared Resources

### Types (`types/`)
- Centralized TypeScript type definitions
- Shared across all services and frontends
- Compiled to `dist/` for consumption

### CLI (`cli/`)
- Development workflow automation
- Service orchestration commands
- Environment management

### Documentation (`docs/`)
- Project documentation and guides
- API documentation
- Setup and deployment instructions
- Architecture diagrams and technical specifications

## Configuration Patterns

### Environment Variables
- Service-specific environment configuration
- Centralized in Docker Compose files
- Local overrides in `.env` files

### Networking
- Internal Docker network for service communication
- Gateway service handles external routing
- Port mapping defined in Docker Compose

## Development Workflow

### Workspace Management
- Yarn workspaces for dependency management
- Shared scripts at root level
- Individual service development possible

### Build Process
1. TypeScript compilation for shared types
2. Service-specific builds (if needed)
3. Docker image creation for deployment

### Code Organization Principles
- **Separation of Concerns**: Each service has single responsibility
- **Shared Dependencies**: Common utilities in `services/common/`
- **Type Safety**: Shared types ensure consistency
- **Modular Frontend**: Reusable components in `commonui/`

## File Naming Conventions
- **Services**: kebab-case directory names
- **Components**: PascalCase for React components
- **Utilities**: camelCase for JavaScript/TypeScript files
- **Configuration**: lowercase with extensions (.yml, .json, .env)