import React, { useCallback } from 'react';
import { useController, FieldPath, FieldValues, Control } from 'react-hook-form';
import { PhoneInputField } from './PhoneInputField';
import { Country } from '@/utils/phone/Countries';
import { CountryCode } from 'libphonenumber-js';
import { PhoneInputFieldProps } from './types/PhoneInputTypes';

export interface PhoneInputFormFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> extends Omit<PhoneInputFieldProps, 'name' | 'value' | 'onChange' | 'onBlur' | 'error'> {
  name: TName;
  control?: Control<TFieldValues>;
  defaultCountry?: CountryCode;
  onCountryChange?: (country: Country) => void;
}

/**
 * React Hook Form compatible PhoneInputField wrapper
 * Automatically handles form state, validation, and error display
 */
export function PhoneInputFormField<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({
  name,
  control,
  defaultCountry,
  onCountryChange,
  disabled,
  placeholder,
  className,
  ...props
}: PhoneInputFormFieldProps<TFieldValues, TName>) {
  const {
    field: { onChange, onBlur, value, ref },
    fieldState: { error, invalid }
  } = useController({
    name,
    control,
    defaultValue: '' as any
  });

  /**
   * Handles phone number changes and formats for form submission
   */
  const handleChange = useCallback(
    (phoneValue: string) => {
      // The PhoneInputField already provides E.164 formatted value
      onChange(phoneValue);
    },
    [onChange]
  );

  /**
   * Handles country changes and notifies parent
   */
  const handleCountryChange = useCallback(
    (country: Country) => {
      onCountryChange?.(country);
    },
    [onCountryChange]
  );

  return (
    <PhoneInputField
      ref={ref}
      name={name}
      value={value || ''}
      onChange={handleChange}
      onBlur={onBlur}
      onCountryChange={handleCountryChange}
      error={error?.message}
      disabled={disabled}
      placeholder={placeholder}
      className={className}
      defaultCountry={defaultCountry}
      aria-invalid={invalid}
      {...props}
    />
  );
}

export default PhoneInputFormField;