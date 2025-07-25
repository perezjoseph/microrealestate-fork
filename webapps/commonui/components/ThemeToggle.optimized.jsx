'use client';

import { memo, lazy, Suspense, useCallback, useEffect, useState, useRef } from 'react';
import { useTheme } from '../hooks/useTheme';

// Lazy load icons to reduce initial bundle size
const SunIcon = lazy(() => import('./icons/SunIcon'));
const MoonIcon = lazy(() => import('./icons/MoonIcon'));
const SystemIcon = lazy(() => import('./icons/SystemIcon'));

// Memoized icon fallback component for loading state
const IconFallback = memo(({ className = 'w-4 h-4' }) => (
    <div
        className={`${className} animate-pulse bg-current opacity-20 rounded`}
        aria-hidden="true"
    />
));

// Memoized icon wrapper with lazy loading
const ThemeIcon = memo(({ theme, resolvedTheme, isTransitioning, className }) => {
    const iconProps = {
        className: `transition-transform duration-200 ${isTransitioning ? 'scale-110' : 'scale-100'} ${className}`
    };

    const IconComponent = theme === 'system'
        ? SystemIcon
        : resolvedTheme === 'dark'
            ? MoonIcon
            : SunIcon;

    return (
        <Suspense fallback={<IconFallback className={iconProps.className} />}>
            <IconComponent {...iconProps} />
        </Suspense>
    );
});

// Memoized label component to prevent unnecessary re-renders
const ThemeLabel = memo(({ theme, resolvedTheme, showLabel, className = '' }) => {
    if (!showLabel) return null;

    const label = theme === 'system' ? 'System' : resolvedTheme === 'dark' ? 'Dark' : 'Light';

    return (
        <span className={`ml-2 text-sm font-medium ${className}`}>
            {label}
        </span>
    );
});

// Memoized tooltip content to prevent recalculation
const useTooltipContent = (theme, resolvedTheme, showTooltip) => {
    return useCallback(() => {
        if (!showTooltip) return undefined;

        const current = theme === 'system' ? 'System' : resolvedTheme === 'dark' ? 'Dark' : 'Light';
        const next = theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light';

        return `Current: ${current} theme. Click to switch to ${next}.`;
    }, [theme, resolvedTheme, showTooltip]);
};

// Memoized ARIA label generator
const useAriaLabel = (theme, resolvedTheme) => {
    return useCallback(() => {
        const current = theme === 'system' ? 'System' : resolvedTheme === 'dark' ? 'Dark' : 'Light';
        const next = theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light';
        return `Theme toggle. Current: ${current}. Press to switch to ${next}.`;
    }, [theme, resolvedTheme]);
};

// Optimized size classes with memoization
const SIZE_CLASSES = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg'
};

// Optimized base classes with reduced string concatenation
const getBaseClasses = (size, isTransitioning, focusVisible) => {
    const sizeClass = SIZE_CLASSES[size] || SIZE_CLASSES.md;

    return [
        'inline-flex items-center justify-center',
        'rounded-md border border-input',
        'bg-background hover:bg-accent hover:text-accent-foreground',
        'transition-all duration-200 ease-in-out',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        'disabled:pointer-events-none disabled:opacity-50',
        'active:scale-95',
        sizeClass,
        isTransitioning && 'bg-accent text-accent-foreground',
        focusVisible && 'ring-2 ring-ring ring-offset-2'
    ].filter(Boolean).join(' ');
};

/**
 * Performance-optimized theme toggle component
 * Features:
 * - Lazy loading of icons to reduce initial bundle size
 * - Memoized components to prevent unnecessary re-renders
 * - Optimized event handlers with useCallback
 * - Reduced DOM manipulations and string concatenations
 * - Efficient focus management
 */
const ThemeToggle = memo(({
    className = '',
    size = 'md',
    variant = 'button',
    showLabel = false,
    showTooltip = true,
    onThemeChange,
    id,
    announceChanges = true
} = {}) => {
    const { theme, setTheme, resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [focusVisible, setFocusVisible] = useState(false);

    // Use refs to avoid creating new objects on each render
    const buttonRef = useRef(null);
    const announcementRef = useRef(null);
    const transitionTimeoutRef = useRef(null);
    const announcementTimeoutRef = useRef(null);

    // Memoized tooltip and aria label generators
    const getTooltipContent = useTooltipContent(theme, resolvedTheme, showTooltip);
    const getAriaLabel = useAriaLabel(theme, resolvedTheme);

    // Prevent hydration mismatch
    useEffect(() => {
        setMounted(true);
    }, []);

    // Optimized focus visibility handling with cleanup
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

    // Optimized theme change announcement with cleanup
    const announceThemeChange = useCallback((newTheme, newResolvedTheme) => {
        if (!announceChanges || !announcementRef.current) return;

        const message = newTheme === 'system'
            ? `Theme switched to system preference: ${newResolvedTheme} mode`
            : `Theme switched to ${newResolvedTheme} mode`;

        // Clear previous timeouts
        if (announcementTimeoutRef.current) {
            clearTimeout(announcementTimeoutRef.current);
        }

        // Clear previous announcement
        announcementRef.current.textContent = '';

        // Add new announcement after a brief delay
        announcementTimeoutRef.current = setTimeout(() => {
            if (announcementRef.current) {
                announcementRef.current.textContent = message;

                // Clear announcement after 3 seconds
                announcementTimeoutRef.current = setTimeout(() => {
                    if (announcementRef.current) {
                        announcementRef.current.textContent = '';
                    }
                }, 3000);
            }
        }, 100);
    }, [announceChanges]);

    // Optimized theme change handler with cleanup
    const handleThemeChange = useCallback(() => {
        // Clear previous transition timeout
        if (transitionTimeoutRef.current) {
            clearTimeout(transitionTimeoutRef.current);
        }

        setIsTransitioning(true);

        const nextTheme = theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light';

        setTheme(nextTheme);
        onThemeChange?.(nextTheme);

        // Announce theme change
        const nextResolvedTheme = nextTheme === 'system'
            ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
            : nextTheme;

        announceThemeChange(nextTheme, nextResolvedTheme);

        // Reset transition state with cleanup
        transitionTimeoutRef.current = setTimeout(() => {
            setIsTransitioning(false);
        }, 200);
    }, [theme, setTheme, onThemeChange, announceThemeChange]);

    // Optimized keyboard handler
    const handleKeyDown = useCallback((event) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            handleThemeChange();
        } else if (event.key === 'Escape') {
            event.preventDefault();
            buttonRef.current?.blur();
        }
    }, [handleThemeChange]);

    // Optimized focus handlers
    const handleFocus = useCallback(() => setFocusVisible(true), []);
    const handleBlur = useCallback(() => setFocusVisible(false), []);

    // Cleanup timeouts on unmount
    useEffect(() => {
        return () => {
            if (transitionTimeoutRef.current) {
                clearTimeout(transitionTimeoutRef.current);
            }
            if (announcementTimeoutRef.current) {
                clearTimeout(announcementTimeoutRef.current);
            }
        };
    }, []);

    // Don't render until mounted to prevent hydration mismatch
    if (!mounted) {
        return (
            <>
                <div
                    className={`inline-flex items-center justify-center opacity-0 ${SIZE_CLASSES[size] || SIZE_CLASSES.md} ${className}`}
                    aria-hidden="true"
                />
                <div
                    ref={announcementRef}
                    aria-live="polite"
                    aria-atomic="true"
                    className="sr-only"
                />
            </>
        );
    }

    const baseClasses = getBaseClasses(size, isTransitioning, focusVisible);
    const tooltipText = getTooltipContent();
    const ariaLabel = getAriaLabel();

    // Render different variants with optimized structure
    const buttonContent = (
        <>
            <ThemeIcon
                theme={theme}
                resolvedTheme={resolvedTheme}
                isTransitioning={isTransitioning}
            />
            <ThemeLabel
                theme={theme}
                resolvedTheme={resolvedTheme}
                showLabel={showLabel}
            />
        </>
    );

    const commonProps = {
        ref: buttonRef,
        id,
        onClick: handleThemeChange,
        onKeyDown: handleKeyDown,
        onFocus: handleFocus,
        onBlur: handleBlur,
        className: `${baseClasses} ${className}`,
        'aria-label': ariaLabel,
        'aria-describedby': id ? `${id}-description` : undefined,
        title: tooltipText
    };

    if (variant === 'switch') {
        return (
            <>
                <div className="flex items-center space-x-3">
                    <button
                        {...commonProps}
                        role="switch"
                        aria-checked={theme !== 'light'}
                    >
                        <ThemeIcon
                            theme={theme}
                            resolvedTheme={resolvedTheme}
                            isTransitioning={isTransitioning}
                        />
                    </button>
                    <ThemeLabel
                        theme={theme}
                        resolvedTheme={resolvedTheme}
                        showLabel={showLabel}
                        className="text-foreground select-none cursor-pointer"
                    />
                </div>
                {id && (
                    <div id={`${id}-description`} className="sr-only">
                        Use Enter or Space to cycle through light, dark, and system themes.
                    </div>
                )}
                <div
                    ref={announcementRef}
                    aria-live="polite"
                    aria-atomic="true"
                    className="sr-only"
                />
            </>
        );
    }

    if (variant === 'dropdown') {
        return (
            <>
                <div className="relative">
                    <button
                        {...commonProps}
                        aria-expanded="false"
                        aria-haspopup="menu"
                    >
                        {buttonContent}
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
                </div>
                {id && (
                    <div id={`${id}-description`} className="sr-only">
                        Use Enter or Space to cycle through light, dark, and system themes.
                    </div>
                )}
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
            <button {...commonProps}>
                {buttonContent}
            </button>
            {id && (
                <div id={`${id}-description`} className="sr-only">
                    Use Enter or Space to cycle through light, dark, and system themes.
                </div>
            )}
            <div
                ref={announcementRef}
                aria-live="polite"
                aria-atomic="true"
                className="sr-only"
            />
        </>
    );
});

ThemeToggle.displayName = 'ThemeToggle';

export { ThemeToggle };
export default ThemeToggle;