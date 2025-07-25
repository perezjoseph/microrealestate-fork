---
inclusion: always
---

# MicroRealEstate Product Guidelines

## Core Product Principles

MicroRealEstate is an open-source property management platform with multi-tenant architecture supporting landlords, tenants, and property management teams through integrated WhatsApp communications.

### Primary User Flows
- **Landlord Dashboard**: Property portfolio management, tenant oversight, financial tracking
- **Tenant Portal**: Rent payments, lease documents, maintenance requests
- **Team Collaboration**: Multi-user property management with role-based permissions

## Feature Implementation Standards

### WhatsApp Integration Requirements
- **OTP Authentication**: 5-minute expiry, rate-limited (3/hour per phone)
- **Notification Templates**: Multi-language support (EN, ES, FR, DE, PT)
- **Phone Validation**: E.164 format with Dominican Republic special handling
- **Message Types**: Invoice delivery, payment reminders, system notifications

### User Experience Patterns
- **Responsive Design**: Mobile-first approach for tenant portal
- **Accessibility**: WCAG 2.1 AA compliance for all interfaces
- **Theme Support**: Light/dark mode with system preference detection
- **Progressive Enhancement**: Core functionality without JavaScript

### Data Architecture Principles
- **Multi-tenancy**: Strict data isolation between property management companies
- **Audit Trails**: Complete activity logging for financial transactions
- **Document Management**: Secure storage with signed URL access
- **Internationalization**: All user-facing text must use i18n keys

## Business Logic Rules

### Property Management
- **Lease Lifecycle**: Draft → Active → Expired/Terminated states
- **Rent Collection**: Automated invoicing with configurable grace periods
- **Maintenance Tracking**: Request → Assigned → In Progress → Completed workflow
- **Financial Reporting**: Monthly/quarterly reports with export capabilities

### User Permissions
- **Landlord Role**: Full property and tenant management access
- **Tenant Role**: Limited to own lease and payment information
- **Manager Role**: Subset of landlord permissions for team members
- **Admin Role**: System-wide configuration and user management

### Communication Preferences
- **Default Channel**: WhatsApp for tenant communications
- **Fallback Options**: Email for system notifications
- **Opt-out Support**: Users can disable specific notification types
- **Language Detection**: Auto-detect from user profile or browser settings

## UI/UX Standards

### Component Hierarchy
- **Layout Components**: Consistent header, navigation, footer across apps
- **Form Components**: Standardized input validation and error handling
- **Data Display**: Consistent table, card, and list patterns
- **Interactive Elements**: Unified button, modal, and tooltip styles

### Content Guidelines
- **Microcopy**: Clear, actionable text for all UI elements
- **Error Messages**: Specific, helpful guidance for user resolution
- **Success States**: Confirmation messages with next action suggestions
- **Loading States**: Progressive disclosure during async operations

### Mobile Optimization
- **Touch Targets**: Minimum 44px for interactive elements
- **Navigation**: Bottom tab bar for primary actions on mobile
- **Forms**: Single-column layout with large input fields
- **Tables**: Horizontal scroll with sticky first column

## Integration Requirements

### Third-party Services
- **Payment Processing**: Stripe integration for rent collection
- **Document Storage**: AWS S3 or compatible for file management
- **Email Service**: SendGrid/Mailgun for system notifications
- **SMS/WhatsApp**: Twilio Business API for communications

### API Design Patterns
- **RESTful Endpoints**: Consistent resource-based URL structure
- **Error Responses**: Standardized error codes and messages
- **Pagination**: Cursor-based for large datasets
- **Rate Limiting**: Per-user and per-endpoint throttling

## Performance & Scalability

### Frontend Optimization
- **Code Splitting**: Route-based lazy loading
- **Image Optimization**: WebP format with fallbacks
- **Caching Strategy**: Service worker for offline functionality
- **Bundle Size**: Monitor and limit JavaScript payload

### Backend Performance
- **Database Indexing**: Optimized queries for tenant data isolation
- **Caching Layer**: Valkey/Redis for session and frequently accessed data
- **Background Jobs**: Async processing for notifications and reports
- **Monitoring**: Application performance and error tracking