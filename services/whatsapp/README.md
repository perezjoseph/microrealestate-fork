# WhatsApp Service

WhatsApp Business API integration service for sending invoices and OTP authentication.

## Features
- WhatsApp Business API integration
- Invoice notifications
- OTP authentication
- Dominican Republic phone formatting
- Multi-language template support
- Rate limiting and security

## Configuration
- **Port**: 8500
- **API**: WhatsApp Business API

## Environment Variables
```bash
WHATSAPP_ACCESS_TOKEN=your_whatsapp_access_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_TEMPLATE_NAME=factura2
WHATSAPP_TEMPLATE_LANGUAGE=es
WHATSAPP_LOGIN_TEMPLATE_NAME=otpcode
WHATSAPP_LOGIN_TEMPLATE_LANGUAGE=es
```

## Development
```bash
cd services/whatsapp
yarn install
yarn dev
```

## API Endpoints
- `/whatsapp/send-message` - Send WhatsApp message
- `/whatsapp/send-invoice` - Send invoice via WhatsApp
- `/whatsapp/send-otp` - Send OTP code
- `/whatsapp/health` - Service health check

## Templates Required
- **factura2**: Invoice notification template
- **otpcode**: OTP authentication template
