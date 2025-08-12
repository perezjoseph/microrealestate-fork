# Quick Start Guide

Get MicroRealEstate up and running in minutes with this quick start guide.

## Prerequisites

- Docker and Docker Compose installed
- Git installed
- 8GB+ RAM available
- Ports 8000-8800 available

## 5-Minute Setup

### 1. Clone and Configure

```bash
# Clone the repository
git clone https://github.com/microrealestate/microrealestate.git
cd microrealestate

# Copy environment configuration
cp base.env .env
```

### 2. Start the Application

```bash
# Start all services (this may take a few minutes on first run)
docker-compose -f docker-compose.microservices.dev.yml up -d

# Wait for services to be ready (check logs)
docker-compose logs -f
```

### 3. Access the Application

- **Landlord Portal**: http://localhost:8080
- **Tenant Portal**: http://localhost:8080/tenant
- **API Gateway**: http://localhost:8080/api

### 4. Create Your First Account

1. Navigate to http://localhost:8080
2. Click "Sign Up" to create a new landlord account
3. Fill in your details and verify your email (if email is configured)
4. Log in with your new credentials

## Basic Workflow

### Setting Up Your First Property

1. **Add a Property**
   - Go to "Properties" in the main menu
   - Click "Add Property"
   - Enter property details (address, type, rent amount)
   - Save the property

2. **Add a Tenant**
   - Go to "Tenants" in the main menu
   - Click "Add Tenant"
   - Enter tenant information
   - Assign them to your property
   - Set lease terms and rent amount

3. **Generate First Invoice**
   - Go to "Rent Collection"
   - Select the tenant
   - Generate monthly rent invoice
   - Send via email or WhatsApp (if configured)

### Key Features to Explore

**Dashboard**
- Overview of properties, tenants, and payments
- Recent activity and notifications
- Financial summaries

**Property Management**
- Add/edit properties
- Track maintenance requests
- Upload property documents

**Tenant Management**
- Tenant profiles and contact information
- Lease agreements and terms
- Communication history

**Rent Collection**
- Generate invoices and receipts
- Track payment status
- Send payment reminders

**Reports**
- Financial reports and analytics
- Occupancy rates
- Payment history

## Configuration Options

### Environment Variables

Key settings you might want to customize in your `.env` file:

```bash
# Application settings
APP_NAME=MicroRealEstate
DEMO_MODE=false

# Database
MONGO_URL=mongodb://mongodb:27017/mredb

# Email configuration (optional)
EMAIL_FROM=noreply@yourdomain.com
EMAIL_REPLY_TO=support@yourdomain.com

# WhatsApp (optional)
WHATSAPP_TOKEN=your_whatsapp_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
```

### Service Ports

Default port configuration:
- Gateway: 8080 (main entry point)
- Authenticator: 8000
- Main API: 8200
- Tenant API: 8250
- PDF Generator: 8300
- Emailer: 8400
- WhatsApp: 8500
- Cache: 8600
- Monitoring: 8800

## Development Mode

For active development with hot-reload:

```bash
# Start infrastructure only
docker-compose -f docker-compose.microservices.base.yml up -d

# Install dependencies
yarn install

# Start development servers
yarn dev
```

## Common Commands

```bash
# View service status
docker-compose ps

# View logs for all services
docker-compose logs -f

# View logs for specific service
docker-compose logs -f api

# Stop all services
docker-compose down

# Restart a specific service
docker-compose restart api

# Update and rebuild
git pull
docker-compose down
docker-compose -f docker-compose.microservices.dev.yml up -d --build
```

## Next Steps

Now that you have MicroRealEstate running:

1. **Configure Integrations**
   - [Set up WhatsApp Business API](./features/whatsapp.md)
   - [Configure email notifications](./api/emailer.md)

2. **Customize Your Setup**
   - [Environment configuration](./deployment/environment.md)
   - [Multi-language support](./features/i18n.md)

3. **Learn the APIs**
   - [API Documentation](./api/README.md)
   - [Authentication](./api/authenticator.md)

4. **Deploy to Production**
   - [Production deployment guide](./deployment/production.md)
   - [Docker deployment](./deployment/docker.md)

## Getting Help

- **Documentation**: Browse the [full documentation](./README.md)
- **Issues**: Report problems on [GitHub Issues](https://github.com/microrealestate/microrealestate/issues)
- **Troubleshooting**: Check the [troubleshooting guide](./development/troubleshooting.md)