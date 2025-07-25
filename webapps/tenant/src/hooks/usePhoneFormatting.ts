import { useState, useCallback, useMemo } from 'react';
import { CountryCode } from 'libphonenumber-js';
import { PhoneValidator } from '../utils/phone/PhoneValidator';
import { Country } from '../utils/phone/Countries';
import useTranslation from '@/utils/i18n/client/useTranslation';

export interface PhoneFormattingResult {
  formatted: string;
  display: string;
  e164: string;
  national: string;
  isValid: boolean;
}

export interface PhoneFormattingHookResult {
  formatNumber: (phoneNumber: string) => PhoneFormattingResult;
  formatForDisplay: (phoneNumber: string) => string;
  formatForAPI: (phoneNumber: string) => string;
  getPlaceholder: () => string;
  formatAsYouType: (input: string) => string;
  cleanInput: (input: string) => string;
}

/**
 * Hook for phone number formatting and display
 */
export const usePhoneFormatting = (
  country: Country
): PhoneFormattingHookResult => {
  const { t } = useTranslation();
  /**
   * Formats a phone number with all possible formats
   */
  const formatNumber = useCallback(
    (phoneNumber: string): PhoneFormattingResult => {
      if (!phoneNumber.trim()) {
        return {
          formatted: '',
          display: '',
          e164: '',
          national: '',
          isValid: false
        };
      }

      const result =
        country.code === 'DO'
          ? PhoneValidator.validateDominicanRepublic(phoneNumber)
          : PhoneValidator.validate(phoneNumber, country.code);

      return {
        formatted: result.formatted,
        display: result.formatted,
        e164: result.e164,
        national: result.national,
        isValid: result.isValid
      };
    },
    [country.code]
  );

  /**
   * Formats phone number for display purposes
   */
  const formatForDisplay = useCallback(
    (phoneNumber: string): string => {
      if (!phoneNumber.trim()) return '';

      return PhoneValidator.formatForDisplay(phoneNumber, country.code);
    },
    [country.code]
  );

  /**
   * Formats phone number for API calls (E.164 format)
   */
  const formatForAPI = useCallback(
    (phoneNumber: string): string => {
      if (!phoneNumber.trim()) return '';

      return PhoneValidator.toE164(phoneNumber, country.code);
    },
    [country.code]
  );

  /**
   * Gets placeholder text based on country format
   */
  const getPlaceholder = useCallback((): string => {
    // Return country-specific placeholder
    const placeholders: Record<string, string> = {
      US: '(555) 123-4567',
      DO: '(809) 123-4567',
      CA: '(555) 123-4567',
      MX: '55 1234 5678',
      ES: '612 34 56 78',
      AR: '11 1234-5678',
      AU: '0412 345 678',
      BR: '(11) 91234-5678',
      CL: '9 1234 5678',
      CO: '300 123 4567',
      CR: '8312-3456',
      DE: '0151 23456789',
      EC: '99 123 4567',
      FR: '06 12 34 56 78',
      GB: '07700 900123',
      GT: '5123 4567',
      HN: '9123 4567',
      IT: '312 345 6789',
      JM: '(876) 123-4567',
      NI: '8123 4567',
      PA: '6123-4567',
      PE: '912 345 678',
      PR: '(787) 123-4567',
      PY: '981 123456',
      SV: '7123 4567',
      UY: '94 123 456',
      VE: '412-1234567'
    };

    return placeholders[country.code] || t('Enter your phone number');
  }, [country.code]);

  /**
   * Formats input as user types (progressive formatting)
   */
  const formatAsYouType = useCallback(
    (input: string): string => {
      if (!input) return '';

      // Clean the input first
      const cleaned = input.replace(/[^\d]/g, '');

      if (!cleaned) return '';

      // Apply country-specific formatting patterns
      const formatPatterns: Record<string, (digits: string) => string> = {
        US: (digits) => {
          if (digits.length <= 3) return digits;
          if (digits.length <= 6)
            return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
          return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
        },
        DO: (digits) => {
          if (digits.length <= 3) return digits;
          if (digits.length <= 6)
            return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
          return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
        },
        CA: (digits) => {
          if (digits.length <= 3) return digits;
          if (digits.length <= 6)
            return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
          return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
        },
        DE: (digits) => {
          if (digits.length <= 4) return digits;
          if (digits.length <= 8)
            return `${digits.slice(0, 4)} ${digits.slice(4)}`;
          return `${digits.slice(0, 4)} ${digits.slice(4, 8)} ${digits.slice(8, 12)}`;
        },
        FR: (digits) => {
          if (digits.length <= 2) return digits;
          if (digits.length <= 4)
            return `${digits.slice(0, 2)} ${digits.slice(2)}`;
          if (digits.length <= 6)
            return `${digits.slice(0, 2)} ${digits.slice(2, 4)} ${digits.slice(4)}`;
          if (digits.length <= 8)
            return `${digits.slice(0, 2)} ${digits.slice(2, 4)} ${digits.slice(4, 6)} ${digits.slice(6)}`;
          return `${digits.slice(0, 2)} ${digits.slice(2, 4)} ${digits.slice(4, 6)} ${digits.slice(6, 8)} ${digits.slice(8, 10)}`;
        },
        ES: (digits) => {
          if (digits.length <= 3) return digits;
          if (digits.length <= 5)
            return `${digits.slice(0, 3)} ${digits.slice(3)}`;
          return `${digits.slice(0, 3)} ${digits.slice(3, 5)} ${digits.slice(5, 7)} ${digits.slice(7, 9)}`;
        },
        GB: (digits) => {
          if (digits.length <= 5) return digits;
          if (digits.length <= 8)
            return `${digits.slice(0, 5)} ${digits.slice(5)}`;
          return `${digits.slice(0, 5)} ${digits.slice(5, 8)} ${digits.slice(8, 11)}`;
        }
      };

      const formatter = formatPatterns[country.code];
      if (formatter) {
        return formatter(cleaned);
      }

      // Default formatting for countries without specific patterns
      if (cleaned.length <= 3) return cleaned;
      if (cleaned.length <= 6)
        return `${cleaned.slice(0, 3)} ${cleaned.slice(3)}`;
      return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
    },
    [country.code]
  );

  /**
   * Cleans input by removing non-digit characters
   */
  const cleanInput = useCallback((input: string): string => {
    return input.replace(/[^\d]/g, '');
  }, []);

  return {
    formatNumber,
    formatForDisplay,
    formatForAPI,
    getPlaceholder,
    formatAsYouType,
    cleanInput
  };
};

/**
 * Hook for managing phone number input state with formatting
 */
export const usePhoneInputState = (country: Country) => {
  const [rawValue, setRawValue] = useState('');
  const [displayValue, setDisplayValue] = useState('');

  const { formatAsYouType, cleanInput, formatForAPI } =
    usePhoneFormatting(country);

  const handleInputChange = useCallback(
    (value: string) => {
      const cleaned = cleanInput(value);
      const formatted = formatAsYouType(cleaned);

      setRawValue(cleaned);
      setDisplayValue(formatted);
    },
    [cleanInput, formatAsYouType]
  );

  const getE164Value = useCallback(() => {
    return formatForAPI(rawValue);
  }, [rawValue, formatForAPI]);

  const reset = useCallback(() => {
    setRawValue('');
    setDisplayValue('');
  }, []);

  return {
    rawValue,
    displayValue,
    handleInputChange,
    getE164Value,
    reset
  };
};

/**
 * Hook for country-specific formatting rules
 */
export const useCountryFormattingRules = (country: Country) => {
  const rules = useMemo(() => {
    const maxLengths: Record<string, number> = {
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

    const minLengths: Record<string, number> = {
      US: 10,
      DO: 10,
      CA: 10,
      MX: 10,
      ES: 9,
      AR: 10,
      AU: 9,
      BR: 10,
      CL: 8,
      CO: 10,
      CR: 8,
      DE: 10,
      EC: 8,
      FR: 10,
      GB: 10,
      GT: 8,
      HN: 8,
      IT: 9,
      JM: 10,
      NI: 8,
      PA: 8,
      PE: 8,
      PR: 10,
      PY: 8,
      SV: 8,
      UY: 8,
      VE: 10
    };

    return {
      maxLength: maxLengths[country.code] || 15,
      minLength: minLengths[country.code] || 7,
      dialCode: country.dialCode,
      format: country.format
    };
  }, [country.code, country.dialCode, country.format]);

  const isValidLength = useCallback(
    (phoneNumber: string): boolean => {
      const cleaned = phoneNumber.replace(/[^\d]/g, '');
      return (
        cleaned.length >= rules.minLength && cleaned.length <= rules.maxLength
      );
    },
    [rules.minLength, rules.maxLength]
  );

  return {
    ...rules,
    isValidLength
  };
};
