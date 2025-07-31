import { CountryCode } from 'libphonenumber-js';
import { Country } from './Countries';
import { ALL_COUNTRIES, CORE_COUNTRIES, POPULAR_COUNTRIES } from './CountriesComplete';

// Use the comprehensive country list
let allCountriesCache: Country[] | null = null;
let loadingPromise: Promise<Country[]> | null = null;

/**
 * Loads all countries (now synchronous since we have them all)
 */
const loadAllCountries = (): Promise<Country[]> => {
  if (allCountriesCache) {
    return Promise.resolve(allCountriesCache);
  }

  if (loadingPromise) {
    return loadingPromise;
  }

  loadingPromise = Promise.resolve(ALL_COUNTRIES).then(countries => {
    allCountriesCache = countries;
    return countries;
  });

  return loadingPromise;
};

/**
 * Preloads all countries in background
 */
const preloadAllCountries = (): void => {
  if (!allCountriesCache && !loadingPromise) {
    loadAllCountries();
  }
};

/**
 * Gets country by code from all countries
 */
export const getCountryByCodeLazy = async (code: CountryCode): Promise<Country | undefined> => {
  const countries = await loadAllCountries();
  return countries.find((country) => country.code === code);
};

/**
 * Gets country by code from core countries only (synchronous)
 */
export const getCoreCountryByCode = (code: CountryCode): Country | undefined => {
  return CORE_COUNTRIES.find((country) => country.code === code);
};

/**
 * Gets all countries with lazy loading
 */
export const getAllCountriesLazy = async (): Promise<Country[]> => {
  return loadAllCountries();
};

/**
 * Gets core countries immediately (no async loading)
 */
export const getCoreCountries = (): Country[] => {
  return CORE_COUNTRIES;
};

/**
 * Searches countries, loading all countries for comprehensive search
 */
export const searchCountriesLazy = async (query: string): Promise<Country[]> => {
  if (!query) return getCoreCountries();

  const searchTerm = query.toLowerCase();
  const countries = await loadAllCountries();

  return countries.filter(
    (country) =>
      country.name.toLowerCase().includes(searchTerm) ||
      country.code.toLowerCase().includes(searchTerm) ||
      country.dialCode.includes(searchTerm)
  );
};

export class LazyCountryData {
  /**
   * Gets all countries with lazy loading
   */
  static async getAllCountries(): Promise<Country[]> {
    return getAllCountriesLazy();
  }

  /**
   * Gets core countries immediately
   */
  static getCoreCountries(): Country[] {
    return getCoreCountries();
  }

  /**
   * Searches countries with lazy loading
   */
  static async searchCountries(query: string): Promise<Country[]> {
    return searchCountriesLazy(query);
  }

  /**
   * Gets country by code with lazy loading
   */
  static async getCountryByCode(code: CountryCode): Promise<Country | undefined> {
    return getCountryByCodeLazy(code);
  }

  /**
   * Gets country by code from core countries only (synchronous)
   */
  static getCoreCountryByCode(code: CountryCode): Country | undefined {
    return getCoreCountryByCode(code);
  }

  /**
   * Gets popular countries (always from core)
   */
  static getPopularCountries(): Country[] {
    return POPULAR_COUNTRIES;
  }

  /**
   * Preloads all countries in background
   */
  static preload(): void {
    preloadAllCountries();
  }

  /**
   * Detects country from browser locale (core countries only for performance)
   */
  static detectCountryFromBrowser(): Country | undefined {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
      return undefined;
    }

    const primaryLocale = navigator.language;
    let country = this.detectCountryFromLocale(primaryLocale);

    if (country) return country;

    if (navigator.languages) {
      for (const locale of navigator.languages) {
        country = this.detectCountryFromLocale(locale);
        if (country) return country;
      }
    }

    return undefined;
  }

  /**
   * Detects country from locale (core countries only)
   */
  static detectCountryFromLocale(locale: string): Country | undefined {
    if (!locale) return undefined;

    const parts = locale.split('-');
    if (parts.length < 2) return undefined;

    const countryCode = parts[1].toUpperCase() as CountryCode;
    return getCoreCountryByCode(countryCode);
  }

  /**
   * Gets the best country to use based on preferences and browser locale
   */
  static detectBestCountry(): Country {
    // 1. Check localStorage for previous selection
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      try {
        const stored = localStorage.getItem('preferred-country');
        if (stored) {
          const countryCode = JSON.parse(stored) as CountryCode;
          const country = getCoreCountryByCode(countryCode);
          if (country) return country;
        }
      } catch {
        // Ignore localStorage errors
      }
    }

    // 2. Detect from browser locale
    const browserCountry = this.detectCountryFromBrowser();
    if (browserCountry) return browserCountry;

    // 3. Default fallback to US
    return getCoreCountryByCode('US') || getCoreCountries()[0];
  }
}
