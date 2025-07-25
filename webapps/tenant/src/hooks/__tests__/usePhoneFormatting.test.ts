import { PhoneValidator } from '../../utils/phone/PhoneValidator';
import { CountryData } from '../../utils/phone/Countries';

describe('Phone Formatting Logic', () => {
  const usCountry = CountryData.getCountryByCode('US')!;
  const doCountry = CountryData.getCountryByCode('DO')!;
  const deCountry = CountryData.getCountryByCode('DE')!;

  describe('Basic formatting', () => {
    it('should format US phone number with all formats', () => {
      const result = PhoneValidator.validate('2125551234', 'US');

      expect(result.isValid).toBe(true);
      expect(result.e164).toBe('+12125551234');
      expect(result.formatted).toContain('212');
      expect(result.national).toContain('212');
    });

    it('should handle empty phone number', () => {
      const result = PhoneValidator.validate('', 'US');

      expect(result).toEqual({
        isValid: false,
        formatted: '',
        e164: '',
        national: '',
        error: 'Phone number is required'
      });
    });

    it('should format for display', () => {
      const display = PhoneValidator.formatForDisplay('2125551234', 'US');

      expect(display).toContain('212');
      expect(display).not.toBe('2125551234'); // Should be formatted
    });

    it('should format for API (E.164)', () => {
      const e164 = PhoneValidator.toE164('2125551234', 'US');
      expect(e164).toBe('+12125551234');
    });

    it('should return empty string for invalid number in API format', () => {
      const e164 = PhoneValidator.toE164('invalid', 'US');
      expect(e164).toBe('');
    });
  });

  describe('Country-specific formatting', () => {
    it('should handle Dominican Republic formatting', () => {
      const result = PhoneValidator.validateDominicanRepublic('8091234567');

      expect(result.isValid).toBe(true);
      expect(result.e164).toContain('+1809');
    });

    it('should handle German formatting', () => {
      const result = PhoneValidator.validate('30123456789', 'DE');

      expect(result.isValid).toBe(true);
      expect(result.country).toBe('DE');
      expect(result.e164).toContain('+49');
    });

    it('should provide country-specific placeholders', () => {
      const usPlaceholder = CountryData.getPlaceholderForCountry(usCountry);
      const doPlaceholder = CountryData.getPlaceholderForCountry(doCountry);

      expect(usPlaceholder).toBe('(000) 000-0000');
      expect(doPlaceholder).toBe('(000) 000-0000');
    });
  });

  describe('Input cleaning and validation', () => {
    it('should clean input by removing non-digits', () => {
      const cleaned = '(212) 555-1234'.replace(/[^\d]/g, '');
      expect(cleaned).toBe('2125551234');
    });

    it('should handle input with various formatting', () => {
      const inputs = [
        '212-555-1234',
        '(212) 555-1234',
        '+1 212 555 1234',
        '212.555.1234'
      ];

      inputs.forEach((input) => {
        const result = PhoneValidator.validate(input, 'US');
        expect(result.isValid).toBe(true);
        expect(result.e164).toBe('+12125551234');
      });
    });
  });

  describe('Length validation', () => {
    it('should validate phone number length for US', () => {
      expect(PhoneValidator.isValidLengthForCountry('2125551234', 'US')).toBe(
        true
      );
      expect(
        PhoneValidator.isValidLengthForCountry('212555123456789012345', 'US')
      ).toBe(false); // Too long
    });

    it('should handle formatted phone numbers in length validation', () => {
      expect(
        PhoneValidator.isValidLengthForCountry('(212) 555-1234', 'US')
      ).toBe(true);
    });

    it('should provide correct max lengths for different countries', () => {
      expect(PhoneValidator.getMaxLengthForCountry('US')).toBe(10);
      expect(PhoneValidator.getMaxLengthForCountry('DO')).toBe(10);
      expect(PhoneValidator.getMaxLengthForCountry('DE')).toBe(12);
      expect(PhoneValidator.getMaxLengthForCountry('FR')).toBe(10);
    });

    it('should handle edge cases in length validation', () => {
      expect(
        PhoneValidator.isValidLengthForCountry('12345678901234567890', 'US')
      ).toBe(false);
      expect(
        PhoneValidator.isValidLengthForCountry(
          '123456789012345678901234567890',
          'US'
        )
      ).toBe(false);
    });
  });

  describe('Progressive formatting patterns', () => {
    it('should format as user types for US numbers', () => {
      const formatAsYouType = (input: string, country: string) => {
        const cleaned = input.replace(/[^\d]/g, '');

        if (country === 'US') {
          if (cleaned.length <= 3) return cleaned;
          if (cleaned.length <= 6)
            return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
          return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
        }

        return cleaned;
      };

      expect(formatAsYouType('212', 'US')).toBe('212');
      expect(formatAsYouType('2125', 'US')).toBe('(212) 5');
      expect(formatAsYouType('2125551', 'US')).toBe('(212) 555-1');
      expect(formatAsYouType('2125551234', 'US')).toBe('(212) 555-1234');
    });

    it('should handle different country formatting patterns', () => {
      // Test basic formatting for different countries
      const usResult = PhoneValidator.validate('2125551234', 'US');
      const deResult = PhoneValidator.validate('30123456789', 'DE');

      expect(usResult.isValid).toBe(true);
      expect(deResult.isValid).toBe(true);

      expect(usResult.country).toBe('US');
      expect(deResult.country).toBe('DE');
    });
  });

  describe('Error handling and edge cases', () => {
    it('should handle malformed input gracefully', () => {
      const result = PhoneValidator.validate('abc-def-ghij', 'US');
      expect(result.isValid).toBe(false);
      expect(result.error).toBeTruthy();
    });

    it('should handle very long input', () => {
      const longInput = '1234567890123456789012345678901234567890';
      const result = PhoneValidator.validateWithDetailedErrors(longInput, 'US');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('too long');
    });

    it('should handle special characters', () => {
      const inputs = [
        '+1-212-555-1234',
        '1.212.555.1234',
        '1 (212) 555-1234',
        '1-212-555-1234'
      ];

      inputs.forEach((input) => {
        const result = PhoneValidator.validate(input, 'US');
        expect(result.isValid).toBe(true);
      });
    });

    it('should handle international format', () => {
      const result = PhoneValidator.validate('+12125551234');
      expect(result.isValid).toBe(true);
      expect(result.country).toBe('US');
      expect(result.e164).toBe('+12125551234');
    });
  });
});
