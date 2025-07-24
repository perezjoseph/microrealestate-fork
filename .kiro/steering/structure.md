# Project Structure

## Root Level Organization

```
microrealestate/
├── cli/                    # Custom CLI for development and deployment
├── services/               # Backend microservices
├── webapps/               # Frontend applications
├── types/                 # Shared TypeScript type definitions
├── config/                # Configuration files (Valkey, Logstash)
├── documentation/         # Project documentation
├── backup/                # Database backup location
├── scripts/               # Utility scripts
└── docker-compose*.yml    # Docker orchestration files
```

## Services Directory (`services/`)

Each service follows a consistent structure:

```
services/
├── api/                   # Main business logic API
├── authenticator/         # Authentication service with JWT/OTP
├── cache/                 # Caching service
├── common/                # Shared utilities and middleware
├── emailer/               # Email notification service
├── gateway/               # API gateway and reverse proxy
├── monitoring/            # System monitoring
├── pdfgenerator/          # Document generation service
├── resetservice/          # Password reset service
├── tenantapi/             # Tenant-specific API endpoints
└── whatsapp/              # WhatsApp Business API integration
```

### Service Structure Pattern
```
service-name/
├── src/                   # Source code
│   ├── index.js/ts       # Entry point
│   ├── routes.js/ts      # Route definitions
│   └── ...               # Service-specific modules
├── Dockerfile            # Production container
├── dev.Dockerfile        # Development container
├── package.json          # Dependencies and scripts
└── README.md             # Service documentation
```

## Frontend Applications (`webapps/`)

```
webapps/
├── commonui/              # Shared UI components and utilities
├── landlord/              # Property management interface
└── tenant/                # Tenant portal interface
```

### Frontend Structure Pattern
```
webapp-name/
├── src/                   # Source code
│   ├── components/        # React components
│   ├── pages/            # Next.js pages
│   ├── hooks/            # Custom React hooks
│   ├── store/            # State management
│   ├── styles/           # Styling files
│   └── utils/            # Utility functions
├── locales/              # Internationalization files
├── public/               # Static assets
├── scripts/              # Build and utility scripts
├── Dockerfile            # Production container
├── dev.Dockerfile        # Development container
├── package.json          # Dependencies and scripts
└── next.config.js        # Next.js configuration
```

## Shared Modules

### Types (`types/`)
- Shared TypeScript definitions
- API contract types
- Common data structures

### Common UI (`webapps/commonui/`)
- Reusable React components
- Form field components
- Shared utilities and hooks

### Common Services (`services/common/`)
- Database connections (MongoDB, Valkey)
- Authentication middleware
- Logging utilities
- HTTP interceptors

## Configuration Files

- `docker-compose.yml` - Main production orchestration
- `docker-compose.local.yml` - Local development
- `docker-compose.microservices.*.yml` - Microservices-specific configs
- `base.env` - Base environment variables
- `.env` - Local environment overrides (not versioned)

## Development Conventions

### File Naming
- Use kebab-case for directories and files
- TypeScript files use `.ts` extension
- React components use PascalCase

### Import/Export Patterns
- Use ES modules (`import/export`)
- Barrel exports in index files
- Relative imports for local modules

### Environment Variables
- Prefix service-specific vars with service name
- Use SCREAMING_SNAKE_CASE
- Document all variables in service README

### Docker Conventions
- Each service has production and development Dockerfiles
- Multi-stage builds for optimization
- Consistent port exposure patterns

## Workspace Configuration

The project uses Yarn workspaces with these packages:
- `cli` - Command line interface
- `services/*` - All backend services
- `webapps/*` - All frontend applications  
- `types` - Shared type definitions

Scripts run across workspaces using `yarn workspaces foreach`.