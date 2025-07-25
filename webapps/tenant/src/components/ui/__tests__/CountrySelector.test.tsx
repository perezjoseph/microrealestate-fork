import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CompactCountrySelector, CountrySelector } from '../CountrySelector';
import { Country, CountryData } from '../../../utils/phone/Countries';

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

  describe('Basic Functionality', () => {
    it('should render with selected country', () => {
      render(
        <CountrySelector
          selectedCountry={mockCountry}
          onCountrySelect={mockOnCountrySelect}
        />
      );

      expect(screen.getByText('United States')).toBeInTheDocument();
      expect(screen.getByText('+1')).toBeInTheDocument();
      expect(screen.getByLabelText('United States flag')).toBeInTheDocument();
    });

    it('should render placeholder when no country selected', () => {
      render(
        <CountrySelector
          selectedCountry={null as any}
          onCountrySelect={mockOnCountrySelect}
          placeholder="Select country..."
        />
      );

      expect(screen.getByText('Select country...')).toBeInTheDocument();
    });

    it('should be disabled when disabled prop is true', () => {
      render(
        <CountrySelector
          selectedCountry={mockCountry}
          onCountrySelect={mockOnCountrySelect}
          disabled={true}
        />
      );

      const button = screen.getByRole('combobox');
      expect(button).toBeDisabled();
    });

    it('should apply custom className', () => {
      render(
        <CountrySelector
          selectedCountry={mockCountry}
          onCountrySelect={mockOnCountrySelect}
          className="custom-class"
        />
      );

      const button = screen.getByRole('combobox');
      expect(button).toHaveClass('custom-class');
    });
  });

  describe('Dropdown Functionality', () => {
    it('should open dropdown when clicked', async () => {
      const user = userEvent.setup();
      render(
        <CountrySelector
          selectedCountry={mockCountry}
          onCountrySelect={mockOnCountrySelect}
        />
      );

      const button = screen.getByRole('combobox');
      await user.click(button);

      expect(button).toHaveAttribute('aria-expanded', 'true');
    });

    it('should display countries in dropdown', async () => {
      const user = userEvent.setup();
      render(
        <CountrySelector
          selectedCountry={mockCountry}
          onCountrySelect={mockOnCountrySelect}
        />
      );

      const button = screen.getByRole('combobox');
      await user.click(button);

      // Should show popular countries section
      expect(screen.getByText('Popular')).toBeInTheDocument();
      expect(screen.getByText('All Countries')).toBeInTheDocument();
    });

    it('should call onCountrySelect when country is selected', async () => {
      const user = userEvent.setup();
      render(
        <CountrySelector
          selectedCountry={mockCountry}
          onCountrySelect={mockOnCountrySelect}
        />
      );

      const button = screen.getByRole('combobox');
      await user.click(button);

      // Find and click on Canada
      const canadaOption = screen.getByText('Canada');
      await user.click(canadaOption);

      expect(mockOnCountrySelect).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'CA',
          name: 'Canada',
          dialCode: '+1'
        })
      );
    });

    it('should close dropdown after country selection', async () => {
      const user = userEvent.setup();
      render(
        <CountrySelector
          selectedCountry={mockCountry}
          onCountrySelect={mockOnCountrySelect}
        />
      );

      const button = screen.getByRole('combobox');
      await user.click(button);

      const canadaOption = screen.getByText('Canada');
      await user.click(canadaOption);

      await waitFor(() => {
        expect(button).toHaveAttribute('aria-expanded', 'false');
      });
    });
  });

  describe('Search Functionality', () => {
    it('should filter countries when searching', async () => {
      const user = userEvent.setup();
      render(
        <CountrySelector
          selectedCountry={mockCountry}
          onCountrySelect={mockOnCountrySelect}
          searchable={true}
        />
      );

      const button = screen.getByRole('combobox');
      await user.click(button);

      const searchInput = screen.getByPlaceholderText('Search countries...');
      await user.type(searchInput, 'Germany');

      expect(screen.getByText('Germany')).toBeInTheDocument();
      expect(screen.queryByText('Canada')).not.toBeInTheDocument();
    });

    it('should show "No country found" when search has no results', async () => {
      const user = userEvent.setup();
      render(
        <CountrySelector
          selectedCountry={mockCountry}
          onCountrySelect={mockOnCountrySelect}
          searchable={true}
        />
      );

      const button = screen.getByRole('combobox');
      await user.click(button);

      const searchInput = screen.getByPlaceholderText('Search countries...');
      await user.type(searchInput, 'NonexistentCountry');

      expect(screen.getByText('No country found.')).toBeInTheDocument();
    });

    it('should clear search when country is selected', async () => {
      const user = userEvent.setup();
      render(
        <CountrySelector
          selectedCountry={mockCountry}
          onCountrySelect={mockOnCountrySelect}
          searchable={true}
        />
      );

      const button = screen.getByRole('combobox');
      await user.click(button);

      const searchInput = screen.getByPlaceholderText('Search countries...');
      await user.type(searchInput, 'Germany');

      const germanyOption = screen.getByText('Germany');
      await user.click(germanyOption);

      // Reopen dropdown to check search is cleared
      await user.click(button);
      const newSearchInput = screen.getByPlaceholderText('Search countries...');
      expect(newSearchInput).toHaveValue('');
    });

    it('should hide search input when searchable is false', async () => {
      const user = userEvent.setup();
      render(
        <CountrySelector
          selectedCountry={mockCountry}
          onCountrySelect={mockOnCountrySelect}
          searchable={false}
        />
      );

      const button = screen.getByRole('combobox');
      await user.click(button);

      expect(
        screen.queryByPlaceholderText('Search countries...')
      ).not.toBeInTheDocument();
    });
  });

  describe('Display Options', () => {
    it('should hide flag when showFlag is false', () => {
      render(
        <CountrySelector
          selectedCountry={mockCountry}
          onCountrySelect={mockOnCountrySelect}
          showFlag={false}
        />
      );

      expect(
        screen.queryByLabelText('United States flag')
      ).not.toBeInTheDocument();
    });

    it('should hide dial code when showDialCode is false', () => {
      render(
        <CountrySelector
          selectedCountry={mockCountry}
          onCountrySelect={mockOnCountrySelect}
          showDialCode={false}
        />
      );

      expect(screen.queryByText('+1')).not.toBeInTheDocument();
    });

    it('should group countries by region when groupByRegion is true', async () => {
      const user = userEvent.setup();
      render(
        <CountrySelector
          selectedCountry={mockCountry}
          onCountrySelect={mockOnCountrySelect}
          groupByRegion={true}
        />
      );

      const button = screen.getByRole('combobox');
      await user.click(button);

      expect(screen.getByText('North America (+1)')).toBeInTheDocument();
      expect(screen.getByText('Europe')).toBeInTheDocument();
      expect(screen.getByText('Latin America')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(
        <CountrySelector
          selectedCountry={mockCountry}
          onCountrySelect={mockOnCountrySelect}
        />
      );

      const button = screen.getByRole('combobox');
      expect(button).toHaveAttribute('aria-label', 'Select country');
      expect(button).toHaveAttribute('aria-expanded', 'false');
    });

    it('should have proper flag alt text', () => {
      render(
        <CountrySelector
          selectedCountry={mockCountry}
          onCountrySelect={mockOnCountrySelect}
        />
      );

      expect(screen.getByLabelText('United States flag')).toBeInTheDocument();
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      render(
        <CountrySelector
          selectedCountry={mockCountry}
          onCountrySelect={mockOnCountrySelect}
        />
      );

      const button = screen.getByRole('combobox');
      
      // Focus and open with Enter
      button.focus();
      await user.keyboard('{Enter}');
      
      expect(button).toHaveAttribute('aria-expanded', 'true');
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

  describe('Basic Functionality', () => {
    it('should render with selected country in compact format', () => {
      render(
        <CompactCountrySelector
          selectedCountry={mockCountry}
          onCountrySelect={mockOnCountrySelect}
        />
      );

      expect(screen.getByText('+1')).toBeInTheDocument();
      expect(screen.getByLabelText('United States flag')).toBeInTheDocument();
    });

    it('should be disabled when disabled prop is true', () => {
      render(
        <CompactCountrySelector
          selectedCountry={mockCountry}
          onCountrySelect={mockOnCountrySelect}
          disabled={true}
        />
      );

      const button = screen.getByRole('combobox');
      expect(button).toBeDisabled();
    });

    it('should apply custom className', () => {
      render(
        <CompactCountrySelector
          selectedCountry={mockCountry}
          onCountrySelect={mockOnCountrySelect}
          className="custom-compact-class"
        />
      );

      const button = screen.getByRole('combobox');
      expect(button).toHaveClass('custom-compact-class');
    });
  });

  describe('Dropdown Functionality', () => {
    it('should open dropdown when clicked', async () => {
      const user = userEvent.setup();
      render(
        <CompactCountrySelector
          selectedCountry={mockCountry}
          onCountrySelect={mockOnCountrySelect}
        />
      );

      const button = screen.getByRole('combobox');
      await user.click(button);

      expect(button).toHaveAttribute('aria-expanded', 'true');
    });

    it('should display popular and all countries sections', async () => {
      const user = userEvent.setup();
      render(
        <CompactCountrySelector
          selectedCountry={mockCountry}
          onCountrySelect={mockOnCountrySelect}
        />
      );

      const button = screen.getByRole('combobox');
      await user.click(button);

      expect(screen.getByText('Popular')).toBeInTheDocument();
      expect(screen.getByText('All Countries')).toBeInTheDocument();
    });

    it('should call onCountrySelect when country is selected', async () => {
      const user = userEvent.setup();
      render(
        <CompactCountrySelector
          selectedCountry={mockCountry}
          onCountrySelect={mockOnCountrySelect}
        />
      );

      const button = screen.getByRole('combobox');
      await user.click(button);

      const canadaOption = screen.getByText('Canada');
      await user.click(canadaOption);

      expect(mockOnCountrySelect).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'CA',
          name: 'Canada',
          dialCode: '+1'
        })
      );
    });

    it('should close dropdown after country selection', async () => {
      const user = userEvent.setup();
      render(
        <CompactCountrySelector
          selectedCountry={mockCountry}
          onCountrySelect={mockOnCountrySelect}
        />
      );

      const button = screen.getByRole('combobox');
      await user.click(button);

      const canadaOption = screen.getByText('Canada');
      await user.click(canadaOption);

      await waitFor(() => {
        expect(button).toHaveAttribute('aria-expanded', 'false');
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(
        <CompactCountrySelector
          selectedCountry={mockCountry}
          onCountrySelect={mockOnCountrySelect}
        />
      );

      const button = screen.getByRole('combobox');
      expect(button).toHaveAttribute('aria-label', 'Selected country: United States');
      expect(button).toHaveAttribute('aria-expanded', 'false');
    });

    it('should have proper flag alt text', () => {
      render(
        <CompactCountrySelector
          selectedCountry={mockCountry}
          onCountrySelect={mockOnCountrySelect}
        />
      );

      expect(screen.getByLabelText('United States flag')).toBeInTheDocument();
    });
  });

  describe('Visual Design', () => {
    it('should have compact styling classes', () => {
      render(
        <CompactCountrySelector
          selectedCountry={mockCountry}
          onCountrySelect={mockOnCountrySelect}
        />
      );

      const button = screen.getByRole('combobox');
      expect(button).toHaveClass('h-10', 'px-3', 'border-r-0', 'rounded-r-none');
    });

    it('should show check icon for selected country', async () => {
      const user = userEvent.setup();
      render(
        <CompactCountrySelector
          selectedCountry={mockCountry}
          onCountrySelect={mockOnCountrySelect}
        />
      );

      const button = screen.getByRole('combobox');
      await user.click(button);

      // The selected country (US) should have a visible check icon
      const checkIcons = screen.getAllByTestId('check-icon');
      const visibleCheckIcon = checkIcons.find(icon => 
        icon.className.includes('opacity-100')
      );
      expect(visibleCheckIcon).toBeInTheDocument();
    });
  });
});

describe('CountrySelector Integration', () => {
  it('should work with CountryData utility functions', async () => {
    const user = userEvent.setup();
    const mockOnCountrySelect = jest.fn();
    const initialCountry = CountryData.getCountryByCode('US')!;

    render(
      <CountrySelector
        selectedCountry={initialCountry}
        onCountrySelect={mockOnCountrySelect}
      />
    );

    const button = screen.getByRole('combobox');
    await user.click(button);

    // Test that popular countries are displayed
    const popularCountries = CountryData.getPopularCountries();
    popularCountries.forEach(country => {
      expect(screen.getByText(country.name)).toBeInTheDocument();
    });
  });

  it('should handle search with CountryData.searchCountries', async () => {
    const user = userEvent.setup();
    const mockOnCountrySelect = jest.fn();
    const initialCountry = CountryData.getCountryByCode('US')!;

    render(
      <CountrySelector
        selectedCountry={initialCountry}
        onCountrySelect={mockOnCountrySelect}
        searchable={true}
      />
    );

    const button = screen.getByRole('combobox');
    await user.click(button);

    const searchInput = screen.getByPlaceholderText('Search countries...');
    await user.type(searchInput, 'Germ');

    // Should find Germany
    expect(screen.getByText('Germany')).toBeInTheDocument();
    
    // Should not show unrelated countries
    expect(screen.queryByText('Canada')).not.toBeInTheDocument();
  });
});