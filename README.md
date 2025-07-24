# MicroRealEstate

[![Continuous Integration](https://github.com/perezjoseph/microrealestate-whatsapp/actions/workflows/ci.yml/badge.svg?event=push)](https://github.com/perezjoseph/microrealestate-whatsapp/actions/workflows/ci.yml)

MicroRealEstate is an open-source property management platform designed to help landlords efficiently manage their properties, tenants, and rental operations with integrated WhatsApp notifications.

## Key Features

### Core Property Management
- **Property & Tenant Management** - Centralized database for properties, tenants, and lease agreements
- **Rent Tracking & Invoicing** - Automated rent collection with payment tracking and reminders
- **Document Generation** - Create custom leases, notices, and rental documents
- **Team Collaboration** - Multi-user support for property management teams

### WhatsApp Integration
- **Invoice Notifications** - Send rent invoices directly via WhatsApp
- **Payment Reminders** - Automated WhatsApp reminders for overdue payments
- **OTP Authentication** - Secure tenant login using WhatsApp OTP codes
- **Multi-language Support** - Templates available in Spanish, English, and more
- **Dominican Republic Support** - Optimized for DR phone number formatting

### Technical Features
- **Modern Architecture** - Microservices-based with Docker containerization
- **Multi-language Support** - Available in English, Spanish, French, German, and Portuguese
- **Responsive Design** - Works on desktop, tablet, and mobile devices
- **Security** - JWT authentication, rate limiting, and SQL injection protection

## Screenshots

|                                                                                                                           |                                                                                                                                   |                                                                                                                                       |
| :-----------------------------------------------------------------------------------------------------------------------: | :-------------------------------------------------------------------------------------------------------------------------------: | :-----------------------------------------------------------------------------------------------------------------------------------: |
|                                                      **Rents page**                                                       |                                                **Send notices, receipt by email**                                                 |                                                            **Pay a rent**                                                             |
|      [<img src="./documentation/pictures/rents.png" alt="drawing" width="200"/>](./documentation/pictures/rents.png)      | [<img src="./documentation/pictures/sendmassemails.png" alt="drawing" width="200"/>](./documentation/pictures/sendmassemails.png) |          [<img src="./documentation/pictures/payment.png" alt="drawing" width="200"/>](./documentation/pictures/payment.png)          |
|                                                     **Tenants page**                                                      |                                                        **Tenant details**                                                         |                                                                                                                                       |
|    [<img src="./documentation/pictures/tenants.png" alt="drawing" width="200"/>](./documentation/pictures/tenants.png)    | [<img src="./documentation/pictures/tenantcontract.png" alt="drawing" width="200"/>](./documentation/pictures/tenantcontract.png) |                                                                                                                                       |
|                                                    **Properties page**                                                    |                                                       **Property details**                                                        |                                                                                                                                       |
| [<img src="./documentation/pictures/properties.png" alt="drawing" width="200"/>](./documentation/pictures/properties.png) |       [<img src="./documentation/pictures/property.png" alt="drawing" width="200"/>](./documentation/pictures/property.png)       |                                                                                                                                       |

## Quick Start

### Prerequisites
- [Docker and Docker Compose](https://docs.docker.com/compose/install)
- WhatsApp Business API credentials (optional, for WhatsApp features)

### Installation

1. **Download the application files:**
```shell
mkdir mre
cd mre
curl https://raw.githubusercontent.com/perezjoseph/microrealestate-whatsapp/master/docker-compose.yml > docker-compose.yml
curl https://raw.githubusercontent.com/perezjoseph/microrealestate-whatsapp/master/.env.domain > .env
```

2. **Configure environment variables:**
Edit the `.env` file and update the secrets and tokens at the end of the file.

**Required Configuration:**
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
WHATSAPP_LOGIN_TEMPLATE_NAME=otpcode
WHATSAPP_LOGIN_TEMPLATE_LANGUAGE=es
```

**IMPORTANT**: If you previously ran the application, the secrets, tokens, and MONGO_URL must be copied from the previous .env file to maintain database connectivity and login credentials.

## Deployment Options

### Localhost Setup
```shell
APP_PORT=8080 docker compose --profile local up
```
- **Landlord Interface**: http://localhost:8080/landlord
- **Tenant Interface**: http://localhost:8080/tenant

### Development Setup (Build from Source)
```shell
APP_PORT=8080 docker compose --profile dev up
```
This profile builds the frontend applications from source code, useful for development with custom changes.

### Production Setup

#### IP Address Setup
```shell
sudo APP_DOMAIN=x.x.x.x docker compose up
```
- **Landlord Interface**: http://x.x.x.x/landlord
- **Tenant Interface**: http://x.x.x.x/tenant

#### Domain with HTTPS Setup
```shell
sudo APP_DOMAIN=app.example.com APP_PROTOCOL=https docker compose up
```
- **Landlord Interface**: https://app.example.com/landlord
- **Tenant Interface**: https://app.example.com/tenant

## WhatsApp Integration Setup

### Prerequisites
1. **WhatsApp Business API Account** - Set up through Meta Business
2. **Approved Templates** - Ensure you have these templates approved:
   - `factura2` - For rent invoices and notifications
   - `otpcode` - For OTP authentication

### Configuration
Add to your `.env` file:
```bash
# WhatsApp Business API Configuration
WHATSAPP_ACCESS_TOKEN=your_whatsapp_access_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id

# WhatsApp Templates
WHATSAPP_TEMPLATE_NAME=factura2
WHATSAPP_TEMPLATE_LANGUAGE=es
WHATSAPP_LOGIN_TEMPLATE_NAME=otpcode
WHATSAPP_LOGIN_TEMPLATE_LANGUAGE=es
```

### Features Enabled
- **Rent Notifications** - Send rent invoices and reminders via WhatsApp
- **OTP Authentication** - Secure tenant login using WhatsApp OTP
- **Multi-language Support** - Templates support multiple languages
- **Dominican Republic Optimization** - Proper phone number formatting

## Architecture

MicroRealEstate follows a microservices architecture:

### Core Services
- **Gateway** (Port 8080) - API gateway and reverse proxy
- **API** (Port 8200) - Main business logic and data management
- **Authenticator** (Port 8100) - Authentication service with JWT and OTP support
- **TenantAPI** (Port 8300) - Tenant-specific API endpoints

### Communication Services
- **WhatsApp** (Port 8500) - WhatsApp Business API integration
- **Emailer** (Port 8083) - Email notification service
- **PDFGenerator** (Port 8082) - Document generation service

### Frontend Applications
- **Landlord Frontend** - Property management interface (Next.js)
- **Tenant Frontend** - Tenant portal interface (Next.js)

### Data Layer
- **MongoDB** - Primary database for application data
- **Valkey** - Redis-compatible caching and session management

## Data Management

### Backup
```shell
docker compose run mongo /usr/bin/mongodump --uri=mongodb://mongo/mredb --gzip --archive=./backup/mredb-$(date +%F_%T).dump
```

### Restore
```shell
docker compose run mongo /usr/bin/mongorestore --uri=mongodb://mongo/mredb --drop --gzip --archive=./backup/mredb-XXXX.dump 
```

## Development

To run the application in development mode:

```shell
# Clone the repository
git clone https://github.com/perezjoseph/microrealestate-whatsapp.git
cd microrealestate-whatsapp

# Install dependencies
yarn install

# Start development environment
yarn dev
```

For detailed development setup, see the [Developer Guide](./documentation/DEVELOPER.md)

For comprehensive deployment instructions, see the [Deployment Guide](./documentation/DEPLOYMENT.md)

## Contributing

We welcome contributions! Areas for contribution:
- New language translations
- WhatsApp template improvements
- Security enhancements
- UI/UX improvements
- Documentation updates

## License

This project is licensed under the GNU Affero General Public License (AGPL) v3.

The AGPL is a copyleft license that ensures the software remains free and open source, even when used in network services. If you modify this software and provide it as a network service, you must make the source code available to users of that service.

[View License](./LICENSE)

## Support

For support and questions:
- Create an issue on GitHub
- Check the [documentation](./documentation/) folder
- Review the [deployment guide](./documentation/DEPLOYMENT.md)
- Consult the [developer guide](./documentation/DEVELOPER.md)

## Recent Updates

### WhatsApp Integration
- Complete WhatsApp Business API integration
- Dominican Republic phone number formatting
- Spanish invoice templates
- OTP authentication via WhatsApp
- Rate limiting and security improvements

### Security Enhancements
- JWT security improvements
- NoSQL injection protection
- Rate limiting implementation
- Enhanced authentication middleware

### Technical Improvements
- Microservices architecture optimization
- Docker containerization improvements
- Valkey integration (Redis-compatible)
- Code quality and linting improvements

---

**Version**: 1.0.0  
**Author**: Joseph Pérez  
**Repository**: https://github.com/perezjoseph/microrealestate-whatsapp
