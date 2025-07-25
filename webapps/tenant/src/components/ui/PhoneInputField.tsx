import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useState } from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '@/utils';
import { Input } from '@/components/ui/input';
import { OptimizedCompactCountrySelector } from '@/components/ui/CountrySelectorOptimized';
import { useCountryDetection } from '@/hooks/useCountryDetection';
import { usePhoneValidation } from '@/hooks/usePhoneValidation';
import { usePhoneFormatting } from '@/hooks/usePhoneFormatting';
import { Country } from '@/utils/phone/Countries';
import { PhoneInputFieldProps, PhoneInputRef, PhoneInputValidationState } from './types/PhoneInputTypes';
import useTranslation from '@/utils/i18n/client/useTranslation';

// Define variants for the phone input field
const phoneInputVariants = cva(
  'relative w-full',
  {
    variants: {
      size: {
        sm: 'text-sm',
        default: 'text-sm sm:text-base',
        lg: 'text-base'
      },
      variant: {
        default: '',
        outline: 'border-2',
        filled: 'bg-muted/50'
      }
    },
    defaultVariants: {
      size: 'default',
      variant: 'default'
    }
  }
);

// Define height variants for consistent sizing
const heightVariants = {
  sm: 'h-8',
  default: 'h-10',
  lg: 'h-12'
};

// Define country selector width variants
const countrySelectorWidths = {
  sm: 'w-[90px] sm:w-[95px]',
  default: 'w-[100px] sm:w-[110px] md:w-[120px]',
  lg: 'w-[110px] sm:w-[120px] md:w-[130px]'
};

/**
 * PhoneInputField component that combines country selection with phone number input
 * Provides real-time validation, formatting, and React Hook Form integration
 */
export const PhoneInputField = forwardRef<PhoneInputRef, PhoneInputFieldProps>(
  (
    {
      name,
      placeholder,
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
    // Translation hook
    const { t } = useTranslation();
    
    // Country detection and management
    const { selectedCountry, setSelectedCountry, isLoading } = useCountryDetection(defaultCountry);
    
    // Phone validation with debouncing
    const { validationState, validateNumber, validateSync } = usePhoneValidation(selectedCountry);
    
    // Phone formatting utilities
    const { formatAsYouType, getPlaceholder, formatForAPI, cleanInput } = usePhoneFormatting(selectedCountry);
    
    // Local state for input value
    const [inputValue, setInputValue] = useState(value);
    const [displayValue, setDisplayValue] = useState(value);
    const [inputRef, setInputRef] = useState<HTMLInputElement | null>(null);

    // Update input value when external value changes
    useEffect(() => {
      setInputValue(value);
      setDisplayValue(value);
    }, [value]);

    // Update placeholder when country changes
    const dynamicPlaceholder = placeholder || getPlaceholder();

    /**
     * Handles country selection from dropdown
     */
    const handleCountrySelect = useCallback(
      (country: Country) => {
        setSelectedCountry(country);
        onCountryChange?.(country);
        
        // Re-validate current input with new country
        if (inputValue.trim()) {
          validateNumber(inputValue);
        }
      },
      [setSelectedCountry, onCountryChange, inputValue, validateNumber]
    );

    // Expose imperative methods via ref
    useImperativeHandle(ref, () => ({
      focus: () => inputRef?.focus(),
      blur: () => inputRef?.blur(),
      clear: () => {
        setInputValue('');
        setDisplayValue('');
        onChange?.('');
      },
      validate: (): PhoneInputValidationState => {
        const result = validateSync(inputValue);
        return {
          isValid: result.isValid,
          isValidating: false,
          error: result.error || null,
          e164: result.e164,
          formatted: result.formatted,
          national: result.national
        };
      },
      getE164Value: () => formatForAPI(inputValue),
      getFormattedValue: () => displayValue,
      setCountry: (country: Country) => handleCountrySelect(country)
    }), [inputValue, displayValue, validateSync, formatForAPI, handleCountrySelect, inputRef]);

    /**
     * Handles input value changes with formatting
     */
    const handleInputChange = useCallback(
      (event: React.ChangeEvent<HTMLInputElement>) => {
        const rawValue = event.target.value;
        const cleanedValue = cleanInput(rawValue);
        
        // Apply progressive formatting for display
        const formattedValue = formatAsYouType(cleanedValue);
        
        setInputValue(cleanedValue);
        setDisplayValue(formattedValue);
        
        // Validate the input
        validateNumber(cleanedValue);
        
        // Call external onChange with E.164 format for form integration
        const e164Value = formatForAPI(cleanedValue);
        onChange?.(e164Value || cleanedValue);
      },
      [cleanInput, formatAsYouType, formatForAPI, validateNumber, onChange]
    );

    /**
     * Handles input blur event
     */
    const handleInputBlur = useCallback(() => {
      onBlur?.();
    }, [onBlur]);

    /**
     * Handles key down events for accessibility
     */
    const handleKeyDown = useCallback(
      (event: React.KeyboardEvent<HTMLInputElement>) => {
        // Allow navigation keys, backspace, delete, etc.
        const allowedKeys = [
          'Backspace',
          'Delete',
          'Tab',
          'Escape',
          'Enter',
          'Home',
          'End',
          'ArrowLeft',
          'ArrowRight',
          'ArrowUp',
          'ArrowDown'
        ];

        // Allow Ctrl/Cmd combinations (copy, paste, etc.)
        if (event.ctrlKey || event.metaKey) {
          return;
        }

        // Allow allowed keys
        if (allowedKeys.includes(event.key)) {
          return;
        }

        // Allow digits and common phone number characters
        if (/[\d\s\-\(\)\+\.]/.test(event.key)) {
          return;
        }

        // Block other keys
        event.preventDefault();
      },
      []
    );

    // Determine if there's an error (external or validation)
    const hasError = !!(error || (validationState.error && inputValue.trim()));
    const errorMessage = error || validationState.error;

    // Loading state with proper styling
    if (isLoading) {
      const height = heightVariants[size];
      const countryWidth = countrySelectorWidths[size];
      
      return (
        <div className={cn(phoneInputVariants({ size, variant }), className)}>
          <div className="flex w-full">
            <div className={cn('animate-pulse bg-muted rounded-l-md border border-input border-r-0', height, countryWidth)} />
            <div className={cn('animate-pulse bg-muted rounded-r-md flex-1 border border-input border-l-0', height)} />
          </div>
          <div className="mt-2">
            <div className="animate-pulse bg-muted h-4 w-32 rounded" />
          </div>
        </div>
      );
    }

    return (
      <div className={cn(phoneInputVariants({ size, variant }), className)}>
        {/* Main Input Container */}
        <div className="relative flex w-full">
          {/* Country Selector */}
          <OptimizedCompactCountrySelector
            selectedCountry={selectedCountry}
            onCountrySelect={handleCountrySelect}
            disabled={disabled}
            className={cn(
              // Base styles matching Input component with size variants
              heightVariants[size],
              'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
              'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
              'transition-colors duration-200',
              // Responsive width based on size
              countrySelectorWidths[size],
              // Border and radius adjustments for seamless connection
              'border-r-0 rounded-r-none',
              // Variant-specific styles
              variant === 'outline' && 'border-2',
              variant === 'filled' && 'bg-muted/50',
              // Error states
              hasError && 'border-destructive focus:ring-destructive',
              // Disabled states
              disabled && 'cursor-not-allowed opacity-50 hover:bg-background'
            )}
          />
          
          {/* Phone Number Input */}
          <div className="relative flex-1">
            <Input
              ref={setInputRef}
              id={id}
              name={name}
              type="tel"
              value={displayValue}
              onChange={handleInputChange}
              onBlur={handleInputBlur}
              onKeyDown={handleKeyDown}
              placeholder={dynamicPlaceholder}
              disabled={disabled}
              className={cn(
                // Size-specific height
                heightVariants[size],
                // Remove left border and radius for seamless connection
                'rounded-l-none border-l-0 focus-visible:ring-offset-0',
                // Ensure proper focus ring behavior
                'focus-visible:ring-2 focus-visible:ring-ring',
                // Add padding for validation indicator
                inputValue.trim() && 'pr-10',
                // Size-specific text sizing
                size === 'sm' && 'text-sm px-2',
                size === 'default' && 'text-sm sm:text-base px-3',
                size === 'lg' && 'text-base px-4',
                // Variant-specific styles
                variant === 'outline' && 'border-2',
                variant === 'filled' && 'bg-muted/50',
                // Error states
                hasError && 'border-destructive focus-visible:ring-destructive'
              )}
              aria-label={ariaLabel || t('Enter your phone number')}
              aria-describedby={ariaDescribedBy}
              aria-invalid={ariaInvalid || hasError}
              autoComplete="tel"
              {...props}
            />

            {/* Validation Status Indicator */}
            {inputValue.trim() && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
                {validationState.isValidating ? (
                  <div 
                    className="animate-spin h-4 w-4 border-2 border-muted-foreground border-t-transparent rounded-full"
                    aria-label={t('Validating phone number')}
                  />
                ) : validationState.isValid ? (
                  <div 
                    className="h-2 w-2 bg-green-500 rounded-full"
                    aria-label={t('Valid phone number')}
                    title={t('Valid phone number')}
                  />
                ) : inputValue.trim() && validationState.error ? (
                  <div 
                    className="h-2 w-2 bg-destructive rounded-full"
                    aria-label={t('Invalid phone number')}
                    title={t('Invalid phone number')}
                  />
                ) : null}
              </div>
            )}
          </div>
        </div>

        {/* Error Message */}
        {hasError && errorMessage && (
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
              <span>{errorMessage}</span>
            </p>
          </div>
        )}

        {/* Success Message for Valid Numbers */}
        {!hasError && inputValue.trim() && validationState.isValid && (
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