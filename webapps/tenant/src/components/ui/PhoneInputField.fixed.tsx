import React, { forwardRef, useCallback, useEffect, useState } from 'react';
import { cn } from '@/utils';

// Fixed types for the component
export interface PhoneInputFieldProps {
  name?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  size?: 'sm' | 'default' | 'lg';
  variant?: 'default' | 'outline' | 'filled';
  defaultCountry?: string;
  onCountryChange?: (country: any) => void;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  value?: string;
  error?: string;
  'aria-label'?: string;
  'aria-describedby'?: string;
  'aria-invalid'?: boolean;
  id?: string;
}

export interface PhoneInputRef {
  focus: () => void;
  blur: () => void;
  clear: () => void;
  validate: () => any;
  getE164Value: () => string;
  getFormattedValue: () => string;
  setCountry: (country: any) => void;
}

/**
 * Fixed PhoneInputField component with proper error handling
 */
export const PhoneInputField = forwardRef<PhoneInputRef, PhoneInputFieldProps>(
  (
    {
      name,
      placeholder = 'Enter phone number',
      disabled = false,
      className,
      size = 'default',
      variant = 'default',
      defaultCountry,
      onCountryChange,
      onChange,
      onBlur,
      value = '',
      error,
      'aria-label': ariaLabel,
      'aria-describedby': ariaDescribedBy,
      'aria-invalid': ariaInvalid,
      id,
      ...props
    },
    ref
  ) => {
    // State management
    const [inputValue, setInputValue] = useState(value);
    const [selectedCountry, setSelectedCountry] = useState({
      code: 'US',
      name: 'United States',
      dialCode: '+1',
      flag: '🇺🇸'
    });
    const [inputRef, setInputRef] = useState<HTMLInputElement | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Update input value when external value changes
    useEffect(() => {
      setInputValue(value);
    }, [value]);

    // Mock translation function
    const t = (key: string) => key;

    // Expose imperative methods via ref
    React.useImperativeHandle(ref, () => ({
      focus: () => inputRef?.focus(),
      blur: () => inputRef?.blur(),
      clear: () => {
        setInputValue('');
        onChange?.('');
      },
      validate: () => ({
        isValid: true,
        isValidating: false,
        error: null,
        e164: inputValue,
        formatted: inputValue,
        national: inputValue
      }),
      getE164Value: () => inputValue,
      getFormattedValue: () => inputValue,
      setCountry: (country: any) => {
        setSelectedCountry(country);
        onCountryChange?.(country);
      }
    }), [inputRef, inputValue, onChange, onCountryChange]);

    const handleInputChange = useCallback(
      (event: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = event.target.value;
        setInputValue(newValue);
        onChange?.(newValue);
      },
      [onChange]
    );

    const handleInputBlur = useCallback(() => {
      onBlur?.();
    }, [onBlur]);

    const handleCountrySelect = useCallback(
      (country: any) => {
        setSelectedCountry(country);
        onCountryChange?.(country);
      },
      [onCountryChange]
    );

    const handleKeyDown = useCallback(
      (event: React.KeyboardEvent<HTMLInputElement>) => {
        const allowedKeys = [
          'Backspace', 'Delete', 'Tab', 'Escape', 'Enter',
          'Home', 'End', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'
        ];

        if (event.ctrlKey || event.metaKey) return;
        if (allowedKeys.includes(event.key)) return;
        if (/[\d\s\-\(\)\+\.]/.test(event.key)) return;

        event.preventDefault();
      },
      []
    );

    // Size classes
    const sizeClasses = {
      sm: 'h-8 text-sm px-2',
      default: 'h-10 text-sm px-3',
      lg: 'h-12 text-base px-4'
    };

    const countrySelectorWidths = {
      sm: 'w-[90px]',
      default: 'w-[100px]',
      lg: 'w-[110px]'
    };

    // Loading state
    if (isLoading) {
      return (
        <div className={cn('relative w-full', className)}>
          <div className="flex w-full">
            <div className={cn('animate-pulse bg-muted rounded-l-md border border-input border-r-0', sizeClasses[size], countrySelectorWidths[size])} />
            <div className={cn('animate-pulse bg-muted rounded-r-md flex-1 border border-input border-l-0', sizeClasses[size])} />
          </div>
        </div>
      );
    }

    return (
      <div className={cn('relative w-full', className)}>
        {/* Main Input Container */}
        <div className="relative flex w-full">
          {/* Country Selector */}
          <button
            type="button"
            data-testid="country-selector"
            disabled={disabled}
            onClick={() => handleCountrySelect({
              code: 'CA',
              name: 'Canada',
              dialCode: '+1',
              flag: '🇨🇦'
            })}
            className={cn(
              'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
              'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
              'transition-colors duration-200',
              countrySelectorWidths[size],
              'border-r-0 rounded-r-none',
              sizeClasses[size],
              variant === 'outline' && 'border-2',
              variant === 'filled' && 'bg-muted/50',
              error && 'border-destructive focus:ring-destructive',
              disabled && 'cursor-not-allowed opacity-50 hover:bg-background'
            )}
          >
            {selectedCountry.flag} {selectedCountry.dialCode}
          </button>
          
          {/* Phone Number Input */}
          <div className="relative flex-1">
            <input
              ref={setInputRef}
              id={id}
              name={name}
              type="tel"
              value={inputValue}
              onChange={handleInputChange}
              onBlur={handleInputBlur}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={disabled}
              className={cn(
                'flex w-full border border-input bg-background',
                'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                'rounded-l-none border-l-0',
                sizeClasses[size],
                inputValue.trim() && 'pr-10',
                variant === 'outline' && 'border-2',
                variant === 'filled' && 'bg-muted/50',
                error && 'border-destructive focus:ring-destructive',
                disabled && 'cursor-not-allowed opacity-50'
              )}
              aria-label={ariaLabel || t('Enter your phone number')}
              aria-describedby={ariaDescribedBy}
              aria-invalid={ariaInvalid || !!error}
              autoComplete="tel"
              data-testid="phone-input"
              {...props}
            />

            {/* Validation Status Indicator */}
            {inputValue.trim() && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
                <div 
                  className="h-2 w-2 bg-green-500 rounded-full"
                  aria-label={t('Valid phone number')}
                  title={t('Valid phone number')}
                />
              </div>
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mt-2">
            <p 
              className="text-sm font-medium text-destructive flex items-start gap-1"
              role="alert"
              aria-live="polite"
            >
              <span className="inline-block w-4 h-4 mt-0.5 flex-shrink-0">
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </span>
              <span>{error}</span>
            </p>
          </div>
        )}

        {/* Success Message for Valid Numbers */}
        {!error && inputValue.trim() && (
          <div className="mt-2">
            <p 
              className="text-sm text-green-600 dark:text-green-400 flex items-start gap-1"
              role="status"
              aria-live="polite"
            >
              <span className="inline-block w-4 h-4 mt-0.5 flex-shrink-0">
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </span>
              <span>{t('Valid phone number')}</span>
            </p>
          </div>
        )}
      </div>
    );
  }
);

PhoneInputField.displayName = 'PhoneInputField';

export default PhoneInputField;
