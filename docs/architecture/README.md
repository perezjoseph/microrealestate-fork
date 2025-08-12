# System Architecture

MicroRealEstate is built using a microservices architecture that provides scalability, maintainability, and flexibility for property management operations.

## Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐
│   Landlord      │    │     Tenant      │
│    Portal       │    │     Portal      │
│  (Next.js)      │    │   (Next.js)     │
└─────────┬───────┘    └─────────┬───────┘
          │                      │
          └──────────┬───────────┘
                     │
          ┌─────────────────┐
          │   API Gateway   │
          │   (Express)     │
          └─────────┬───────┘
                    │
    ┌───────────────┼───────────────┐
    │               │               │
┌───▼───┐    ┌─────▼─────┐    ┌───▼────┐
│  Auth │    │    API    │    │ Tenant │
│Service│    │  Service  │    │   API  │
└───┬───┘    └─────┬─────┘    └───┬────┘
    │              │              │
    └──────────────┼──────────────┘
                   │
    ┌──────────────┼──────────────┐
    │              │              │
┌───▼───┐    ┌────▼────┐    ┌────▼────┐
│  PDF  │    │ WhatsApp│    │ Emailer │
│  Gen  │    │ Service │    │ Service │
└───────┘    └─────────┘    └─────────┘
                   │
          ┌────────┼────────┐
          │        │        │
      ┌───▼───┐ ┌──▼──┐ ┌───▼────┐
      │MongoDB│ │Cache│ │Monitor │
      │       │ │     │ │Service │
      └───────┘ └─────┘ └────────┘
```

## Core Principles

### 1. Microservices Architecture
- **Service Independence**: Each service can be developed, deployed, and scaled independently
- **Single Responsibility**: Each service handles a specific business domain
- **API-First Design**: Services communicate through well-defined REST APIs
- **Technology Diversity**: Services can use different technologies as needed

### 2. Containerization
- **Docker Containers**: All services run in isolated containers
- **Docker Compose**: Orchestration for development and production
- **Health Checks**: Built-in service health monitoring
- **Resource Management**: Configurable resource limits and scaling

### 3. API Gateway Pattern
- **Centralized Routing**: Single entry point for all client requests
- **Load Balancing**: Distributes requests across service instances
- **Authentication**: Centralized JWT token validation
- **Rate Limiting**: Protection against abuse and overload

### 4. Data Architecture
- **Database per Service**: Each service owns its data
- **Shared Database**: Unified MongoDB instance (`mredb`) for consistency
- **Caching Layer**: Valkey (Redis-compatible) for performance
- **Event-Driven**: Asynchronous communication where appropriate

## Service Responsibilities

### Frontend Services
- **Landlord Portal**: Property management interface for landlords
- **Tenant Portal**: Self-service interface for tenants
- **Common UI**: Shared components and utilities

### Backend Services
- **Gateway**: Request routing, authentication, and API composition
- **Authenticator**: User management, JWT tokens, and authorization
- **API**: Core business logic for properties, tenants, and rent management
- **Tenant API**: Tenant-specific endpoints and operations
- **PDF Generator**: Document generation for invoices and reports
- **Emailer**: Email notifications and communication
- **WhatsApp**: WhatsApp Business API integration
- **Cache**: Caching and session management
- **Monitoring**: Health checks and system monitoring

### Infrastructure Services
- **MongoDB**: Primary data storage
- **Valkey**: Caching and session storage
- **Logstash**: Log aggregation and processing (optional)

## Communication Patterns

### Synchronous Communication
- **HTTP/REST**: Primary communication method between services
- **Request/Response**: Direct service-to-service calls
- **API Gateway**: Centralized routing and composition

### Asynchronous Communication
- **Event Publishing**: Services publish domain events
- **Message Queues**: Decoupled communication for non-critical operations
- **Background Jobs**: Scheduled tasks and batch processing

## Security Architecture

### Authentication & Authorization
- **JWT Tokens**: Stateless authentication across services
- **Refresh Tokens**: Secure token rotation
- **Role-Based Access**: Landlord and tenant role separation
- **API Gateway Security**: Centralized authentication enforcement

### Network Security
- **Internal Network**: Services communicate on private Docker network
- **Rate Limiting**: Protection against abuse and DDoS
- **Input Validation**: Comprehensive request validation
- **Security Headers**: HTTP security headers via Helmet.js

## Scalability & Performance

### Horizontal Scaling
- **Service Replication**: Multiple instances of services
- **Load Balancing**: Request distribution across instances
- **Database Scaling**: MongoDB replica sets and sharding
- **Cache Scaling**: Valkey clustering for high availability

### Performance Optimization
- **Caching Strategy**: Multi-layer caching (application, database, CDN)
- **Database Indexing**: Optimized queries and indexes
- **Connection Pooling**: Efficient database connections
- **Asset Optimization**: Frontend bundling and compression

## Deployment Architecture

### Development Environment
- **Local Development**: Docker Compose with hot-reload
- **Service Isolation**: Independent service development
- **Shared Dependencies**: Common utilities and types

### Production Environment
- **Container Orchestration**: Docker Compose or Kubernetes
- **Health Monitoring**: Service health checks and alerts
- **Log Aggregation**: Centralized logging and monitoring
- **Backup Strategy**: Automated database backups

## Technology Stack Integration

### Backend Integration
- **Node.js Runtime**: Consistent runtime across all services
- **Express Framework**: Standard web framework
- **TypeScript**: Type safety and better development experience
- **Mongoose ODM**: MongoDB integration with schema validation

### Frontend Integration
- **Next.js Framework**: Server-side rendering and optimization
- **React Ecosystem**: Component-based UI development
- **State Management**: MobX for reactive state management
- **UI Libraries**: Material-UI and Radix UI for consistent design

## Quality Assurance

### Code Quality
- **ESLint**: Consistent code style across services
- **Prettier**: Automated code formatting
- **TypeScript**: Compile-time type checking
- **Husky**: Git hooks for quality enforcement

### Testing Strategy
- **Unit Tests**: Service-level testing with Jest
- **Integration Tests**: API endpoint testing
- **End-to-End Tests**: Full workflow testing
- **Performance Tests**: Load and stress testing

## Monitoring & Observability

### Health Monitoring
- **Service Health Checks**: Built-in health endpoints
- **Dependency Monitoring**: Database and cache health
- **Performance Metrics**: Response times and throughput
- **Error Tracking**: Centralized error logging

### Logging Strategy
- **Structured Logging**: JSON-formatted logs with Winston
- **Log Aggregation**: Centralized log collection
- **Log Levels**: Configurable logging levels per service
- **Audit Trails**: User action tracking and compliance