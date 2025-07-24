# Tenant Frontend

Tenant portal interface built with Next.js and React for tenants to access their rental information and make payments.

## Features
- Rent payment tracking
- Document access
- Maintenance requests
- WhatsApp OTP authentication
- Multi-language support
- Mobile-responsive design

## Technology Stack
- **Framework**: Next.js 14
- **UI Library**: React 18
- **Styling**: Tailwind CSS
- **State Management**: React Query
- **Authentication**: JWT + WhatsApp OTP

## Development
```bash
cd webapps/tenant
yarn install
yarn dev
```

## Build
```bash
yarn build
yarn start
```

## Environment Variables
```bash
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_WHATSAPP_OTP_ENABLED=true
```

## Key Features
- Secure WhatsApp OTP login
- Payment history dashboard
- Document download center
- Maintenance request system
- Multi-language interface
