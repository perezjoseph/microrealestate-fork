/**
 * Phone number utilities for WhatsApp service
 */
class PhoneUtils {
  /**
   * Validate phone number format with comprehensive checks
   * @param {string} phoneNumber - Phone number to validate
   * @returns {boolean} - True if valid
   */
  static isValid(phoneNumber) {
    if (!phoneNumber || typeof phoneNumber !== 'string') {
      return false;
    }

    // Remove all non-digit characters except +
    const cleaned = phoneNumber.replace(/[^\d+]/g, '');

    // Must have at least 10 digits and at most 15 (E.164 standard)
    if (cleaned.length < 10 || cleaned.length > 16) {
      // +15 digits max
      return false;
    }

    // Check if it matches international format
    const internationalRegex = /^\+\d{10,15}$/;

    // Or just digits (10-15 digits)
    const localRegex = /^\d{10,15}$/;

    const isValidFormat =
      internationalRegex.test(cleaned) || localRegex.test(cleaned);

    // Additional validation: check for common invalid patterns
    if (isValidFormat) {
      // Reject numbers with all same digits (like +1111111111)
      const digitsOnly = cleaned.replace(/^\+/, '');
      if (/^(\d)\1+$/.test(digitsOnly)) {
        return false;
      }

      // Reject numbers starting with 0 after country code
      if (cleaned.startsWith('+') && /^\+\d{1,3}0/.test(cleaned)) {
        return false;
      }
    }

    return isValidFormat;
  }

  /**
   * Format phone number for WhatsApp API (remove + prefix)
   * @param {string} phoneNumber - Phone number to format
   * @returns {string} - Formatted phone number
   */
  static formatForApi(phoneNumber) {
    if (!this.isValid(phoneNumber)) {
      throw new Error(`Invalid phone number format: ${phoneNumber}`);
    }

    // Remove all non-digit characters except +
    let cleaned = phoneNumber.replace(/[^\d+]/g, '');

    // Remove + if present (WhatsApp API expects without +)
    if (cleaned.startsWith('+')) {
      cleaned = cleaned.substring(1);
    }

    return cleaned;
  }

  /**
   * Generate WhatsApp Web URL
   * @param {string} phoneNumber - Phone number
   * @param {string} message - Message content
   * @returns {string} - WhatsApp Web URL
   */
  static generateWhatsAppURL(phoneNumber, message) {
    const cleanPhone = phoneNumber.replace(/[^\d+]/g, '');

    let formattedPhone = cleanPhone;
    if (!formattedPhone.startsWith('+')) {
      formattedPhone = `+${formattedPhone}`;
    }

    const encodedMessage = encodeURIComponent(message);
    return `https://wa.me/${formattedPhone.replace('+', '')}?text=${encodedMessage}`;
  }

  /**
   * Sanitize phone number for logging (remove digits)
   * @param {string} phoneNumber - Phone number to sanitize
   * @returns {string} - Sanitized phone number
   */
  static sanitizeForLog(phoneNumber) {
    if (!phoneNumber || typeof phoneNumber !== 'string') {
      return phoneNumber;
    }

    // Replace digits with asterisks, keep + and country code pattern
    return phoneNumber.replace(/\d/g, '*');
  }

  /**
   * Extract country code from phone number
   * @param {string} phoneNumber - Phone number
   * @returns {string|null} - Country code or null
   */
  static extractCountryCode(phoneNumber) {
    if (!this.isValid(phoneNumber)) {
      return null;
    }

    const cleaned = phoneNumber.replace(/[^\d+]/g, '');

    if (cleaned.startsWith('+')) {
      // Extract first 1-3 digits as country code
      const match = cleaned.match(/^\+(\d{1,3})/);
      return match ? match[1] : null;
    }

    return null;
  }
}

export default PhoneUtils;
