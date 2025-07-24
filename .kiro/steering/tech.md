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

### Docker Profiles
- `--profile dev`: Source builds with hot reload
- `--profile local`: Pre-built images
- Production: No profile (optimized)

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