# API Service

The main business logic service for MicroRealEstate, handling property management, tenant operations, and rent calculations.

## Features
- Property and tenant management
- Rent calculations and tracking
- Lease agreement handling
- Payment processing
- Multi-language support

## Configuration
- **Port**: 8200
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
cd services/api
yarn install
yarn dev
```

## API Endpoints
- `/api/properties` - Property management
- `/api/tenants` - Tenant operations
- `/api/rents` - Rent tracking
- `/api/leases` - Lease agreements
