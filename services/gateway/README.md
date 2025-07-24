# Gateway Service

API gateway and reverse proxy service that routes requests to appropriate microservices.

## Features
- Request routing and load balancing
- CORS handling
- Rate limiting
- Request/response logging
- Health check aggregation

## Configuration
- **Port**: 8080
- **Upstream Services**: API, Authenticator, TenantAPI, WhatsApp, Emailer, PDFGenerator

## Environment Variables
```bash
API_URL=http://api:8200
AUTHENTICATOR_URL=http://authenticator:8100
TENANTAPI_URL=http://tenantapi:8300
WHATSAPP_URL=http://whatsapp:8500
```

## Development
```bash
cd services/gateway
yarn install
yarn dev
```

## Routes
- `/api/*` → API Service
- `/auth/*` → Authenticator Service
- `/tenant/*` → TenantAPI Service
- `/whatsapp/*` → WhatsApp Service
