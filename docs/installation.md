# Installation Guide

This guide will help you install and set up MicroRealEstate on your system.

## Prerequisites

### System Requirements
- **Node.js**: Version 22.17.1 or higher
- **Yarn**: Version 3.3.0 (package manager)
- **Docker**: Latest stable version
- **Docker Compose**: Latest stable version
- **Git**: For cloning the repository

### Optional Requirements
- **MongoDB**: If running without Docker
- **Valkey/Redis**: If running without Docker

## Installation Methods

### Method 1: Docker Compose (Recommended)

This is the easiest way to get MicroRealEstate running with all services.

1. **Clone the repository**
   ```bash
   git clone https://github.com/microrealestate/microrealestate.git
   cd microrealestate
   ```

2. **Set up environment variables**
   ```bash
   cp base.env .env
   # Edit .env file with your specific configuration
   ```

3. **Start all services**
   ```bash
   # For development
   docker-compose -f docker-compose.microservices.dev.yml up -d
   
   # For production
   docker-compose -f docker-compose.prod.yml up -d
   ```

4. **Verify installation**
   - Frontend: http://localhost:8080
   - API Gateway: http://localhost:8080/api
   - MongoDB: localhost:27017
   - Valkey: localhost:6379

### Method 2: Local Development Setup

For active development with hot-reload capabilities.

1. **Clone and install dependencies**
   ```bash
   git clone https://github.com/microrealestate/microrealestate.git
   cd microrealestate
   yarn install
   ```

2. **Start infrastructure services**
   ```bash
   docker-compose -f docker-compose.microservices.base.yml up -d
   ```

3. **Start development services**
   ```bash
   yarn dev
   ```

### Method 3: Manual Installation

For custom setups or when Docker is not available.

1. **Install Node.js and Yarn**
   ```bash
   # Install Node.js 22.17.1+
   # Install Yarn 3.3.0
   corepack enable
   ```

2. **Set up databases**
   - Install and configure MongoDB
   - Install and configure Valkey/Redis

3. **Clone and build**
   ```bash
   git clone https://github.com/microrealestate/microrealestate.git
   cd microrealestate
   yarn install
   yarn build
   ```

4. **Configure environment**
   ```bash
   cp base.env .env
   # Update database connection strings and other settings
   ```

5. **Start services individually**
   ```bash
   # Start each service in separate terminals
   cd services/authenticator && npm start
   cd services/api && npm start
   cd services/gateway && npm start
   # ... repeat for other services
   ```

## Post-Installation Setup

### 1. Database Initialization
The application will automatically create necessary database collections on first run.

### 2. Admin User Creation
Create your first admin user through the web interface or API.

### 3. WhatsApp Integration (Optional)
If using WhatsApp features:
1. Set up Facebook Business Account
2. Configure WhatsApp Business API
3. Update environment variables with API credentials

### 4. Email Configuration (Optional)
Configure email service for notifications:
1. Choose email provider (Gmail, Mailgun, SMTP)
2. Update email configuration in environment variables

## Verification

### Health Checks
```bash
# Check service health
curl http://localhost:8080/api/health

# Check individual services
curl http://localhost:8000/health  # Authenticator
curl http://localhost:8200/health  # Main API
curl http://localhost:8300/health  # PDF Generator
```

### Service Status
```bash
# View running containers
docker-compose ps

# View logs
docker-compose logs -f [service-name]
```

## Troubleshooting

### Common Issues

**Port conflicts**
- Check if ports 8000-8800 are available
- Modify port mappings in docker-compose files if needed

**Database connection issues**
- Ensure MongoDB is running and accessible
- Check connection string in environment variables

**Memory issues**
- Increase Docker memory allocation
- Monitor service resource usage

**SELinux issues (Linux)**
```bash
# Temporarily disable SELinux for development
sudo setenforce 0
```

### Getting Help
- Check the [Troubleshooting Guide](./development/troubleshooting.md)
- Review service logs for error messages
- Create an issue on GitHub with detailed error information

## Next Steps

After successful installation:
1. Read the [Quick Start Guide](./quick-start.md)
2. Explore the [API Documentation](./api/README.md)
3. Set up your first property and tenant