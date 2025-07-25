# Design Document

## Overview

This design enhances the existing WhatsApp phone number input field in the tenant sign-in page with proper validation, country code selection, and consistent styling. The solution will create a new `PhoneInputField` component that integrates seamlessly with the existing React Hook Form and Zod validation patterns while maintaining visual consistency with the email input field.

## Architecture

### Component Structure

```
PhoneInputField/
├── PhoneInputField.tsx          # Main component
├── CountrySelector.tsx          # Country dropdown component  
├── PhoneValidator.ts            # Validation utilities
├── CountryData.ts               # Country codes and formatting data
├── hooks/
│   ├── useCountryDetection.ts   # Browser locale detection
│   ├── usePhoneValidation.ts    # Real-time validation
│   └── usePhoneFormatting.ts    # Number formatting
└── types.ts                     # TypeScript definitions
```

### Integration Points

- **Form Integration**: React Hook Form with Zod validation
- **Styling**: Tailwind CSS classes matching existing Input component
- **Internationalization**: next-translate for multi-language support
- **State Management**: Local component state with localStorage persistence
- **API Integration**: E.164 formatted numbers to authenticator service

## Components and Interfaces

### PhoneInputField Component

```typescript
interface PhoneInputFieldProps {
  name: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  onCountryChange?: (country: Country) => void;
  defaultCountry?: string;
}

interface Country {
  code: string;           // ISO 3166-1 alpha-2 (e.g., "US", "DE")
  name: string;           // Country name
  dialCode: string;       // Phone code (e.g., "+1", "+49")
  flag: string;           // Unicode flag emoji
  format: string;         // Display format pattern
  maxLength: number;      // Maximum digits for validation
}
```

### CountrySelector Component

```typescript
interface CountrySelectorProps {
  selectedCountry: Country;
  onCountrySelect: (country: Country) => void;
  disabled?: boolean;
  searchable?: boolean;
}
```

### Validation Schema Enhancement

```typescript
// Enhanced Zod schema with country-specific validation
const phoneNumberSchema = z.object({
  phoneNumber: z.string()
    .min(1, 'Phone number is required')
    .refine((value) => {
      const { isValid } = validatePhoneNumber(value);
      return isValid;
    }, {
      message: 'Please enter a valid phone number'
    })
});
```

## Data Models

### Country Data Structure

```typescript
interface CountryData {
  countries: Country[];
  getCountryByCode: (code: string) => Country | undefined;
  getCountryByDialCode: (dialCode: string) => Country | undefined;
  searchCountries: (query: string) => Country[];
  detectCountryFromLocale: (locale: string) => Country | undefined;
}
```

### Phone Number Formatting

```typescript
interface PhoneNumberFormat {
  raw: string;           // User input
  formatted: string;     // Display format (e.g., "+1 (555) 123-4567")
  e164: string;          // International format (e.g., "+15551234567")
  national: string;      // National format (e.g., "(555) 123-4567")
  isValid: boolean;      // Validation status
  country: Country;      // Detected/selected country
}
```

## Error Handling

### Validation Error Types

```typescript
enum PhoneValidationError {
  REQUIRED = 'Phone number is required',
  INVALID_FORMAT = 'Please enter a valid phone number',
  TOO_SHORT = 'Phone number is too short',
  TOO_LONG = 'Phone number is too long',
  INVALID_COUNTRY = 'Invalid country code',
  UNSUPPORTED_COUNTRY = 'Country not supported'
}
```

### Error Display Strategy

- **Real-time validation**: Show errors as user types (debounced)
- **Form submission**: Prevent submission with invalid numbers
- **Visual indicators**: Red border, error message below input
- **Accessibility**: ARIA labels and error announcements

## Testing Strategy

### Unit Tests

```typescript
// PhoneInputField.test.tsx
describe('PhoneInputField', () => {
  test('should detect country from browser locale');
  test('should validate phone numbers correctly');
  test('should format numbers according to country');
  test('should handle country selection');
  test('should persist country preference');
});

// PhoneValidator.test.ts
describe('PhoneValidator', () => {
  test('should validate US phone numbers');
  test('should validate Dominican Republic numbers');
  test('should validate international numbers');
  test('should reject invalid formats');
});
```

### Integration Tests

```typescript
// SignIn.integration.test.tsx
describe('Sign In with Phone', () => {
  test('should submit valid phone number');
  test('should prevent submission with invalid number');
  test('should switch between email and phone methods');
  test('should maintain form state during method switch');
});
```

### E2E Tests

```typescript
// signin.e2e.ts
describe('Phone Number Sign In', () => {
  test('should complete WhatsApp OTP flow');
  test('should handle country selection');
  test('should validate phone number format');
  test('should show appropriate error messages');
});
```

## Implementation Details

### Country Detection Logic

```typescript
const useCountryDetection = () => {
  const detectCountry = useCallback(() => {
    // 1. Check localStorage for previous selection
    const saved = localStorage.getItem('preferred-country');
    if (saved) return JSON.parse(saved);
    
    // 2. Detect from browser locale
    const locale = navigator.language || navigator.languages[0];
    const country = detectCountryFromLocale(locale);
    if (country) return country;
    
    // 3. Default fallback
    return getCountryByCode('US');
  }, []);
  
  return { detectCountry };
};
```

### Phone Number Formatting

```typescript
const usePhoneFormatting = (country: Country) => {
  const formatNumber = useCallback((input: string) => {
    // Remove all non-digit characters except +
    const cleaned = input.replace(/[^\d+]/g, '');
    
    // Apply country-specific formatting
    return applyCountryFormat(cleaned, country);
  }, [country]);
  
  return { formatNumber };
};
```

### Real-time Validation

```typescript
const usePhoneValidation = (country: Country) => {
  const [validationState, setValidationState] = useState({
    isValid: false,
    error: null,
    isValidating: false
  });
  
  const validateNumber = useMemo(
    () => debounce((number: string) => {
      setValidationState({ isValidating: true });
      
      const result = validatePhoneNumber(number, country);
      
      setValidationState({
        isValid: result.isValid,
        error: result.error,
        isValidating: false
      });
    }, 300),
    [country]
  );
  
  return { validationState, validateNumber };
};
```

### Styling Implementation

The component will use the same Tailwind classes as the existing Input component:

```typescript
const inputClasses = cn(
  'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background',
  'placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2',
  'focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
  hasError && 'border-destructive focus-visible:ring-destructive',
  className
);
```

### Country Selector Styling

```typescript
const CountrySelector = ({ selectedCountry, onCountrySelect, disabled }) => (
  <Popover>
    <PopoverTrigger asChild>
      <Button
        variant="outline"
        role="combobox"
        className="w-[120px] justify-between border-r-0 rounded-r-none"
        disabled={disabled}
      >
        <span className="flex items-center gap-2">
          <span>{selectedCountry.flag}</span>
          <span className="text-sm">{selectedCountry.dialCode}</span>
        </span>
        <ChevronDown className="h-4 w-4 opacity-50" />
      </Button>
    </PopoverTrigger>
    <PopoverContent className="w-[300px] p-0">
      <Command>
        <CommandInput placeholder="Search countries..." />
        <CommandEmpty>No country found.</CommandEmpty>
        <CommandGroup className="max-h-[200px] overflow-auto">
          {countries.map((country) => (
            <CommandItem
              key={country.code}
              onSelect={() => onCountrySelect(country)}
            >
              <span className="flex items-center gap-2">
                <span>{country.flag}</span>
                <span>{country.name}</span>
                <span className="text-muted-foreground">({country.dialCode})</span>
              </span>
            </CommandItem>
          ))}
        </CommandGroup>
      </Command>
    </PopoverContent>
  </Popover>
);
```

### Form Integration

The enhanced sign-in page will integrate the new component:

```typescript
// Updated signin page with PhoneInputField
{loginMethod === 'whatsapp' && (
  <Form {...whatsappForm}>
    <form onSubmit={whatsappForm.handleSubmit(onWhatsAppSubmit)} className="space-y-6">
      <FormField
        control={whatsappForm.control}
        name="phoneNumber"
        render={({ field }) => (
          <FormItem>
            <FormControl>
              <PhoneInputField
                {...field}
                placeholder={t('Enter your phone number')}
                disabled={loading}
                onCountryChange={(country) => {
                  // Update placeholder based on country
                  setPlaceholder(getCountryPlaceholder(country));
                }}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? t('Sending...') : t('Send WhatsApp OTP')}
      </Button>
    </form>
  </Form>
)}
```

## Security Considerations

### Input Sanitization

- Sanitize all user input before validation
- Prevent XSS through proper escaping
- Validate country codes against whitelist

### Rate Limiting Integration

- Ensure formatted E.164 numbers work with existing rate limiting
- Maintain compatibility with WhatsApp OTP service limits

### Data Privacy

- Store minimal country preference data in localStorage
- Clear sensitive data on component unmount
- Comply with GDPR requirements for data processing

## Performance Optimizations

### Lazy Loading

- Load country data asynchronously
- Implement virtual scrolling for country list
- Debounce validation and formatting operations

### Memoization

- Memoize country search results
- Cache validation results for repeated inputs
- Optimize re-renders with React.memo

### Bundle Size

- Tree-shake unused country data
- Lazy load validation libraries
- Minimize component bundle impact

## Accessibility

### ARIA Support

```typescript
<input
  aria-label="Phone number"
  aria-describedby={hasError ? `${name}-error` : undefined}
  aria-invalid={hasError}
  role="textbox"
/>

{hasError && (
  <div id={`${name}-error`} role="alert" aria-live="polite">
    {error}
  </div>
)}
```

### Keyboard Navigation

- Full keyboard support for country selector
- Tab navigation between input and dropdown
- Escape key to close dropdown
- Arrow keys for country selection

### Screen Reader Support

- Announce country changes
- Provide clear error messages
- Label all interactive elements

## Migration Strategy

### Phase 1: Component Development
- Create PhoneInputField component
- Implement validation utilities
- Add comprehensive tests

### Phase 2: Integration
- Replace existing phone input in signin page
- Update form validation schema
- Test with existing WhatsApp OTP flow

### Phase 3: Enhancement
- Add country detection
- Implement formatting
- Add accessibility features

### Phase 4: Optimization
- Performance improvements
- Bundle size optimization
- Advanced validation features

## Dependencies

### New Dependencies Required

```json
{
  "@radix-ui/react-command": "^1.0.0",
  "@radix-ui/react-popover": "^1.0.0", // Already exists
  "libphonenumber-js": "^1.10.0"
}
```

### Rationale for libphonenumber-js

- Industry standard for phone number validation
- Supports all international formats
- Regular updates for country code changes
- Lightweight compared to full Google libphonenumber
- TypeScript support included