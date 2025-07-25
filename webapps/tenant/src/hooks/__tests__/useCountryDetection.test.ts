import { CountryData } from '../../utils/phone/Countries';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};

// Mock global objects for Node environment
global.localStorage = localStorageMock as any;
global.navigator = {
  language: 'en-US',
  languages: ['en-US', 'en']
} as any;

describe('CountryData utility functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  it('should get country by code', () => {
    const usCountry = CountryData.getCountryByCode('US');
    expect(usCountry?.code).toBe('US');
    expect(usCountry?.name).toBe('United States');
  });

  it('should get country by dial code', () => {
    const countries = CountryData.getCountriesWithSameDialCode('+1');
    expect(countries.length).toBeGreaterThan(0);
    expect(countries.some((c) => c.code === 'US')).toBe(true);
    expect(countries.some((c) => c.code === 'DO')).toBe(true);
  });

  it('should detect country from locale', () => {
    const country = CountryData.detectCountryFromLocale('en-US');
    expect(country?.code).toBe('US');
  });

  it('should detect country from browser', () => {
    const country = CountryData.detectCountryFromBrowser();
    expect(country?.code).toBe('US');
  });

  it('should handle invalid locale gracefully', () => {
    const country = CountryData.detectCountryFromLocale('invalid-locale');
    expect(country).toBeUndefined();
  });

  it('should search countries by name', () => {
    const results = CountryData.searchCountries('United');
    expect(results.length).toBeGreaterThan(0);
    expect(results.some((c) => c.name.includes('United'))).toBe(true);
  });

  it('should search countries by code', () => {
    const results = CountryData.searchCountries('US');
    expect(results.length).toBeGreaterThan(0);
    expect(results.some((c) => c.code === 'US')).toBe(true);
  });

  it('should get all countries sorted by priority', () => {
    const countries = CountryData.getAllCountries();
    expect(countries.length).toBeGreaterThan(0);

    // Check that priority countries come first
    const firstCountry = countries[0];
    expect(firstCountry.priority).toBeDefined();
  });

  it('should detect best country with localStorage preference', () => {
    localStorageMock.getItem.mockReturnValue(JSON.stringify('DO'));

    const country = CountryData.detectBestCountry();
    expect(country.code).toBe('DO');
  });

  it('should detect best country with browser fallback', () => {
    localStorageMock.getItem.mockReturnValue(null);

    const country = CountryData.detectBestCountry();
    expect(country.code).toBe('US'); // Based on mocked navigator.language
  });

  it('should set and get preferred country', () => {
    const doCountry = CountryData.getCountryByCode('DO')!;

    CountryData.setPreferredCountry(doCountry);
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'preferred-country',
      JSON.stringify('DO')
    );
  });

  it('should clear preferred country', () => {
    CountryData.clearPreferredCountry();
    expect(localStorageMock.removeItem).toHaveBeenCalledWith(
      'preferred-country'
    );
  });

  it('should handle localStorage errors gracefully', () => {
    localStorageMock.getItem.mockImplementation(() => {
      throw new Error('localStorage error');
    });

    const country = CountryData.getPreferredCountry();
    expect(country).toBeUndefined();
  });

  it('should get popular countries', () => {
    const popular = CountryData.getPopularCountries();
    expect(popular.length).toBeGreaterThan(0);
    expect(popular.every((c) => c.priority)).toBe(true);
  });

  it('should get placeholder for country', () => {
    const usCountry = CountryData.getCountryByCode('US')!;
    const placeholder = CountryData.getPlaceholderForCountry(usCountry);
    expect(placeholder).toBe('(000) 000-0000');
  });

  it('should identify NANP countries', () => {
    expect(CountryData.isNANPCountry('US')).toBe(true);
    expect(CountryData.isNANPCountry('DO')).toBe(true);
    expect(CountryData.isNANPCountry('DE')).toBe(false);
  });

  it('should get countries by region', () => {
    const regions = CountryData.getCountriesByRegion();
    expect(regions['North America (+1)']).toBeDefined();
    expect(regions['Europe']).toBeDefined();
    expect(regions['Latin America']).toBeDefined();
  });

  it('should validate country codes', () => {
    expect(CountryData.isValidCountryCode('US')).toBe(true);
    expect(CountryData.isValidCountryCode('INVALID')).toBe(false);
  });

  it('should get formatting pattern', () => {
    const pattern = CountryData.getFormattingPattern('US');
    expect(pattern).toBe('(###) ###-####');
  });

  it('should get all dial codes', () => {
    const dialCodes = CountryData.getAllDialCodes();
    expect(dialCodes).toContain('+1');
    expect(dialCodes).toContain('+49');
    expect(dialCodes.length).toBeGreaterThan(0);
  });
});
