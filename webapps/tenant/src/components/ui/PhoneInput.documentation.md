# PhoneInput Component Documentation

## Overview

The PhoneInput component system provides a comprehensive solution for international phone number input with validation, country selection, and formatting. It consists of several components and utilities designed to work together seamlessly.

## Components

### PhoneInputField

The core phone input component with country selector and real-time validation.

#### Props

```typescript
interface PhoneInputFieldProps {
  name: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  onCountryChange?: (country: Country) => void;
  defaultCountry?: string;
  value?: string;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  error?: string;
}
```

#### Basic Usage

```tsx
import { PhoneInputField } from '@/components/ui/PhoneInputField';

function BasicExample() {
  const [phoneNumber, setPhoneNumber] = useState('');
  
  return (
    <PhoneInputField
      name="phone"
      placeholder="Enter your phone number"
      value={phoneNumber}
      onChange={setPhoneNumber}
    />
  );
}
```

#### With Country Change Handler

```tsx
function CountryChangeExample() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  
  return (
    <PhoneInputField
      name="phone"
      placeholder="Enter your phone number"
      value={phoneNumber}
      onChange={setPhoneNumber}
      onCountryChange={setSelectedCountry}
      defaultCountry="US"
    />
  );
}
```

### PhoneInputFormField

React Hook Form wrapper for PhoneInputField with built-in validation.

#### Props

```typescript
interface PhoneInputFormFieldProps {
  name: string;
  control: Control<any>;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  defaultCountry?: string;
}
```

#### Usage with React Hook Form

```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PhoneInputFormField } from '@/components/ui/PhoneInputFormField';
import { phoneNumberSchema } from '@/utils/phone/validation';

const formSchema = z.object({
  phoneNumber: phoneNumberSchema,
});

function FormExample() {
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      phoneNumber: '',
    },
  });

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    console.log('Phone number:', data.phoneNumber);
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <PhoneInputFormField
        name="phoneNumber"
        control={form.control}
        placeholder="Enter your phone number"
        defaultCountry="US"
      />
      <button type="submit">Submit</button>
    </form>
  );
}
```

### CountrySelector

Dropdown component for selecting countries with search functionality.

#### Props

```typescript
interface CountrySelectorProps {
  selectedCountry: Country;
  onCountrySelect: (country: Country) => void;
  disabled?: boolean;
  searchable?: boolean;
  className?: string;
}
```

#### Standalone Usage

```tsx
import { CountrySelector } from '@/components/ui/CountrySelector';
import { getCountryByCode } from '@/utils/phone/CountryData';

function CountrySelectorExample() {
  const [country, setCountry] = useState(getCountryByCode('US'));
  
  return (
    <CountrySelector
      selectedCountry={country}
      onCountrySelect={setCountry}
      searchable={true}
    />
  );
}
```

## Utilities

### PhoneValidator

Core validation utility for phone numbers.

```typescript
import { PhoneValidator } from '@/utils/phone/PhoneValidator';

// Validate a phone number
const result = PhoneValidator.validatePhoneNumber('+1234567890', 'US');
console.log(result.isValid); // boolean
console.log(result.formattedNumber); // formatted display
console.log(result.e164Number); // E.164 format

// Format for display
const formatted = PhoneValidator.formatForDisplay('+1234567890', 'US');
console.log(formatted); // "+1 (234) 567-890"

// Get E.164 format
const e164 = PhoneValidator.toE164('+1234567890', 'US');
console.log(e164); // "+1234567890"
```

### CountryData

Country information and utilities.

```typescript
import { 
  getCountryByCode, 
  getCountryByDialCode, 
  searchCountries,
  detectCountryFromLocale 
} from '@/utils/phone/CountryData';

// Get country by ISO code
const us = getCountryByCode('US');

// Get country by dial code
const country = getCountryByDialCode('+1');

// Search countries
const results = searchCountries('united');

// Detect from browser locale
const detected = detectCountryFromLocale('en-US');
```

## Custom Hooks

### useCountryDetection

Detects user's country from browser locale with localStorage persistence.

```typescript
import { useCountryDetection } from '@/hooks/useCountryDetection';

function CountryDetectionExample() {
  const { 
    detectedCountry, 
    setPreferredCountry, 
    clearPreference 
  } = useCountryDetection();
  
  return (
    <div>
      <p>Detected country: {detectedCountry.name}</p>
      <button onClick={() => setPreferredCountry('DE')}>
        Set Germany as preferred
      </button>
      <button onClick={clearPreference}>
        Clear preference
      </button>
    </div>
  );
}
```

### usePhoneValidation

Real-time phone number validation with debouncing.

```typescript
import { usePhoneValidation } from '@/hooks/usePhoneValidation';

function ValidationExample() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const { validationResult, isValidating } = usePhoneValidation(
    phoneNumber, 
    'US'
  );
  
  return (
    <div>
      <input 
        value={phoneNumber}
        onChange={(e) => setPhoneNumber(e.target.value)}
      />
      {isValidating && <span>Validating...</span>}
      {validationResult.error && (
        <span className="error">{validationResult.error}</span>
      )}
      {validationResult.isValid && (
        <span className="success">Valid phone number!</span>
      )}
    </div>
  );
}
```

### usePhoneFormatting

Real-time phone number formatting.

```typescript
import { usePhoneFormatting } from '@/hooks/usePhoneFormatting';

function FormattingExample() {
  const [rawInput, setRawInput] = useState('');
  const { formattedNumber, e164Number } = usePhoneFormatting(
    rawInput, 
    'US'
  );
  
  return (
    <div>
      <input 
        value={rawInput}
        onChange={(e) => setRawInput(e.target.value)}
        placeholder="Enter phone number"
      />
      <p>Formatted: {formattedNumber}</p>
      <p>E.164: {e164Number}</p>
    </div>
  );
}
```

## Advanced Usage

### Custom Validation Schema

```typescript
import { z } from 'zod';
import { PhoneValidator } from '@/utils/phone/PhoneValidator';

const customPhoneSchema = z.string()
  .min(1, 'Phone number is required')
  .refine((value) => {
    const result = PhoneValidator.validatePhoneNumber(value);
    return result.isValid;
  }, {
    message: 'Please enter a valid phone number'
  })
  .refine((value) => {
    // Custom business rule: no premium numbers
    return !value.startsWith('+1900');
  }, {
    message: 'Premium numbers are not allowed'
  });
```

### Internationalization

```typescript
import { useTranslation } from 'react-i18next';

function InternationalizedPhoneInput() {
  const { t } = useTranslation();
  
  return (
    <PhoneInputField
      name="phone"
      placeholder={t('Enter your phone number')}
      // Component automatically uses translated error messages
    />
  );
}
```

### Performance Optimization

```typescript
import { memo } from 'react';
import { PhoneInputField } from '@/components/ui/PhoneInputField';

// Memoize for performance in large forms
const OptimizedPhoneInput = memo(PhoneInputField);

// Use with virtualized lists
import { VirtualizedCountryList } from '@/components/ui/VirtualizedCountryList';

function LargeFormExample() {
  return (
    <div>
      {/* Use optimized version for better performance */}
      <OptimizedPhoneInput
        name="phone"
        placeholder="Enter phone number"
      />
    </div>
  );
}
```

## Styling and Theming

### Custom Styling

```tsx
function StyledPhoneInput() {
  return (
    <PhoneInputField
      name="phone"
      className="custom-phone-input"
      placeholder="Enter phone number"
    />
  );
}

// CSS
.custom-phone-input {
  @apply border-2 border-blue-500 rounded-lg;
}

.custom-phone-input:focus-within {
  @apply ring-2 ring-blue-200;
}
```

### Dark Mode Support

The components automatically support dark mode through Tailwind CSS classes:

```tsx
function DarkModeExample() {
  return (
    <div className="dark:bg-gray-900">
      <PhoneInputField
        name="phone"
        placeholder="Enter phone number"
        // Automatically adapts to dark mode
      />
    </div>
  );
}
```

## Error Handling

### Custom Error Messages

```typescript
const customErrorMessages = {
  REQUIRED: 'Phone number is required',
  INVALID_FORMAT: 'Please enter a valid phone number',
  TOO_SHORT: 'Phone number is too short',
  TOO_LONG: 'Phone number is too long',
  INVALID_COUNTRY: 'Invalid country code',
};

function CustomErrorExample() {
  const [error, setError] = useState('');
  
  const handleValidation = (phoneNumber: string) => {
    const result = PhoneValidator.validatePhoneNumber(phoneNumber);
    if (!result.isValid) {
      setError(customErrorMessages[result.errorCode] || 'Invalid phone number');
    } else {
      setError('');
    }
  };
  
  return (
    <div>
      <PhoneInputField
        name="phone"
        error={error}
        onChange={handleValidation}
      />
    </div>
  );
}
```

## Testing

### Unit Testing

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { PhoneInputField } from '@/components/ui/PhoneInputField';

describe('PhoneInputField', () => {
  test('validates phone number correctly', async () => {
    render(<PhoneInputField name="phone" />);
    
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: '+1234567890' } });
    
    // Wait for validation
    await waitFor(() => {
      expect(screen.queryByText(/invalid/i)).not.toBeInTheDocument();
    });
  });
});
```

### Integration Testing

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useForm } from 'react-hook-form';
import { PhoneInputFormField } from '@/components/ui/PhoneInputFormField';

function TestForm() {
  const form = useForm();
  return (
    <form onSubmit={form.handleSubmit(() => {})}>
      <PhoneInputFormField name="phone" control={form.control} />
      <button type="submit">Submit</button>
    </form>
  );
}

test('integrates with React Hook Form', async () => {
  render(<TestForm />);
  
  const input = screen.getByRole('textbox');
  fireEvent.change(input, { target: { value: '+1234567890' } });
  
  const submitButton = screen.getByRole('button');
  fireEvent.click(submitButton);
  
  // Form should submit successfully with valid phone number
  await waitFor(() => {
    expect(screen.queryByText(/error/i)).not.toBeInTheDocument();
  });
});
```

## Browser Compatibility

### Supported Browsers

- **Chrome**: 90+
- **Firefox**: 88+
- **Safari**: 14+
- **Edge**: 90+
- **Mobile Safari**: iOS 14+
- **Chrome Mobile**: Android 90+

### Polyfills Required

For older browsers, include these polyfills:

```html
<!-- For Internet Explorer 11 support -->
<script src="https://polyfill.io/v3/polyfill.min.js?features=es6,Array.prototype.includes,String.prototype.includes"></script>
```

### Feature Detection

```typescript
// Check for required features
const hasIntlSupport = typeof Intl !== 'undefined';
const hasLocalStorageSupport = typeof Storage !== 'undefined';

if (!hasIntlSupport) {
  console.warn('Intl API not supported, country detection may be limited');
}
```

## Performance Considerations

### Bundle Size Impact

- **PhoneInputField**: ~15KB gzipped
- **libphonenumber-js**: ~85KB gzipped (lazy loaded)
- **Country data**: ~8KB gzipped

### Optimization Strategies

1. **Lazy Loading**: Country data and validation library are loaded on demand
2. **Memoization**: Components use React.memo and useMemo for expensive operations
3. **Debouncing**: Validation is debounced to reduce API calls
4. **Virtual Scrolling**: Large country lists use virtualization

### Memory Usage

The component maintains minimal memory footprint:
- Country data: ~200KB in memory
- Validation cache: ~50KB for recent validations
- Component state: ~5KB per instance

## Troubleshooting

### Common Issues

1. **Country not detected**: Check browser locale settings
2. **Validation not working**: Ensure libphonenumber-js is loaded
3. **Styling issues**: Verify Tailwind CSS classes are available
4. **Performance issues**: Use memoized versions for large forms

### Debug Mode

Enable debug logging:

```typescript
// Set in development environment
window.PHONE_INPUT_DEBUG = true;

// Component will log validation steps and country detection
```

### Error Reporting

```typescript
// Custom error handler
const handlePhoneInputError = (error: Error, context: string) => {
  console.error(`PhoneInput Error [${context}]:`, error);
  // Send to error reporting service
  errorReporter.captureException(error, { context });
};
```

## Migration Guide

### From Basic Input

```typescript
// Before
<input 
  type="tel" 
  name="phone" 
  placeholder="Phone number"
/>

// After
<PhoneInputField
  name="phone"
  placeholder="Enter your phone number"
/>
```

### From Other Phone Libraries

```typescript
// From react-phone-number-input
// Before
<PhoneInput
  value={value}
  onChange={setValue}
  defaultCountry="US"
/>

// After
<PhoneInputField
  name="phone"
  value={value}
  onChange={setValue}
  defaultCountry="US"
/>
```

## API Reference

See the complete API reference in the TypeScript definitions:
- `PhoneInputTypes.ts` - Type definitions
- `PhoneValidator.ts` - Validation utilities
- `CountryData.ts` - Country information

## Contributing

When contributing to the PhoneInput components:

1. Add tests for new features
2. Update documentation
3. Follow existing code patterns
4. Ensure accessibility compliance
5. Test across supported browsers

## License

This component is part of the MicroRealEstate project and follows the same license terms.