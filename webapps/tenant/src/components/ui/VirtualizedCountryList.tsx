import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/utils';
import { CommandItem } from '@/components/ui/command';
import { Country } from '../../utils/phone/Countries';

interface VirtualizedCountryListProps {
  countries: Country[];
  selectedCountry: Country;
  onCountrySelect: (country: Country) => void;
  showFlag?: boolean;
  showDialCode?: boolean;
  itemHeight?: number;
  maxHeight?: number;
  searchValue?: string;
}

interface VirtualItem {
  index: number;
  country: Country;
  top: number;
  height: number;
}

export const VirtualizedCountryList: React.FC<VirtualizedCountryListProps> = ({
  countries,
  selectedCountry,
  onCountrySelect,
  showFlag = true,
  showDialCode = true,
  itemHeight = 40,
  maxHeight = 300,
  searchValue = ''
}) => {
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(maxHeight);
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate visible items based on scroll position
  const visibleItems = useMemo(() => {
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(
      startIndex + Math.ceil(containerHeight / itemHeight) + 1,
      countries.length
    );

    const items: VirtualItem[] = [];
    for (let i = startIndex; i < endIndex; i++) {
      if (countries[i]) {
        items.push({
          index: i,
          country: countries[i],
          top: i * itemHeight,
          height: itemHeight
        });
      }
    }

    return items;
  }, [countries, scrollTop, containerHeight, itemHeight]);

  // Total height of all items
  const totalHeight = countries.length * itemHeight;

  // Handle scroll events
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  // Update container height on resize
  useEffect(() => {
    const updateHeight = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setContainerHeight(Math.min(rect.height, maxHeight));
      }
    };

    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, [maxHeight]);

  // Scroll to selected country when it changes
  useEffect(() => {
    if (selectedCountry && containerRef.current) {
      const selectedIndex = countries.findIndex(
        (country) => country.code === selectedCountry.code
      );
      
      if (selectedIndex >= 0) {
        const targetScrollTop = selectedIndex * itemHeight;
        const currentScrollTop = containerRef.current.scrollTop;
        const containerHeight = containerRef.current.clientHeight;

        // Only scroll if the selected item is not visible
        if (
          targetScrollTop < currentScrollTop ||
          targetScrollTop > currentScrollTop + containerHeight - itemHeight
        ) {
          containerRef.current.scrollTop = Math.max(
            0,
            targetScrollTop - containerHeight / 2
          );
        }
      }
    }
  }, [selectedCountry, countries, itemHeight]);

  // Render individual country item
  const renderCountryItem = useCallback((item: VirtualItem) => {
    const { country, top, height } = item;
    
    return (
      <div
        key={country.code}
        style={{
          position: 'absolute',
          top,
          height,
          width: '100%',
          display: 'flex',
          alignItems: 'center'
        }}
      >
        <CommandItem
          value={`${country.name} ${country.code} ${country.dialCode}`}
          onSelect={() => onCountrySelect(country)}
          className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-accent w-full"
          style={{ height: '100%' }}
        >
          {showFlag && (
            <span
              className="text-lg flex-shrink-0"
              role="img"
              aria-label={`${country.name} flag`}
            >
              {country.flag}
            </span>
          )}
          <div className="flex-1 flex items-center justify-between min-w-0">
            <span className="text-sm font-medium truncate">{country.name}</span>
            {showDialCode && (
              <span className="text-sm text-muted-foreground ml-2 flex-shrink-0">
                {country.dialCode}
              </span>
            )}
          </div>
          <Check
            className={cn(
              'ml-auto h-4 w-4 flex-shrink-0',
              selectedCountry.code === country.code ? 'opacity-100' : 'opacity-0'
            )}
          />
        </CommandItem>
      </div>
    );
  }, [selectedCountry.code, onCountrySelect, showFlag, showDialCode]);

  // Show loading state for empty list
  if (countries.length === 0) {
    return (
      <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">
        {searchValue ? 'No countries found' : 'Loading countries...'}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative overflow-auto"
      style={{ height: Math.min(totalHeight, maxHeight) }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        {visibleItems.map(renderCountryItem)}
      </div>
    </div>
  );
};

export default VirtualizedCountryList;