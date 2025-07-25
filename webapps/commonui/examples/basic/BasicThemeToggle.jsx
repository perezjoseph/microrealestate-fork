/**
 * Basic Theme Toggle Example
 * 
 * This example demonstrates the simplest way to implement a theme toggle
 * using the MicroRealEstate theme system.
 */

import React from 'react';
import { ThemeToggle } from '@microrealestate/commonui/components/ThemeToggle';
import { useTheme } from '@microrealestate/commonui/hooks/useTheme';

/**
 * Basic usage of the ThemeToggle component
 */
export function BasicThemeToggleExample() {
    return (
        <div className="p-6 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 min-h-screen">
            <h1 className="text-2xl font-bold mb-4">Basic Theme Toggle Example</h1>

            <div className="space-y-4">
                {/* Default theme toggle */}
                <div className="flex items-center space-x-4">
                    <span>Default toggle:</span>
                    <ThemeToggle />
                </div>

                {/* Toggle with label */}
                <div className="flex items-center space-x-4">
                    <span>With label:</span>
                    <ThemeToggle showLabel />
                </div>

                {/* Different sizes */}
                <div className="flex items-center space-x-4">
                    <span>Small:</span>
                    <ThemeToggle size="sm" />
                    <span>Medium:</span>
                    <ThemeToggle size="md" />
                    <span>Large:</span>
                    <ThemeToggle size="lg" />
                </div>

                {/* Switch variant */}
                <div className="flex items-center space-x-4">
                    <span>Switch style:</span>
                    <ThemeToggle variant="switch" />
                </div>
            </div>
        </div>
    );
}

/**
 * Custom theme toggle using the useTheme hook
 */
export function CustomThemeToggle() {
    const { theme, setTheme, resolvedTheme } = useTheme();

    const handleThemeChange = () => {
        const newTheme = resolvedTheme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
    };

    return (
        <button
            onClick={handleThemeChange}
            className="
        px-4 py-2 rounded-md border
        bg-white dark:bg-gray-800
        border-gray-300 dark:border-gray-600
        text-gray-700 dark:text-gray-300
        hover:bg-gray-50 dark:hover:bg-gray-700
        focus:outline-none focus:ring-2 focus:ring-blue-500
        transition-colors duration-200
      "
            aria-label={`Switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} mode`}
        >
            {resolvedTheme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode'}
        </button>
    );
}

/**
 * Theme status display component
 */
export function ThemeStatus() {
    const { theme, resolvedTheme, systemTheme, isLoading } = useTheme();

    if (isLoading) {
        return (
            <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-md">
                <div className="animate-pulse">Loading theme...</div>
            </div>
        );
    }

    return (
        <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-md space-y-2">
            <h3 className="font-semibold">Theme Status</h3>
            <div className="text-sm space-y-1">
                <div>Selected theme: <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">{theme}</code></div>
                <div>Resolved theme: <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">{resolvedTheme}</code></div>
                <div>System theme: <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">{systemTheme}</code></div>
            </div>
        </div>
    );
}

/**
 * Complete basic example with all components
 */
export default function BasicThemeExample() {
    return (
        <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors">
            <div className="container mx-auto px-4 py-8">
                <header className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold">Basic Theme Example</h1>
                    <ThemeToggle />
                </header>

                <div className="grid gap-8 md:grid-cols-2">
                    <div>
                        <h2 className="text-xl font-semibold mb-4">Theme Toggle Variants</h2>
                        <BasicThemeToggleExample />
                    </div>

                    <div>
                        <h2 className="text-xl font-semibold mb-4">Custom Implementation</h2>
                        <div className="space-y-4">
                            <CustomThemeToggle />
                            <ThemeStatus />
                        </div>
                    </div>
                </div>

                <div className="mt-8 p-6 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <h3 className="text-lg font-semibold mb-4">Theme-Aware Content</h3>
                    <p className="mb-4">
                        This content automatically adapts to the current theme. The background, text colors,
                        and borders all change based on the selected theme.
                    </p>

                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded">
                            <h4 className="font-medium text-blue-900 dark:text-blue-100">Info Card</h4>
                            <p className="text-blue-700 dark:text-blue-300 text-sm mt-1">
                                This card uses theme-aware colors for better visibility.
                            </p>
                        </div>

                        <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded">
                            <h4 className="font-medium text-green-900 dark:text-green-100">Success Card</h4>
                            <p className="text-green-700 dark:text-green-300 text-sm mt-1">
                                Success states work well in both themes.
                            </p>
                        </div>

                        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded">
                            <h4 className="font-medium text-yellow-900 dark:text-yellow-100">Warning Card</h4>
                            <p className="text-yellow-700 dark:text-yellow-300 text-sm mt-1">
                                Warning colors maintain good contrast.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

/**
 * Usage Notes:
 * 
 * 1. Always wrap your app with ThemeProvider
 * 2. Use the useTheme hook to access theme state
 * 3. Apply theme-aware classes using Tailwind's dark: prefix
 * 4. Handle loading states to prevent theme flashing
 * 5. Provide proper accessibility attributes
 * 
 * Common Patterns:
 * - bg-white dark:bg-gray-800 (backgrounds)
 * - text-gray-900 dark:text-gray-100 (text)
 * - border-gray-200 dark:border-gray-700 (borders)
 * - hover:bg-gray-50 dark:hover:bg-gray-700 (hover states)
 */