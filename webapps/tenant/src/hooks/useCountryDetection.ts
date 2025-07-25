import { useCallback, useEffect, useState } from 'react';
import { CountryCode } from 'libphonenumber-js';
import { Country, CountryData } from '../utils/phone/Countries';

const STORAGE_KEY = 'preferred-country';

export interface CountryDetectionResult {
  selectedCountry: Country;
  setSelectedCountry: (country: Country) => void;
  detectCountry: () => Country;
  isLoading: boolean;
}

/**
 * Hook for detecting and managing country selection with localStorage persistence
 */
export const useCountryDetection = (
  defaultCountryCode?: CountryCode
): CountryDetectionResult => {
  const [selectedCountry, setSelectedCountryState] = useState<Country | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Detects country from browser locale
   */
  const detectCountryFromLocale = useCallback((): Country => {
    try {
      // Get browser locale
      const locale = navigator.language || navigator.languages?.[0] || 'en-US';

      // Extract country code from locale (e.g., 'en-US' -> 'US')
      const countryCode = locale.split('-')[1]?.toUpperCase() as CountryCode;

      if (countryCode) {
        const country = CountryData.getCountryByCode(countryCode);
        if (country) {
          return country;
        }
      }
    } catch (error) {
      console.warn('Failed to detect country from locale:', error);
    }

    // Fallback to default or US
    if (defaultCountryCode) {
      const defaultCountry = CountryData.getCountryByCode(defaultCountryCode);
      if (defaultCountry) {
        return defaultCountry;
      }
    }

    // Final fallback to US
    return (
      CountryData.getCountryByCode('US') || CountryData.getAllCountries()[0]
    );
  }, [defaultCountryCode]);

  /**
   * Detects country with priority order:
   * 1. localStorage preference
   * 2. Browser locale
   * 3. Default country code
   * 4. US fallback
   */
  const detectCountry = useCallback((): Country => {
    try {
      // 1. Check localStorage for previous selection
      const savedCountry = localStorage.getItem(STORAGE_KEY);
      if (savedCountry) {
        const parsed = JSON.parse(savedCountry) as Country;
        // Validate that the saved country still exists in our data
        const validCountry = CountryData.getCountryByCode(parsed.code);
        if (validCountry) {
          return validCountry;
        }
      }
    } catch (error) {
      console.warn('Failed to load country from localStorage:', error);
    }

    // 2. Detect from browser locale
    return detectCountryFromLocale();
  }, [detectCountryFromLocale]);

  /**
   * Sets selected country and persists to localStorage
   */
  const setSelectedCountry = useCallback((country: Country) => {
    setSelectedCountryState(country);

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(country));
    } catch (error) {
      console.warn('Failed to save country to localStorage:', error);
    }
  }, []);

  /**
   * Initialize country detection on mount
   */
  useEffect(() => {
    const initializeCountry = () => {
      setIsLoading(true);
      const detectedCountry = detectCountry();
      setSelectedCountryState(detectedCountry);
      setIsLoading(false);
    };

    initializeCountry();
  }, [detectCountry]);

  return {
    selectedCountry: selectedCountry || detectCountry(),
    setSelectedCountry,
    detectCountry,
    isLoading
  };
};

/**
 * Hook for getting country preference from localStorage only
 */
export const useStoredCountryPreference = (): Country | null => {
  const [storedCountry, setStoredCountry] = useState<Country | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Country;
        const validCountry = CountryData.getCountryByCode(parsed.code);
        setStoredCountry(validCountry || null);
      }
    } catch (error) {
      console.warn('Failed to load stored country preference:', error);
      setStoredCountry(null);
    }
  }, []);

  return storedCountry;
};

/**
 * Hook for clearing country preference
 */
export const useClearCountryPreference = () => {
  return useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.warn('Failed to clear country preference:', error);
    }
  }, []);
};
