'use client';

import { useTheme } from '../hooks/useTheme';
import { useEffect, useState, useCallback, useRef, memo } from 'react';

// Memoized SVG Icons for better performance
const SunIcon = memo(({ className = 'w-4 h-4' }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="5" />
    <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
  </svg>
));

const MoonIcon = memo(({ className = 'w-4 h-4' }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
));

const SystemIcon = memo(({ className = 'w-4 h-4' }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
    <line x1="8" y1="21" x2="16" y2="21" />
    <line x1="12" y1="17" x2="12" y2="21" />
  </svg>
));

/**
 * Theme toggle component that works with both landlord and tenant applications
 * Provides multiple variants and comprehensive accessibility features
 * Meets WCAG AA accessibility standards
 *
 * @param {Object} props - Component props
 * @param {string} [props.className=''] - Additional CSS classes
 * @param {'sm'|'md'|'lg'} [props.size='md'] - Button size
 * @param {'button'|'switch'|'dropdown'} [props.variant='button'] - Visual variant
 * @param {boolean} [props.showLabel=false] - Whether to show text label
 * @param {boolean} [props.showTooltip=true] - Whether to show tooltip on hover
 * @param {Function} [props.onThemeChange] - Callback when theme changes
 * @param {string} [props.id] - Custom ID for the button (for accessibility)
 * @param {boolean} [props.announceChanges=true] - Whether to announce theme changes to screen readers
 */
const ThemeToggle = memo(function ThemeToggle({
  className = '',
  size = 'md',
  variant = 'button',
  showLabel = false,
  showTooltip = true,
  onThemeChange,
  id,
  announceChanges = true
} = {}) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [focusVisible, setFocusVisible] = useState(false);
  const buttonRef = useRef(null);
  const announcementRef = useRef(null);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Optimized focus visibility handling with passive listeners
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Tab') {
        setFocusVisible(true);
      }
    };

    const handleMouseDown = () => {
      setFocusVisible(false);
    };

    document.addEventListener('keydown', handleKeyDown, { passive: true });
    document.addEventListener('mousedown', handleMouseDown, { passive: true });

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, []);

  // Announce theme changes to screen readers
  const announceThemeChange = useCallback((newTheme, newResolvedTheme) => {
    if (!announceChanges || !announcementRef.current) return;

    const message = newTheme === 'system'
      ? `Theme switched to system preference: ${newResolvedTheme} mode`
      : `Theme switched to ${newResolvedTheme} mode`;

    // Clear previous announcement
    announcementRef.current.textContent = '';

    // Add new announcement after a brief delay to ensure screen readers pick it up
    setTimeout(() => {
      if (announcementRef.current) {
        announcementRef.current.textContent = message;
      }
    }, 100);

    // Clear announcement after 3 seconds to avoid clutter
    setTimeout(() => {
      if (announcementRef.current) {
        announcementRef.current.textContent = '';
      }
    }, 3100);
  }, [announceChanges]);

  // Optimized theme change handler with batched updates
  const handleThemeChange = useCallback(() => {
    setIsTransitioning(true);

    const nextTheme = theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light';

    // Batch state updates
    requestAnimationFrame(() => {
      setTheme(nextTheme);
      onThemeChange?.(nextTheme);

      // Announce theme change to screen readers
      const nextResolvedTheme = nextTheme === 'system'
        ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
        : nextTheme;

      announceThemeChange(nextTheme, nextResolvedTheme);

      // Reset transition state after animation
      setTimeout(() => setIsTransitioning(false), 200);
    });
  }, [theme, setTheme, onThemeChange, announceThemeChange]);

  const handleKeyDown = useCallback(
    (event) => {
      // Support Enter and Space keys for accessibility
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        handleThemeChange();
      }
      // Support Escape key to blur the button
      else if (event.key === 'Escape') {
        event.preventDefault();
        buttonRef.current?.blur();
      }
    },
    [handleThemeChange]
  );

  const handleFocus = useCallback(() => {
    setFocusVisible(true);
  }, []);

  const handleBlur = useCallback(() => {
    setFocusVisible(false);
  }, []);

  const getIcon = () => {
    const iconProps = {
      className: `transition-transform duration-200 ${isTransitioning ? 'scale-110' : 'scale-100'}`
    };

    if (theme === 'system') {
      return <SystemIcon {...iconProps} />;
    }
    return resolvedTheme === 'dark' ? (
      <MoonIcon {...iconProps} />
    ) : (
      <SunIcon {...iconProps} />
    );
  };

  const getLabel = () => {
    if (theme === 'system') {
      return 'System';
    }
    return resolvedTheme === 'dark' ? 'Dark' : 'Light';
  };

  const getNextThemeLabel = () => {
    if (theme === 'light') return 'dark';
    if (theme === 'dark') return 'system';
    return 'light';
  };

  const getAriaLabel = () => {
    const current = getLabel();
    const next = getNextThemeLabel();
    return `Theme toggle. Current: ${current}. Press to switch to ${next}.`;
  };

  const getAriaDescription = () => {
    return `Use Enter or Space to cycle through light, dark, and system themes. Current theme is ${getLabel()}.`;
  };

  const getTooltipText = () => {
    if (!showTooltip) return undefined;
    return `Current: ${getLabel()} theme. Click to switch to ${getNextThemeLabel()}.`;
  };

  // Don't render until mounted to prevent hydration mismatch
  if (!mounted) {
    return (
      <>
        <div
          className={`inline-flex items-center justify-center opacity-0 ${getSizeClasses(size)} ${className}`}
          aria-hidden="true"
        />
        {/* Screen reader announcement area */}
        <div
          ref={announcementRef}
          aria-live="polite"
          aria-atomic="true"
          className="sr-only"
        />
      </>
    );
  }

  const sizeClasses = getSizeClasses(size);
  const baseClasses = getBaseClasses(sizeClasses, isTransitioning, focusVisible);

  if (variant === 'dropdown') {
    return (
      <>
        <div className="relative">
          <button
            ref={buttonRef}
            id={id}
            onClick={handleThemeChange}
            onKeyDown={handleKeyDown}
            onFocus={handleFocus}
            onBlur={handleBlur}
            className={`${baseClasses} ${className}`}
            aria-label={getAriaLabel()}
            aria-describedby={id ? `${id}-description` : undefined}
            title={getTooltipText()}
            aria-expanded="false"
            aria-haspopup="menu"
          >
            {getIcon()}
            {showLabel && (
              <span className="ml-2 text-sm font-medium">{getLabel()}</span>
            )}
            <svg
              className="ml-1 w-3 h-3 transition-transform duration-200"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
          {id && (
            <div id={`${id}-description`} className="sr-only">
              {getAriaDescription()}
            </div>
          )}
        </div>
        {/* Screen reader announcement area */}
        <div
          ref={announcementRef}
          aria-live="polite"
          aria-atomic="true"
          className="sr-only"
        />
      </>
    );
  }

  if (variant === 'switch') {
    return (
      <>
        <div className="flex items-center space-x-3">
          <button
            ref={buttonRef}
            id={id}
            onClick={handleThemeChange}
            onKeyDown={handleKeyDown}
            onFocus={handleFocus}
            onBlur={handleBlur}
            className={`${baseClasses} ${className}`}
            aria-label={getAriaLabel()}
            aria-describedby={id ? `${id}-description` : undefined}
            title={getTooltipText()}
            role="switch"
            aria-checked={theme !== 'light'}
          >
            {getIcon()}
          </button>
          {showLabel && (
            <label
              htmlFor={id}
              className="text-sm font-medium text-foreground select-none cursor-pointer"
            >
              {getLabel()}
            </label>
          )}
          {id && (
            <div id={`${id}-description`} className="sr-only">
              {getAriaDescription()}
            </div>
          )}
        </div>
        {/* Screen reader announcement area */}
        <div
          ref={announcementRef}
          aria-live="polite"
          aria-atomic="true"
          className="sr-only"
        />
      </>
    );
  }

  // Default button variant
  return (
    <>
      <button
        ref={buttonRef}
        id={id}
        onClick={handleThemeChange}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        onBlur={handleBlur}
        className={`${baseClasses} ${className}`}
        aria-label={getAriaLabel()}
        aria-describedby={id ? `${id}-description` : undefined}
        title={getTooltipText()}
      >
        {getIcon()}
        {showLabel && (
          <span className="ml-2 text-sm font-medium">{getLabel()}</span>
        )}
      </button>
      {id && (
        <div id={`${id}-description`} className="sr-only">
          {getAriaDescription()}
        </div>
      )}
      {/* Screen reader announcement area */}
      <div
        ref={announcementRef}
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      />
    </>
  );
});

// Helper functions for consistent styling
function getSizeClasses(size) {
  const sizeMap = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg'
  };
  return sizeMap[size] || sizeMap.md;
}

function getBaseClasses(sizeClasses, isTransitioning, focusVisible) {
  return `
    inline-flex items-center justify-center
    rounded-md border border-input
    bg-background hover:bg-accent hover:text-accent-foreground
    transition-all duration-200 ease-in-out
    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
    disabled:pointer-events-none disabled:opacity-50
    active:scale-95
    ${isTransitioning ? 'bg-accent text-accent-foreground' : ''}
    ${focusVisible ? 'ring-2 ring-ring ring-offset-2' : ''}
    ${sizeClasses}
  `
    .trim()
    .replace(/\s+/g, ' ');
}

ThemeToggle.displayName = 'ThemeToggle';

export { ThemeToggle };
export default ThemeToggle;
