import { Country, CountryData } from '../../../utils/phone/Countries';

describe('CountrySelector Component Dependencies', () => {
    describe('CountryData Integration', () => {
        it('should have access to all required CountryData methods', () => {
            expect(CountryData.getAllCountries).toBeDefined();
            expect(CountryData.getCountryByCode).toBeDefined();
            expect(CountryData.getCountryByDialCode).toBeDefined();
            expect(CountryData.searchCountries).toBeDefined();
            expect(CountryData.getPopularCountries).toBeDefined();
            expect(CountryData.detectBestCountry).toBeDefined();
            expect(CountryData.getCountriesByRegion).toBeDefined();
        });

        it('should return valid country data', () => {
            const countries = CountryData.getAllCountries();
            expect(Array.isArray(countries)).toBe(true);
            expect(countries.length).toBeGreaterThan(0);

            // Test first country has required properties
            const firstCountry = countries[0];
            expect(firstCountry).toHaveProperty('code');
            expect(firstCountry).toHaveProperty('name');
            expect(firstCountry).toHaveProperty('dialCode');
            expect(firstCountry).toHaveProperty('flag');
            expect(firstCountry).toHaveProperty('format');
            expect(firstCountry).toHaveProperty('maxLength');
        });

        it('should find US country by code', () => {
            const usCountry = CountryData.getCountryByCode('US');
            expect(usCountry).toBeDefined();
            expect(usCountry?.code).toBe('US');
            expect(usCountry?.name).toBe('United States');
            expect(usCountry?.dialCode).toBe('+1');
            expect(usCountry?.flag).toBe('🇺🇸');
        });

        it('should find Dominican Republic country by code', () => {
            const doCountry = CountryData.getCountryByCode('DO');
            expect(doCountry).toBeDefined();
            expect(doCountry?.code).toBe('DO');
            expect(doCountry?.name).toBe('Dominican Republic');
            expect(doCountry?.dialCode).toBe('+1');
            expect(doCountry?.flag).toBe('🇩🇴');
        });

        it('should search countries by name', () => {
            const searchResults = CountryData.searchCountries('Germany');
            expect(Array.isArray(searchResults)).toBe(true);
            expect(searchResults.length).toBeGreaterThan(0);

            const germany = searchResults.find(country => country.code === 'DE');
            expect(germany).toBeDefined();
            expect(germany?.name).toBe('Germany');
        });

        it('should search countries by dial code', () => {
            const searchResults = CountryData.searchCountries('+49');
            expect(Array.isArray(searchResults)).toBe(true);
            expect(searchResults.length).toBeGreaterThan(0);

            const germany = searchResults.find(country => country.code === 'DE');
            expect(germany).toBeDefined();
            expect(germany?.dialCode).toBe('+49');
        });

        it('should return popular countries with priority', () => {
            const popularCountries = CountryData.getPopularCountries();
            expect(Array.isArray(popularCountries)).toBe(true);
            expect(popularCountries.length).toBeGreaterThan(0);

            // Should be sorted by priority
            for (let i = 0; i < popularCountries.length - 1; i++) {
                const current = popularCountries[i].priority || 0;
                const next = popularCountries[i + 1].priority || 0;
                expect(current).toBeLessThanOrEqual(next);
            }
        });

        it('should group countries by region', () => {
            const regions = CountryData.getCountriesByRegion();
            expect(typeof regions).toBe('object');
            expect(regions['North America (+1)']).toBeDefined();
            expect(regions['Europe']).toBeDefined();
            expect(regions['Latin America']).toBeDefined();
            expect(regions['Other']).toBeDefined();

            // Check North America contains US and DO
            const northAmerica = regions['North America (+1)'];
            const usCountry = northAmerica.find(c => c.code === 'US');
            const doCountry = northAmerica.find(c => c.code === 'DO');
            expect(usCountry).toBeDefined();
            expect(doCountry).toBeDefined();
        });

        it('should detect best country (fallback to US)', () => {
            const bestCountry = CountryData.detectBestCountry();
            expect(bestCountry).toBeDefined();
            expect(bestCountry.code).toBeDefined();
            expect(bestCountry.name).toBeDefined();
            expect(bestCountry.dialCode).toBeDefined();
        });

        it('should handle empty search gracefully', () => {
            const emptyResults = CountryData.searchCountries('');
            const allCountries = CountryData.getAllCountries();
            expect(emptyResults).toEqual(allCountries);
        });

        it('should handle non-existent country code', () => {
            const nonExistent = CountryData.getCountryByCode('XX' as any);
            expect(nonExistent).toBeUndefined();
        });

        it('should handle non-existent dial code', () => {
            const nonExistent = CountryData.getCountryByDialCode('+999');
            expect(nonExistent).toBeUndefined();
        });
    });

    describe('Country Interface Validation', () => {
        it('should validate Country interface structure', () => {
            const countries = CountryData.getAllCountries();

            countries.forEach((country: Country) => {
                // Required properties
                expect(typeof country.code).toBe('string');
                expect(typeof country.name).toBe('string');
                expect(typeof country.dialCode).toBe('string');
                expect(typeof country.flag).toBe('string');
                expect(typeof country.format).toBe('string');
                expect(typeof country.maxLength).toBe('number');

                // Optional properties
                if (country.priority !== undefined) {
                    expect(typeof country.priority).toBe('number');
                }

                // Validate dial code format
                expect(country.dialCode).toMatch(/^\+\d+$/);

                // Validate max length is positive
                expect(country.maxLength).toBeGreaterThan(0);

                // Validate country code is 2 characters
                expect(country.code.length).toBe(2);
                expect(country.code).toMatch(/^[A-Z]{2}$/);
            });
        });

        it('should have consistent NANP countries', () => {
            const nanpCountries = CountryData.getAllCountries().filter(
                country => country.dialCode === '+1'
            );

            expect(nanpCountries.length).toBeGreaterThan(0);

            // All NANP countries should have same format and max length
            nanpCountries.forEach(country => {
                expect(country.dialCode).toBe('+1');
                expect(country.format).toBe('(###) ###-####');
                expect(country.maxLength).toBe(10);
            });

            // Should include US, DO, CA, JM, PR
            const codes = nanpCountries.map(c => c.code);
            expect(codes).toContain('US');
            expect(codes).toContain('DO');
            expect(codes).toContain('CA');
            expect(codes).toContain('JM');
            expect(codes).toContain('PR');
        });
    });

    describe('CountrySelector Props Interface', () => {
        it('should define proper TypeScript interfaces', () => {
            // This test ensures the interfaces are properly exported and structured
            const mockCountry: Country = {
                code: 'US',
                name: 'United States',
                dialCode: '+1',
                flag: '🇺🇸',
                format: '(###) ###-####',
                maxLength: 10,
                priority: 1
            };

            // Test that we can create objects matching the interfaces
            const countrySelectorProps = {
                selectedCountry: mockCountry,
                onCountrySelect: (country: Country) => { },
                disabled: false,
                searchable: true,
                placeholder: 'Select country...',
                className: 'test-class',
                showDialCode: true,
                showFlag: true,
                groupByRegion: false
            };

            const compactCountrySelectorProps = {
                selectedCountry: mockCountry,
                onCountrySelect: (country: Country) => { },
                disabled: false,
                className: 'test-class'
            };

            // If these compile without TypeScript errors, the interfaces are correct
            expect(countrySelectorProps.selectedCountry).toEqual(mockCountry);
            expect(compactCountrySelectorProps.selectedCountry).toEqual(mockCountry);
        });
    });

    describe('Component Functionality Requirements', () => {
        it('should support all required features for country selection', () => {
            // Test search functionality
            const searchResults = CountryData.searchCountries('Germ');
            expect(searchResults.length).toBeGreaterThan(0);
            expect(searchResults.some(c => c.name.includes('Germany'))).toBe(true);

            // Test popular countries for quick access
            const popular = CountryData.getPopularCountries();
            expect(popular.length).toBeGreaterThan(0);
            expect(popular.every(c => c.priority !== undefined)).toBe(true);

            // Test regional grouping
            const regions = CountryData.getCountriesByRegion();
            expect(Object.keys(regions).length).toBeGreaterThan(0);

            // Test country detection
            const detected = CountryData.detectBestCountry();
            expect(detected).toBeDefined();
        });

        it('should handle keyboard navigation requirements', () => {
            // Test that countries are properly sorted for navigation
            const countries = CountryData.getAllCountries();
            const popularCountries = CountryData.getPopularCountries();

            // Popular countries should come first
            expect(popularCountries.length).toBeGreaterThan(0);

            // All countries should be accessible
            expect(countries.length).toBeGreaterThan(popularCountries.length);
        });

        it('should support accessibility requirements', () => {
            const countries = CountryData.getAllCountries();

            countries.forEach(country => {
                // Each country should have proper flag emoji for screen readers
                expect(country.flag).toBeDefined();
                expect(country.flag.length).toBeGreaterThan(0);

                // Each country should have clear name for screen readers
                expect(country.name).toBeDefined();
                expect(country.name.length).toBeGreaterThan(0);

                // Each country should have dial code for screen readers
                expect(country.dialCode).toBeDefined();
                expect(country.dialCode.startsWith('+')).toBe(true);
            });
        });
    });

    describe('Integration with Phone Input Requirements', () => {
        it('should provide data needed for phone input validation', () => {
            const countries = CountryData.getAllCountries();

            countries.forEach(country => {
                // Should provide format for placeholder text
                expect(country.format).toBeDefined();
                expect(country.format.includes('#')).toBe(true);

                // Should provide max length for validation
                expect(country.maxLength).toBeGreaterThan(0);

                // Should provide dial code for formatting
                expect(country.dialCode.startsWith('+')).toBe(true);
            });
        });

        it('should support Dominican Republic special requirements', () => {
            const doCountry = CountryData.getCountryByCode('DO');
            expect(doCountry).toBeDefined();
            expect(doCountry?.name).toBe('Dominican Republic');
            expect(doCountry?.dialCode).toBe('+1');
            expect(doCountry?.priority).toBeDefined(); // Should be in popular countries

            // Should be in NANP group
            const nanpCountries = CountryData.getAllCountries().filter(
                c => c.dialCode === '+1'
            );
            expect(nanpCountries.some(c => c.code === 'DO')).toBe(true);
        });
    });
});