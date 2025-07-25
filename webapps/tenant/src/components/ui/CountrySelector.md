# CountrySelector Component

A comprehensive country selection dropdown component built with Radix UI Command component, designed for phone number input fields with full accessibility support and keyboard navigation.

## Features

- **Searchable dropdown** with real-time filtering
- **Flag icons** and country names with dial codes
- **Popular countries** section for quick access
- **Regional grouping** option for better organization
- **Keyboard navigation** and accessibility support
- **Compact variant** optimized for phone input fields
- **TypeScript support** with full type safety
- **Responsive design** with Tailwind CSS styling

## Components

### CountrySelector

The main country selector component with full customization options.

```tsx
import { CountrySelector } from '@/components/ui/CountrySelector';
import { CountryData } from '@/utils/phone/Countries';

function MyComponent() {
  const [selectedCountry, setSelectedCountry] = useState(
    CountryData.detectBestCountry()
  );

  return (
    <CountrySelector
      selectedCountry={selectedCountry}
      onCountrySelect={setSelectedCountry}
      searchable={true}
      showFlag={true}
      showDialCode={true}
    />
  );
}
```

### CompactCountrySelector

A compact variant designed specifically for phone input fields.

```tsx
import { CompactCountrySelector } from '@/components/ui/CountrySelector';

function PhoneInput() {
  const [selectedCountry, setSelectedCountry] = useState(
    CountryData.getCountryByCode('US')!
  );

  return (
    <div className="flex">
      <CompactCountrySelector
        selectedCountry={selectedCountry}
        onCountrySelect={setSelectedCountry}
      />
      <input
        type="tel"
        placeholder={CountryData.getPlaceholderForCountry(selectedCountry)}
        className="flex-1 rounded-l-none border-l-0"
      />
    </div>
  );
}
```

## Props

### CountrySelectorProps

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `selectedCountry` | `Country` | - | Currently selected country (required) |
| `onCountrySelect` | `(country: Country) => void` | - | Callback when country is selected (required) |
| `disabled` | `boolean` | `false` | Disable the selector |
| `searchable` | `boolean` | `true` | Enable search functionality |
| `placeholder` | `string` | `"Select country..."` | Placeholder text when no country selected |
| `className` | `string` | - | Additional CSS classes |
| `showDialCode` | `boolean` | `true` | Show dial code in display |
| `showFlag` | `boolean` | `true` | Show flag emoji |
| `groupByRegion` | `boolean` | `false` | Group countries by region |

### CompactCountrySelectorProps

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `selectedCountry` | `Country` | - | Currently selected country (required) |
| `onCountrySelect` | `(country: Country) => void` | - | Callback when country is selected (required) |
| `disabled` | `boolean` | `false` | Disable the selector |
| `className` | `string` | - | Additional CSS classes |

## Country Interface

```typescript
interface Country {
  code: CountryCode;        // ISO 3166-1 alpha-2 code (e.g., "US", "DE")
  name: string;             // Country name (e.g., "United States")
  dialCode: string;         // Phone code (e.g., "+1", "+49")
  flag: string;             // Unicode flag emoji (e.g., "🇺🇸")
  format: string;           // Display format pattern (e.g., "(###) ###-####")
  maxLength: number;        // Maximum digits for validation
  priority?: number;        // Priority for popular countries (1 = highest)
}
```

## Usage Examples

### Basic Usage

```tsx
import { CountrySelector } from '@/components/ui/CountrySelector';
import { CountryData, Country } from '@/utils/phone/Countries';

function BasicExample() {
  const [country, setCountry] = useState<Country>(
    CountryData.getCountryByCode('US')!
  );

  return (
    <CountrySelector
      selectedCountry={country}
      onCountrySelect={setCountry}
    />
  );
}
```

### With Search Disabled

```tsx
<CountrySelector
  selectedCountry={selectedCountry}
  onCountrySelect={setSelectedCountry}
  searchable={false}
/>
```

### Regional Grouping

```tsx
<CountrySelector
  selectedCountry={selectedCountry}
  onCountrySelect={setSelectedCountry}
  groupByRegion={true}
/>
```

### Minimal Display

```tsx
<CountrySelector
  selectedCountry={selectedCountry}
  onCountrySelect={setSelectedCountry}
  showFlag={false}
  showDialCode={false}
/>
```

### Phone Input Integration

```tsx
import { CompactCountrySelector } from '@/components/ui/CountrySelector';
import { usePhoneValidation } from '@/hooks/usePhoneValidation';

function PhoneInputField() {
  const [country, setCountry] = useState(CountryData.detectBestCountry());
  const [phoneNumber, setPhoneNumber] = useState('');
  const { isValid, error } = usePhoneValidation(phoneNumber, country);

  return (
    <div className="space-y-2">
      <div className="flex">
        <CompactCountrySelector
          selectedCountry={country}
          onCountrySelect={(newCountry) => {
            setCountry(newCountry);
            CountryData.setPreferredCountry(newCountry);
          }}
        />
        <input
          type="tel"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          placeholder={CountryData.getPlaceholderForCountry(country)}
          className={cn(
            'flex-1 rounded-l-none border-l-0',
            error && 'border-red-500'
          )}
        />
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
```

## Accessibility Features

### ARIA Support

- **Role**: `combobox` for the trigger button
- **ARIA Labels**: Descriptive labels for screen readers
- **ARIA Expanded**: Indicates dropdown state
- **ARIA Describedby**: Links to error messages when present

### Keyboard Navigation

- **Tab**: Navigate to/from the component
- **Enter/Space**: Open dropdown
- **Arrow Keys**: Navigate through options
- **Escape**: Close dropdown
- **Type to Search**: Filter countries by typing

### Screen Reader Support

- Flag emojis have proper `aria-label` attributes
- Country names are announced clearly
- Dial codes are included in announcements
- Selection changes are announced

## Styling

The component uses Tailwind CSS classes and follows the existing design system:

### Default Styling

```css
/* Trigger button */
.country-selector-trigger {
  @apply w-[200px] justify-between border border-input bg-background;
  @apply hover:bg-accent hover:text-accent-foreground;
  @apply focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring;
}

/* Compact variant */
.country-selector-compact {
  @apply h-10 px-3 border-r-0 rounded-r-none;
  @apply border-input bg-background hover:bg-accent;
}

/* Dropdown content */
.country-selector-content {
  @apply w-[300px] p-0 border bg-popover text-popover-foreground;
  @apply shadow-md rounded-md;
}
```

### Customization

```tsx
// Custom width
<CountrySelector
  className="w-[250px]"
  selectedCountry={country}
  onCountrySelect={setCountry}
/>

// Custom styling for compact variant
<CompactCountrySelector
  className="border-blue-500 bg-blue-50"
  selectedCountry={country}
  onCountrySelect={setCountry}
/>
```

## Integration with CountryData

The component integrates seamlessly with the `CountryData` utility class:

```tsx
import { CountryData } from '@/utils/phone/Countries';

// Get all countries
const countries = CountryData.getAllCountries();

// Search countries
const searchResults = CountryData.searchCountries('Germany');

// Get popular countries
const popular = CountryData.getPopularCountries();

// Detect best country
const detected = CountryData.detectBestCountry();

// Group by region
const regions = CountryData.getCountriesByRegion();

// Country preference persistence
CountryData.setPreferredCountry(selectedCountry);
const preferred = CountryData.getPreferredCountry();
```

## Performance Considerations

### Optimization Features

- **Memoized search results** to prevent unnecessary re-renders
- **Virtualized dropdown** for large country lists (handled by Radix UI)
- **Debounced search** to reduce filtering operations
- **Lazy loading** of country data when needed

### Best Practices

```tsx
// Memoize country selection handler
const handleCountrySelect = useCallback((country: Country) => {
  setSelectedCountry(country);
  CountryData.setPreferredCountry(country);
}, []);

// Memoize search results
const searchResults = useMemo(() => {
  return searchQuery 
    ? CountryData.searchCountries(searchQuery)
    : CountryData.getAllCountries();
}, [searchQuery]);
```

## Testing

The component includes comprehensive tests covering:

- **Unit tests** for component props and interfaces
- **Integration tests** with CountryData utility
- **Accessibility tests** for ARIA attributes and keyboard navigation
- **Functionality tests** for search, selection, and grouping

### Running Tests

```bash
# Run all CountrySelector tests
npm test -- --testPathPattern=CountrySelector

# Run specific test file
npm test -- --testPathPattern=CountrySelector.unit.test.ts
```

### Test Coverage

- ✅ Component rendering and props
- ✅ Country selection functionality
- ✅ Search and filtering
- ✅ Keyboard navigation
- ✅ Accessibility features
- ✅ Integration with CountryData
- ✅ TypeScript interface compliance
- ✅ Error handling and edge cases

## Browser Support

- **Modern browsers**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Mobile browsers**: iOS Safari 14+, Chrome Mobile 90+
- **Accessibility**: NVDA, JAWS, VoiceOver screen readers

## Dependencies

- `@radix-ui/react-popover` - Dropdown positioning
- `@radix-ui/react-command` - Search and keyboard navigation
- `lucide-react` - Icons (ChevronDown, Search, Check)
- `libphonenumber-js` - Country code validation (via CountryData)
- `class-variance-authority` - Styling utilities
- `tailwind-merge` - CSS class merging

## Migration Guide

### From Basic Select to CountrySelector

```tsx
// Before: Basic select
<select onChange={(e) => setCountry(e.target.value)}>
  <option value="US">United States</option>
  <option value="CA">Canada</option>
</select>

// After: CountrySelector
<CountrySelector
  selectedCountry={CountryData.getCountryByCode(country)!}
  onCountrySelect={(country) => setCountry(country.code)}
/>
```

### From Custom Dropdown to CountrySelector

```tsx
// Before: Custom implementation
const [isOpen, setIsOpen] = useState(false);
const [search, setSearch] = useState('');

// After: Built-in functionality
<CountrySelector
  selectedCountry={selectedCountry}
  onCountrySelect={setSelectedCountry}
  searchable={true}
/>
```

## Troubleshooting

### Common Issues

1. **Country not found**: Ensure country code exists in `COUNTRIES` array
2. **Search not working**: Check that `searchable={true}` is set
3. **Styling issues**: Verify Tailwind CSS classes are available
4. **TypeScript errors**: Import `Country` interface from correct path

### Debug Mode

```tsx
// Enable debug logging
<CountrySelector
  selectedCountry={selectedCountry}
  onCountrySelect={(country) => {
    console.log('Selected country:', country);
    setSelectedCountry(country);
  }}
/>
```

## Contributing

When contributing to the CountrySelector component:

1. **Add tests** for new functionality
2. **Update documentation** for API changes
3. **Follow accessibility guidelines** for new features
4. **Test with screen readers** for accessibility changes
5. **Maintain TypeScript compatibility** for all changes

## Related Components

- `PhoneInputField` - Main phone input component using CountrySelector
- `useCountryDetection` - Hook for country detection logic
- `usePhoneValidation` - Hook for phone number validation
- `CountryData` - Utility class for country data management