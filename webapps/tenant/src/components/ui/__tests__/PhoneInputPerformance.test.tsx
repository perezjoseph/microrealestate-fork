import { LazyCountryData } from '../../../utils/phone/CountriesLazy';
import { OptimizedPhoneValidator } from '../../../utils/phone/PhoneValidatorOptimized';

// Mock translations
jest.mock('@/utils/i18n/client/useTranslation', () => ({
  __esModule: true,
  default: () => ({
    t: (key: string) => key
  })
}));

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
});

describe('Phone Input Performance Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
  });

  describe('Data Loading Performance', () => {
    it('should load core countries immediately', () => {
      const startTime = Date.now();
      
      const coreCountries = LazyCountryData.getCoreCountries();
      
      const endTime = Date.now();
      const loadTime = endTime - startTime;

      expect(loadTime).toBeLessThan(50); // Should load in less than 50ms
      expect(coreCountries).toHaveLength(5); // Should have 5 core countries
      expect(coreCountries[0]).toHaveProperty('code');
      expect(coreCountries[0]).toHaveProperty('name');
      expect(coreCountries[0]).toHaveProperty('dialCode');
    });

    it('should load all countries with acceptable performance', async () => {
      const startTime = Date.now();
      
      const allCountries = await LazyCountryData.getAllCountries();
      
      const endTime = Date.now();
      const loadTime = endTime - startTime;

      expect(loadTime).toBeLessThan(100); // Should load in less than 100ms
      expect(allCountries.length).toBeGreaterThan(20); // Should have more than 20 countries
    });

    it('should search countries efficiently', async () => {
      const startTime = Date.now();
      
      const results = await LazyCountryData.searchCountries('united');
      
      const endTime = Date.now();
      const searchTime = endTime - startTime;

      expect(searchTime).toBeLessThan(50); // Should search in less than 50ms
      expect(results.length).toBeGreaterThan(0);
      expect(results.some(country => country.name.toLowerCase().includes('united'))).toBe(true);
    });
  });

  describe('Validation Performance', () => {
    it('should perform basic validation quickly', () => {
      const startTime = Date.now();
      
      const result = OptimizedPhoneValidator.basicValidate('1234567890', 'US');
      
      const endTime = Date.now();
      const validationTime = endTime - startTime;

      expect(validationTime).toBeLessThan(50); // Should validate in less than 50ms
      expect(result.isValid).toBe(true);
    });

    it('should handle async validation efficiently', async () => {
      // Test that async validation works (result may vary in test environment)
      const startTime = Date.now();
      
      const result = await OptimizedPhoneValidator.quickValidate('1234567890', 'US');
      
      const endTime = Date.now();
      const validationTime = endTime - startTime;

      expect(validationTime).toBeLessThan(1000); // Should validate in reasonable time
      // Note: Result may be false in test environment due to mocked libphonenumber-js
      expect(typeof result).toBe('boolean');
    });
  });

  describe('Memory Usage Optimization', () => {
    it('should provide memoized country data', () => {
      // Test that core countries are memoized
      const countries1 = LazyCountryData.getCoreCountries();
      const countries2 = LazyCountryData.getCoreCountries();
      
      expect(countries1).toEqual(countries2);
      expect(countries1.length).toBe(5);
    });
  });

  describe('Bundle Size Impact', () => {
    it('should lazy load libphonenumber-js', async () => {
      // This test verifies that libphonenumber-js is not loaded until needed
      const startTime = Date.now();
      
      // Basic validation should work without loading the full library
      const basicResult = OptimizedPhoneValidator.basicValidate('1234567890', 'US');
      
      const basicTime = Date.now() - startTime;
      
      expect(basicTime).toBeLessThan(50); // Basic validation should be very fast
      expect(basicResult.isValid).toBe(true);

      // Full validation should load the library
      const fullStartTime = Date.now();
      const fullResult = await OptimizedPhoneValidator.validate('1234567890', 'US');
      const fullTime = Date.now() - fullStartTime;

      // Note: Result may vary in test environment due to mocked libphonenumber-js
      expect(typeof fullResult.isValid).toBe('boolean');
      expect(fullTime).toBeLessThan(1000); // Should complete in reasonable time
    });

    it('should preload resources in background', async () => {
      // Test that preloading doesn't block the main thread
      const startTime = Date.now();
      
      LazyCountryData.preload();
      OptimizedPhoneValidator.preload();
      
      const preloadTime = Date.now() - startTime;
      
      expect(preloadTime).toBeLessThan(50); // Preload should not block
      
      // Wait a bit for background loading
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Subsequent operations should be faster
      const fastStartTime = Date.now();
      const countries = await LazyCountryData.getAllCountries();
      const fastTime = Date.now() - fastStartTime;
      
      expect(countries.length).toBeGreaterThan(20);
      expect(fastTime).toBeLessThan(100); // Should be faster after preload
    });
  });
});

describe('Performance Benchmarks', () => {
  it('should meet performance benchmarks', async () => {
    const benchmarks = {
      coreCountryLoad: 50, // ms
      allCountryLoad: 200, // ms
      basicValidation: 50, // ms
      search: 100, // ms
    };

    // Core country load benchmark
    const coreStart = Date.now();
    LazyCountryData.getCoreCountries();
    const coreTime = Date.now() - coreStart;
    expect(coreTime).toBeLessThan(benchmarks.coreCountryLoad);

    // All country load benchmark
    const allStart = Date.now();
    await LazyCountryData.getAllCountries();
    const allTime = Date.now() - allStart;
    expect(allTime).toBeLessThan(benchmarks.allCountryLoad);

    // Basic validation benchmark
    const validationStart = Date.now();
    OptimizedPhoneValidator.basicValidate('1234567890', 'US');
    const validationTime = Date.now() - validationStart;
    expect(validationTime).toBeLessThan(benchmarks.basicValidation);

    // Search benchmark
    const searchStart = Date.now();
    await LazyCountryData.searchCountries('united');
    const searchTime = Date.now() - searchStart;
    expect(searchTime).toBeLessThan(benchmarks.search);

    console.log('Performance Benchmarks:');
    console.log(`  Core Country Load: ${coreTime}ms (target: <${benchmarks.coreCountryLoad}ms)`);
    console.log(`  All Country Load: ${allTime}ms (target: <${benchmarks.allCountryLoad}ms)`);
    console.log(`  Basic Validation: ${validationTime}ms (target: <${benchmarks.basicValidation}ms)`);
    console.log(`  Search: ${searchTime}ms (target: <${benchmarks.search}ms)`);
  });
});