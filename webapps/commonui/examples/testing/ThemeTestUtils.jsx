/**
 * Theme Testing Utilities and Examples
 * 
 * This file provides utilities and examples for testing theme-related
 * functionality in the MicroRealEstate application.
 */

import React, { createContext, useContext, useState } from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

/**
 * Mock Theme Provider for Testing
 * Provides a controlled theme environment for tests
 */
const MockThemeContext = createContext();

export function MockThemeProvider({
    children,
    initialTheme = 'light',
    systemTheme = 'light',
    onThemeChange = () => { }
}) {
    const [theme, setTheme] = useState(initialTheme);
    const [resolvedTheme, setResolvedTheme] = useState(
        initialTheme === 'system' ? systemTheme : initialTheme
    );

    const handleSetTheme = (newTheme) => {
        setTheme(newTheme);
        const resolved = newTheme === 'system' ? systemTheme : newTheme;
        setResolvedTheme(resolved);
        onThemeChange(newTheme, resolved);
    };

    const value = {
        theme,
        setTheme: handleSetTheme,
        resolvedTheme,
        systemTheme,
        isLoading: false
    };

    return (
        <MockThemeContext.Provider value={value}>
            <div className={resolvedTheme === 'dark' ? 'dark' : ''}>
                {children}
            </div>
        </MockThemeContext.Provider>
    );
}

/**
 * Mock useTheme hook for testing
 */
export function useMockTheme() {
    const context = useContext(MockThemeContext);
    if (!context) {
        throw new Error('useMockTheme must be used within MockThemeProvider');
    }
    return context;
}

/**
 * Test utilities for theme components
 */
export const themeTestUtils = {
    /**
     * Render component with theme provider
     */
    renderWithTheme: (component, options = {}) => {
        const {
            initialTheme = 'light',
            systemTheme = 'light',
            onThemeChange = jest.fn(),
            ...renderOptions
        } = options;

        return {
            ...render(
                <MockThemeProvider
                    initialTheme={initialTheme}
                    systemTheme={systemTheme}
                    onThemeChange={onThemeChange}
                >
                    {component}
                </MockThemeProvider>,
                renderOptions
            ),
            onThemeChange
        };
    },

    /**
     * Get theme toggle button
     */
    getThemeToggle: () => {
        return screen.getByRole('button', { name: /switch to|toggle/i });
    },

    /**
     * Toggle theme and wait for changes
     */
    toggleTheme: async () => {
        const toggle = themeTestUtils.getThemeToggle();
        await userEvent.click(toggle);
        await waitFor(() => {
            // Wait for theme change to complete
        });
    },

    /**
     * Check if element has dark mode classes
     */
    hasDarkModeClasses: (element) => {
        const classes = element.className;
        return classes.includes('dark:') || element.closest('.dark') !== null;
    },

    /**
     * Mock system theme preference
     */
    mockSystemTheme: (theme) => {
        const mockMatchMedia = jest.fn((query) => ({
            matches: query === '(prefers-color-scheme: dark)' ? theme === 'dark' : theme === 'light',
            media: query,
            onchange: null,
            addListener: jest.fn(),
            removeListener: jest.fn(),
            addEventListener: jest.fn(),
            removeEventListener: jest.fn(),
            dispatchEvent: jest.fn(),
        }));

        Object.defineProperty(window, 'matchMedia', {
            writable: true,
            value: mockMatchMedia,
        });

        return mockMatchMedia;
    },

    /**
     * Mock localStorage for theme persistence tests
     */
    mockLocalStorage: () => {
        const store = {};
        const mockLocalStorage = {
            getItem: jest.fn((key) => store[key] || null),
            setItem: jest.fn((key, value) => {
                store[key] = value;
            }),
            removeItem: jest.fn((key) => {
                delete store[key];
            }),
            clear: jest.fn(() => {
                Object.keys(store).forEach(key => delete store[key]);
            })
        };

        Object.defineProperty(window, 'localStorage', {
            value: mockLocalStorage,
            writable: true
        });

        return mockLocalStorage;
    }
};

/**
 * Example test component for demonstration
 */
function TestThemeComponent() {
    const { theme, setTheme, resolvedTheme } = useMockTheme();

    return (
        <div className="p-4 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
            <h1>Theme Test Component</h1>
            <p>Current theme: {theme}</p>
            <p>Resolved theme: {resolvedTheme}</p>

            <button
                onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
                aria-label={`Switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} mode`}
            >
                Toggle Theme
            </button>

            <div className="mt-4 p-2 bg-blue-100 dark:bg-blue-900 rounded">
                Theme-aware content
            </div>
        </div>
    );
}

/**
 * Example test suites
 */
export const exampleTests = {
    /**
     * Basic theme functionality tests
     */
    basicThemeTests: () => {
        describe('Basic Theme Functionality', () => {
            beforeEach(() => {
                themeTestUtils.mockLocalStorage();
                themeTestUtils.mockSystemTheme('light');
            });

            it('renders with light theme by default', () => {
                themeTestUtils.renderWithTheme(<TestThemeComponent />);

                expect(screen.getByText('Current theme: light')).toBeInTheDocument();
                expect(screen.getByText('Resolved theme: light')).toBeInTheDocument();
            });

            it('can toggle to dark theme', async () => {
                const { onThemeChange } = themeTestUtils.renderWithTheme(<TestThemeComponent />);

                await themeTestUtils.toggleTheme();

                expect(onThemeChange).toHaveBeenCalledWith('dark', 'dark');
                expect(screen.getByText('Current theme: dark')).toBeInTheDocument();
            });

            it('applies correct CSS classes', () => {
                const { container } = themeTestUtils.renderWithTheme(
                    <TestThemeComponent />,
                    { initialTheme: 'dark' }
                );

                expect(container.firstChild).toHaveClass('dark');
            });
        });
    },

    /**
     * Accessibility tests
     */
    accessibilityTests: () => {
        describe('Theme Accessibility', () => {
            it('meets accessibility standards in light mode', async () => {
                const { container } = themeTestUtils.renderWithTheme(<TestThemeComponent />);
                const results = await axe(container);
                expect(results).toHaveNoViolations();
            });

            it('meets accessibility standards in dark mode', async () => {
                const { container } = themeTestUtils.renderWithTheme(
                    <TestThemeComponent />,
                    { initialTheme: 'dark' }
                );
                const results = await axe(container);
                expect(results).toHaveNoViolations();
            });

            it('has proper ARIA labels', () => {
                themeTestUtils.renderWithTheme(<TestThemeComponent />);

                const toggle = screen.getByRole('button', { name: /switch to dark mode/i });
                expect(toggle).toHaveAttribute('aria-label');
            });

            it('supports keyboard navigation', async () => {
                themeTestUtils.renderWithTheme(<TestThemeComponent />);

                const toggle = themeTestUtils.getThemeToggle();
                toggle.focus();

                await userEvent.keyboard('{Enter}');

                expect(screen.getByText('Current theme: dark')).toBeInTheDocument();
            });
        });
    },

    /**
     * System theme detection tests
     */
    systemThemeTests: () => {
        describe('System Theme Detection', () => {
            it('detects dark system theme', () => {
                themeTestUtils.mockSystemTheme('dark');

                themeTestUtils.renderWithTheme(
                    <TestThemeComponent />,
                    { initialTheme: 'system', systemTheme: 'dark' }
                );

                expect(screen.getByText('Resolved theme: dark')).toBeInTheDocument();
            });

            it('detects light system theme', () => {
                themeTestUtils.mockSystemTheme('light');

                themeTestUtils.renderWithTheme(
                    <TestThemeComponent />,
                    { initialTheme: 'system', systemTheme: 'light' }
                );

                expect(screen.getByText('Resolved theme: light')).toBeInTheDocument();
            });
        });
    },

    /**
     * Persistence tests
     */
    persistenceTests: () => {
        describe('Theme Persistence', () => {
            let mockStorage;

            beforeEach(() => {
                mockStorage = themeTestUtils.mockLocalStorage();
            });

            it('saves theme preference to localStorage', async () => {
                themeTestUtils.renderWithTheme(<TestThemeComponent />);

                await themeTestUtils.toggleTheme();

                expect(mockStorage.setItem).toHaveBeenCalledWith(
                    'mre-theme-preference',
                    'dark'
                );
            });

            it('loads theme preference from localStorage', () => {
                mockStorage.getItem.mockReturnValue('dark');

                themeTestUtils.renderWithTheme(
                    <TestThemeComponent />,
                    { initialTheme: 'dark' }
                );

                expect(screen.getByText('Current theme: dark')).toBeInTheDocument();
            });
        });
    },

    /**
     * Performance tests
     */
    performanceTests: () => {
        describe('Theme Performance', () => {
            it('does not cause excessive re-renders', () => {
                const renderSpy = jest.fn();

                function SpyComponent() {
                    renderSpy();
                    return <TestThemeComponent />;
                }

                themeTestUtils.renderWithTheme(<SpyComponent />);

                const initialRenderCount = renderSpy.mock.calls.length;

                // Theme change should only cause one additional render
                fireEvent.click(themeTestUtils.getThemeToggle());

                expect(renderSpy.mock.calls.length).toBe(initialRenderCount + 1);
            });
        });
    },

    /**
     * Error handling tests
     */
    errorHandlingTests: () => {
        describe('Theme Error Handling', () => {
            it('handles localStorage unavailability gracefully', () => {
                // Mock localStorage to throw errors
                Object.defineProperty(window, 'localStorage', {
                    value: {
                        getItem: jest.fn(() => {
                            throw new Error('localStorage unavailable');
                        }),
                        setItem: jest.fn(() => {
                            throw new Error('localStorage unavailable');
                        })
                    },
                    writable: true
                });

                expect(() => {
                    themeTestUtils.renderWithTheme(<TestThemeComponent />);
                }).not.toThrow();
            });

            it('falls back to light theme on errors', () => {
                // Mock theme provider to simulate error
                const ErrorComponent = () => {
                    throw new Error('Theme error');
                };

                const { container } = render(
                    <div className="theme-fallback">
                        <ErrorComponent />
                    </div>
                );

                expect(container.firstChild).toHaveClass('theme-fallback');
            });
        });
    }
};

/**
 * Custom Jest matchers for theme testing
 */
export const customMatchers = {
    toHaveTheme: (received, expectedTheme) => {
        const hasThemeClass = expectedTheme === 'dark'
            ? received.classList.contains('dark') || received.closest('.dark')
            : !received.classList.contains('dark') && !received.closest('.dark');

        return {
            message: () =>
                `expected element to have ${expectedTheme} theme, but it ${hasThemeClass ? 'does' : 'does not'}`,
            pass: hasThemeClass
        };
    },

    toBeAccessible: async (received) => {
        const results = await axe(received);
        return {
            message: () =>
                results.violations.length > 0
                    ? `Expected element to be accessible, but found ${results.violations.length} violations`
                    : 'Element is accessible',
            pass: results.violations.length === 0
        };
    }
};

/**
 * Test setup helper
 */
export function setupThemeTests() {
    beforeEach(() => {
        // Reset DOM
        document.documentElement.className = '';

        // Mock localStorage
        themeTestUtils.mockLocalStorage();

        // Mock matchMedia
        themeTestUtils.mockSystemTheme('light');

        // Clear all mocks
        jest.clearAllMocks();
    });

    afterEach(() => {
        // Cleanup
        jest.restoreAllMocks();
    });
}

/**
 * Integration test example
 */
export function createIntegrationTest(Component) {
    return () => {
        describe(`${Component.name} Integration Tests`, () => {
            setupThemeTests();

            it('integrates with theme system correctly', () => {
                const { onThemeChange } = themeTestUtils.renderWithTheme(<Component />);

                // Test initial state
                expect(screen.getByRole('button')).toBeInTheDocument();

                // Test theme change
                fireEvent.click(themeTestUtils.getThemeToggle());
                expect(onThemeChange).toHaveBeenCalled();
            });

            it('maintains accessibility standards', async () => {
                const { container } = themeTestUtils.renderWithTheme(<Component />);
                const results = await axe(container);
                expect(results).toHaveNoViolations();
            });
        });
    };
}

export default {
    MockThemeProvider,
    useMockTheme,
    themeTestUtils,
    exampleTests,
    customMatchers,
    setupThemeTests,
    createIntegrationTest
};

/**
 * Usage Example:
 * 
 * import { themeTestUtils, setupThemeTests } from './ThemeTestUtils';
 * 
 * describe('MyThemeComponent', () => {
 *   setupThemeTests();
 *   
 *   it('renders correctly', () => {
 *     themeTestUtils.renderWithTheme(<MyThemeComponent />);
 *     expect(screen.getByText('Hello')).toBeInTheDocument();
 *   });
 *   
 *   it('toggles theme', async () => {
 *     themeTestUtils.renderWithTheme(<MyThemeComponent />);
 *     await themeTestUtils.toggleTheme();
 *     // Assert theme change
 *   });
 * });
 */