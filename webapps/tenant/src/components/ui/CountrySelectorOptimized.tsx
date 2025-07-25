import React, { useState, useCallback, useMemo, memo, useEffect } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import { cn } from '@/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandList
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import { Country } from '../../utils/phone/Countries';
import { LazyCountryData } from '../../utils/phone/CountriesLazy';
import VirtualizedCountryList from './VirtualizedCountryList';
import useTranslation from '@/utils/i18n/client/useTranslation';

export interface OptimizedCountrySelectorProps {
  selectedCountry: Country;
  onCountrySelect: (country: Country) => void;
  disabled?: boolean;
  searchable?: boolean;
  placeholder?: string;
  className?: string;
  showDialCode?: boolean;
  showFlag?: boolean;
  useVirtualScrolling?: boolean;
  maxHeight?: number;
}

export const OptimizedCountrySelector: React.FC<OptimizedCountrySelectorProps> = memo(({
  selectedCountry,
  onCountrySelect,
  disabled = false,
  searchable = true,
  placeholder,
  className,
  showDialCode = true,
  showFlag = true,
  useVirtualScrolling = true,
  maxHeight = 300
}) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [countries, setCountries] = useState<Country[]>(() => LazyCountryData.getCoreCountries());
  const [isLoading, setIsLoading] = useState(false);

  // Load countries when dropdown opens
  useEffect(() => {
    if (open && countries.length <= 5) { // Only core countries loaded
      setIsLoading(true);
      LazyCountryData.getAllCountries()
        .then(setCountries)
        .finally(() => setIsLoading(false));
    }
  }, [open, countries.length]);

  // Handle search with lazy loading
  useEffect(() => {
    if (!searchValue) {
      // Reset to all countries when search is cleared
      if (countries.length > 5) {
        return; // Already have all countries
      }
      LazyCountryData.getAllCountries().then(setCountries);
      return;
    }

    const searchTimeout = setTimeout(async () => {
      setIsLoading(true);
      try {
        const results = await LazyCountryData.searchCountries(searchValue);
        setCountries(results);
      } finally {
        setIsLoading(false);
      }
    }, 150); // Debounce search

    return () => clearTimeout(searchTimeout);
  }, [searchValue, countries.length]);

  // Preload additional countries in background when component mounts
  useEffect(() => {
    LazyCountryData.preload();
  }, []);

  const handleCountrySelect = useCallback(
    (country: Country) => {
      onCountrySelect(country);
      setOpen(false);
      setSearchValue('');
    },
    [onCountrySelect]
  );

  const filteredCountries = useMemo(() => {
    if (!searchValue) return countries;
    
    const searchTerm = searchValue.toLowerCase();
    return countries.filter(
      (country) =>
        country.name.toLowerCase().includes(searchTerm) ||
        country.code.toLowerCase().includes(searchTerm) ||
        country.dialCode.includes(searchTerm)
    );
  }, [countries, searchValue]);

  const popularCountries = useMemo(() => 
    LazyCountryData.getPopularCountries(), 
    []
  );

  const renderCountryList = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">
          Loading countries...
        </div>
      );
    }

    if (filteredCountries.length === 0) {
      return <CommandEmpty>{t('No country found.')}</CommandEmpty>;
    }

    // Use virtual scrolling for large lists
    if (useVirtualScrolling && filteredCountries.length > 20) {
      return (
        <VirtualizedCountryList
          countries={filteredCountries}
          selectedCountry={selectedCountry}
          onCountrySelect={handleCountrySelect}
          showFlag={showFlag}
          showDialCode={showDialCode}
          maxHeight={maxHeight}
          searchValue={searchValue}
        />
      );
    }

    // Regular rendering for smaller lists
    const otherCountries = filteredCountries.filter(
      (country) => !popularCountries.some((p) => p.code === country.code)
    );

    return (
      <CommandList className={`max-h-[${maxHeight}px] overflow-auto`}>
        {!searchValue && popularCountries.length > 0 && (
          <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
            Popular
          </div>
        )}
        {(!searchValue ? popularCountries : []).map((country) => (
          <div
            key={country.code}
            className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-accent"
            onClick={() => handleCountrySelect(country)}
          >
            {showFlag && (
              <span
                className="text-lg"
                role="img"
                aria-label={`${country.name} flag`}
              >
                {country.flag}
              </span>
            )}
            <div className="flex-1 flex items-center justify-between">
              <span className="text-sm font-medium">{country.name}</span>
              {showDialCode && (
                <span className="text-sm text-muted-foreground ml-2">
                  {country.dialCode}
                </span>
              )}
            </div>
          </div>
        ))}
        
        {!searchValue && otherCountries.length > 0 && (
          <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground border-t">
            All Countries
          </div>
        )}
        {(searchValue ? filteredCountries : otherCountries).map((country) => (
          <div
            key={country.code}
            className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-accent"
            onClick={() => handleCountrySelect(country)}
          >
            {showFlag && (
              <span
                className="text-lg"
                role="img"
                aria-label={`${country.name} flag`}
              >
                {country.flag}
              </span>
            )}
            <div className="flex-1 flex items-center justify-between">
              <span className="text-sm font-medium">{country.name}</span>
              {showDialCode && (
                <span className="text-sm text-muted-foreground ml-2">
                  {country.dialCode}
                </span>
              )}
            </div>
          </div>
        ))}
      </CommandList>
    );
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label={t('Select country')}
          className={cn(
            'w-[200px] justify-between',
            !selectedCountry && 'text-muted-foreground',
            className
          )}
          disabled={disabled}
        >
          <div className="flex items-center gap-2">
            {showFlag && selectedCountry && (
              <span
                className="text-lg"
                role="img"
                aria-label={`${selectedCountry.name} flag`}
              >
                {selectedCountry.flag}
              </span>
            )}
            <span className="truncate">
              {selectedCountry ? selectedCountry.name : (placeholder || t('Select country'))}
            </span>
            {showDialCode && selectedCountry && (
              <span className="text-muted-foreground ml-auto">
                {selectedCountry.dialCode}
              </span>
            )}
          </div>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <Command>
          {searchable && (
            <div className="flex items-center border-b px-3">
              <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
              <CommandInput
                placeholder={t('Search countries...')}
                value={searchValue}
                onValueChange={setSearchValue}
                className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
          )}
          {renderCountryList()}
        </Command>
      </PopoverContent>
    </Popover>
  );
});

// Compact version with optimizations
export interface OptimizedCompactCountrySelectorProps {
  selectedCountry: Country;
  onCountrySelect: (country: Country) => void;
  disabled?: boolean;
  className?: string;
}

export const OptimizedCompactCountrySelector: React.FC<OptimizedCompactCountrySelectorProps> = memo(({
  selectedCountry,
  onCountrySelect,
  disabled = false,
  className
}) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  // Only load popular countries for compact selector
  const popularCountries = useMemo(() => LazyCountryData.getPopularCountries(), []);

  const handleCountrySelect = useCallback(
    (country: Country) => {
      onCountrySelect(country);
      setOpen(false);
    },
    [onCountrySelect]
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          role="combobox"
          aria-expanded={open}
          aria-label={`Selected country: ${selectedCountry.name}`}
          className={cn(
            'h-10 px-3 border-r-0 rounded-r-none border-input bg-background hover:bg-accent hover:text-accent-foreground',
            'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
            disabled && 'cursor-not-allowed opacity-50',
            className
          )}
          disabled={disabled}
        >
          <div className="flex items-center gap-1">
            <span
              className="text-base"
              role="img"
              aria-label={`${selectedCountry.name} flag`}
            >
              {selectedCountry.flag}
            </span>
            <span className="text-sm font-medium">
              {selectedCountry.dialCode}
            </span>
            <ChevronDown className="h-3 w-3 opacity-50" />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-0" align="start">
        <Command>
          <CommandInput placeholder={t('Search countries...')} />
          <CommandList className="max-h-[200px]">
            <CommandEmpty>{t('No country found.')}</CommandEmpty>
            <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
              Popular
            </div>
            {popularCountries.map((country) => (
              <div
                key={country.code}
                className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-accent"
                onClick={() => handleCountrySelect(country)}
              >
                <span
                  className="text-base"
                  role="img"
                  aria-label={`${country.name} flag`}
                >
                  {country.flag}
                </span>
                <div className="flex-1 flex items-center justify-between">
                  <span className="text-sm">{country.name}</span>
                  <span className="text-sm text-muted-foreground">
                    {country.dialCode}
                  </span>
                </div>
              </div>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
});

export default OptimizedCountrySelector;