# MicroRealEstate

[![Continuous Integration](https://github.com/perezjoseph/microrealestate-whatsapp/actions/workflows/ci.yml/badge.svg?event=push)](https://github.com/perezjoseph/microrealestate-whatsapp/actions/workflows/ci.yml)

MicroRealEstate is an open-source property management platform designed to help landlords efficiently manage their properties, tenants, and rental operations.

## Features

- **Property & Tenant Management** - Centralized database for properties, tenants, and lease agreements
- **Rent Tracking & Invoicing** - Automated rent collection with payment tracking and reminders
- **WhatsApp Integration** - Send invoices and notifications via WhatsApp with OTP authentication
- **Multi-language Support** - Available in English, Spanish, French, German, and Portuguese
- **Document Generation** - Create custom leases, notices, and rental documents
- **Team Collaboration** - Multi-user support for property management teams
- **Modern Architecture** - Microservices-based with Docker containerization

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
curl https://raw.githubusercontent.com/microrealestate/microrealestate/master/docker-compose.yml > docker-compose.yml
curl https://raw.githubusercontent.com/microrealestate/microrealestate/master/.env.domain > .env
```

2. **Configure environment variables:**
Edit the `.env` file and update the secrets and tokens at the end of the file.

**Required Configuration:**
```bash
# Basic Configuration
MONGO_URL=mongodb://mongo/mredb
REDIS_URL=redis://redis:6379
JWT_SECRET=your_jwt_secret_here

# WhatsApp Configuration (Optional)
WHATSAPP_ACCESS_TOKEN=your_whatsapp_access_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_TEMPLATE_NAME=factura2
WHATSAPP_TEMPLATE_LANGUAGE=es
WHATSAPP_LOGIN_TEMPLATE_NAME=otpcode
WHATSAPP_LOGIN_TEMPLATE_LANGUAGE=es
```

**IMPORTANT**

In case you previously ran the application, the secrets, the tokens and the MONGO_URL must be reported from previous .env file to the new one.
Otherwise, the application will not point to the correct database and will not be able to login with the previous credentials.

## Deployment Options

### Localhost Setup

Start the application under localhost:

```shell
APP_PORT=8080 docker compose --profile local up
```
The application will be available on:
- **Landlord Interface**: http://localhost:8080/landlord
- **Tenant Interface**: http://localhost:8080/tenant

### IP Address Setup

Start the application under a custom IP:

```shell
sudo APP_DOMAIN=x.x.x.x docker compose up
```
Replace `x.x.x.x` with your server's IP address.

The application will be available on:
- **Landlord Interface**: http://x.x.x.x/landlord
- **Tenant Interface**: http://x.x.x.x/tenant

**Note**: If you need to use a port number, use the `APP_PORT` environment variable instead of including it in `APP_DOMAIN`.

### Domain with HTTPS Setup

Start the application under a custom domain with HTTPS:

```shell
sudo APP_DOMAIN=app.example.com APP_PROTOCOL=https docker compose up
```

Make sure your DNS records are pointing to your server. The application will automatically issue the SSL certificate.

The application will be available on:
- **Landlord Interface**: https://app.example.com/landlord
- **Tenant Interface**: https://app.example.com/tenant

## WhatsApp Integration

### Prerequisites
1. **WhatsApp Business API Account**: Set up through Meta Business
2. **Approved Templates**: Ensure you have the following templates approved:
   - `factura2` - For rent invoices and notifications
   - `otpcode` - For OTP authentication

### Configuration
Add the following to your `.env` file:

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
- **Rent Notifications**: Send rent invoices and reminders via WhatsApp
- **OTP Authentication**: Secure tenant login using WhatsApp OTP
- **Multi-language Support**: Templates support multiple languages

## Data Management

### Backup

The backup and restore commands can be executed when the application is running to allow connecting to MongoDB.

In the mre directory run:

```shell
docker compose run mongo /usr/bin/mongodump --uri=mongodb://mongo/mredb --gzip --archive=./backup/mredb-$(date +%F_%T).dump
```

Replace "mredb" with the name of your database (see .env file). By default, the database name is "mredb".

The archive file will be placed in the "backup" folder.

### Restore

In the mre/backup directory, select an archive file you want to restore. 

Then run the restore command:

```shell
docker compose run mongo /usr/bin/mongorestore --uri=mongodb://mongo/mredb --drop --gzip --archive=./backup/mredb-XXXX.dump 
```

Where mredb-XXXX.dump is the archive file you selected.

Again, replace "mredb" with the name of your database (see .env file). By default, the database name is "mredb".

## Architecture

MicroRealEstate follows a microservices architecture with the following components:

### Core Services
- **Gateway**: API gateway and reverse proxy
- **Authenticator**: Authentication service with JWT and OTP support
- **API**: Main business logic and data management
- **TenantAPI**: Tenant-specific API endpoints

### Communication Services
- **WhatsApp**: WhatsApp Business API integration
- **Emailer**: Email notification service
- **PDFGenerator**: Document generation service

### Frontend Applications
- **Landlord Frontend**: Property management interface (Next.js)
- **Tenant Frontend**: Tenant portal interface (Next.js)

### Data Layer
- **MongoDB**: Primary database for application data
- **Redis**: Caching and session management

## Development

To run the application in development mode, follow the steps outlined in the documentation available [here](./documentation/DEVELOPER.md)

### Quick Development Setup
```shell
# Clone the repository
git clone https://github.com/perezjoseph/microrealestate-whatsapp.git
cd microrealestate-whatsapp

# Start development environment
npm run dev
```

## Contributing

We welcome contributions! Please see our contributing guidelines and feel free to submit pull requests.

### Areas for Contribution
- New language translations
- WhatsApp template improvements
- Security enhancements
- UI/UX improvements
- Documentation updates

## Support

For support and questions:
- Create an issue on GitHub
- Check the documentation in the `/documentation` folder
- Review the FAQ and troubleshooting guides

## Changelog

See [CHANGELOG.md](./CHANGELOG.md) for detailed release notes and version history.

## Donate

Thank you for your interest in supporting MicroRealEstate.
Every contribution will help us pay our ongoing maintenance and development costs 

[![Donate](https://img.shields.io/static/v1?label=Sponsor&message=%E2%9D%A4&logo=GitHub)](https://github.com/sponsors/perezjoseph)

## License

The project is licensed under the GNU Affero General Public License (AGPL) v3. To view the license details, please follow the link below:

[GNU Affero General Public License v3](./LICENSE)

The AGPL is a copyleft license that ensures the software remains free and open source, even when used in network services. If you modify this software and provide it as a network service, you must make the source code available to users of that service.
