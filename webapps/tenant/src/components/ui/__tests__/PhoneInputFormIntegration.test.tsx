import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { PhoneInputFormField } from '../PhoneInputFormField';
import { phoneNumberSchema } from '../../../utils/validation/phoneValidation';

// Mock the dependencies
jest.mock('../../../utils/phone/Countries', () => ({
  CountryData: {
    detectBestCountry: jest.fn(() => ({
      code: 'US',
      name: 'United States',
      dialCode: '+1',
      flag: '🇺🇸',
      format: '(###) ###-####',
      maxLength: 10
    })),
    getCountryByCode: jest.fn((code) => ({
      code,
      name: 'United States',
      dialCode: '+1',
      flag: '🇺🇸',
      format: '(###) ###-####',
      maxLength: 10
    })),
    setPreferredCountry: jest.fn(),
    getPreferredCountry: jest.fn(() => null),
    clearPreferredCountry: jest.fn()
  }
}));

// Test form schema
const testFormSchema = z.object({
  phoneNumber: phoneNumberSchema
});

type TestFormValues = z.infer<typeof testFormSchema>;

// Test component that uses the PhoneInputFormField
const TestForm: React.FC<{
  onSubmit: (values: TestFormValues) => void;
  defaultValues?: Partial<TestFormValues>;
}> = ({ onSubmit, defaultValues = {} }) => {
  const form = useForm<TestFormValues>({
    resolver: zodResolver(testFormSchema),
    defaultValues: {
      phoneNumber: '',
      ...defaultValues
    }
  });

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} data-testid="test-form">
      <PhoneInputFormField
        name="phoneNumber"
        control={form.control}
        placeholder="Enter your phone number"
      />
      <button type="submit" data-testid="submit-button">
        Submit
      </button>
      <div data-testid="form-errors">
        {form.formState.errors.phoneNumber?.message}
      </div>
    </form>
  );
};

describe('PhoneInputFormField Integration', () => {
  const mockOnSubmit = jest.fn();

  beforeEach(() => {
    mockOnSubmit.mockClear();
  });

  it('should integrate with React Hook Form and validate phone numbers', async () => {
    const user = userEvent.setup();
    
    render(<TestForm onSubmit={mockOnSubmit} />);

    const phoneInput = screen.getByRole('textbox', { name: /phone number/i });
    const submitButton = screen.getByTestId('submit-button');

    // Test empty submission (should show validation error)
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByTestId('form-errors')).toHaveTextContent('Phone number is required');
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();

    // Test invalid phone number
    await user.type(phoneInput, '123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByTestId('form-errors')).toHaveTextContent('Please enter a valid phone number');
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();

    // Clear the input and test valid phone number
    await user.clear(phoneInput);
    await user.type(phoneInput, '5551234567');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        phoneNumber: '+15551234567' // Should be in E.164 format
      });
    });
  });

  it('should format phone number to E.164 for form submission', async () => {
    const user = userEvent.setup();
    
    render(<TestForm onSubmit={mockOnSubmit} />);

    const phoneInput = screen.getByRole('textbox', { name: /phone number/i });
    const submitButton = screen.getByTestId('submit-button');

    // Test various input formats that should all result in the same E.164 format
    const testCases = [
      { input: '5551234567', expected: '+15551234567' },
      { input: '(555) 123-4567', expected: '+15551234567' },
      { input: '555-123-4567', expected: '+15551234567' },
      { input: '+1 555 123 4567', expected: '+15551234567' }
    ];

    for (const { input, expected } of testCases) {
      mockOnSubmit.mockClear();
      
      await user.clear(phoneInput);
      await user.type(phoneInput, input);
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          phoneNumber: expected
        });
      });
    }
  });

  it('should handle controlled form values correctly', async () => {
    const { rerender } = render(
      <TestForm 
        onSubmit={mockOnSubmit} 
        defaultValues={{ phoneNumber: '+15551234567' }}
      />
    );

    const phoneInput = screen.getByRole('textbox', { name: /phone number/i });
    
    // Should display the formatted version of the E.164 number
    await waitFor(() => {
      expect(phoneInput).toHaveValue('+15551234567');
    });

    // Test form submission with pre-filled value
    const submitButton = screen.getByTestId('submit-button');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        phoneNumber: '+15551234567'
      });
    });
  });

  it('should validate Dominican Republic numbers correctly', async () => {
    const user = userEvent.setup();
    
    render(<TestForm onSubmit={mockOnSubmit} />);

    const phoneInput = screen.getByRole('textbox', { name: /phone number/i });
    const submitButton = screen.getByTestId('submit-button');

    // Test Dominican Republic number
    await user.type(phoneInput, '8091234567');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        phoneNumber: '+18091234567' // Should be in E.164 format with +1 prefix
      });
    });
  });

  it('should show real-time validation feedback', async () => {
    const user = userEvent.setup();
    
    render(<TestForm onSubmit={mockOnSubmit} />);

    const phoneInput = screen.getByRole('textbox', { name: /phone number/i });

    // Start typing an invalid number
    await user.type(phoneInput, '123');
    
    // Should show validation indicator (this would be tested in the PhoneInputField component)
    // Here we're testing that the form integration doesn't interfere with real-time validation
    expect(phoneInput).toHaveValue('123');

    // Complete a valid number
    await user.type(phoneInput, '4567890');
    
    // Should show valid indicator
    expect(phoneInput).toHaveValue('1234567890');
  });

  it('should handle form reset correctly', async () => {
    const user = userEvent.setup();
    
    const TestFormWithReset: React.FC = () => {
      const form = useForm<TestFormValues>({
        resolver: zodResolver(testFormSchema),
        defaultValues: { phoneNumber: '' }
      });

      return (
        <form onSubmit={form.handleSubmit(mockOnSubmit)}>
          <PhoneInputFormField
            name="phoneNumber"
            control={form.control}
            placeholder="Enter your phone number"
          />
          <button 
            type="button" 
            onClick={() => form.reset()}
            data-testid="reset-button"
          >
            Reset
          </button>
          <button type="submit" data-testid="submit-button">
            Submit
          </button>
        </form>
      );
    };

    render(<TestFormWithReset />);

    const phoneInput = screen.getByRole('textbox', { name: /phone number/i });
    const resetButton = screen.getByTestId('reset-button');

    // Type a phone number
    await user.type(phoneInput, '5551234567');
    expect(phoneInput).toHaveValue('(555) 123-4567'); // Should be formatted

    // Reset the form
    await user.click(resetButton);

    await waitFor(() => {
      expect(phoneInput).toHaveValue('');
    });
  });
});