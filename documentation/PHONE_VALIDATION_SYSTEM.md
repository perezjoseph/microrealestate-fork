# Phone Validation System for WhatsApp Integration

This document describes the comprehensive phone validation system implemented for the tenant webapp to support WhatsApp OTP authentication.

## Overview

The phone validation system provides robust international phone number validation, formatting, and country detection capabilities. It's designed to work seamlessly with the WhatsApp OTP authentication flow while providing an excellent user experience.

## Architecture

### Core Components

1. **PhoneValidator** (`webapps/tenant/src/utils/phone/PhoneValidator.ts`)
   - Main validation logic using libphonenumber-js
   - E.164 formatting for API integration
   - Dominican Republic special handling
   - Detailed error messages

2. **CountryData** (`webapps/tenant/src/utils/phone/Countries.ts`)
   - Country information with dial codes and formatting patterns
   - Browser locale detection
   - localStorage integration for preferences
   - 25+ supported countries with priority ordering

3. **Test Suite** (`webapps/tenant/src/utils/phone/__tests__/`)
   - Comprehensive unit tests for all validation scenarios
   - Browser environment mocking
   - Jest configuration with TypeScript support

## Features

### International Phone Validation

- **Supported Countries**: 25+ countries including US, Dominican Republic, Mexico, Spain, Germany, and Latin American countries
- **Format Validation**: Country-specific format validation and length checks
- **E.164 Conversion**: Automatic conversion to E.164 format for API calls
- **Display Formatting**: User-friendly formatting for display purposes

### Country Detection

- **Browser Locale**: Automatic detection from `navigator.language` and `navigator.languages`
- **localStorage Persistence**: Remembers user's preferred country selection
- **Fallback Logic**: Smart fallback to US if detection fails
- **Priority Countries**: US, Dominican Republic, Canada, Mexico, and Spain prioritized

### Dominican Republic Special Support

The system includes special handling for Dominican Republic phone numbers:

```typescript
// Handles DR area codes: 809, 829, 849
const result = PhoneValidator.validateDominicanRepublic('(809) 123-4567');
console.log(result.e164); // +18091234567
console.log(result.country); // 'DO'
```

### Error Handling

Comprehensive error messages for different validation scenarios:

- Empty phone number
- Too short/too long numbers
- Invalid format for country
- Unparseable numbers

## Implementation Details

### PhoneValidator Class

```typescript
import { PhoneValidator } from '@/utils/phone';

// Basic validation
const result = PhoneValidator.validate('(212) 555-1234', 'US');
// Returns: { isValid: true, e164: '+12125551234', formatted: '+1 212 555 1234', ... }

// E.164 formatting for API calls
const e164 = PhoneValidator.toE164('(212) 555-1234', 'US');
// Returns: '+12125551234'

// Display formatting
const display = PhoneValidator.formatForDisplay('2125551234', 'US');
// Returns: '+1 212 555 1234'

// Detailed validation with enhanced errors
const detailed = PhoneValidator.validateWithDetailedErrors('123', 'US');
// Returns: { isValid: false, error: 'Phone number is too short' }
```

### CountryData Class

```typescript
import { CountryData } from '@/utils/phone';

// Get all countries (sorted by priority then name)
const countries = CountryData.getAllCountries();

// Detect best country (localStorage > browser > US fallback)
const country = CountryData.detectBestCountry();

// Search countries
const results = CountryData.searchCountries('United');

// Browser detection
const browserCountry = CountryData.detectCountryFromBrowser();

// localStorage integration
CountryData.setPreferredCountry(country);
const preferred = CountryData.getPreferredCountry();
```

## Testing Framework

### Test Configuration

The system uses Jest with TypeScript support and comprehensive browser environment mocking:

```javascript
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  // ... additional configuration
};
```

### Browser Environment Mocking

```javascript
// jest.setup.js
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

global.window = {
  localStorage: localStorageMock,
  navigator: { language: 'en-US', languages: ['en-US', 'es-DO'] },
};
```

### Test Coverage

#### CountryData Tests
- Country retrieval and searching
- Browser locale detection
- localStorage integration
- NANP country identification
- Region grouping
- Error handling for server-side rendering

#### PhoneValidator Tests
- US phone number validation
- Dominican Republic special handling
- International number formatting
- E.164 conversion
- Length validation
- Detailed error messages
- NANP number detection
- Country detection from numbers

### Running Tests

```bash
# Run all phone validation tests
cd webapps/tenant
yarn test src/utils/phone/__tests__/

# Run specific test files
yarn test CountryData.test.ts
yarn test PhoneValidator.test.ts

# Run with coverage
yarn test --coverage src/utils/phone/

# Watch mode for development
yarn test --watch src/utils/phone/
```

## Integration with WhatsApp OTP

The phone validation system integrates seamlessly with the WhatsApp OTP authentication flow:

1. **User Input**: User selects country and enters phone number
2. **Validation**: Real-time validation with country-specific rules
3. **Formatting**: Convert to E.164 format for API calls
4. **API Integration**: Send formatted number to authenticator service
5. **WhatsApp Delivery**: WhatsApp Business API receives properly formatted number

### API Integration Example

```typescript
// Frontend validation and formatting
const result = PhoneValidator.validate(userInput, selectedCountry);

if (result.isValid) {
  // Send E.164 formatted number to API
  const response = await fetch('/api/v2/authenticator/tenant/whatsapp/signin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phoneNumber: result.e164 })
  });
}
```

## Supported Countries

| Country | Code | Dial Code | Format | Max Length | Priority |
|---------|------|-----------|--------|------------|----------|
| United States | US | +1 | (###) ###-#### | 10 | 1 |
| Dominican Republic | DO | +1 | (###) ###-#### | 10 | 2 |
| Canada | CA | +1 | (###) ###-#### | 10 | 3 |
| Mexico | MX | +52 | ## #### #### | 10 | 4 |
| Spain | ES | +34 | ### ### ### | 9 | 5 |
| Germany | DE | +49 | ### ######## | 12 | - |
| France | FR | +33 | ## ## ## ## ## | 10 | - |
| United Kingdom | GB | +44 | #### ### #### | 11 | - |
| ... | ... | ... | ... | ... | ... |

*Total: 25+ countries supported*

## Future Enhancements

### Planned Features

1. **React Components**
   - PhoneInputField component with country selector
   - CountrySelector dropdown with search
   - Integration with React Hook Form

2. **Enhanced Validation**
   - Real-time validation hooks
   - Debounced validation for better UX
   - Custom validation rules per country

3. **UI Components**
   - Flag icons for countries
   - Searchable country dropdown
   - Responsive design for mobile

4. **Additional Countries**
   - Expand to 50+ countries
   - Regional grouping improvements
   - Better locale detection

### Development Roadmap

- [x] Core validation utilities
- [x] Country data management
- [x] Comprehensive test suite
- [x] Jest configuration and mocking
- [ ] React components implementation
- [ ] Form integration
- [ ] UI/UX enhancements
- [ ] Additional country support

## Troubleshooting

### Common Issues

1. **Test Import Errors**
   - Ensure Jest configuration includes TypeScript support
   - Check that jest.setup.js is properly configured
   - Verify all imports use correct paths

2. **Browser Environment Issues**
   - Ensure proper mocking of window and navigator objects
   - Check localStorage mock implementation
   - Verify server-side rendering handling

3. **Validation Failures**
   - Check country code format (ISO 3166-1 alpha-2)
   - Verify phone number format matches country expectations
   - Ensure libphonenumber-js is properly installed

### Debug Tips

```typescript
// Enable detailed logging
const result = PhoneValidator.validateWithDetailedErrors(phoneNumber, country);
console.log('Validation result:', result);

// Check country detection
const detected = CountryData.detectBestCountry();
console.log('Detected country:', detected);

// Test specific scenarios
const drResult = PhoneValidator.validateDominicanRepublic('809-123-4567');
console.log('DR validation:', drResult);
```

## Security Considerations

- **Input Sanitization**: All phone numbers are cleaned before validation
- **Rate Limiting**: Validation is designed to work with API rate limiting
- **No Sensitive Data**: No sensitive information stored in localStorage
- **E.164 Standard**: Follows international standards for phone number formatting

---

**Version**: 1.0.0  
**Last Updated**: January 2025  
**Status**: Core utilities implemented, React components in development  
**Author**: Development Team