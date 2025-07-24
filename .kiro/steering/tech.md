---
inclusion: always
---

---
inclusion: always
---

# MicroRealEstate Technical Standards

## Architecture Rules

### Language & Framework Standards
- **New services**: TypeScript only (follow `services/gateway`, `services/tenantapi`)
- **Existing services**: JavaScript ES modules - DO NOT convert to TypeScript
- **Frontend**: React + Next.js with TypeScript for new components
- **Database**: MongoDB with Valkey (Redis) caching
- **Authentication**: JWT tokens via authenticator service

### Service Communication
- **Ports**: Gateway (8080), API (8200), Auth (8100), TenantAPI (8300)
- **Protocol**: HTTP only - no message queues
- **Error handling**: Always use ServiceError class

## Required Imports & Patterns

### Common Module Imports (All Services)
```typescript
import { MongoClient } from '@microrealestate/common/utils/mongoclient';
import { RedisClient } from '@microrealestate/common/utils/redisclient';
import { ServiceError } from '@microrealestate/common/utils/serviceerror';
import logger from '@microrealestate/common/utils/logger';
```

### Error Handling (Mandatory)
```typescript
// Throw errors
throw new ServiceError('ERROR_CODE', 'Message', 400);

// Required middleware
app.use((error, req, res, next) => {
  if (error instanceof ServiceError) {
    return res.status(error.status).json(error.toJSON());
  }
  logger.error('Unexpected error:', error);
  res.status(500).json({ error: 'Internal server error' });
});
```

### Import Conventions
- ES modules only (`import/export`) - NO CommonJS
- Relative imports: `./routes`, `../utils`
- Common module: `@microrealestate/common/...`
- Barrel exports in index files

## Service Structure (New Services)
```
services/[name]/
├── src/index.ts          # Entry point with error middleware
├── src/routes.ts         # Route definitions
├── Dockerfile            # Production build
├── dev.Dockerfile        # Development with hot reload
└── package.json          # Workspace member
```

## Frontend Standards

### Component Organization
- **Shared**: `webapps/commonui/components`
- **App-specific**: `src/components`
- **State**: MobX (landlord), React Hook Form (tenant)
- **Styling**: Tailwind CSS utility-first

### Internationalization (Required)
```javascript
import { useTranslation } from 'react-i18next';
const { t } = useTranslation();
// All text: {t('common:key')}
// Files: webapps/[app]/locales/[lang]/common.json
```

## Database Patterns

### MongoDB Access
```typescript
import { Collections } from '@microrealestate/common/collections';
const tenant = await Collections.Tenant.findOne({ _id: tenantId });
```

### Valkey/Redis Caching
```typescript
await RedisClient.set('key', 'value', 'EX', 3600);
const value = await RedisClient.get('key');
```

## Environment & Dependencies

### Environment Variables
- Format: `SCREAMING_SNAKE_CASE` with service prefix
- Base: `base.env`, Local: `.env` (not committed)
- Docker: Use `APP_DOMAIN` and `APP_PROTOCOL`

### Locked Versions
- Node.js 22.17.1 (exact - see `.nvmrc`)
- Yarn 3.3.0 (NO npm)
- Axios 1.8.4, Lodash 4.17.21, Nanoid 5.1.0
- ESLint 8.57.0, Prettier 3.5.2

## Development Commands
```bash
yarn dev                  # Start development
yarn mre dev             # CLI development
yarn mre build           # Production build
yarn workspaces foreach  # Cross-workspace commands
```

## Testing Commands
```bash
# Start application for testing
APP_PORT=8080 docker-compose -p local up

# Start application in background for testing
APP_PORT=8080 docker-compose -p local up -d

# Stop testing application
docker-compose -p local down

# View logs during testing
docker-compose -p local logs -f [service-name]
```

## Parallel Processing & Development Efficiency

### File Operations (Use Parallel Processing)
```bash
# Search across multiple services simultaneously
find services/ -name "*.ts" -o -name "*.js" | xargs grep -l "pattern" &
find webapps/ -name "*.tsx" -o -name "*.jsx" | xargs grep -l "pattern" &
wait

# Parallel file editing with multiple processes
yarn workspaces foreach --parallel run lint:fix
yarn workspaces foreach --parallel run format

# Concurrent file operations
grep -r "searchterm" services/ &
grep -r "searchterm" webapps/ &
grep -r "searchterm" types/ &
wait
```

### Local Docker Image Building (Parallel)
```bash
# Build multiple service images concurrently
docker build -f services/api/Dockerfile -t mre-api:local services/api &
docker build -f services/gateway/Dockerfile -t mre-gateway:local services/gateway &
docker build -f services/authenticator/Dockerfile -t mre-auth:local services/authenticator &
wait

# Parallel webapp builds
docker build -f webapps/landlord/Dockerfile -t mre-landlord:local webapps/landlord &
docker build -f webapps/tenant/Dockerfile -t mre-tenant:local webapps/tenant &
wait

# Use docker-compose for parallel builds
docker-compose build --parallel

# Build specific services in parallel
docker-compose build --parallel api gateway authenticator
```

### Development Workflow Optimization
```bash
# Parallel workspace operations
yarn workspaces foreach --parallel run build
yarn workspaces foreach --parallel run test
yarn workspaces foreach --parallel run type-check

# Concurrent development servers (use different terminals)
yarn workspace @microrealestate/api run dev &
yarn workspace @microrealestate/gateway run dev &
yarn workspace @microrealestate/landlord run dev &

# Parallel linting and formatting
yarn workspaces foreach --parallel run lint &
yarn workspaces foreach --parallel run format &
wait
```

### File Search & Edit Patterns
```bash
# Multi-directory parallel search
find . -name "*.ts" -not -path "./node_modules/*" | xargs grep -l "ServiceError" &
find . -name "*.js" -not -path "./node_modules/*" | xargs grep -l "ServiceError" &
wait

# Parallel sed operations for bulk edits
find services/ -name "*.ts" | xargs sed -i 's/oldPattern/newPattern/g' &
find webapps/ -name "*.tsx" | xargs sed -i 's/oldPattern/newPattern/g' &
wait

# Concurrent file processing
ls services/*/package.json | xargs -P 4 -I {} sh -c 'echo "Processing {}" && cat {}'
```

### Performance Guidelines
- **Always use parallel operations** for multi-service tasks
- **Background processes** with `&` for independent operations
- **Use `wait`** to synchronize parallel operations
- **Leverage `xargs -P`** for parallel command execution
- **Docker parallel builds** reduce local development time
- **Concurrent workspace commands** with `--parallel` flag

### Docker Profiles
- `--profile dev`: Source builds with hot reload
- `--profile local`: Pre-built images
- Production: No profile (optimized)

## CI/CD & GitHub Actions

### Complete CI/CD Pipeline
- **Trigger**: Push to `master` branch only
- **Registry**: GitHub Container Registry (ghcr.io)
- **Deployment**: Automated to CI environment
- **Testing**: End-to-end Cypress tests

### CI Workflow Structure
```yaml
name: Continuous Integration
on:
  push:
    branches: [master]

jobs:
  setup: # Queue management
  lint: # Code quality checks
  build-push-images: # Docker builds for all services
  deploy: # Deploy to CI environment
  healthcheck: # Verify deployment
  test: # E2E testing with Cypress
```

### Docker Image Building (All Microservices)
**Backend Services:**
- `api` - Main business logic API
- `authenticator` - Authentication service with JWT/OTP
- `cache` - Caching service (Valkey/Redis)
- `emailer` - Email notification service
- `gateway` - API gateway and reverse proxy
- `monitoring` - System monitoring service
- `pdfgenerator` - Document generation service
- `resetservice` - Password reset service
- `tenantapi` - Tenant-specific API endpoints
- `whatsapp` - WhatsApp Business API integration

**Frontend Applications:**
- `landlord-frontend` - Property management interface
- `tenant-frontend` - Tenant portal interface

### Image Registry & Tagging
- **Registry**: `ghcr.io/${{ github.repository }}/[service]:${{ github.sha }}`
- **Tagging**: Uses commit SHA for traceability
- **Multi-platform**: Linux AMD64 support

### Deployment Process
1. **Build CLI**: Package MRE CLI tool for deployment
2. **Copy files**: Transfer deployment files to remote server
3. **Deploy**: Use MRE CLI to deploy with new images
4. **Cleanup**: Remove old containers and images
5. **Health check**: Verify application is running
6. **E2E tests**: Run Cypress tests against deployed environment

### Required Secrets
```bash
HOST                    # Deployment server hostname
USERNAME               # SSH username for deployment
KEY                    # SSH private key for deployment
CI_GATEWAY_URL         # Gateway URL for testing
CI_LANDLORD_APP_URL    # Landlord app URL for testing
```

### Quality Enforcement
- **ESLint + Prettier**: Code quality before build
- **Docker builds**: Validate all 12 services can build
- **Health checks**: Ensure deployment success
- **E2E tests**: Validate full application functionality

## New Service Checklist
1. Create `services/[name]/` directory
2. Use TypeScript (mandatory for new services)
3. Include `Dockerfile` and `dev.Dockerfile`
4. Add `@microrealestate/common` dependency
5. Assign unique port (check existing)
6. Update all docker-compose files
7. Add to root `package.json` workspaces

## WhatsApp Integration

### OTP Pattern
```javascript
const otpCode = generateOTP();
await sendWhatsAppOTP(phoneNumber, otpCode);
await storeOTPInRedis(phoneNumber, otpCode, 300); // 5min expiry
```

### Phone Number Handling
- Dominican Republic: Use special formatting utilities
- International: E.164 format required
- Always validate using common utilities

## Quality Enforcement
- Husky pre-commit hooks with lint-staged
- ESLint + Prettier on all files
- Tests must pass before commits