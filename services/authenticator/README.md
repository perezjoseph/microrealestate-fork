# Authenticator Service

Authentication service providing JWT-based authentication and WhatsApp OTP support.

## Features
- JWT token generation and validation
- WhatsApp OTP authentication
- User session management
- Rate limiting protection
- Multi-factor authentication

## Configuration
- **Port**: 8100
- **Database**: MongoDB
- **Cache**: Redis

## Environment Variables
```bash
JWT_SECRET=your_jwt_secret_here
WHATSAPP_ACCESS_TOKEN=your_whatsapp_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_id
```

## Development
```bash
cd services/authenticator
yarn install
yarn dev
```

## API Endpoints
- `/auth/login` - User authentication
- `/auth/otp` - WhatsApp OTP verification
- `/auth/refresh` - Token refresh
- `/auth/logout` - User logout
