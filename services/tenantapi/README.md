# TenantAPI Service

Tenant-specific API service providing tenant portal functionality.

## Features
- Tenant authentication
- Rent payment tracking
- Document access
- Maintenance requests
- Communication with landlords

## Configuration
- **Port**: 8300
- **Database**: MongoDB
- **Cache**: Redis

## Environment Variables
```bash
MONGO_URL=mongodb://mongo/mredb
REDIS_URL=redis://redis:6379
JWT_SECRET=your_jwt_secret_here
```

## Development
```bash
cd services/tenantapi
yarn install
yarn dev
```

## API Endpoints
- `/tenant/profile` - Tenant profile management
- `/tenant/payments` - Payment history
- `/tenant/documents` - Document access
- `/tenant/maintenance` - Maintenance requests
