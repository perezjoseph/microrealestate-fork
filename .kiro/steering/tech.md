---
inclusion: always
---

---
inclusion: always
---

# MicroRealEstate Technical Standards

## Architecture & Language Standards

### Service Architecture
- **New services**: TypeScript only (follow `services/gateway`, `services/tenantapi`)
- **Existing services**: JavaScript ES modules - DO NOT convert to TypeScript
- **Frontend**: React + Next.js with TypeScript for new components
- **Database**: MongoDB with Valkey (Redis) caching
- **Authentication**: JWT tokens via authenticator service
- **Communication**: HTTP only - no message queues

### Service Ports
- Gateway: 8080, API: 8200, Auth: 8100, TenantAPI: 8300

## Required Code Patterns

### Common Module Imports
```typescript
import { MongoClient } from '@microrealestate/common/utils/mongoclient';
import { RedisClient } from '@microrealestate/common/utils/redisclient';
import { ServiceError } from '@microrealestate/common/utils/serviceerror';
import logger from '@microrealestate/common/utils/logger';
```

### Error Handling (Mandatory)
```typescript
// Always throw ServiceError for API errors
throw new ServiceError('ERROR_CODE', 'Message', 400);

// Required error middleware in all services
app.use((error, req, res, next) => {
  if (error instanceof ServiceError) {
    return res.status(error.status).json(error.toJSON());
  }
  logger.error('Unexpected error:', error);
  res.status(500).json({ error: 'Internal server error' });
});
```

### Import/Export Conventions
- ES modules only (`import/export`) - NO CommonJS
- Relative imports: `./routes`, `../utils`
- Common module: `@microrealestate/common/...`
- Barrel exports in index files

## Frontend Standards

### Component Organization
- **Shared components**: `webapps/commonui/components`
- **App-specific**: `src/components`
- **State management**: MobX (landlord), React Hook Form (tenant)
- **Styling**: Tailwind CSS utility-first approach

### Theme System (Required)
```typescript
// Use theme provider in all apps
import { ThemeProvider } from '@/components/providers/ThemeProvider';

// Theme-aware components
import { useTheme } from '@microrealestate/commonui/hooks/useTheme';
const { theme, toggleTheme } = useTheme();
```

### Internationalization (Required)
```javascript
import { useTranslation } from 'react-i18next';
const { t } = useTranslation();
// All user-facing text: {t('common:key')}
// Locale files: webapps/[app]/locales/[lang]/common.json
```

### Phone Input Components
```typescript
// Use standardized phone input with country detection
import { PhoneInputField } from '@/components/ui/PhoneInputField';
import { CountrySelector } from '@/components/ui/CountrySelector';

// Always validate E.164 format
import { validatePhoneNumber } from '@/utils/phone/PhoneValidatorOptimized';
```

## Database & Caching Patterns

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
- Base config: `base.env`, Local overrides: `.env` (not committed)
- Docker: Use `APP_DOMAIN` and `APP_PROTOCOL`

### Locked Versions (DO NOT CHANGE)
- Node.js 22.17.1 (exact - see `.nvmrc`)
- Yarn 3.3.0 (NO npm allowed)
- Axios 1.8.4, Lodash 4.17.21, Nanoid 5.1.0
- ESLint 8.57.0, Prettier 3.5.2

## Development Workflow

### Commands
```bash
yarn dev                  # Start development
yarn mre dev             # CLI development
yarn mre build           # Production build
yarn workspaces foreach  # Cross-workspace commands
```

### Testing
```bash
# Local testing environment
APP_PORT=8080 docker-compose -p local up -d
docker-compose -p local logs -f [service-name]
docker-compose -p local down
```

### Performance Optimization
- **Always use parallel operations** for multi-service tasks
- **Concurrent builds**: `docker-compose build --parallel`
- **Parallel workspace operations**: `yarn workspaces foreach --parallel`
- **Background processes**: Use `&` and `wait` for independent operations

## CI/CD Pipeline

### Deployment Flow
1. **Trigger**: Push to `master` branch only
2. **Registry**: GitHub Container Registry (ghcr.io)
3. **Services**: All 12 microservices + 2 frontend apps
4. **Testing**: Automated E2E with Cypress
5. **Deployment**: Automated to CI environment

### Required Secrets
- `HOST`, `USERNAME`, `KEY` for deployment
- `CI_GATEWAY_URL`, `CI_LANDLORD_APP_URL` for testing

## WhatsApp Integration

### OTP Implementation
```javascript
// 5-minute expiry, rate-limited (3/hour per phone)
const otpCode = generateOTP();
await sendWhatsAppOTP(phoneNumber, otpCode);
await storeOTPInRedis(phoneNumber, otpCode, 300);
```

### Phone Number Handling
- **International**: E.164 format required
- **Dominican Republic**: Special formatting utilities
- **Validation**: Always use common utilities

## Quality Standards

### Code Quality
- **Pre-commit**: Husky hooks with lint-staged
- **Linting**: ESLint + Prettier on all files
- **Testing**: Jest for unit tests, Cypress for E2E
- **Type Safety**: TypeScript strict mode for new code

### Performance Requirements
- **Bundle Analysis**: Monitor JavaScript payload size
- **Lazy Loading**: Route-based code splitting
- **Caching**: Service worker for offline functionality
- **Optimization**: WebP images with fallbacks

### Accessibility
- **WCAG 2.1 AA**: Compliance for all interfaces
- **Mobile-first**: Responsive design approach
- **Touch targets**: Minimum 44px for interactive elements
- **Screen readers**: Proper ARIA labels and semantic HTML

## New Service Checklist
1. Create `services/[name]/` with TypeScript
2. Include `Dockerfile` and `dev.Dockerfile`
3. Add `@microrealestate/common` dependency
4. Assign unique port (check existing services)
5. Update all docker-compose files
6. Add to root `package.json` workspaces
7. Implement ServiceError error handling
8. Add health check endpoint