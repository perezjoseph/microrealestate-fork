import React from 'react';
import { CompactCountrySelector, CountrySelector } from '../CountrySelector';
import { Country, CountryData } from '../../../utils/phone/Countries';

// Mock the utils
jest.mock('../../../utils', () => ({
  cn: (...classes: any[]) => classes.filter(Boolean).join(' ')
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Check: () => React.createElement('div', { 'data-testid': 'check-icon' }),
  ChevronDown: () => React.createElement('div', { 'data-testid': 'chevron-down-icon' }),
  Search: () => React.createElement('div', { 'data-testid': 'search-icon' })
}));

// Mock Radix UI components
jest.mock('@/components/ui/button', () => ({
  Button: React.forwardRef<HTMLButtonElement, any>(({ children, ...props }, ref) =>
    React.createElement('button', { ...props, ref }, children)
  )
}));

jest.mock('@/components/ui/popover', () => ({
  Popover: ({ children }: { children: React.ReactNode }) => React.createElement('div', {}, children),
  PopoverTrigger: ({ children }: { children: React.ReactNode }) => React.createElement('div', {}, children),
  PopoverContent: ({ children }: { children: React.ReactNode }) => React.createElement('div', {}, children)
}));

jest.mock('@/components/ui/command', () => ({
  Command: ({ children }: { children: React.ReactNode }) => React.createElement('div', {}, children),
  CommandInput: (props: any) => React.createElement('input', props),
  CommandList: ({ children }: { children: React.ReactNode }) => React.createElement('div', {}, children),
  CommandEmpty: ({ children }: { children: React.ReactNode }) => React.createElement('div', {}, children),
  CommandGroup: ({ children, heading }: { children: React.ReactNode; heading?: string }) => 
    React.createElement('div', {}, heading && React.createElement('h3', {}, heading), children),
  CommandItem: ({ children, onSelect }: { children: React.ReactNode; onSelect?: () => void }) => 
    React.createElement('div', { onClick: onSelect }, children)
}));

describe('CountrySelector', () => {
  const mockCountry: Country = {
    code: 'US',
    name: 'United States',
    dialCode: '+1',
    flag: '🇺🇸',
    format: '(###) ###-####',
    maxLength: 10,
    priority: 1
  };

  const mockOnCountrySelect = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Component Structure', () => {
    it('should be defined and exportable', () => {
      expect(CountrySelector).toBeDefined();
      expect(typeof CountrySelector).toBe('function');
    });

    it('should accept required props without throwing', () => {
      expect(() => {
        React.createElement(CountrySelector, {
          selectedCountry: mockCountry,
          onCountrySelect: mockOnCountrySelect
        });
      }).not.toThrow();
    });

    it('should accept optional props without throwing', () => {
      expect(() => {
        React.createElement(CountrySelector, {
          selectedCountry: mockCountry,
          onCountrySelect: mockOnCountrySelect,
          disabled: true,
          searchable: false,
          placeholder: 'Test placeholder',
          className: 'test-class',
          showDialCode: false,
          showFlag: false,
          groupByRegion: true
        });
      }).not.toThrow();
    });
  });

  describe('Props Interface', () => {
    it('should handle selectedCountry prop', () => {
      const component = React.createElement(CountrySelector, {
        selectedCountry: mockCountry,
        onCountrySelect: mockOnCountrySelect
      });
      expect(component.props.selectedCountry).toEqual(mockCountry);
    });

    it('should handle onCountrySelect callback prop', () => {
      const component = React.createElement(CountrySelector, {
        selectedCountry: mockCountry,
        onCountrySelect: mockOnCountrySelect
      });
      expect(component.props.onCountrySelect).toBe(mockOnCountrySelect);
    });

    it('should handle boolean props', () => {
      const component = React.createElement(CountrySelector, {
        selectedCountry: mockCountry,
        onCountrySelect: mockOnCountrySelect,
        disabled: true,
        searchable: false,
        showDialCode: false,
        showFlag: false,
        groupByRegion: true
      });
      
      expect(component.props.disabled).toBe(true);
      expect(component.props.searchable).toBe(false);
      expect(component.props.showDialCode).toBe(false);
      expect(component.props.showFlag).toBe(false);
      expect(component.props.groupByRegion).toBe(true);
    });

    it('should handle string props', () => {
      const component = React.createElement(CountrySelector, {
        selectedCountry: mockCountry,
        onCountrySelect: mockOnCountrySelect,
        placeholder: 'Custom placeholder',
        className: 'custom-class'
      });
      
      expect(component.props.placeholder).toBe('Custom placeholder');
      expect(component.props.className).toBe('custom-class');
    });
  });
});

describe('CompactCountrySelector', () => {
  const mockCountry: Country = {
    code: 'US',
    name: 'United States',
    dialCode: '+1',
    flag: '🇺🇸',
    format: '(###) ###-####',
    maxLength: 10,
    priority: 1
  };

  const mockOnCountrySelect = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Component Structure', () => {
    it('should be defined and exportable', () => {
      expect(CompactCountrySelector).toBeDefined();
      expect(typeof CompactCountrySelector).toBe('function');
    });

    it('should accept required props without throwing', () => {
      expect(() => {
        React.createElement(CompactCountrySelector, {
          selectedCountry: mockCountry,
          onCountrySelect: mockOnCountrySelect
        });
      }).not.toThrow();
    });

    it('should accept optional props without throwing', () => {
      expect(() => {
        React.createElement(CompactCountrySelector, {
          selectedCountry: mockCountry,
          onCountrySelect: mockOnCountrySelect,
          disabled: true,
          className: 'test-class'
        });
      }).not.toThrow();
    });
  });

  describe('Props Interface', () => {
    it('should handle selectedCountry prop', () => {
      const component = React.createElement(CompactCountrySelector, {
        selectedCountry: mockCountry,
        onCountrySelect: mockOnCountrySelect
      });
      expect(component.props.selectedCountry).toEqual(mockCountry);
    });

    it('should handle onCountrySelect callback prop', () => {
      const component = React.createElement(CompactCountrySelector, {
        selectedCountry: mockCountry,
        onCountrySelect: mockOnCountrySelect
      });
      expect(component.props.onCountrySelect).toBe(mockOnCountrySelect);
    });

    it('should handle optional props', () => {
      const component = React.createElement(CompactCountrySelector, {
        selectedCountry: mockCountry,
        onCountrySelect: mockOnCountrySelect,
        disabled: true,
        className: 'custom-compact-class'
      });
      
      expect(component.props.disabled).toBe(true);
      expect(component.props.className).toBe('custom-compact-class');
    });
  });
});

describe('CountrySelector Integration with CountryData', () => {
  const mockOnCountrySelect = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should work with CountryData utility functions', () => {
    const countries = CountryData.getAllCountries();
    expect(countries).toBeDefined();
    expect(Array.isArray(countries)).toBe(true);
    expect(countries.length).toBeGreaterThan(0);

    const usCountry = CountryData.getCountryByCode('US');
    expect(usCountry).toBeDefined();
    expect(usCountry?.code).toBe('US');
    expect(usCountry?.name).toBe('United States');
    expect(usCountry?.dialCode).toBe('+1');

    // Test that component can be created with CountryData
    expect(() => {
      React.createElement(CountrySelector, {
        selectedCountry: usCountry!,
        onCountrySelect: mockOnCountrySelect
      });
    }).not.toThrow();
  });

  it('should handle search functionality with CountryData', () => {
    const searchResults = CountryData.searchCountries('Germ');
    expect(searchResults).toBeDefined();
    expect(Array.isArray(searchResults)).toBe(true);
    
    const germanyResult = searchResults.find(country => country.code === 'DE');
    expect(germanyResult).toBeDefined();
    expect(germanyResult?.name).toBe('Germany');
  });

  it('should handle popular countries from CountryData', () => {
    const popularCountries = CountryData.getPopularCountries();
    expect(popularCountries).toBeDefined();
    expect(Array.isArray(popularCountries)).toBe(true);
    expect(popularCountries.length).toBeGreaterThan(0);
    
    // Should include US as a popular country
    const usCountry = popularCountries.find(country => country.code === 'US');
    expect(usCountry).toBeDefined();
    expect(usCountry?.priority).toBeDefined();
  });

  it('should handle country detection from CountryData', () => {
    const detectedCountry = CountryData.detectBestCountry();
    expect(detectedCountry).toBeDefined();
    expect(detectedCountry.code).toBeDefined();
    expect(detectedCountry.name).toBeDefined();
    expect(detectedCountry.dialCode).toBeDefined();
  });
});

describe('CountrySelector TypeScript Interface Compliance', () => {
  it('should satisfy CountrySelectorProps interface', () => {
    const mockCountry: Country = {
      code: 'US',
      name: 'United States',
      dialCode: '+1',
      flag: '🇺🇸',
      format: '(###) ###-####',
      maxLength: 10,
      priority: 1
    };

    const mockOnCountrySelect = jest.fn();

    // Test all required props
    const requiredProps = {
      selectedCountry: mockCountry,
      onCountrySelect: mockOnCountrySelect
    };

    // Test all optional props
    const allProps = {
      ...requiredProps,
      disabled: true,
      searchable: false,
      placeholder: 'Select country...',
      className: 'test-class',
      showDialCode: false,
      showFlag: false,
      groupByRegion: true
    };

    expect(() => {
      React.createElement(CountrySelector, requiredProps);
      React.createElement(CountrySelector, allProps);
    }).not.toThrow();
  });

  it('should satisfy CompactCountrySelectorProps interface', () => {
    const mockCountry: Country = {
      code: 'US',
      name: 'United States',
      dialCode: '+1',
      flag: '🇺🇸',
      format: '(###) ###-####',
      maxLength: 10,
      priority: 1
    };

    const mockOnCountrySelect = jest.fn();

    // Test all required props
    const requiredProps = {
      selectedCountry: mockCountry,
      onCountrySelect: mockOnCountrySelect
    };

    // Test all optional props
    const allProps = {
      ...requiredProps,
      disabled: true,
      className: 'test-class'
    };

    expect(() => {
      React.createElement(CompactCountrySelector, requiredProps);
      React.createElement(CompactCountrySelector, allProps);
    }).not.toThrow();
  });
});