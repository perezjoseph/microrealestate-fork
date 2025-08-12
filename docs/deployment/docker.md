# Docker Deployment Guide

This guide covers deploying MicroRealEstate using Docker and Docker Compose for both development and production environments.

## Docker Architecture

MicroRealEstate uses a multi-container architecture with the following components:

### Core Services
- **Gateway**: API gateway and reverse proxy
- **Authenticator**: Authentication and user management
- **API**: Main business logic service
- **Tenant API**: Tenant-specific operations
- **Frontend**: Next.js applications (Landlord and Tenant portals)

### Utility Services
- **PDF Generator**: Document generation service
- **Emailer**: Email notification service
- **WhatsApp**: WhatsApp Business API integration
- **Cache**: Valkey (Redis-compatible) caching service
- **Monitoring**: Health checks and system monitoring

### Infrastructure
- **MongoDB**: Primary database
- **Valkey**: Cache and session storage

## Docker Compose Configurations

### Development Configuration
**File**: `docker-compose.microservices.dev.yml`

Features:
- Local builds with hot-reload
- Development environment variables
- Volume mounts for source code
- Debug ports exposed

```bash
# Start development environment
docker-compose -f docker-compose.microservices.dev.yml up -d

# View logs
docker-compose -f docker-compose.microservices.dev.yml logs -f

# Stop services
docker-compose -f docker-compose.microservices.dev.yml down
```

### Production Configuration
**File**: `docker-compose.prod.yml`

Features:
- Pre-built Docker images
- Production environment variables
- Optimized resource allocation
- Health checks and restart policies

```bash
# Start production environment
docker-compose -f docker-compose.prod.yml up -d

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Stop services
docker-compose -f docker-compose.prod.yml down
```

### Base Infrastructure
**File**: `docker-compose.microservices.base.yml`

Contains only infrastructure services (MongoDB, Valkey) for local development.

```bash
# Start only infrastructure
docker-compose -f docker-compose.microservices.base.yml up -d
```

## Environment Configuration

### Environment Files

1. **base.env**: Default configuration values
2. **.env**: Local overrides (create from base.env)
3. **.env.domain**: Domain-specific settings (optional)

### Key Environment Variables

```bash
# Application
APP_NAME=MicroRealEstate
NODE_ENV=production
DEMO_MODE=false

# Database
MONGO_URL=mongodb://mongodb:27017/mredb

# Cache
REDIS_URL=redis://valkey:6379

# Ports (configurable)
GATEWAY_PORT=8080
AUTHENTICATOR_PORT=8000
API_PORT=8200
TENANT_API_PORT=8250
PDF_GENERATOR_PORT=8300
EMAILER_PORT=8400
WHATSAPP_PORT=8500
CACHE_PORT=8600
MONITORING_PORT=8800

# Security
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret

# Email (optional)
EMAIL_FROM=noreply@yourdomain.com
EMAIL_SMTP_HOST=smtp.gmail.com
EMAIL_SMTP_PORT=587
EMAIL_SMTP_USER=your-email@gmail.com
EMAIL_SMTP_PASS=your-app-password

# WhatsApp (optional)
WHATSAPP_TOKEN=your-whatsapp-token
WHATSAPP_PHONE_NUMBER_ID=your-phone-number-id
WHATSAPP_VERIFY_TOKEN=your-verify-token
```

## Service Configuration

### Health Checks

All services include health check endpoints:

```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 40s
```

### Resource Limits

Production services have resource limits:

```yaml
deploy:
  resources:
    limits:
      memory: 512M
      cpus: '0.5'
    reservations:
      memory: 256M
      cpus: '0.25'
```

### Restart Policies

```yaml
restart: unless-stopped
```

## Networking

### Internal Network

Services communicate on a private Docker network:

```yaml
networks:
  microrealestate:
    driver: bridge
```

### Port Mapping

Only the gateway port is exposed externally:

```yaml
ports:
  - "${GATEWAY_PORT:-8080}:8080"
```

## Volume Management

### Persistent Data

```yaml
volumes:
  mongodb_data:
    driver: local
  valkey_data:
    driver: local
```

### Development Volumes

Source code mounted for hot-reload:

```yaml
volumes:
  - ./services/api/src:/app/src
  - ./services/api/package.json:/app/package.json
```

## Building Images

### Development Builds

```bash
# Build all services
docker-compose -f docker-compose.microservices.dev.yml build

# Build specific service
docker-compose -f docker-compose.microservices.dev.yml build api

# Build with no cache
docker-compose -f docker-compose.microservices.dev.yml build --no-cache
```

### Production Builds

```bash
# Build production images
docker-compose -f docker-compose.prod.yml build

# Tag for registry
docker tag microrealestate/api:latest your-registry.com/microrealestate/api:v1.0.0

# Push to registry
docker push your-registry.com/microrealestate/api:v1.0.0
```

## Deployment Strategies

### Single Server Deployment

1. **Prepare the server**
   ```bash
   # Install Docker and Docker Compose
   curl -fsSL https://get.docker.com -o get-docker.sh
   sh get-docker.sh
   
   # Install Docker Compose
   sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
   sudo chmod +x /usr/local/bin/docker-compose
   ```

2. **Deploy the application**
   ```bash
   # Clone repository
   git clone https://github.com/microrealestate/microrealestate.git
   cd microrealestate
   
   # Configure environment
   cp base.env .env
   # Edit .env with production values
   
   # Start services
   docker-compose -f docker-compose.prod.yml up -d
   ```

### Multi-Server Deployment

For larger deployments, consider:
- **Docker Swarm**: Built-in orchestration
- **Kubernetes**: Advanced orchestration with Helm charts
- **Load Balancers**: Distribute traffic across instances

## Monitoring and Logging

### Container Logs

```bash
# View all logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f api

# View logs with timestamps
docker-compose logs -f -t

# Follow logs from specific time
docker-compose logs -f --since="2025-01-08T10:00:00"
```

### Container Stats

```bash
# View resource usage
docker stats

# View specific containers
docker stats microrealestate_api_1 microrealestate_gateway_1
```

### Health Monitoring

```bash
# Check service health
curl http://localhost:8080/api/health

# Check individual services
docker-compose exec api curl http://localhost:8200/health
docker-compose exec authenticator curl http://localhost:8000/health
```

## Backup and Recovery

### Database Backup

```bash
# Create MongoDB backup
docker-compose exec mongodb mongodump --db mredb --out /backup

# Copy backup from container
docker cp microrealestate_mongodb_1:/backup ./backup/$(date +%Y%m%d)
```

### Volume Backup

```bash
# Backup volumes
docker run --rm -v microrealestate_mongodb_data:/data -v $(pwd)/backup:/backup alpine tar czf /backup/mongodb_data.tar.gz -C /data .
docker run --rm -v microrealestate_valkey_data:/data -v $(pwd)/backup:/backup alpine tar czf /backup/valkey_data.tar.gz -C /data .
```

### Restore Process

```bash
# Stop services
docker-compose down

# Restore volumes
docker run --rm -v microrealestate_mongodb_data:/data -v $(pwd)/backup:/backup alpine tar xzf /backup/mongodb_data.tar.gz -C /data

# Start services
docker-compose up -d
```

## Troubleshooting

### Common Issues

**Port conflicts**
```bash
# Check port usage
netstat -tulpn | grep :8080

# Change ports in .env file
GATEWAY_PORT=8081
```

**Memory issues**
```bash
# Increase Docker memory limit
# Docker Desktop: Settings > Resources > Memory

# Check container memory usage
docker stats --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}"
```

**Network issues**
```bash
# Inspect network
docker network inspect microrealestate_default

# Test connectivity between services
docker-compose exec api ping mongodb
```

**SELinux issues (Linux)**
```bash
# Temporarily disable SELinux
sudo setenforce 0

# Or configure SELinux contexts
sudo setsebool -P container_manage_cgroup on
```

### Debugging Services

```bash
# Access service shell
docker-compose exec api bash

# View service configuration
docker-compose exec api env

# Check service processes
docker-compose exec api ps aux

# Test service endpoints
docker-compose exec api curl http://localhost:8200/health
```

## Security Considerations

### Container Security

1. **Non-root users**: Services run as non-root users
2. **Read-only filesystems**: Where possible
3. **Minimal base images**: Alpine Linux for smaller attack surface
4. **Security scanning**: Regular image vulnerability scans

### Network Security

1. **Internal network**: Services communicate on private network
2. **Firewall rules**: Only necessary ports exposed
3. **TLS encryption**: HTTPS in production
4. **Rate limiting**: Protection against abuse

### Secrets Management

```bash
# Use Docker secrets for sensitive data
echo "your-jwt-secret" | docker secret create jwt_secret -

# Reference in compose file
secrets:
  - jwt_secret
```

## Performance Optimization

### Resource Allocation

```yaml
# Optimize resource limits based on usage
deploy:
  resources:
    limits:
      memory: 1G
      cpus: '1.0'
```

### Caching Strategy

1. **Application caching**: Valkey for session and data caching
2. **HTTP caching**: Nginx for static assets
3. **Database caching**: MongoDB query result caching

### Scaling Services

```bash
# Scale specific services
docker-compose up -d --scale api=3 --scale gateway=2
```

## Next Steps

- Set up [production monitoring](./monitoring.md)
- Configure [SSL certificates](./ssl.md)
- Implement [backup automation](./backup.md)
- Set up [CI/CD pipeline](./cicd.md)