import { PhoneValidator } from '../../utils/phone/PhoneValidator';
import { CountryData } from '../../utils/phone/Countries';

describe('Phone Validation Logic', () => {
  const usCountry = CountryData.getCountryByCode('US')!;
  const doCountry = CountryData.getCountryByCode('DO')!;

  describe('PhoneValidator', () => {
    it('should validate US phone number correctly', () => {
      const result = PhoneValidator.validate('2125551234', 'US');

      expect(result.isValid).toBe(true);
      expect(result.e164).toBe('+12125551234');
      expect(result.country).toBe('US');
    });

    it('should validate Dominican Republic phone number correctly', () => {
      const result = PhoneValidator.validateDominicanRepublic('8091234567');

      expect(result.isValid).toBe(true);
      expect(result.country).toBe('DO');
      expect(result.e164).toContain('+1809');
    });

    it('should show error for invalid phone number', () => {
      const result = PhoneValidator.validateWithDetailedErrors('123', 'US');

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Phone number is too short');
    });

    it('should handle empty phone number', () => {
      const result = PhoneValidator.validateWithDetailedErrors('', 'US');

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Phone number is required');
    });

    it('should format phone number to E.164', () => {
      const e164 = PhoneValidator.toE164('2125551234', 'US');
      expect(e164).toBe('+12125551234');
    });

    it('should format phone number for display', () => {
      const display = PhoneValidator.formatForDisplay('2125551234', 'US');
      expect(display).toContain('212');
      expect(display).not.toBe('2125551234'); // Should be formatted
    });

    it('should detect NANP numbers', () => {
      expect(PhoneValidator.isNANPNumber('+12125551234')).toBe(true);
      expect(PhoneValidator.isNANPNumber('+491234567890')).toBe(false);
    });

    it('should get country from number', () => {
      const country = PhoneValidator.getCountryFromNumber('+12125551234');
      expect(country).toBe('US');
    });

    it('should validate length for country', () => {
      expect(PhoneValidator.isValidLengthForCountry('2125551234', 'US')).toBe(
        true
      );
      expect(
        PhoneValidator.isValidLengthForCountry(
          '21255512345678901234567890',
          'US'
        )
      ).toBe(false);
    });

    it('should get max length for country', () => {
      expect(PhoneValidator.getMaxLengthForCountry('US')).toBe(10);
      expect(PhoneValidator.getMaxLengthForCountry('DO')).toBe(10);
      expect(PhoneValidator.getMaxLengthForCountry('DE')).toBe(12);
    });
  });

  describe('Validation with different countries', () => {
    it('should validate German phone number', () => {
      const result = PhoneValidator.validate('30123456789', 'DE');
      expect(result.isValid).toBe(true);
      expect(result.country).toBe('DE');
    });

    it('should validate French phone number', () => {
      const result = PhoneValidator.validate('123456789', 'FR');
      expect(result.isValid).toBe(true);
      expect(result.country).toBe('FR');
    });

    it('should handle invalid country code', () => {
      const result = PhoneValidator.validate('1234567890', 'INVALID' as any);
      // Should still attempt validation
      expect(typeof result.isValid).toBe('boolean');
    });
  });

  describe('Dominican Republic special handling', () => {
    it('should handle DR area codes correctly', () => {
      const result809 = PhoneValidator.validateDominicanRepublic('8091234567');
      const result829 = PhoneValidator.validateDominicanRepublic('8291234567');
      const result849 = PhoneValidator.validateDominicanRepublic('8491234567');

      expect(result809.isValid).toBe(true);
      expect(result829.isValid).toBe(true);
      expect(result849.isValid).toBe(true);

      expect(result809.country).toBe('DO');
      expect(result829.country).toBe('DO');
      expect(result849.country).toBe('DO');
    });

    it('should handle DR numbers with country code', () => {
      const result = PhoneValidator.validateDominicanRepublic('+18091234567');
      expect(result.isValid).toBe(true);
      expect(result.country).toBe('DO');
    });

    it('should reject invalid DR numbers', () => {
      const result = PhoneValidator.validateDominicanRepublic('123');
      expect(result.isValid).toBe(false);
    });
  });

  describe('Error handling', () => {
    it('should handle malformed input gracefully', () => {
      const result = PhoneValidator.validate('abc-def-ghij', 'US');
      expect(result.isValid).toBe(false);
      expect(result.error).toBeTruthy();
    });

    it('should handle null/undefined input', () => {
      const result1 = PhoneValidator.validate('', 'US');
      const result2 = PhoneValidator.validate('   ', 'US');

      expect(result1.isValid).toBe(false);
      expect(result2.isValid).toBe(false);
    });

    it('should provide detailed error messages', () => {
      const shortResult = PhoneValidator.validateWithDetailedErrors(
        '123',
        'US'
      );
      const emptyResult = PhoneValidator.validateWithDetailedErrors('', 'US');
      const longResult = PhoneValidator.validateWithDetailedErrors(
        '123456789012345678901234567890',
        'US'
      );

      expect(shortResult.error).toBe('Phone number is too short');
      expect(emptyResult.error).toBe('Phone number is required');
      expect(longResult.error).toContain('too long');
    });
  });
});
