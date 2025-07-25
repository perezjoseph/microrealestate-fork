/**
 * SSR and hydration tests for theme system
 * Tests server-side rendering compatibility and theme flashing prevention
 */

import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { ThemeToggle } from '../ThemeToggle';
import { useTheme } from '../../hooks/useTheme';
import {
    SafeStorage,
    SystemThemeDetector,
    SafeThemeApplicator
} from '../../utils/themeErrorHandling';

// Mock the theme utilities
jest.mock('../../utils/themeErrorHandling', () => ({
    ThemeError: jest.fn().mockImplementation((message, type, severity, originalError) => ({
        name: 'ThemeError',
        message,
        type,
        severity,
        originalError,
        timestamp: Date.now(),
        toJSON: jest.fn()
    })),
    ThemeErrorLogger: {
        log: jest.fn(),
        getRecentErrors: jest.fn(() => []),
        clearErrors: jest.fn()
    },
    SafeStorage: {
        isAvailable: jest.fn(() => true),
        getItem: jest.fn(),
        setItem: jest.fn(() => true)
    },
    SystemThemeDetector: {
        detect: jest.fn(() => 'light'),
        createListener: jest.fn(() => jest.fn())
    },
    SafeThemeApplicator: {
        applyTheme: jest.fn(() => true),
        resetToDefault: jest.fn(() => true)
    },
    validateTheme: jest.fn((theme) => ['light', 'dark', 'system'].includes(theme)),
    resolveTheme: jest.fn((theme, systemTheme) => theme === 'system' ? systemTheme : theme),
    announceThemeChange: jest.fn(),
    THEME_ERROR_TYPES: {
        STORAGE_ERROR: 'STORAGE_ERROR',
        PROVIDER_ERROR: 'PROVIDER_ERROR',
        DOM_MANIPULATION_ERROR: 'DOM_MANIPULATION_ERROR',
        SYSTEM_DETECTION_ERROR: 'SYSTEM_DETECTION_ERROR'
    },
    THEME_ERROR_SEVERITY: {
        LOW: 'LOW',
        MEDIUM: 'MEDIUM',
        HIGH: 'HIGH',
        CRITICAL: 'CRITICAL'
    }
}));

// Test component that uses theme
const SSRTestComponent = ({ showTheme = true }) => {
    const { theme, resolvedTheme, isLoading } = useTheme();

    if (isLoading) {
        return <div data-testid="loading">Loading theme...</div>;
    }

    return (
        <div data-testid="ssr-component">
            {showTheme && (
                <>
                    <span data-testid="theme">{theme}</span>
                    <span data-testid="resolved-theme">{resolvedTheme}</span>
                </>
            )}
            <ThemeToggle />
        </div>
    );
};

// Component that conditionally renders based on theme
const ConditionalThemeComponent = () => {
    const { resolvedTheme, isLoading } = useTheme();

    if (isLoading) {
        return <div data-testid="conditional-loading">Loading...</div>;
    }

    return (
        <div data-testid="conditional-component">
            {resolvedTheme === 'dark' ? (
                <div data-testid="dark-content">Dark mode content</div>
            ) : (
                <div data-testid="light-content">Light mode content</div>
            )}
        </div>
    );
};

describe('Theme SSR and Hydration Tests', () => {
    let originalWindow;

    beforeEach(() => {
        jest.clearAllMocks();
        originalWindow = global.window;

        // Reset mocks
        SafeStorage.getItem.mockReturnValue(null);
        SafeStorage.setItem.mockReturnValue(true);
        SystemThemeDetector.detect.mockReturnValue('light');
        SystemThemeDetector.createListener.mockReturnValue(jest.fn());
        SafeThemeApplicator.applyTheme.mockReturnValue(true);
    });

    afterEach(() => {
        global.window = originalWindow;
    });

    describe('Server-Side Rendering', () => {
        it('should render without errors on server', () => {
            // Simulate server environment
            delete global.window;

            expect(() => {
                renderToString(<SSRTestComponent />);
            }).not.toThrow();
        });

        it('should provide default theme values on server', () => {
            delete global.window;

            const html = renderToString(<SSRTestComponent />);

            // Should render with default values
            expect(html).toContain('system'); // Default theme
            expect(html).toContain('light');  // Default resolved theme
        });

        it('should not access localStorage on server', () => {
            delete global.window;

            renderToString(<SSRTestComponent />);

            // SafeStorage should not be called on server
            expect(SafeStorage.getItem).not.toHaveBeenCalled();
        });

        it('should not apply theme to DOM on server', () => {
            delete global.window;

            renderToString(<SSRTestComponent />);

            expect(SafeThemeApplicator.applyTheme).not.toHaveBeenCalled();
        });

        it('should render loading state appropriately on server', () => {
            delete global.window;

            const html = renderToString(<SSRTestComponent />);

            // Should not show loading state on server
            expect(html).not.toContain('Loading theme...');
        });
    });

    describe('Client-Side Hydration', () => {
        it('should hydrate without theme flashing', async () => {
            // Simulate server-rendered HTML
            const serverHtml = renderToString(<SSRTestComponent showTheme={false} />);

            // Set up client environment
            global.window = originalWindow;
            document.body.innerHTML = `<div id="root">${serverHtml}</div>`;

            // Hydrate on client
            const { container } = render(<SSRTestComponent showTheme={false} />, {
                container: document.getElementById('root'),
                hydrate: true
            });

            // Should not show loading state during hydration
            expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
            expect(screen.getByTestId('ssr-component')).toBeInTheDocument();
        });

        it('should load persisted theme after hydration', async () => {
            SafeStorage.getItem.mockReturnValue(JSON.stringify({
                theme: 'dark',
                timestamp: Date.now()
            }));

            render(<SSRTestComponent />);

            // Should eventually load the persisted theme
            expect(screen.getByTestId('theme')).toHaveTextContent('dark');
            expect(SafeStorage.getItem).toHaveBeenCalledWith('mre-theme-preference');
        });

        it('should handle hydration with system theme preference', async () => {
            SystemThemeDetector.detect.mockReturnValue('dark');

            render(<SSRTestComponent />);

            expect(screen.getByTestId('resolved-theme')).toHaveTextContent('dark');
        });

        it('should prevent theme flashing during hydration', async () => {
            const flashDetector = jest.fn();

            // Component that detects theme changes
            const FlashDetector = () => {
                const { resolvedTheme } = useTheme();
                React.useEffect(() => {
                    flashDetector(resolvedTheme);
                }, [resolvedTheme]);
                return <div data-testid="flash-detector">{resolvedTheme}</div>;
            };

            render(<FlashDetector />);

            // Should only call once (no flashing)
            expect(flashDetector).toHaveBeenCalledTimes(1);
            expect(flashDetector).toHaveBeenCalledWith('light');
        });
    });

    describe('Conditional Rendering', () => {
        it('should handle conditional rendering without flashing', () => {
            render(<ConditionalThemeComponent />);

            // Should render light content initially
            expect(screen.getByTestId('light-content')).toBeInTheDocument();
            expect(screen.queryByTestId('dark-content')).not.toBeInTheDocument();
        });

        it('should update conditional content when theme changes', async () => {
            const { rerender } = render(<ConditionalThemeComponent />);

            // Simulate theme change to dark
            SafeStorage.getItem.mockReturnValue(JSON.stringify({
                theme: 'dark',
                timestamp: Date.now()
            }));

            rerender(<ConditionalThemeComponent />);

            expect(screen.getByTestId('dark-content')).toBeInTheDocument();
            expect(screen.queryByTestId('light-content')).not.toBeInTheDocument();
        });

        it('should handle loading state in conditional rendering', () => {
            // Mock loading state
            const LoadingComponent = () => {
                const [isLoading, setIsLoading] = React.useState(true);
                const { resolvedTheme } = useTheme();

                React.useEffect(() => {
                    const timer = setTimeout(() => setIsLoading(false), 100);
                    return () => clearTimeout(timer);
                }, []);

                if (isLoading) {
                    return <div data-testid="custom-loading">Custom loading...</div>;
                }

                return (
                    <div data-testid="loaded-content">
                        Theme: {resolvedTheme}
                    </div>
                );
            };

            render(<LoadingComponent />);

            expect(screen.getByTestId('custom-loading')).toBeInTheDocument();
        });
    });

    describe('Theme Provider Hydration', () => {
        it('should handle missing theme provider gracefully', () => {
            // Simulate missing provider context
            delete global.window.__THEME_CONTEXT__;
            delete global.window.__NEXT_THEMES_CONTEXT__;

            expect(() => {
                render(<SSRTestComponent />);
            }).not.toThrow();

            expect(screen.getByTestId('ssr-component')).toBeInTheDocument();
        });

        it('should use fallback theme when provider is unavailable', () => {
            delete global.window.__THEME_CONTEXT__;
            delete global.window.__NEXT_THEMES_CONTEXT__;

            render(<SSRTestComponent />);

            expect(screen.getByTestId('theme')).toHaveTextContent('system');
            expect(screen.getByTestId('resolved-theme')).toHaveTextContent('light');
        });

        it('should handle provider initialization errors during hydration', () => {
            SystemThemeDetector.detect.mockImplementation(() => {
                throw new Error('Hydration error');
            });

            render(<SSRTestComponent />);

            // Should still render with fallback
            expect(screen.getByTestId('ssr-component')).toBeInTheDocument();
        });
    });

    describe('Theme Toggle Hydration', () => {
        it('should render theme toggle without hydration mismatch', () => {
            const serverHtml = renderToString(<ThemeToggle />);

            global.window = originalWindow;
            document.body.innerHTML = `<div id="root">${serverHtml}</div>`;

            expect(() => {
                render(<ThemeToggle />, {
                    container: document.getElementById('root'),
                    hydrate: true
                });
            }).not.toThrow();
        });

        it('should maintain theme toggle state after hydration', () => {
            SafeStorage.getItem.mockReturnValue(JSON.stringify({
                theme: 'dark',
                timestamp: Date.now()
            }));

            render(<ThemeToggle />);

            const button = screen.getByRole('button');
            expect(button).toHaveAttribute('aria-label', expect.stringContaining('Dark'));
        });

        it('should handle theme toggle interactions after hydration', async () => {
            render(<ThemeToggle />);

            const button = screen.getByRole('button');

            // Should be interactive after hydration
            expect(button).not.toBeDisabled();

            // Click should work
            act(() => {
                button.click();
            });

            expect(SafeThemeApplicator.applyTheme).toHaveBeenCalled();
        });
    });

    describe('Performance During Hydration', () => {
        it('should not cause excessive re-renders during hydration', () => {
            const renderCount = jest.fn();

            const PerformanceTestComponent = () => {
                renderCount();
                const { theme } = useTheme();
                return <div>{theme}</div>;
            };

            render(<PerformanceTestComponent />);

            // Should not cause excessive renders
            expect(renderCount).toHaveBeenCalledTimes(1);
        });

        it('should batch theme updates during hydration', async () => {
            const updateCount = jest.fn();

            const BatchTestComponent = () => {
                const { theme, resolvedTheme } = useTheme();

                React.useEffect(() => {
                    updateCount();
                }, [theme, resolvedTheme]);

                return <div>{theme}-{resolvedTheme}</div>;
            };

            render(<BatchTestComponent />);

            // Should batch updates
            expect(updateCount).toHaveBeenCalledTimes(1);
        });
    });

    describe('Error Boundaries During Hydration', () => {
        it('should handle theme errors during hydration gracefully', () => {
            const ErrorBoundary = class extends React.Component {
                constructor(props) {
                    super(props);
                    this.state = { hasError: false };
                }

                static getDerivedStateFromError(error) {
                    return { hasError: true };
                }

                render() {
                    if (this.state.hasError) {
                        return <div data-testid="error-fallback">Theme error occurred</div>;
                    }

                    return this.props.children;
                }
            };

            // Simulate theme error during hydration
            SafeThemeApplicator.applyTheme.mockImplementation(() => {
                throw new Error('DOM manipulation failed');
            });

            render(
                <ErrorBoundary>
                    <SSRTestComponent />
                </ErrorBoundary>
            );

            // Should either render normally or show error boundary
            expect(
                screen.getByTestId('ssr-component') || screen.getByTestId('error-fallback')
            ).toBeInTheDocument();
        });
    });

    describe('Accessibility During Hydration', () => {
        it('should maintain accessibility attributes during hydration', () => {
            render(<ThemeToggle />);

            const button = screen.getByRole('button');

            expect(button).toHaveAttribute('aria-label');
            expect(button).toHaveAttribute('type', 'button');
        });

        it('should not announce theme changes during initial hydration', () => {
            const mockAnnounce = jest.fn();

            // Mock the announcement function
            jest.doMock('../../utils/themeErrorHandling', () => ({
                ...jest.requireActual('../../utils/themeErrorHandling'),
                announceThemeChange: mockAnnounce
            }));

            render(<SSRTestComponent />);

            // Should not announce during initial render
            expect(mockAnnounce).not.toHaveBeenCalled();
        });
    });
});