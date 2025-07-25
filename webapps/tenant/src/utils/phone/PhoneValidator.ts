import {
  CountryCode,
  PhoneNumber,
  isValidPhoneNumber,
  parsePhoneNumber
} from 'libphonenumber-js';

export interface PhoneValidationResult {
  isValid: boolean;
  formatted: string;
  e164: string;
  national: string;
  country?: CountryCode;
  error?: string;
}

export class PhoneValidator {
  /**
   * Validates and formats a phone number
   */
  static validate(
    phoneNumber: string,
    defaultCountry?: CountryCode
  ): PhoneValidationResult {
    try {
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
      const isValid = isValidPhoneNumber(cleanNumber, defaultCountry);

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
      let parsed: PhoneNumber;
      try {
        parsed = parsePhoneNumber(cleanNumber, defaultCountry);
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
   * Validates phone number for a specific country
   */
  static validateForCountry(
    phoneNumber: string,
    country: CountryCode
  ): PhoneValidationResult {
    return this.validate(phoneNumber, country);
  }

  /**
   * Formats phone number to E.164 format for API calls
   */
  static toE164(phoneNumber: string, defaultCountry?: CountryCode): string {
    const result = this.validate(phoneNumber, defaultCountry);
    return result.isValid ? result.e164 : '';
  }

  /**
   * Formats phone number for display
   */
  static formatForDisplay(
    phoneNumber: string,
    defaultCountry?: CountryCode
  ): string {
    const result = this.validate(phoneNumber, defaultCountry);
    return result.isValid ? result.formatted : phoneNumber;
  }

  /**
   * Checks if a phone number is valid for Dominican Republic
   * Special handling for DR numbers which use +1-809, +1-829, +1-849
   */
  static validateDominicanRepublic(phoneNumber: string): PhoneValidationResult {
    // First try direct validation as DO
    const result = this.validate(phoneNumber, 'DO');

    if (result.isValid && result.country === 'DO') {
      return result;
    }

    // Try parsing as US number with DR area codes
    const usResult = this.validate(phoneNumber, 'US');
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
      const drResult = this.validate(withCountryCode);
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
   * Validates phone number with enhanced error messages
   */
  static validateWithDetailedErrors(
    phoneNumber: string,
    defaultCountry?: CountryCode
  ): PhoneValidationResult {
    if (!phoneNumber || phoneNumber.trim() === '') {
      return {
        isValid: false,
        formatted: '',
        e164: '',
        national: '',
        error: 'Phone number is required'
      };
    }

    const cleanNumber = phoneNumber.replace(/[^\d+]/g, '');

    if (cleanNumber.length < 7) {
      return {
        isValid: false,
        formatted: phoneNumber,
        e164: '',
        national: '',
        error: 'Phone number is too short'
      };
    }

    if (
      defaultCountry &&
      !this.isValidLengthForCountry(cleanNumber, defaultCountry)
    ) {
      return {
        isValid: false,
        formatted: phoneNumber,
        e164: '',
        national: '',
        error: `Phone number is too long for ${defaultCountry}`
      };
    }

    return this.validate(phoneNumber, defaultCountry);
  }

  /**
   * Checks if a number belongs to NANP (North American Numbering Plan)
   */
  static isNANPNumber(phoneNumber: string): boolean {
    const result = this.validate(phoneNumber);
    return (result.isValid && result.e164?.startsWith('+1')) || false;
  }

  /**
   * Gets the country code from a phone number
   */
  static getCountryFromNumber(phoneNumber: string): CountryCode | undefined {
    const result = this.validate(phoneNumber);
    return result.isValid ? result.country : undefined;
  }

  /**
   * Gets the maximum length for a phone number in a specific country
   */
  static getMaxLengthForCountry(country: CountryCode): number {
    // Get max length from country data if available
    const countryData = this.getCountryData(country);
    if (countryData) {
      return countryData.maxLength;
    }

    // Fallback to common maximum lengths by country
    const maxLengths: Record<string, number> = {
      US: 10, // National format without country code
      DO: 10, // Dominican Republic
      DE: 12, // Germany
      FR: 10, // France
      ES: 9, // Spain
      GB: 11, // United Kingdom
      CA: 10, // Canada
      MX: 10, // Mexico
      BR: 11, // Brazil
      AR: 10, // Argentina
      CO: 10, // Colombia
      PE: 9, // Peru
      CL: 9, // Chile
      EC: 9, // Ecuador
      VE: 10, // Venezuela
      PY: 9, // Paraguay
      UY: 8, // Uruguay
      CR: 8, // Costa Rica
      PA: 8, // Panama
      GT: 8, // Guatemala
      HN: 8, // Honduras
      SV: 8, // El Salvador
      NI: 8, // Nicaragua
      JM: 10, // Jamaica
      PR: 10, // Puerto Rico
      AU: 9, // Australia
      IT: 10 // Italy
    };

    return maxLengths[country] || 15; // Default to international max
  }

  /**
   * Helper method to get country data
   */
  private static getCountryData(countryCode: CountryCode) {
    // This would normally import from Countries.ts, but to avoid circular dependency
    // we'll implement a simple lookup here
    const countryMaxLengths: Record<string, number> = {
      US: 10,
      DO: 10,
      CA: 10,
      MX: 10,
      ES: 9,
      AR: 10,
      AU: 9,
      BR: 11,
      CL: 9,
      CO: 10,
      CR: 8,
      DE: 12,
      EC: 9,
      FR: 10,
      GB: 11,
      GT: 8,
      HN: 8,
      IT: 10,
      JM: 10,
      NI: 8,
      PA: 8,
      PE: 9,
      PR: 10,
      PY: 9,
      SV: 8,
      UY: 8,
      VE: 10
    };

    return countryMaxLengths[countryCode]
      ? { maxLength: countryMaxLengths[countryCode] }
      : null;
  }

  /**
   * Checks if phone number length is valid for country
   */
  static isValidLengthForCountry(
    phoneNumber: string,
    country: CountryCode
  ): boolean {
    const cleanNumber = phoneNumber.replace(/[^\d]/g, '');
    const maxLength = this.getMaxLengthForCountry(country);
    return cleanNumber.length <= maxLength;
  }
}
