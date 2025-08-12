---
inclusion: always
---

# Project Structure & Architecture Patterns

## Microservices Architecture Rules

### Service Independence
- Each service in `services/` is completely independent with its own package.json
- Services communicate only via HTTP APIs, never direct database access
- Use `services/common/` for shared utilities, but avoid tight coupling
- All services must have health check endpoints for Docker orchestration

### Port Allocation (Fixed)
- **Gateway**: 8080 (external entry point)
- **Authenticator**: 8000 (auth/user management)
- **API**: 8200 (main business logic)
- **TenantAPI**: 8250 (tenant-specific endpoints)
- **PDFGenerator**: 8300 (document generation)
- **Emailer**: 8400 (notifications)
- **WhatsApp**: 8500 (messaging integration)
- **Cache**: 8600 (Valkey/Redis)
- **Monitoring**: 8800 (health/metrics)

## Code Organization Patterns

### Service Structure (Mandatory)
```
services/[service-name]/
├── src/
│   ├── index.js           # Express app entry point
│   ├── routes/            # Route handlers (one file per resource)
│   ├── models/            # Mongoose models (if database access)
│   └── utils/             # Service-specific utilities
├── package.json           # Independent dependencies
└── Dockerfile             # Container configuration
```

### Frontend Structure (Next.js Apps)
```
webapps/[app-name]/
├── src/
│   ├── components/        # Reusable React components
│   ├── pages/            # Next.js file-based routing
│   ├── utils/            # Client-side utilities
│   └── styles/           # Tailwind/CSS modules
├── public/               # Static assets
└── next.config.js        # Next.js configuration
```

## File Naming Conventions (Strict)
- **Services**: kebab-case directories (`whatsapp/`, `pdf-generator/`)
- **React Components**: PascalCase files (`PropertyCard.jsx`)
- **Utilities/Hooks**: camelCase (`usePropertyData.js`)
- **API Routes**: kebab-case (`property-management.js`)
- **Database Models**: PascalCase (`Property.js`, `Tenant.js`)
- **Configuration**: lowercase with extensions (`.env`, `.yml`)

## Database Access Patterns
- **Unified Database**: All services use single MongoDB instance (`mredb`)
- **Model Location**: Database models belong in the service that owns the data
- **Cross-Service Data**: Use API calls, never direct database access
- **Common Models**: Shared models go in `services/common/models/`

## Docker Compose Usage
- **Development**: Use `docker-compose.dev.yml` for simple setup
- **Full Development**: Use `docker-compose.microservices.dev.yml` for all services
- **Production**: Use `docker-compose.prod.yml` with pre-built images
- **Infrastructure Only**: Use `docker-compose.microservices.base.yml` for MongoDB/Valkey

## Shared Resources Rules

### Types (`types/`)
- All TypeScript interfaces shared between services
- Must be compiled to `dist/` before use
- Import from `@microrealestate/types` in services
- Update types when changing API contracts

### Common UI (`webapps/commonui/`)
- Shared React components between landlord/tenant apps
- Material-UI v4 for legacy components
- Radix UI + Tailwind for new components
- Export components with proper TypeScript definitions

## Environment Configuration
- **Base Configuration**: `base.env` provides defaults
- **Service Overrides**: Individual `.env` files in service directories
- **Docker Variables**: Defined in docker-compose files
- **Required Variables**: `MONGO_URL`, `REDIS_URL`, `JWT_SECRET`

## Development Workflow Rules
1. **Workspace Commands**: Always run from root directory
2. **Service Development**: Use `yarn dev` from root or `npm run dev` in service
3. **Type Changes**: Rebuild types package before testing services
4. **Database Changes**: Update models in owning service, then update types
5. **API Changes**: Update OpenAPI specs in `docs/api/`

## Inter-Service Communication
- **Authentication**: All requests through Gateway with JWT validation
- **Service Discovery**: Use Docker service names (e.g., `http://api:8200`)
- **Error Handling**: Return consistent error formats across services
- **Logging**: Use Winston with structured logging format