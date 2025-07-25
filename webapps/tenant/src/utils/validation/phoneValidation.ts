import * as z from 'zod';
import { PhoneValidator } from '@/utils/phone/PhoneValidator';
import { CountryCode } from 'libphonenumber-js';

/**
 * Enhanced Zod schema for phone number validation
 * Uses PhoneValidator for comprehensive validation
 */
export const createPhoneNumberSchema = (defaultCountry?: CountryCode) => {
    return z
        .string()
        .min(1, 'Phone number is required')
        .refine(
            (value) => {
                const result = PhoneValidator.validateWithDetailedErrors(value, defaultCountry);
                return result.isValid;
            },
            (value) => {
                const result = PhoneValidator.validateWithDetailedErrors(value, defaultCountry);
                return {
                    message: result.error || 'Please enter a valid phone number'
                };
            }
        )
        .transform((value) => {
            // Transform to E.164 format for API submission
            const result = PhoneValidator.validate(value, defaultCountry);
            return result.isValid ? result.e164 : value;
        });
};

/**
 * Default phone number schema (no specific country)
 */
export const phoneNumberSchema = createPhoneNumberSchema();

/**
 * Dominican Republic specific phone number schema
 */
export const dominicanPhoneNumberSchema = z
    .string()
    .min(1, 'Phone number is required')
    .refine(
        (value) => {
            const result = PhoneValidator.validateDominicanRepublic(value);
            return result.isValid;
        },
        (value) => {
            const result = PhoneValidator.validateDominicanRepublic(value);
            return {
                message: result.error || 'Please enter a valid Dominican Republic phone number'
            };
        }
    )
    .transform((value) => {
        const result = PhoneValidator.validateDominicanRepublic(value);
        return result.isValid ? result.e164 : value;
    });

/**
 * Creates a phone validation schema for a specific country
 */
export const createCountryPhoneSchema = (country: CountryCode) => {
    return z
        .string()
        .min(1, 'Phone number is required')
        .refine(
            (value) => {
                const result = PhoneValidator.validateForCountry(value, country);
                return result.isValid;
            },
            (value) => {
                const result = PhoneValidator.validateForCountry(value, country);
                return {
                    message: result.error || `Please enter a valid ${country} phone number`
                };
            }
        )
        .transform((value) => {
            const result = PhoneValidator.validateForCountry(value, country);
            return result.isValid ? result.e164 : value;
        });
};