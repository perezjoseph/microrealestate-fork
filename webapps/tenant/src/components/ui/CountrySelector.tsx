import React, { useState, useCallback, useMemo, memo, useEffect } from 'react';
import { Check, ChevronDown, Search } from 'lucide-react';
import { cn } from '@/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
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

export interface CountrySelectorProps {
  selectedCountry: Country;
  onCountrySelect: (country: Country) => void;
  disabled?: boolean;
  searchable?: boolean;
  placeholder?: string;
  className?: string;
  showDialCode?: boolean;
  showFlag?: boolean;
  groupByRegion?: boolean;
}

export const CountrySelector: React.FC<CountrySelectorProps> = memo(({
  selectedCountry,
  onCountrySelect,
  disabled = false,
  searchable = true,
  placeholder,
  className,
  showDialCode = true,
  showFlag = true,
  groupByRegion = false
}) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [countries, setCountries] = useState<Country[]>(() => LazyCountryData.getCoreCountries());
  const [isLoading, setIsLoading] = useState(false);

  // Load all countries when dropdown opens
  useEffect(() => {
    if (open && countries.length <= 5) { // Only core countries loaded
      setIsLoading(true);
      LazyCountryData.getAllCountries()
        .then(setCountries)
        .finally(() => setIsLoading(false));
    }
  }, [open, countries.length]);

  // Preload countries in background
  useEffect(() => {
    LazyCountryData.preload();
  }, []);

  // Memoize filtered countries with debounced search
  const filteredCountries = useMemo(() => {
    if (!searchValue) return countries;
    
    const searchTerm = searchValue.toLowerCase();
    return countries.filter(
      (country) =>
        country.name.toLowerCase().includes(searchTerm) ||
        country.code.toLowerCase().includes(searchTerm) ||
        country.dialCode.includes(searchTerm)
    );
  }, [searchValue, countries]);

  const handleCountrySelect = useCallback(
    (country: Country) => {
      onCountrySelect(country);
      setOpen(false);
      setSearchValue('');
    },
    [onCountrySelect]
  );

  const renderCountryItem = useCallback((country: Country) => (
    <CommandItem
      key={country.code}
      value={`${country.name} ${country.code} ${country.dialCode}`}
      onSelect={() => handleCountrySelect(country)}
      className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-accent"
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
      <Check
        className={cn(
          'ml-auto h-4 w-4',
          selectedCountry.code === country.code ? 'opacity-100' : 'opacity-0'
        )}
      />
    </CommandItem>
  ), [handleCountrySelect, showFlag, showDialCode, selectedCountry.code]);

  const popularCountries = useMemo(() => LazyCountryData.getPopularCountries(), []);

  const renderCountryList = useCallback(() => {
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
    if (filteredCountries.length > 20) {
      return (
        <VirtualizedCountryList
          countries={filteredCountries}
          selectedCountry={selectedCountry}
          onCountrySelect={handleCountrySelect}
          showFlag={showFlag}
          showDialCode={showDialCode}
          maxHeight={300}
          searchValue={searchValue}
        />
      );
    }

    // Regular rendering for smaller lists
    const otherCountries = filteredCountries.filter(
      (country) => !popularCountries.some((p) => p.code === country.code)
    );

    return (
      <CommandList className="max-h-[300px] overflow-auto">
        {!searchValue && popularCountries.length > 0 && (
          <CommandGroup heading="Popular">
            {popularCountries.map(renderCountryItem)}
          </CommandGroup>
        )}
        <CommandGroup heading={searchValue ? 'Results' : 'All Countries'}>
          {(searchValue ? filteredCountries : otherCountries).map(
            renderCountryItem
          )}
        </CommandGroup>
      </CommandList>
    );
  }, [isLoading, filteredCountries, selectedCountry, handleCountrySelect, showFlag, showDialCode, searchValue, popularCountries, renderCountryItem, t]);

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

// Compact version for use in phone input fields
export interface CompactCountrySelectorProps {
  selectedCountry: Country;
  onCountrySelect: (country: Country) => void;
  disabled?: boolean;
  className?: string;
}

export const CompactCountrySelector: React.FC<CompactCountrySelectorProps> = memo(({
  selectedCountry,
  onCountrySelect,
  disabled = false,
  className
}) => {
  const [open, setOpen] = useState(false);

  // Use lazy loading for better performance
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
            <CommandGroup heading="Popular">
              {popularCountries.map((country) => (
                <CommandItem
                  key={country.code}
                  value={`${country.name} ${country.code} ${country.dialCode}`}
                  onSelect={() => handleCountrySelect(country)}
                  className="flex items-center gap-2"
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
                  <Check
                    className={cn(
                      'ml-auto h-4 w-4',
                      selectedCountry.code === country.code
                        ? 'opacity-100'
                        : 'opacity-0'
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandGroup heading="All Countries">
              {/* Show message for lazy loading */}
              <CommandItem className="text-muted-foreground text-center py-4">
                Loading more countries...
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
});

export default CountrySelector;
