import { CountryData } from '../Countries';

// Mock localStorage for testing
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};

// Mock navigator for testing
const navigatorMock = {
  language: 'en-US',
  languages: ['en-US', 'es-DO', 'fr-FR']
};

// Setup global mocks to simulate browser environment
Object.defineProperty(global, 'window', {
  value: {
    localStorage: localStorageMock,
    navigator: navigatorMock
  },
  writable: true
});

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
  writable: true
});

Object.defineProperty(global, 'navigator', {
  value: navigatorMock,
  writable: true
});

describe('CountryData', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('getAllCountries', () => {
    it('should return a list of countries with dial codes', () => {
      const countries = CountryData.getAllCountries();
      expect(countries.length).toBeGreaterThan(0);

      const us = countries.find((c) => c.code === 'US');
      expect(us).toBeDefined();
      expect(us?.dialCode).toBe('+1');
      expect(us?.flag).toBe('🇺🇸');
      expect(us?.name).toBe('United States');
    });

    it('should return countries sorted by priority then name', () => {
      const countries = CountryData.getAllCountries();
      const priorityCountries = countries.filter((c) => c.priority);
      expect(priorityCountries[0].code).toBe('US');
      expect(priorityCountries[1].code).toBe('DO');
    });
  });

  describe('getCountryByCode', () => {
    it('should return country by ISO code', () => {
      const us = CountryData.getCountryByCode('US');
      expect(us?.code).toBe('US');
      expect(us?.dialCode).toBe('+1');
      expect(us?.name).toBe('United States');
    });

    it('should return undefined for invalid code', () => {
      const invalid = CountryData.getCountryByCode('XX' as any);
      expect(invalid).toBeUndefined();
    });
  });

  describe('getCountryByDialCode', () => {
    it('should return country by dial code', () => {
      const us = CountryData.getCountryByDialCode('+1');
      expect(us?.code).toBe('US');
      expect(us?.dialCode).toBe('+1');
    });

    it('should return undefined for invalid dial code', () => {
      const invalid = CountryData.getCountryByDialCode('+999');
      expect(invalid).toBeUndefined();
    });
  });

  describe('searchCountries', () => {
    it('should search by country name', () => {
      const results = CountryData.searchCountries('United');
      expect(results.length).toBeGreaterThan(0);
      expect(results.some((c) => c.name.includes('United'))).toBe(true);
    });

    it('should search by country code', () => {
      const results = CountryData.searchCountries('US');
      expect(results.some((c) => c.code === 'US')).toBe(true);
    });

    it('should search by dial code', () => {
      const results = CountryData.searchCountries('+1');
      expect(results.some((c) => c.dialCode === '+1')).toBe(true);
    });

    it('should return all countries for empty query', () => {
      const results = CountryData.searchCountries('');
      const allCountries = CountryData.getAllCountries();
      expect(results.length).toBe(allCountries.length);
    });
  });

  describe('detectCountryFromLocale', () => {
    it('should detect country from full locale', () => {
      const us = CountryData.detectCountryFromLocale('en-US');
      expect(us?.code).toBe('US');
    });

    it('should detect Dominican Republic from locale', () => {
      const dr = CountryData.detectCountryFromLocale('es-DO');
      expect(dr?.code).toBe('DO');
    });

    it('should return undefined for unknown locale', () => {
      const unknown = CountryData.detectCountryFromLocale('xx-XX');
      expect(unknown).toBeUndefined();
    });
  });

  describe('getPlaceholderForCountry', () => {
    it('should generate placeholder for US', () => {
      const us = CountryData.getCountryByCode('US')!;
      const placeholder = CountryData.getPlaceholderForCountry(us);
      expect(placeholder).toBe('(000) 000-0000');
    });
  });

  describe('getPopularCountries', () => {
    it('should return popular countries first', () => {
      const popular = CountryData.getPopularCountries();
      expect(popular[0].code).toBe('US');
      expect(popular[1].code).toBe('DO');
      expect(popular.length).toBe(5); // We have 5 priority countries
    });
  });

  describe('getNANPCountries', () => {
    it('should return all +1 countries', () => {
      const nanpCountries = CountryData.getNANPCountries();
      expect(nanpCountries.length).toBeGreaterThan(0);
      expect(nanpCountries.every((c) => c.dialCode === '+1')).toBe(true);
      expect(nanpCountries.some((c) => c.code === 'US')).toBe(true);
      expect(nanpCountries.some((c) => c.code === 'DO')).toBe(true);
      expect(nanpCountries.some((c) => c.code === 'CA')).toBe(true);
    });
  });

  describe('isNANPCountry', () => {
    it('should identify NANP countries correctly', () => {
      expect(CountryData.isNANPCountry('US')).toBe(true);
      expect(CountryData.isNANPCountry('DO')).toBe(true);
      expect(CountryData.isNANPCountry('CA')).toBe(true);
      expect(CountryData.isNANPCountry('DE')).toBe(false);
      expect(CountryData.isNANPCountry('ES')).toBe(false);
    });
  });

  describe('detectCountryFromBrowser', () => {
    it('should detect country from navigator.language', () => {
      // Mock window to exist
      global.window = {
        localStorage: localStorageMock,
        navigator: { language: 'en-US', languages: ['en-US'] }
      };
      global.navigator = { language: 'en-US', languages: ['en-US'] };

      const country = CountryData.detectCountryFromBrowser();
      expect(country?.code).toBe('US');
    });

    it('should try navigator.languages if primary language fails', () => {
      // Mock window to exist
      global.window = {
        localStorage: localStorageMock,
        navigator: { language: 'en', languages: ['en', 'es-DO'] }
      };
      global.navigator = { language: 'en', languages: ['en', 'es-DO'] };

      const country = CountryData.detectCountryFromBrowser();
      expect(country?.code).toBe('DO');
    });

    it('should return undefined if no valid locale found', () => {
      // Mock window to exist
      global.window = {
        localStorage: localStorageMock,
        navigator: { language: 'en', languages: ['en', 'fr'] }
      };
      global.navigator = { language: 'en', languages: ['en', 'fr'] };

      const country = CountryData.detectCountryFromBrowser();
      expect(country).toBeUndefined();
    });

    it('should return undefined in server-side rendering', () => {
      // Temporarily remove window
      const originalWindow = global.window;
      delete global.window;

      const country = CountryData.detectCountryFromBrowser();
      expect(country).toBeUndefined();

      // Restore window
      global.window = originalWindow;
    });
  });

  describe('localStorage integration', () => {
    it('should get preferred country from localStorage', () => {
      // Ensure window and localStorage exist
      global.window = {
        localStorage: localStorageMock,
        navigator: navigatorMock
      };
      global.localStorage = localStorageMock;

      localStorageMock.getItem.mockReturnValue('"US"');
      const country = CountryData.getPreferredCountry();
      expect(country?.code).toBe('US');
      expect(localStorageMock.getItem).toHaveBeenCalledWith(
        'preferred-country'
      );
    });

    it('should set preferred country in localStorage', () => {
      // Ensure window and localStorage exist
      global.window = {
        localStorage: localStorageMock,
        navigator: navigatorMock
      };
      global.localStorage = localStorageMock;

      const usCountry = CountryData.getCountryByCode('US')!;
      CountryData.setPreferredCountry(usCountry);
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'preferred-country',
        '"US"'
      );
    });

    it('should clear preferred country from localStorage', () => {
      // Ensure window and localStorage exist
      global.window = {
        localStorage: localStorageMock,
        navigator: navigatorMock
      };
      global.localStorage = localStorageMock;

      CountryData.clearPreferredCountry();
      expect(localStorageMock.removeItem).toHaveBeenCalledWith(
        'preferred-country'
      );
    });

    it('should handle localStorage errors gracefully', () => {
      // Ensure window and localStorage exist
      global.window = {
        localStorage: localStorageMock,
        navigator: navigatorMock
      };
      global.localStorage = localStorageMock;

      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('localStorage error');
      });
      const country = CountryData.getPreferredCountry();
      expect(country).toBeUndefined();
    });

    it('should return undefined in server-side rendering', () => {
      // Temporarily remove window
      const originalWindow = global.window;
      delete global.window;

      const country = CountryData.getPreferredCountry();
      expect(country).toBeUndefined();

      // Restore window
      global.window = originalWindow;
    });
  });

  describe('detectBestCountry', () => {
    it('should prefer localStorage over browser detection', () => {
      // Ensure window and localStorage exist
      global.window = {
        localStorage: localStorageMock,
        navigator: { language: 'en-US', languages: ['en-US'] }
      };
      global.localStorage = localStorageMock;
      global.navigator = { language: 'en-US', languages: ['en-US'] };

      localStorageMock.getItem.mockReturnValue('"DE"');
      const country = CountryData.detectBestCountry();
      expect(country.code).toBe('DE');
    });

    it('should use browser detection if no localStorage preference', () => {
      // Ensure window and localStorage exist
      global.window = {
        localStorage: localStorageMock,
        navigator: { language: 'es-DO', languages: ['es-DO'] }
      };
      global.localStorage = localStorageMock;
      global.navigator = { language: 'es-DO', languages: ['es-DO'] };

      localStorageMock.getItem.mockReturnValue(null);
      const country = CountryData.detectBestCountry();
      expect(country.code).toBe('DO');
    });

    it('should fallback to US if no detection works', () => {
      // Ensure window and localStorage exist
      global.window = {
        localStorage: localStorageMock,
        navigator: { language: 'en', languages: ['en'] }
      };
      global.localStorage = localStorageMock;
      global.navigator = { language: 'en', languages: ['en'] };

      localStorageMock.getItem.mockReturnValue(null);
      const country = CountryData.detectBestCountry();
      expect(country.code).toBe('US');
    });
  });

  describe('utility methods', () => {
    it('should group countries by region', () => {
      const regions = CountryData.getCountriesByRegion();
      expect(regions['North America (+1)']).toBeDefined();
      expect(regions['Europe']).toBeDefined();
      expect(regions['Latin America']).toBeDefined();
      expect(regions['Other']).toBeDefined();

      expect(regions['North America (+1)'].some((c) => c.code === 'US')).toBe(
        true
      );
      expect(regions['Europe'].some((c) => c.code === 'DE')).toBe(true);
      expect(regions['Latin America'].some((c) => c.code === 'MX')).toBe(true);
    });

    it('should validate country codes', () => {
      expect(CountryData.isValidCountryCode('US')).toBe(true);
      expect(CountryData.isValidCountryCode('DO')).toBe(true);
      expect(CountryData.isValidCountryCode('XX')).toBe(false);
    });

    it('should get formatting patterns', () => {
      expect(CountryData.getFormattingPattern('US')).toBe('(###) ###-####');
      expect(CountryData.getFormattingPattern('DE')).toBe('### ########');
    });

    it('should get all dial codes', () => {
      const dialCodes = CountryData.getAllDialCodes();
      expect(dialCodes).toContain('+1');
      expect(dialCodes).toContain('+49');
      expect(dialCodes).toContain('+34');
      expect(dialCodes.length).toBeGreaterThan(0);
    });

    it('should find countries with same dial code', () => {
      const nanpCountries = CountryData.getCountriesWithSameDialCode('+1');
      expect(nanpCountries.length).toBeGreaterThan(1);
      expect(nanpCountries.some((c) => c.code === 'US')).toBe(true);
      expect(nanpCountries.some((c) => c.code === 'DO')).toBe(true);
      expect(nanpCountries.some((c) => c.code === 'CA')).toBe(true);
    });
  });
});
