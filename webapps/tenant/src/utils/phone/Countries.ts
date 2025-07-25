import { CountryCode } from 'libphonenumber-js';

export interface Country {
  code: CountryCode;
  name: string;
  dialCode: string;
  flag: string;
  format: string;
  maxLength: number;
  priority?: number;
}

export const COUNTRIES: Country[] = [
  // Priority countries (most commonly used)
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
  },

  // Additional countries (alphabetical order)
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

export class CountryData {
  static getAllCountries(): Country[] {
    return COUNTRIES.sort((a, b) => {
      if (a.priority && b.priority) {
        return a.priority - b.priority;
      }
      if (a.priority && !b.priority) return -1;
      if (!a.priority && b.priority) return 1;
      return a.name.localeCompare(b.name);
    });
  }

  static getCountryByCode(code: CountryCode): Country | undefined {
    return COUNTRIES.find((country) => country.code === code);
  }

  static getCountryByDialCode(dialCode: string): Country | undefined {
    return COUNTRIES.find((country) => country.dialCode === dialCode);
  }

  static searchCountries(query: string): Country[] {
    if (!query) return this.getAllCountries();

    const searchTerm = query.toLowerCase();
    return COUNTRIES.filter(
      (country) =>
        country.name.toLowerCase().includes(searchTerm) ||
        country.code.toLowerCase().includes(searchTerm) ||
        country.dialCode.includes(searchTerm)
    );
  }

  static detectCountryFromLocale(locale: string): Country | undefined {
    if (!locale) return undefined;

    const parts = locale.split('-');
    if (parts.length < 2) return undefined;

    const countryCode = parts[1].toUpperCase() as CountryCode;
    return this.getCountryByCode(countryCode);
  }

  /**
   * Detects country from browser locale using navigator.language
   */
  static detectCountryFromBrowser(): Country | undefined {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
      return undefined; // Server-side rendering
    }

    // Try primary language first
    const primaryLocale = navigator.language;
    let country = this.detectCountryFromLocale(primaryLocale);

    if (country) return country;

    // Try other languages if available
    if (navigator.languages) {
      for (const locale of navigator.languages) {
        country = this.detectCountryFromLocale(locale);
        if (country) return country;
      }
    }

    return undefined;
  }

  /**
   * Gets the preferred country from localStorage
   */
  static getPreferredCountry(): Country | undefined {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return undefined; // Server-side rendering
    }

    try {
      const stored = localStorage.getItem('preferred-country');
      if (stored) {
        const countryCode = JSON.parse(stored) as CountryCode;
        return this.getCountryByCode(countryCode);
      }
    } catch (error) {
      console.warn(
        'Failed to read preferred country from localStorage:',
        error
      );
    }

    return undefined;
  }

  /**
   * Sets the preferred country in localStorage
   */
  static setPreferredCountry(country: Country): void {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return; // Server-side rendering
    }

    try {
      localStorage.setItem('preferred-country', JSON.stringify(country.code));
    } catch (error) {
      console.warn('Failed to save preferred country to localStorage:', error);
    }
  }

  /**
   * Detects the best country to use based on preferences and browser locale
   * Priority: 1. localStorage preference, 2. browser locale, 3. default (US)
   */
  static detectBestCountry(): Country {
    // 1. Check localStorage for previous selection
    const preferred = this.getPreferredCountry();
    if (preferred) return preferred;

    // 2. Detect from browser locale
    const browserCountry = this.detectCountryFromBrowser();
    if (browserCountry) return browserCountry;

    // 3. Default fallback to US
    return this.getCountryByCode('US') || this.getAllCountries()[0];
  }

  /**
   * Clears the preferred country from localStorage
   */
  static clearPreferredCountry(): void {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return; // Server-side rendering
    }

    try {
      localStorage.removeItem('preferred-country');
    } catch (error) {
      console.warn(
        'Failed to clear preferred country from localStorage:',
        error
      );
    }
  }

  static getPopularCountries(): Country[] {
    return COUNTRIES.filter((country) => country.priority).sort(
      (a, b) => (a.priority || 0) - (b.priority || 0)
    );
  }

  static getPlaceholderForCountry(country: Country): string {
    return country.format.replace(/#/g, '0');
  }

  static getNANPCountries(): Country[] {
    return COUNTRIES.filter((country) => country.dialCode === '+1');
  }

  static isNANPCountry(countryCode: CountryCode): boolean {
    const country = this.getCountryByCode(countryCode);
    return country?.dialCode === '+1';
  }

  /**
   * Gets countries grouped by region/dial code
   */
  static getCountriesByRegion(): Record<string, Country[]> {
    const regions: Record<string, Country[]> = {
      'North America (+1)': [],
      Europe: [],
      'Latin America': [],
      Other: []
    };

    COUNTRIES.forEach((country) => {
      if (country.dialCode === '+1') {
        regions['North America (+1)'].push(country);
      } else if (['DE', 'FR', 'GB', 'IT', 'ES'].includes(country.code)) {
        regions['Europe'].push(country);
      } else if (
        [
          'AR',
          'BR',
          'CL',
          'CO',
          'CR',
          'EC',
          'GT',
          'HN',
          'MX',
          'NI',
          'PA',
          'PE',
          'PY',
          'SV',
          'UY',
          'VE'
        ].includes(country.code)
      ) {
        regions['Latin America'].push(country);
      } else {
        regions['Other'].push(country);
      }
    });

    // Sort countries within each region
    Object.keys(regions).forEach((region) => {
      regions[region].sort((a, b) => a.name.localeCompare(b.name));
    });

    return regions;
  }

  /**
   * Validates if a country code exists in our data
   */
  static isValidCountryCode(code: string): code is CountryCode {
    return COUNTRIES.some((country) => country.code === code);
  }

  /**
   * Gets formatting pattern for a country
   */
  static getFormattingPattern(countryCode: CountryCode): string {
    const country = this.getCountryByCode(countryCode);
    return country?.format || '###########';
  }

  /**
   * Gets all unique dial codes
   */
  static getAllDialCodes(): string[] {
    const dialCodes = new Set(COUNTRIES.map((country) => country.dialCode));
    return Array.from(dialCodes).sort();
  }

  /**
   * Finds countries that share the same dial code
   */
  static getCountriesWithSameDialCode(dialCode: string): Country[] {
    return COUNTRIES.filter((country) => country.dialCode === dialCode);
  }
}
