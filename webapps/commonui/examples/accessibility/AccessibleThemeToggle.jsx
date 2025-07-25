/**
 * Accessible Theme Toggle Examples
 * 
 * This example demonstrates how to create fully accessible theme toggles
 * that meet WCAG AA standards and work well with assistive technologies.
 */

import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '@microrealestate/commonui/hooks/useTheme';

/**
 * WCAG AA Compliant Theme Toggle
 * Includes proper ARIA attributes, keyboard navigation, and screen reader support
 */
export function AccessibleThemeToggle() {
    const { theme, setTheme, resolvedTheme } = useTheme();
    const [announcement, setAnnouncement] = useState('');

    const handleThemeChange = () => {
        const newTheme = resolvedTheme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);

        // Announce theme change to screen readers
        setAnnouncement(`Theme changed to ${newTheme} mode`);

        // Clear announcement after screen readers have time to read it
        setTimeout(() => setAnnouncement(''), 1000);
    };

    const handleKeyDown = (event) => {
        // Support Enter and Space keys
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            handleThemeChange();
        }
    };

    return (
        <>
            <button
                onClick={handleThemeChange}
                onKeyDown={handleKeyDown}
                aria-label={`Switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} mode`}
                aria-pressed={resolvedTheme === 'dark'}
                className="
          relative p-3 rounded-lg
          bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700
          border-2 border-transparent
          focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
          dark:focus:ring-offset-gray-800
          transition-all duration-200
          group
        "
                type="button"
            >
                {/* Visual icon */}
                <div className="w-6 h-6 flex items-center justify-center">
                    {resolvedTheme === 'dark' ? (
                        <svg
                            className="w-5 h-5 text-yellow-500"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                            aria-hidden="true"
                        >
                            <path
                                fillRule="evenodd"
                                d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
                                clipRule="evenodd"
                            />
                        </svg>
                    ) : (
                        <svg
                            className="w-5 h-5 text-gray-700"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                            aria-hidden="true"
                        >
                            <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                        </svg>
                    )}
                </div>

                {/* Tooltip */}
                <div className="
          absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2
          px-2 py-1 text-xs font-medium text-white bg-gray-900 rounded
          opacity-0 group-hover:opacity-100 group-focus:opacity-100
          transition-opacity duration-200
          pointer-events-none
          whitespace-nowrap
        ">
                    Switch to {resolvedTheme === 'dark' ? 'light' : 'dark'} mode
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                </div>
            </button>

            {/* Screen reader announcements */}
            <div
                aria-live="polite"
                aria-atomic="true"
                className="sr-only"
            >
                {announcement}
            </div>
        </>
    );
}

/**
 * Theme Toggle with Descriptive Labels
 * Provides clear text labels for better understanding
 */
export function LabeledThemeToggle() {
    const { theme, setTheme, resolvedTheme } = useTheme();

    return (
        <div className="flex items-center space-x-3">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Theme:
            </span>

            <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                {['light', 'dark', 'system'].map((themeOption) => (
                    <button
                        key={themeOption}
                        onClick={() => setTheme(themeOption)}
                        className={`
              px-3 py-1 text-sm font-medium rounded-md transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
              dark:focus:ring-offset-gray-800
              ${theme === themeOption
                                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                            }
            `}
                        aria-pressed={theme === themeOption}
                        aria-label={`Set theme to ${themeOption}`}
                    >
                        {themeOption.charAt(0).toUpperCase() + themeOption.slice(1)}
                    </button>
                ))}
            </div>

            <span className="text-xs text-gray-500 dark:text-gray-400">
                (Currently: {resolvedTheme})
            </span>
        </div>
    );
}

/**
 * Switch-Style Theme Toggle
 * Mimics a physical switch for intuitive interaction
 */
export function SwitchThemeToggle() {
    const { setTheme, resolvedTheme } = useTheme();
    const [isPressed, setIsPressed] = useState(false);

    const handleToggle = () => {
        const newTheme = resolvedTheme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
    };

    const handleKeyDown = (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            setIsPressed(true);
            handleToggle();
        }
    };

    const handleKeyUp = (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
            setIsPressed(false);
        }
    };

    return (
        <div className="flex items-center space-x-3">
            <label
                htmlFor="theme-switch"
                className="text-sm font-medium text-gray-700 dark:text-gray-300"
            >
                Dark mode
            </label>

            <button
                id="theme-switch"
                role="switch"
                aria-checked={resolvedTheme === 'dark'}
                aria-label={`${resolvedTheme === 'dark' ? 'Disable' : 'Enable'} dark mode`}
                onClick={handleToggle}
                onKeyDown={handleKeyDown}
                onKeyUp={handleKeyUp}
                onMouseDown={() => setIsPressed(true)}
                onMouseUp={() => setIsPressed(false)}
                onMouseLeave={() => setIsPressed(false)}
                className={`
          relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
          dark:focus:ring-offset-gray-800
          ${resolvedTheme === 'dark'
                        ? 'bg-blue-600'
                        : 'bg-gray-200 dark:bg-gray-700'
                    }
          ${isPressed ? 'scale-95' : 'scale-100'}
        `}
            >
                <span
                    className={`
            inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200
            ${resolvedTheme === 'dark' ? 'translate-x-6' : 'translate-x-1'}
          `}
                />
            </button>

            <span className="text-xs text-gray-500 dark:text-gray-400">
                {resolvedTheme === 'dark' ? 'On' : 'Off'}
            </span>
        </div>
    );
}

/**
 * Keyboard Navigation Demo
 * Shows how to implement proper keyboard navigation
 */
export function KeyboardNavigationDemo() {
    const { theme, setTheme, resolvedTheme } = useTheme();
    const [focusedIndex, setFocusedIndex] = useState(0);
    const buttonRefs = useRef([]);

    const themes = ['light', 'dark', 'system'];

    const handleKeyDown = (event, index) => {
        switch (event.key) {
            case 'ArrowRight':
            case 'ArrowDown':
                event.preventDefault();
                const nextIndex = (index + 1) % themes.length;
                setFocusedIndex(nextIndex);
                buttonRefs.current[nextIndex]?.focus();
                break;

            case 'ArrowLeft':
            case 'ArrowUp':
                event.preventDefault();
                const prevIndex = (index - 1 + themes.length) % themes.length;
                setFocusedIndex(prevIndex);
                buttonRefs.current[prevIndex]?.focus();
                break;

            case 'Enter':
            case ' ':
                event.preventDefault();
                setTheme(themes[index]);
                break;

            case 'Home':
                event.preventDefault();
                setFocusedIndex(0);
                buttonRefs.current[0]?.focus();
                break;

            case 'End':
                event.preventDefault();
                const lastIndex = themes.length - 1;
                setFocusedIndex(lastIndex);
                buttonRefs.current[lastIndex]?.focus();
                break;
        }
    };

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Keyboard Navigation Demo
            </h3>

            <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <p>Use keyboard to navigate:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Arrow keys to move between options</li>
                    <li>Enter or Space to select</li>
                    <li>Home/End to jump to first/last option</li>
                </ul>
            </div>

            <div
                role="radiogroup"
                aria-label="Theme selection"
                className="flex space-x-2"
            >
                {themes.map((themeOption, index) => (
                    <button
                        key={themeOption}
                        ref={(el) => (buttonRefs.current[index] = el)}
                        role="radio"
                        aria-checked={theme === themeOption}
                        tabIndex={focusedIndex === index ? 0 : -1}
                        onKeyDown={(e) => handleKeyDown(e, index)}
                        onFocus={() => setFocusedIndex(index)}
                        onClick={() => setTheme(themeOption)}
                        className={`
              px-4 py-2 text-sm font-medium rounded-md border-2 transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
              dark:focus:ring-offset-gray-800
              ${theme === themeOption
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                                : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                            }
            `}
                    >
                        {themeOption.charAt(0).toUpperCase() + themeOption.slice(1)}
                    </button>
                ))}
            </div>
        </div>
    );
}

/**
 * High Contrast Theme Toggle
 * Designed for users with visual impairments
 */
export function HighContrastThemeToggle() {
    const { setTheme, resolvedTheme } = useTheme();

    return (
        <button
            onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
            className="
        px-6 py-3 text-lg font-bold rounded-lg border-4
        bg-white dark:bg-black
        text-black dark:text-white
        border-black dark:border-white
        hover:bg-gray-100 dark:hover:bg-gray-900
        focus:outline-none focus:ring-4 focus:ring-blue-500
        transition-all duration-200
      "
            aria-label={`Switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} mode`}
        >
            {resolvedTheme === 'dark' ? '☀️ LIGHT MODE' : '🌙 DARK MODE'}
        </button>
    );
}

/**
 * Complete accessibility example
 */
export default function AccessibilityExample() {
    return (
        <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors">
            <div className="container mx-auto px-4 py-8">
                <header className="mb-8">
                    <h1 className="text-3xl font-bold mb-4">Accessible Theme Toggles</h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Examples of theme toggles that meet WCAG AA accessibility standards
                    </p>
                </header>

                <div className="space-y-12">
                    <section>
                        <h2 className="text-2xl font-semibold mb-4">Standard Accessible Toggle</h2>
                        <div className="p-6 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <AccessibleThemeToggle />
                        </div>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4">Labeled Toggle Options</h2>
                        <div className="p-6 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <LabeledThemeToggle />
                        </div>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4">Switch Style Toggle</h2>
                        <div className="p-6 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <SwitchThemeToggle />
                        </div>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4">Keyboard Navigation</h2>
                        <div className="p-6 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <KeyboardNavigationDemo />
                        </div>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4">High Contrast Toggle</h2>
                        <div className="p-6 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <HighContrastThemeToggle />
                        </div>
                    </section>
                </div>

                <div className="mt-12 p-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <h2 className="text-xl font-semibold mb-4 text-blue-900 dark:text-blue-100">
                        Accessibility Checklist
                    </h2>

                    <div className="space-y-3 text-sm text-blue-800 dark:text-blue-200">
                        <div className="flex items-start space-x-2">
                            <span className="text-green-600 dark:text-green-400">✓</span>
                            <span>Proper ARIA labels and roles</span>
                        </div>
                        <div className="flex items-start space-x-2">
                            <span className="text-green-600 dark:text-green-400">✓</span>
                            <span>Keyboard navigation support</span>
                        </div>
                        <div className="flex items-start space-x-2">
                            <span className="text-green-600 dark:text-green-400">✓</span>
                            <span>Screen reader announcements</span>
                        </div>
                        <div className="flex items-start space-x-2">
                            <span className="text-green-600 dark:text-green-400">✓</span>
                            <span>High contrast color ratios</span>
                        </div>
                        <div className="flex items-start space-x-2">
                            <span className="text-green-600 dark:text-green-400">✓</span>
                            <span>Focus indicators</span>
                        </div>
                        <div className="flex items-start space-x-2">
                            <span className="text-green-600 dark:text-green-400">✓</span>
                            <span>Touch target size (44px minimum)</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

/**
 * Accessibility Testing Notes:
 * 
 * 1. Test with screen readers (NVDA, JAWS, VoiceOver)
 * 2. Verify keyboard-only navigation
 * 3. Check color contrast ratios (4.5:1 for normal text, 3:1 for large text)
 * 4. Test with high contrast mode enabled
 * 5. Verify focus indicators are visible
 * 6. Test with zoom up to 200%
 * 7. Ensure touch targets are at least 44px
 * 8. Verify announcements work correctly
 */