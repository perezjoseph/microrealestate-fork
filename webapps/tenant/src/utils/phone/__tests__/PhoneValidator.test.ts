import { PhoneValidator } from '../PhoneValidator';

describe('PhoneValidator', () => {
  describe('validate', () => {
    it('should validate US phone numbers correctly', () => {
      const result = PhoneValidator.validate('(212) 555-1234', 'US');
      expect(result.isValid).toBe(true);
      expect(result.e164).toBe('+12125551234');
      expect(result.country).toBe('US');
    });

    it('should validate Dominican Republic phone numbers', () => {
      const result = PhoneValidator.validateDominicanRepublic('(809) 123-4567');
      expect(result.isValid).toBe(true);
      expect(result.e164).toBe('+18091234567');
      expect(result.country).toBe('DO');
    });

    it('should handle invalid phone numbers', () => {
      const result = PhoneValidator.validate('123', 'US');
      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle empty phone numbers', () => {
      const result = PhoneValidator.validate('', 'US');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Phone number is required');
    });

    it('should format international numbers correctly', () => {
      const result = PhoneValidator.validate('+49 30 12345678', 'DE');
      expect(result.isValid).toBe(true);
      expect(result.country).toBe('DE');
      expect(result.e164).toBe('+493012345678');
    });
  });

  describe('toE164', () => {
    it('should convert valid numbers to E.164 format', () => {
      const e164 = PhoneValidator.toE164('(212) 555-1234', 'US');
      expect(e164).toBe('+12125551234');
    });

    it('should return empty string for invalid numbers', () => {
      const e164 = PhoneValidator.toE164('invalid', 'US');
      expect(e164).toBe('');
    });
  });

  describe('formatForDisplay', () => {
    it('should format valid numbers for display', () => {
      const formatted = PhoneValidator.formatForDisplay('2125551234', 'US');
      expect(formatted).toBe('+1 212 555 1234');
    });

    it('should return original input for invalid numbers', () => {
      const formatted = PhoneValidator.formatForDisplay('invalid', 'US');
      expect(formatted).toBe('invalid');
    });
  });

  describe('getMaxLengthForCountry', () => {
    it('should return correct max length for US', () => {
      expect(PhoneValidator.getMaxLengthForCountry('US')).toBe(10);
    });

    it('should return correct max length for Dominican Republic', () => {
      expect(PhoneValidator.getMaxLengthForCountry('DO')).toBe(10);
    });

    it('should return default max length for unknown countries', () => {
      expect(PhoneValidator.getMaxLengthForCountry('XX' as any)).toBe(15);
    });
  });

  describe('isValidLengthForCountry', () => {
    it('should validate length correctly for US numbers', () => {
      expect(PhoneValidator.isValidLengthForCountry('2125551234', 'US')).toBe(
        true
      );
      expect(
        PhoneValidator.isValidLengthForCountry('212555123456789012', 'US')
      ).toBe(false);
    });
  });

  describe('validateWithDetailedErrors', () => {
    it('should provide detailed error messages', () => {
      const result = PhoneValidator.validateWithDetailedErrors('123', 'US');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Phone number is too short');
    });

    it('should handle empty input', () => {
      const result = PhoneValidator.validateWithDetailedErrors('', 'US');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Phone number is required');
    });
  });

  describe('isNANPNumber', () => {
    it('should identify NANP numbers', () => {
      expect(PhoneValidator.isNANPNumber('+12125551234')).toBe(true);
      expect(PhoneValidator.isNANPNumber('+18091234567')).toBe(true);
      expect(PhoneValidator.isNANPNumber('+493012345678')).toBe(false);
    });
  });

  describe('getCountryFromNumber', () => {
    it('should detect country from phone number', () => {
      expect(PhoneValidator.getCountryFromNumber('+12125551234')).toBe('US');
      expect(PhoneValidator.getCountryFromNumber('+18091234567')).toBe('DO'); // DR is correctly detected
      expect(PhoneValidator.getCountryFromNumber('+493012345678')).toBe('DE');
    });
  });
});
