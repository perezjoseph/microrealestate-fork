'use client';

import { lazy, Suspense, memo } from 'react';
import { ThemePerformanceMonitor } from '../utils/themePerformance';

// Lazy load the optimized theme toggle component
const ThemeToggleOptimized = lazy(() =>
    import('./ThemeToggle.optimized').then(module => ({
        default: module.ThemeToggle
    }))
);

// Lightweight loading fallback component
const ThemeToggleLoader = memo(({ size = 'md', className = '' }) => {
    const sizeClasses = {
        sm: 'w-8 h-8',
        md: 'w-10 h-10',
        lg: 'w-12 h-12'
    };

    return (
        <div
            className={`
        inline-flex items-center justify-center
        rounded-md border border-input
        bg-background
        animate-pulse
        ${sizeClasses[size] || sizeClasses.md}
        ${className}
      `}
            aria-label="Loading theme toggle..."
            role="button"
            aria-disabled="true"
        >
            <div className="w-4 h-4 bg-current opacity-20 rounded" />
        </div>
    );
});

ThemeToggleLoader.displayName = 'ThemeToggleLoader';

/**
 * Lazy-loaded theme toggle wrapper with performance monitoring
 * Features:
 * - Code splitting to reduce initial bundle size
 * - Performance monitoring integration
 * - Lightweight loading state
 * - Error boundary for graceful fallbacks
 */
const LazyThemeToggle = memo((props) => {
    const handleThemeChange = (newTheme) => {
        // Monitor theme change performance
        const measurement = ThemePerformanceMonitor.startThemeChange(
            props.theme || 'unknown',
            newTheme
        );

        // Call original handler
        if (props.onThemeChange) {
            props.onThemeChange(newTheme);
        }

        // Complete measurement after a frame to capture DOM updates
        requestAnimationFrame(() => {
            measurement.complete();
        });
    };

    return (
        <Suspense fallback={<ThemeToggleLoader size={props.size} className={props.className} />}>
            <ThemeToggleOptimized
                {...props}
                onThemeChange={handleThemeChange}
            />
        </Suspense>
    );
});

LazyThemeToggle.displayName = 'LazyThemeToggle';

export { LazyThemeToggle };
export default LazyThemeToggle;