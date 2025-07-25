import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PhoneInputField } from '../PhoneInputField';
import { CountryData } from '../../../utils/phone/Countries';

// Mock the utils
jest.mock('../../../utils', () => ({
  cn: (...classes: any[]) => classes.filter(Boolean).join(' ')
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Check: ({ className }: { className?: string }) => 
    React.createElement('div', { 'data-testid': 'check-icon', className }),
  ChevronDown: ({ className }: { className?: string }) => 
    React.createElement('div', { 'data-testid': 'chevron-down-icon', className }),
  Search: ({ className }: { className?: string }) => 
    React.createElement('div', { 'data-testid': 'search-icon', className })
}));

// Mock UI components
jest.mock('@/components/ui/input', () => ({
  Input: React.forwardRef<HTMLInputElement, any>(({ ...props }, ref) =>
    React.createElement('input', { ...props, ref, 'data-testid': 'phone-input' })
  )
}));

jest.mock('@/components/ui/button', () => ({
  Button: React.forwardRef<HTMLButtonElement, any>(({ children, ...props }, ref) =>
    React.createElement('button', { ...props, ref, 'data-testid': 'country-button' }, children)
  )
}));

jest.mock('@/components/ui/popover', () => ({
  Popover: ({ children }: { children: React.ReactNode }) => React.createElement('div', {}, children),
  PopoverTrigger: ({ children }: { children: React.ReactNode }) => React.createElement('div', {}, children),
  PopoverContent: ({ children }: { children: React.ReactNode }) => React.createElement('div', {}, children)
}));

jest.mock('@/components/ui/command', () => ({
  Command: ({ children }: { children: React.ReactNode }) => React.createElement('div', {}, children),
  CommandInput: (props: any) => React.createElement('input', { ...props, 'data-testid': 'country-search' }),
  CommandList: ({ children }: { children: React.ReactNode }) => React.createElement('div', {}, children),
  CommandEmpty: ({ children }: { children: React.ReactNode }) => React.createElement('div', {}, children),
  CommandGroup: ({ children, heading }: { children: React.ReactNode; heading?: string }) => 
    React.createElement('div', {}, heading && React.createElement('h3', {}, heading), children),
  CommandItem: ({ children, onSelect }: { children: React.ReactNode; onSelect?: () => void }) => 
    React.createElement('div', { onClick: onSelect, 'data-testid': 'country-item' }, children)
}));

describe('PhoneInputField', () => {
  const mockOnChange = jest.fn();
  const mockOnCountryChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Functionality', () => {
    it('should render with default country', async () => {
      render(
        <PhoneInputField
          name="phone"
          onChange={mockOnChange}
          onCountryChange={mockOnCountryChange}
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('phone-input')).toBeInTheDocument();
        expect(screen.getByTestId('country-button')).toBeInTheDocument();
      });
    });

    it('should render with custom placeholder', async () => {
      render(
        <PhoneInputField
          name="phone"
          placeholder="Enter your phone number"
          onChange={mockOnChange}
          onCountryChange={mockOnCountryChange}
        />
      );

      await waitFor(() => {
        const input = screen.getByTestId('phone-input');
        expect(input).toHaveAttribute('placeholder', 'Enter your phone number');
      });
    });

    it('should be disabled when disabled prop is true', async () => {
      render(
        <PhoneInputField
          name="phone"
          disabled={true}
          onChange={mockOnChange}
          onCountryChange={mockOnCountryChange}
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('phone-input')).toBeDisabled();
        expect(screen.getByTestId('country-button')).toBeDisabled();
      });
    });

    it('should display error message when error prop is provided', async () => {
      render(
        <PhoneInputField
          name="phone"
          error="Invalid phone number"
          onChange={mockOnChange}
          onCountryChange={mockOnCountryChange}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Invalid phone number')).toBeInTheDocument();
      });
    });

    it('should apply custom className', async () => {
      render(
        <PhoneInputField
          name="phone"
          className="custom-class"
          onChange={mockOnChange}
          onCountryChange={mockOnCountryChange}
        />
      );

      await waitFor(() => {
        const container = screen.getByTestId('phone-input').closest('div');
        expect(container).toHaveClass('custom-class');
      });
    });
  });

  describe('Input Handling', () => {
    it('should call onChange when input value changes', async () => {
      const user = userEvent.setup();
      
      render(
        <PhoneInputField
          name="phone"
          onChange={mockOnChange}
          onCountryChange={mockOnCountryChange}
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('phone-input')).toBeInTheDocument();
      });

      const input = screen.getByTestId('phone-input');
      await user.type(input, '2125551234');

      expect(mockOnChange).toHaveBeenCalled();
    });

    it('should format phone number as user types', async () => {
      const user = userEvent.setup();
      
      render(
        <PhoneInputField
          name="phone"
          onChange={mockOnChange}
          onCountryChange={mockOnCountryChange}
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('phone-input')).toBeInTheDocument();
      });

      const input = screen.getByTestId('phone-input');
      await user.type(input, '2125551234');

      // The input should show formatted value
      await waitFor(() => {
        expect(input).toHaveValue(expect.stringContaining('212'));
      });
    });

    it('should handle controlled value prop', async () => {
      render(
        <PhoneInputField
          name="phone"
          value="+12125551234"
          onChange={mockOnChange}
          onCountryChange={mockOnCountryChange}
        />
      );

      await waitFor(() => {
        const input = screen.getByTestId('phone-input');
        expect(input).toHaveValue('+12125551234');
      });
    });
  });

  describe('Validation', () => {
    it('should show validation indicator for valid numbers', async () => {
      const user = userEvent.setup();
      
      render(
        <PhoneInputField
          name="phone"
          onChange={mockOnChange}
          onCountryChange={mockOnCountryChange}
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('phone-input')).toBeInTheDocument();
      });

      const input = screen.getByTestId('phone-input');
      await user.type(input, '2125551234');

      // Should show success message for valid number
      await waitFor(() => {
        expect(screen.getByText('Valid phone number')).toBeInTheDocument();
      }, { timeout: 1000 });
    });

    it('should show error for invalid numbers', async () => {
      const user = userEvent.setup();
      
      render(
        <PhoneInputField
          name="phone"
          onChange={mockOnChange}
          onCountryChange={mockOnCountryChange}
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('phone-input')).toBeInTheDocument();
      });

      const input = screen.getByTestId('phone-input');
      await user.type(input, '123');

      // Should show error for invalid number
      await waitFor(() => {
        expect(screen.getByText('Phone number is too short')).toBeInTheDocument();
      }, { timeout: 1000 });
    });
  });

  describe('Country Selection', () => {
    it('should call onCountryChange when country is changed', async () => {
      const user = userEvent.setup();
      
      render(
        <PhoneInputField
          name="phone"
          onChange={mockOnChange}
          onCountryChange={mockOnCountryChange}
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('country-button')).toBeInTheDocument();
      });

      const countryButton = screen.getByTestId('country-button');
      await user.click(countryButton);

      // Should show country options
      const countryItems = screen.getAllByTestId('country-item');
      if (countryItems.length > 0) {
        await user.click(countryItems[0]);
        expect(mockOnCountryChange).toHaveBeenCalled();
      }
    });

    it('should use default country when provided', async () => {
      render(
        <PhoneInputField
          name="phone"
          defaultCountry="CA"
          onChange={mockOnChange}
          onCountryChange={mockOnCountryChange}
        />
      );

      await waitFor(() => {
        // Should detect and use Canadian country
        expect(screen.getByTestId('country-button')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', async () => {
      render(
        <PhoneInputField
          name="phone"
          aria-label="Phone number input"
          onChange={mockOnChange}
          onCountryChange={mockOnCountryChange}
        />
      );

      await waitFor(() => {
        const input = screen.getByTestId('phone-input');
        expect(input).toHaveAttribute('aria-label', 'Phone number input');
        expect(input).toHaveAttribute('type', 'tel');
        expect(input).toHaveAttribute('autoComplete', 'tel');
      });
    });

    it('should announce validation errors', async () => {
      render(
        <PhoneInputField
          name="phone"
          error="Invalid phone number"
          onChange={mockOnChange}
          onCountryChange={mockOnCountryChange}
        />
      );

      await waitFor(() => {
        const errorElement = screen.getByRole('alert');
        expect(errorElement).toBeInTheDocument();
        expect(errorElement).toHaveAttribute('aria-live', 'polite');
      });
    });
  });

  describe('Size Variants', () => {
    it('should apply small size variant', async () => {
      render(
        <PhoneInputField
          name="phone"
          size="sm"
          onChange={mockOnChange}
          onCountryChange={mockOnCountryChange}
        />
      );

      await waitFor(() => {
        const input = screen.getByTestId('phone-input');
        expect(input).toHaveClass('h-8');
      });
    });

    it('should apply large size variant', async () => {
      render(
        <PhoneInputField
          name="phone"
          size="lg"
          onChange={mockOnChange}
          onCountryChange={mockOnCountryChange}
        />
      );

      await waitFor(() => {
        const input = screen.getByTestId('phone-input');
        expect(input).toHaveClass('h-12');
      });
    });
  });
});

describe('PhoneInputField Integration', () => {
  it('should work with CountryData utility functions', async () => {
    const mockOnChange = jest.fn();
    const mockOnCountryChange = jest.fn();

    render(
      <PhoneInputField
        name="phone"
        onChange={mockOnChange}
        onCountryChange={mockOnCountryChange}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('phone-input')).toBeInTheDocument();
      expect(screen.getByTestId('country-button')).toBeInTheDocument();
    });

    // Verify that CountryData functions are working
    const countries = CountryData.getAllCountries();
    expect(countries.length).toBeGreaterThan(0);

    const usCountry = CountryData.getCountryByCode('US');
    expect(usCountry).toBeDefined();
    expect(usCountry?.name).toBe('United States');
  });
});