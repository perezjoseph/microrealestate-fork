import { CountryCode } from 'libphonenumber-js';
import { Country } from './Countries';

// Core countries that are always loaded (most commonly used)
export const CORE_COUNTRIES: Country[] = [
    {
        code: 'US',
        name: 'United States',
        dialCode: '+1',
        flag: '🇺🇸',
        format: '(###) ###-####',
        maxLength: 10,
        priority: 1
    },
    {
        code: 'DO',
        name: 'Dominican Republic',
        dialCode: '+1',
        flag: '🇩🇴',
        format: '(###) ###-####',
        maxLength: 10,
        priority: 2
    },
    {
        code: 'CA',
        name: 'Canada',
        dialCode: '+1',
        flag: '🇨🇦',
        format: '(###) ###-####',
        maxLength: 10,
        priority: 3
    },
    {
        code: 'MX',
        name: 'Mexico',
        dialCode: '+52',
        flag: '🇲🇽',
        format: '## #### ####',
        maxLength: 10,
        priority: 4
    },
    {
        code: 'ES',
        name: 'Spain',
        dialCode: '+34',
        flag: '🇪🇸',
        format: '### ### ###',
        maxLength: 9,
        priority: 5
    }
];

// Lazy-loaded additional countries
let additionalCountries: Country[] | null = null;
let loadingPromise: Promise<Country[]> | null = null;

const ADDITIONAL_COUNTRIES: Country[] = [
    {
        code: 'AR',
        name: 'Argentina',
        dialCode: '+54',
        flag: '🇦🇷',
        format: '## #### ####',
        maxLength: 10
    },
    {
        code: 'AU',
        name: 'Australia',
        dialCode: '+61',
        flag: '🇦🇺',
        format: '### ### ###',
        maxLength: 9
    },
    {
        code: 'BR',
        name: 'Brazil',
        dialCode: '+55',
        flag: '🇧🇷',
        format: '(##) #####-####',
        maxLength: 11
    },
    {
        code: 'CL',
        name: 'Chile',
        dialCode: '+56',
        flag: '🇨🇱',
        format: '# #### ####',
        maxLength: 9
    },
    {
        code: 'CO',
        name: 'Colombia',
        dialCode: '+57',
        flag: '🇨🇴',
        format: '### ### ####',
        maxLength: 10
    },
    {
        code: 'CR',
        name: 'Costa Rica',
        dialCode: '+506',
        flag: '🇨🇷',
        format: '#### ####',
        maxLength: 8
    },
    {
        code: 'DE',
        name: 'Germany',
        dialCode: '+49',
        flag: '🇩🇪',
        format: '### ########',
        maxLength: 12
    },
    {
        code: 'EC',
        name: 'Ecuador',
        dialCode: '+593',
        flag: '🇪🇨',
        format: '## ### ####',
        maxLength: 9
    },
    {
        code: 'FR',
        name: 'France',
        dialCode: '+33',
        flag: '🇫🇷',
        format: '## ## ## ## ##',
        maxLength: 10
    },
    {
        code: 'GB',
        name: 'United Kingdom',
        dialCode: '+44',
        flag: '🇬🇧',
        format: '#### ### ####',
        maxLength: 11
    },
    {
        code: 'GT',
        name: 'Guatemala',
        dialCode: '+502',
        flag: '🇬🇹',
        format: '#### ####',
        maxLength: 8
    },
    {
        code: 'HN',
        name: 'Honduras',
        dialCode: '+504',
        flag: '🇭🇳',
        format: '#### ####',
        maxLength: 8
    },
    {
        code: 'IT',
        name: 'Italy',
        dialCode: '+39',
        flag: '🇮🇹',
        format: '### ### ####',
        maxLength: 10
    },
    {
        code: 'JM',
        name: 'Jamaica',
        dialCode: '+1',
        flag: '🇯🇲',
        format: '(###) ###-####',
        maxLength: 10
    },
    {
        code: 'NI',
        name: 'Nicaragua',
        dialCode: '+505',
        flag: '🇳🇮',
        format: '#### ####',
        maxLength: 8
    },
    {
        code: 'PA',
        name: 'Panama',
        dialCode: '+507',
        flag: '🇵🇦',
        format: '#### ####',
        maxLength: 8
    },
    {
        code: 'PE',
        name: 'Peru',
        dialCode: '+51',
        flag: '🇵🇪',
        format: '### ### ###',
        maxLength: 9
    },
    {
        code: 'PR',
        name: 'Puerto Rico',
        dialCode: '+1',
        flag: '🇵🇷',
        format: '(###) ###-####',
        maxLength: 10
    },
    {
        code: 'PY',
        name: 'Paraguay',
        dialCode: '+595',
        flag: '🇵🇾',
        format: '### ### ###',
        maxLength: 9
    },
    {
        code: 'SV',
        name: 'El Salvador',
        dialCode: '+503',
        flag: '🇸🇻',
        format: '#### ####',
        maxLength: 8
    },
    {
        code: 'UY',
        name: 'Uruguay',
        dialCode: '+598',
        flag: '🇺🇾',
        format: '#### ####',
        maxLength: 8
    },
    {
        code: 'VE',
        name: 'Venezuela',
        dialCode: '+58',
        flag: '🇻🇪',
        format: '###-#######',
        maxLength: 10
    }
];

/**
 * Lazy loads additional countries
 */
export const loadAdditionalCountries = async (): Promise<Country[]> => {
    if (additionalCountries) {
        return additionalCountries;
    }

    if (loadingPromise) {
        return loadingPromise;
    }

    loadingPromise = new Promise((resolve) => {
        // Simulate async loading with a small delay to allow for code splitting
        setTimeout(() => {
            additionalCountries = ADDITIONAL_COUNTRIES;
            resolve(additionalCountries);
        }, 0);
    });

    return loadingPromise;
};

/**
 * Gets all countries, loading additional ones if needed
 */
export const getAllCountriesLazy = async (): Promise<Country[]> => {
    const additional = await loadAdditionalCountries();
    return [...CORE_COUNTRIES, ...additional].sort((a, b) => {
        if (a.priority && b.priority) {
            return a.priority - b.priority;
        }
        if (a.priority && !b.priority) return -1;
        if (!a.priority && b.priority) return 1;
        return a.name.localeCompare(b.name);
    });
};

/**
 * Gets core countries immediately (no async loading)
 */
export const getCoreCountries = (): Country[] => {
    return CORE_COUNTRIES.sort((a, b) => {
        if (a.priority && b.priority) {
            return a.priority - b.priority;
        }
        if (a.priority && !b.priority) return -1;
        if (!a.priority && b.priority) return 1;
        return a.name.localeCompare(b.name);
    });
};

/**
 * Searches countries, loading additional ones if needed for comprehensive search
 */
export const searchCountriesLazy = async (query: string): Promise<Country[]> => {
    if (!query) return getCoreCountries();

    const searchTerm = query.toLowerCase();

    // First search in core countries
    const coreResults = CORE_COUNTRIES.filter(
        (country) =>
            country.name.toLowerCase().includes(searchTerm) ||
            country.code.toLowerCase().includes(searchTerm) ||
            country.dialCode.includes(searchTerm)
    );

    // If we have good results from core countries, return them
    if (coreResults.length >= 3) {
        return coreResults;
    }

    // Otherwise, load additional countries and search there too
    const additional = await loadAdditionalCountries();
    const additionalResults = additional.filter(
        (country) =>
            country.name.toLowerCase().includes(searchTerm) ||
            country.code.toLowerCase().includes(searchTerm) ||
            country.dialCode.includes(searchTerm)
    );

    return [...coreResults, ...additionalResults];
};

/**
 * Gets a country by code, checking core countries first
 */
export const getCountryByCodeLazy = async (code: CountryCode): Promise<Country | undefined> => {
    // Check core countries first
    const coreCountry = CORE_COUNTRIES.find((country) => country.code === code);
    if (coreCountry) return coreCountry;

    // Load additional countries if needed
    const additional = await loadAdditionalCountries();
    return additional.find((country) => country.code === code);
};

/**
 * Gets a country by code synchronously from core countries only
 */
export const getCoreCountryByCode = (code: CountryCode): Country | undefined => {
    return CORE_COUNTRIES.find((country) => country.code === code);
};

/**
 * Preloads additional countries in the background
 */
export const preloadAdditionalCountries = (): void => {
    if (!additionalCountries && !loadingPromise) {
        loadAdditionalCountries().catch(() => {
            // Ignore errors in background preloading
        });
    }
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
        return CORE_COUNTRIES.filter((country) => country.priority).sort(
            (a, b) => (a.priority || 0) - (b.priority || 0)
        );
    }

    /**
     * Preloads additional countries in background
     */
    static preload(): void {
        preloadAdditionalCountries();
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