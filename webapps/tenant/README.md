# Tenant Frontend

Tenant portal interface built with Next.js and React for tenants to access their rental information and make payments.

## Features
- Rent payment tracking
- Document access
- Maintenance requests
- WhatsApp OTP authentication
- Multi-language support
- Mobile-responsive design

## Technology Stack
- **Framework**: Next.js 14
- **UI Library**: React 18
- **Styling**: Tailwind CSS
- **State Management**: React Query
- **Authentication**: JWT + WhatsApp OTP

## Development
```bash
cd webapps/tenant
yarn install
yarn dev
```

## Build
```bash
yarn build
yarn start
```

## Environment Variables
```bash
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_WHATSAPP_OTP_ENABLED=true
```

## Key Features
- Secure WhatsApp OTP login with international phone validation
- Payment history dashboard
- Document download center
- Maintenance request system
- Multi-language interface
- Advanced phone input validation with country detection

## Phone Validation System

The tenant app includes a comprehensive phone validation system for WhatsApp OTP authentication:

### Features
- **International Support**: 25+ countries with proper formatting
- **Country Detection**: Automatic detection from browser locale
- **Dominican Republic Support**: Special handling for DR area codes (809, 829, 849)
- **E.164 Formatting**: Proper formatting for API integration
- **Real-time Validation**: Instant feedback on phone number validity
- **localStorage Integration**: Remembers user's preferred country

### Testing
```bash
# Run phone validation tests
yarn test src/utils/phone/__tests__/

# Test specific validation scenarios
yarn test --testNamePattern="PhoneValidator"
yarn test --testNamePattern="CountryData"
```

### Usage Example
```typescript
import { PhoneValidator, CountryData } from '@/utils/phone';

// Validate phone number
const result = PhoneValidator.validate('(809) 123-4567', 'DO');
console.log(result.isValid); // true
console.log(result.e164);   // +18091234567

// Detect country from browser
const country = CountryData.detectBestCountry();
console.log(country.name);  // "United States" or detected country
```
