import { CountryCode } from 'libphonenumber-js';

// Lazy import for libphonenumber-js to reduce initial bundle size
let libphonenumber: any = null;
let loadingPromise: Promise<any> | null = null;

const loadLibphonenumber = async () => {
    if (libphonenumber) return libphonenumber;

    if (loadingPromise) return loadingPromise;

    loadingPromise = import('libphonenumber-js').then((lib) => {
        libphonenumber = lib;
        return lib;
    });

    return loadingPromise;
};

export interface PhoneValidationResult {
    isValid: boolean;
    formatted: string;
    e164: string;
    national: string;
    country?: CountryCode;
    error?: string;
}

export class OptimizedPhoneValidator {
    /**
     * Validates and formats a phone number with lazy loading
     */
    static async validate(
        phoneNumber: string,
        defaultCountry?: CountryCode
    ): Promise<PhoneValidationResult> {
        try {
            const lib = await loadLibphonenumber();

            // Remove any non-digit characters except + for initial parsing
            const cleanNumber = phoneNumber.replace(/[^\d+]/g, '');

            if (!cleanNumber) {
                return {
                    isValid: false,
                    formatted: '',
                    e164: '',
                    national: '',
                    error: 'Phone number is required'
                };
            }

            // Check if the number is valid
            const isValid = lib.isValidPhoneNumber(cleanNumber, defaultCountry);

            if (!isValid) {
                return {
                    isValid: false,
                    formatted: phoneNumber,
                    e164: '',
                    national: '',
                    error: 'Please enter a valid phone number'
                };
            }

            // Parse the phone number
            let parsed: any;
            try {
                parsed = lib.parsePhoneNumber(cleanNumber, defaultCountry);
            } catch {
                return {
                    isValid: false,
                    formatted: phoneNumber,
                    e164: '',
                    national: '',
                    error: 'Unable to parse phone number'
                };
            }

            if (!parsed) {
                return {
                    isValid: false,
                    formatted: phoneNumber,
                    e164: '',
                    national: '',
                    error: 'Unable to parse phone number'
                };
            }

            return {
                isValid: true,
                formatted: parsed.formatInternational(),
                e164: parsed.format('E.164'),
                national: parsed.formatNational(),
                country: parsed.country
            };
        } catch {
            return {
                isValid: false,
                formatted: phoneNumber,
                e164: '',
                national: '',
                error: 'Invalid phone number format'
            };
        }
    }

    /**
     * Quick validation without full parsing (for real-time validation)
     */
    static async quickValidate(
        phoneNumber: string,
        defaultCountry?: CountryCode
    ): Promise<boolean> {
        try {
            const lib = await loadLibphonenumber();
            const cleanNumber = phoneNumber.replace(/[^\d+]/g, '');

            if (!cleanNumber || cleanNumber.length < 7) return false;

            return lib.isValidPhoneNumber(cleanNumber, defaultCountry);
        } catch {
            return false;
        }
    }

    /**
     * Formats phone number to E.164 format for API calls
     */
    static async toE164(phoneNumber: string, defaultCountry?: CountryCode): Promise<string> {
        const result = await this.validate(phoneNumber, defaultCountry);
        return result.isValid ? result.e164 : '';
    }

    /**
     * Formats phone number for display
     */
    static async formatForDisplay(
        phoneNumber: string,
        defaultCountry?: CountryCode
    ): Promise<string> {
        const result = await this.validate(phoneNumber, defaultCountry);
        return result.isValid ? result.formatted : phoneNumber;
    }

    /**
     * Validates Dominican Republic numbers with special handling
     */
    static async validateDominicanRepublic(phoneNumber: string): Promise<PhoneValidationResult> {
        const lib = await loadLibphonenumber();

        // First try direct validation as DO
        const result = await this.validate(phoneNumber, 'DO');

        if (result.isValid && result.country === 'DO') {
            return result;
        }

        // Try parsing as US number with DR area codes
        const usResult = await this.validate(phoneNumber, 'US');
        if (usResult.isValid && usResult.e164) {
            const e164 = usResult.e164;
            // Check for DR area codes: 809, 829, 849
            if (e164.match(/^\+1(809|829|849)/)) {
                return {
                    ...usResult,
                    country: 'DO' as CountryCode
                };
            }
        }

        // Try parsing without country code if it starts with DR area codes
        const cleanNumber = phoneNumber.replace(/[^\d]/g, '');
        if (cleanNumber.match(/^(809|829|849)/)) {
            const withCountryCode = '+1' + cleanNumber;
            const drResult = await this.validate(withCountryCode);
            if (drResult.isValid) {
                return {
                    ...drResult,
                    country: 'DO' as CountryCode
                };
            }
        }

        return result;
    }

    /**
     * Preloads the libphonenumber-js library
     */
    static preload(): void {
        loadLibphonenumber().catch(() => {
            // Ignore preload errors
        });
    }

    /**
     * Synchronous basic validation (without libphonenumber-js)
     * Used for immediate feedback before async validation
     */
    static basicValidate(phoneNumber: string, defaultCountry?: CountryCode): {
        isValid: boolean;
        error?: string;
    } {
        if (!phoneNumber || phoneNumber.trim() === '') {
            return {
                isValid: false,
                error: 'Phone number is required'
            };
        }

        const cleanNumber = phoneNumber.replace(/[^\d+]/g, '');

        if (cleanNumber.length < 7) {
            return {
                isValid: false,
                error: 'Phone number is too short'
            };
        }

        // Basic length validation based on country
        const maxLengths: Record<string, number> = {
            US: 10, DO: 10, CA: 10, MX: 10, ES: 9, AR: 10, AU: 9, BR: 11,
            CL: 9, CO: 10, CR: 8, DE: 12, EC: 9, FR: 10, GB: 11, GT: 8,
            HN: 8, IT: 10, JM: 10, NI: 8, PA: 8, PE: 9, PR: 10, PY: 9,
            SV: 8, UY: 8, VE: 10
        };

        if (defaultCountry && maxLengths[defaultCountry]) {
            const maxLength = maxLengths[defaultCountry];
            const nationalNumber = cleanNumber.startsWith('+')
                ? cleanNumber.replace(/^\+\d{1,3}/, '')
                : cleanNumber;

            if (nationalNumber.length > maxLength) {
                return {
                    isValid: false,
                    error: `Phone number is too long for ${defaultCountry}`
                };
            }
        }

        // Basic format validation
        if (!cleanNumber.match(/^(\+\d{1,3})?\d{7,15}$/)) {
            return {
                isValid: false,
                error: 'Invalid phone number format'
            };
        }

        return { isValid: true };
    }

    /**
     * Gets the country code from a phone number (async)
     */
    static async getCountryFromNumber(phoneNumber: string): Promise<CountryCode | undefined> {
        const result = await this.validate(phoneNumber);
        return result.isValid ? result.country : undefined;
    }

    /**
     * Checks if a number belongs to NANP (North American Numbering Plan)
     */
    static async isNANPNumber(phoneNumber: string): Promise<boolean> {
        const result = await this.validate(phoneNumber);
        return (result.isValid && result.e164?.startsWith('+1')) || false;
    }
}

// Export both optimized and original for backward compatibility
export { OptimizedPhoneValidator as PhoneValidator };