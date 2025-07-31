import React, { forwardRef, useCallback, useState } from 'react';
import { cn } from '@/utils';

// Simplified types for testing
export interface SimplePhoneInputProps {
  name?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  size?: 'sm' | 'default' | 'lg';
  onChange?: (value: string) => void;
  onBlur?: () => void;
  value?: string;
  error?: string;
  'aria-label'?: string;
  id?: string;
}

export interface SimplePhoneInputRef {
  focus: () => void;
  blur: () => void;
  clear: () => void;
}

/**
 * Simplified PhoneInputField component for testing purposes
 */
export const SimplePhoneInputField = forwardRef<SimplePhoneInputRef, SimplePhoneInputProps>(
  (
    {
      name,
      placeholder = 'Enter phone number',
      disabled = false,
      className,
      size = 'default',
      onChange,
      onBlur,
      value = '',
      error,
      'aria-label': ariaLabel,
      id,
      ...props
    },
    ref
  ) => {
    const [inputValue, setInputValue] = useState(value);
    const [inputRef, setInputRef] = useState<HTMLInputElement | null>(null);

    // Expose imperative methods via ref
    React.useImperativeHandle(ref, () => ({
      focus: () => inputRef?.focus(),
      blur: () => inputRef?.blur(),
      clear: () => {
        setInputValue('');
        onChange?.('');
      }
    }), [inputRef, onChange]);

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

    const sizeClasses = {
      sm: 'h-8 text-sm px-2',
      default: 'h-10 text-sm px-3',
      lg: 'h-12 text-base px-4'
    };

    return (
      <div className={cn('relative w-full', className)}>
        {/* Country Selector Mock */}
        <div className="flex w-full">
          <button
            data-testid="country-selector"
            disabled={disabled}
            className={cn(
              'border border-input bg-background hover:bg-accent',
              'focus:outline-none focus:ring-2 focus:ring-ring',
              'border-r-0 rounded-r-none w-[100px]',
              sizeClasses[size],
              disabled && 'cursor-not-allowed opacity-50'
            )}
          >
            🇺🇸 +1
          </button>
          
          {/* Phone Number Input */}
          <input
            ref={setInputRef}
            id={id}
            name={name}
            type="tel"
            value={inputValue}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            placeholder={placeholder}
            disabled={disabled}
            className={cn(
              'flex-1 border border-input bg-background',
              'focus:outline-none focus:ring-2 focus:ring-ring',
              'rounded-l-none border-l-0',
              sizeClasses[size],
              error && 'border-destructive focus:ring-destructive',
              disabled && 'cursor-not-allowed opacity-50'
            )}
            aria-label={ariaLabel}
            autoComplete="tel"
            data-testid="phone-input"
            {...props}
          />
        </div>

        {/* Error Message */}
        {error && (
          <div className="mt-2">
            <p 
              className="text-sm font-medium text-destructive"
              role="alert"
              aria-live="polite"
            >
              {error}
            </p>
          </div>
        )}
      </div>
    );
  }
);

SimplePhoneInputField.displayName = 'SimplePhoneInputField';

export default SimplePhoneInputField;
