import { CountryCode } from 'libphonenumber-js';
import { Country } from '@/utils/phone/Countries';

/**
 * Size variants for the phone input field
 */
export type PhoneInputSize = 'sm' | 'default' | 'lg';

/**
 * Visual variants for the phone input field
 */
export type PhoneInputVariant = 'default' | 'outline' | 'filled';

/**
 * Props for the main PhoneInputField component
 */
export interface PhoneInputFieldProps {
    name?: string;
    placeholder?: string;
    disabled?: boolean;
    className?: string;
    size?: PhoneInputSize;
    variant?: PhoneInputVariant;
    defaultCountry?: CountryCode;
    onCountryChange?: (country: Country) => void;
    onChange?: (value: string) => void;
    onBlur?: () => void;
    value?: string;
    error?: string;
    'aria-label'?: string;
    'aria-describedby'?: string;
    'aria-invalid'?: boolean;
    id?: string;
}

/**
 * Phone input validation state
 */
export interface PhoneInputValidationState {
    isValid: boolean;
    isValidating: boolean;
    error: string | null;
    e164: string;
    formatted: string;
    national: string;
}

/**
 * Phone input formatting options
 */
export interface PhoneInputFormattingOptions {
    formatAsYouType?: boolean;
    showCountryCode?: boolean;
    allowInternationalFormat?: boolean;
    restrictToCountry?: boolean;
}

/**
 * Phone input accessibility options
 */
export interface PhoneInputAccessibilityOptions {
    ariaLabel?: string;
    ariaDescribedBy?: string;
    announceValidation?: boolean;
    announceCountryChange?: boolean;
}

/**
 * Phone input configuration
 */
export interface PhoneInputConfig {
    debounceMs?: number;
    validateOnChange?: boolean;
    validateOnBlur?: boolean;
    formatOnBlur?: boolean;
    clearOnCountryChange?: boolean;
}

/**
 * Phone input ref methods for imperative control
 */
export interface PhoneInputRef {
    focus: () => void;
    blur: () => void;
    clear: () => void;
    validate: () => PhoneInputValidationState;
    getE164Value: () => string;
    getFormattedValue: () => string;
    setCountry: (country: Country) => void;
}

/**
 * Phone input event handlers
 */
export interface PhoneInputEventHandlers {
    onCountryChange?: (country: Country) => void;
    onChange?: (value: string, validation: PhoneInputValidationState) => void;
    onBlur?: (value: string, validation: PhoneInputValidationState) => void;
    onFocus?: (value: string) => void;
    onValidationChange?: (validation: PhoneInputValidationState) => void;
}

/**
 * Complete phone input component props
 */
export interface CompletePhoneInputProps
    extends Omit<PhoneInputFieldProps, 'onBlur' | 'onChange'>,
    PhoneInputFormattingOptions,
    PhoneInputAccessibilityOptions,
    PhoneInputConfig,
    PhoneInputEventHandlers { }