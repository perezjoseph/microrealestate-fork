import { CountryCode } from 'libphonenumber-js';

/**
 * Phone validation error message keys for internationalization
 * These keys correspond to translations in locale files
 */
export const PHONE_VALIDATION_MESSAGES = {
    REQUIRED: 'Phone number is required',
    INVALID: 'Please enter a valid phone number',
    TOO_SHORT: 'Phone number is too short',
    TOO_LONG: 'Phone number is too long',
    UNABLE_TO_PARSE: 'Unable to parse phone number',
    INVALID_FORMAT: 'Invalid phone number format',
    VALID: 'Valid phone number'
} as const;

export type PhoneValidationMessageKey = typeof PHONE_VALIDATION_MESSAGES[keyof typeof PHONE_VALIDATION_MESSAGES];

/**
 * Gets the appropriate error message key for a phone validation error
 */
export const getPhoneValidationMessageKey = (error: string): PhoneValidationMessageKey => {
    // Map common error patterns to message keys
    if (error.includes('required')) return PHONE_VALIDATION_MESSAGES.REQUIRED;
    if (error.includes('too short')) return PHONE_VALIDATION_MESSAGES.TOO_SHORT;
    if (error.includes('too long')) return PHONE_VALIDATION_MESSAGES.TOO_LONG;
    if (error.includes('parse')) return PHONE_VALIDATION_MESSAGES.UNABLE_TO_PARSE;
    if (error.includes('format')) return PHONE_VALIDATION_MESSAGES.INVALID_FORMAT;

    // Default to invalid message
    return PHONE_VALIDATION_MESSAGES.INVALID;
};

/**
 * Creates a phone validation result with a translatable error message
 */
export const createPhoneValidationResult = (
    isValid: boolean,
    formatted: string,
    e164: string,
    national: string,
    country?: CountryCode,
    errorKey?: PhoneValidationMessageKey
) => ({
    isValid,
    formatted,
    e164,
    national,
    country,
    error: errorKey
});