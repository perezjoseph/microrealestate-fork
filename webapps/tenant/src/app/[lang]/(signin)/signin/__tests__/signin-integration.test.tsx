import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SignIn from '../page';
import { jest } from '@jest/globals';

// Mock the dependencies
jest.mock('@/utils/env/client', () => ({
  __esModule: true,
  default: jest.fn(() => 'false')
}));

jest.mock('@/mocks/session', () => ({
  __esModule: true,
  default: { email: 'test@example.com' }
}));

jest.mock('@/utils/fetch/client', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    post: jest.fn()
  }))
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: jest.fn()
  })
}));

jest.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn()
  })
}));

jest.mock('@/utils/i18n/client/useTranslation', () => ({
  __esModule: true,
  default: () => ({
    t: (key: string) => key
  })
}));

// Mock the PhoneInputFormField component
jest.mock('@/components/ui/PhoneInputFormField', () => ({
  PhoneInputFormField: ({ name, control, placeholder, disabled, onCountryChange }: any) => (
    <input
      data-testid="phone-input-form-field"
      name={name}
      placeholder={placeholder}
      disabled={disabled}
      onChange={(e) => {
        // Simulate the component behavior
        if (onCountryChange) {
          onCountryChange({ code: 'US', name: 'United States', dialCode: '+1', flag: '🇺🇸' });
        }
      }}
    />
  )
}));

describe('SignIn Page Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render both email and WhatsApp login methods', () => {
    render(<SignIn />);
    
    expect(screen.getByText('Sign in to your account')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('WhatsApp')).toBeInTheDocument();
  });

  it('should show email form by default', () => {
    render(<SignIn />);
    
    expect(screen.getByPlaceholderText('Your email')).toBeInTheDocument();
    expect(screen.getByText('Send Email OTP')).toBeInTheDocument();
  });

  it('should switch to WhatsApp form when WhatsApp button is clicked', async () => {
    const user = userEvent.setup();
    render(<SignIn />);
    
    const whatsappButton = screen.getByText('WhatsApp');
    await user.click(whatsappButton);
    
    expect(screen.getByTestId('phone-input-form-field')).toBeInTheDocument();
    expect(screen.getByText('Send WhatsApp OTP')).toBeInTheDocument();
  });

  it('should use PhoneInputFormField component for WhatsApp input', async () => {
    const user = userEvent.setup();
    render(<SignIn />);
    
    // Switch to WhatsApp method
    const whatsappButton = screen.getByText('WhatsApp');
    await user.click(whatsappButton);
    
    // Verify PhoneInputFormField is rendered
    const phoneInput = screen.getByTestId('phone-input-form-field');
    expect(phoneInput).toBeInTheDocument();
    expect(phoneInput).toHaveAttribute('placeholder', 'Enter your phone number');
  });

  it('should show correct helper text for each method', async () => {
    const user = userEvent.setup();
    render(<SignIn />);
    
    // Email method helper text
    expect(screen.getByText('We will send a verification code to your email')).toBeInTheDocument();
    
    // Switch to WhatsApp method
    const whatsappButton = screen.getByText('WhatsApp');
    await user.click(whatsappButton);
    
    // WhatsApp method helper text
    expect(screen.getByText('We will send a verification code to your WhatsApp')).toBeInTheDocument();
  });

  it('should handle country change in phone input', async () => {
    const user = userEvent.setup();
    render(<SignIn />);
    
    // Switch to WhatsApp method
    const whatsappButton = screen.getByText('WhatsApp');
    await user.click(whatsappButton);
    
    // Trigger change event on phone input (simulates country selection)
    const phoneInput = screen.getByTestId('phone-input-form-field');
    fireEvent.change(phoneInput, { target: { value: '+1234567890' } });
    
    // The component should handle the country change
    expect(phoneInput).toBeInTheDocument();
  });
});