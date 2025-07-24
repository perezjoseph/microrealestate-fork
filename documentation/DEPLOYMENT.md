# MicroRealEstate Deployment Guide

## Overview

MicroRealEstate is a comprehensive property management platform with integrated WhatsApp notifications. This guide covers all deployment scenarios from development to production.

## Architecture

The application consists of:

### Backend Services
- **Gateway** (Port 8080) - API gateway and reverse proxy
- **API** (Port 8200) - Main business logic and data management
- **Authenticator** (Port 8100) - Authentication service with JWT and OTP support
- **TenantAPI** (Port 8300) - Tenant-specific API endpoints
- **WhatsApp** (Port 8500) - WhatsApp Business API integration
- **Emailer** (Port 8083) - Email notification service
- **PDFGenerator** (Port 8082) - Document generation service

### Frontend Applications
- **Landlord Frontend** - Property management interface (Next.js)
- **Tenant Frontend** - Tenant portal interface (Next.js)

### Data Layer
- **MongoDB** - Primary database for application data
- **Valkey** - Redis-compatible caching and session management

## Prerequisites

### System Requirements
- [Docker and Docker Compose](https://docs.docker.com/compose/install/)
- Minimum 4GB RAM
- 10GB free disk space

### For Development
- [Node.js version 20.x](https://nodejs.org/en/download/package-manager)
- [VS Code](https://code.visualstudio.com/) (recommended)
- [Git](https://git-scm.com/downloads)

### Optional: WhatsApp Integration
- WhatsApp Business API credentials
- Approved WhatsApp message templates

## Quick Start (Production)

### 1. Download Application Files

```bash
mkdir mre
cd mre
curl https://raw.githubusercontent.com/perezjoseph/microrealestate-whatsapp/master/docker-compose.yml > docker-compose.yml
curl https://raw.githubusercontent.com/perezjoseph/microrealestate-whatsapp/master/.env.domain > .env
```

### 2. Configure Environment

Edit the `.env` file and update the required configuration:

```bash
# Basic Configuration
MONGO_URL=mongodb://mongo/mredb
REDIS_URL=redis://valkey:6379
JWT_SECRET=your_jwt_secret_here

# WhatsApp Configuration (Optional)
WHATSAPP_ACCESS_TOKEN=your_whatsapp_access_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_TEMPLATE_NAME=factura2
WHATSAPP_TEMPLATE_LANGUAGE=es
```

**IMPORTANT**: If you previously ran the application, copy secrets and tokens from your previous `.env` file to maintain database connectivity.

### 3. Deploy

Choose your deployment method:

#### Localhost Setup
```bash
APP_PORT=8080 docker compose --profile local up
```
- **Landlord Interface**: http://localhost:8080/landlord
- **Tenant Interface**: http://localhost:8080/tenant

#### IP Address Setup
```bash
sudo APP_DOMAIN=x.x.x.x docker compose up
```
- **Landlord Interface**: http://x.x.x.x/landlord
- **Tenant Interface**: http://x.x.x.x/tenant

#### Domain with HTTPS Setup
```bash
sudo APP_DOMAIN=app.example.com APP_PROTOCOL=https docker compose up
```
- **Landlord Interface**: https://app.example.com/landlord
- **Tenant Interface**: https://app.example.com/tenant

## Development Setup

### 1. Clone Repository

```bash
git clone https://github.com/perezjoseph/microrealestate-whatsapp.git
cd microrealestate
```

### 2. Install Dependencies

```bash
yarn install
```

### 3. Development Commands

#### Start Development Environment
```bash
yarn dev
```
This starts all services with hot reload and debug capabilities.

#### Build for Production
```bash
yarn build
```

#### Start Production Mode
```bash
yarn start
```

#### Run Tests
```bash
# End-to-end tests with Cypress
yarn e2e:ci          # Headless mode
yarn e2e:run         # With browser visible
yarn e2e:open        # Cypress UI

# Stop all services
yarn stop
```

## Configuration

### Environment Variables

#### Core Configuration
```bash
# Database
MONGO_URL=mongodb://mongo/mredb
REDIS_URL=redis://valkey:6379

# Security
JWT_SECRET=your_jwt_secret_here
ACCESS_TOKEN_SECRET=your_access_token_secret
REFRESH_TOKEN_SECRET=your_refresh_token_secret

# Application
NODE_ENV=production
APP_NAME=MicroRealEstate
SIGNUP=true
```

#### Email Configuration
```bash
# Gmail (Recommended)
GMAIL_EMAIL=your-email@gmail.com
GMAIL_APP_PASSWORD=your-app-password

# Or SMTP
SMTP_SERVER=smtp.example.com
SMTP_PORT=587
SMTP_USERNAME=your-username
SMTP_PASSWORD=your-password
```

#### WhatsApp Configuration
```bash
# WhatsApp Business API
WHATSAPP_API_URL=https://graph.facebook.com/v23.0
WHATSAPP_ACCESS_TOKEN=your_access_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_BUSINESS_ACCOUNT_ID=your_business_account_id

# Templates
WHATSAPP_TEMPLATE_NAME=factura2
WHATSAPP_TEMPLATE_LANGUAGE=es
WHATSAPP_INVOICE_TEMPLATE=factura2
WHATSAPP_PAYMENT_NOTICE_TEMPLATE=rentcall
WHATSAPP_LOGIN_TEMPLATE_NAME=otpcode
```

### WhatsApp Integration Setup

#### Prerequisites
1. **WhatsApp Business API Account** - Set up through Meta Business
2. **Approved Templates** - Ensure you have these templates approved:
   - `factura2` - For rent invoices and notifications
   - `otpcode` - For OTP authentication

#### Template Configuration
The application supports multiple WhatsApp templates:
- **Invoice Template**: `factura2` - Professional rent invoice notifications
- **Payment Notice**: `rentcall` - Payment reminders
- **OTP Template**: `otpcode` - Secure tenant authentication
- **Multi-language Support** - Templates available in Spanish, English, and more

#### Features Enabled
- **Rent Notifications** - Send rent invoices and reminders via WhatsApp
- **OTP Authentication** - Secure tenant login using WhatsApp OTP
- **Dominican Republic Optimization** - Proper phone number formatting
- **Professional Templates** - Branded, approved message templates

## Data Management

### Backup Database
```bash
docker compose run mongo /usr/bin/mongodump --uri=mongodb://mongo/mredb --gzip --archive=./backup/mredb-$(date +%F_%T).dump
```

### Restore Database
```bash
docker compose run mongo /usr/bin/mongorestore --uri=mongodb://mongo/mredb --drop --gzip --archive=./backup/mredb-XXXX.dump
```

### Backup Valkey Data
```bash
cp -r ./data/valkey ./data/valkey-backup-$(date +%F_%T)
```

## Troubleshooting

### Common Issues

#### Services Not Starting
```bash
# Check service status
docker compose ps

# View service logs
docker compose logs [service-name]

# Restart specific service
docker compose restart [service-name]
```

#### Database Connection Issues
```bash
# Check MongoDB status
docker compose logs mongo

# Verify connection string in .env
MONGO_URL=mongodb://mongo/mredb
```

#### WhatsApp Messages Not Working
1. Verify WhatsApp credentials in `.env`
2. Check template approval status
3. Validate phone number format
4. Review WhatsApp service logs:
   ```bash
   docker compose logs whatsapp
   ```

#### Frontend Not Loading
```bash
# Rebuild frontend containers
docker compose build --no-cache landlord-frontend tenant-frontend

# Check frontend logs
docker compose logs landlord-frontend
docker compose logs tenant-frontend
```

### Health Checks

#### Service Health
```bash
# Gateway health
curl http://localhost:8080/health

# WhatsApp service health
curl http://localhost:8500/health

# API health
curl http://localhost:8200/health
```

#### Database Health
```bash
# MongoDB connection
docker compose exec mongo mongosh --eval "db.adminCommand('ping')"

# Valkey connection
docker compose exec valkey valkey-cli ping
```

## Production Considerations

### Security
- Change all default passwords and secrets
- Use HTTPS in production
- Configure firewall rules
- Regular security updates

### Performance
- Monitor resource usage
- Configure appropriate limits
- Use production-grade database setup
- Implement caching strategies

### Monitoring
- Set up health checks
- Configure log aggregation
- Monitor service metrics
- Set up alerting

### Backup Strategy
- Automated database backups
- Configuration backup
- Disaster recovery plan
- Regular restore testing

## Support

### Documentation
- Check `/documentation` folder for detailed guides
- Review service-specific README files
- Consult API documentation

### Troubleshooting
- Check Docker logs for errors
- Verify environment configuration
- Test individual service endpoints
- Review network connectivity

### Community
- GitHub Issues for bug reports
- Discussions for questions
- Contributions welcome

---

**Last Updated**: July 2025  
**Version**: 1.0.0  
**Maintainer**: Joseph Pérez
