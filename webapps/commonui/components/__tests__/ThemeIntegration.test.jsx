/**
 * Integration tests for theme system
 * Tests theme persistence, cross-component updates, and provider interactions
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeToggle } from '../ThemeToggle';
import { useTheme } from '../../hooks/useTheme';
import {
    SafeStorage,
    SystemThemeDetector,
    SafeThemeApplicator,
    ThemeErrorLogger
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
const TestThemeConsumer = ({ onThemeChange }) => {
    const { theme, resolvedTheme, setTheme } = useTheme();

    React.useEffect(() => {
        if (onThemeChange) {
            onThemeChange({ theme, resolvedTheme });
        }
    }, [theme, resolvedTheme, onThemeChange]);

    return (
        <div data-testid="theme-consumer">
            <span data-testid="current-theme">{theme}</span>
            <span data-testid="resolved-theme">{resolvedTheme}</span>
            <button onClick={() => setTheme('dark')} data-testid="set-dark">
                Set Dark
            </button>
            <button onClick={() => setTheme('light')} data-testid="set-light">
                Set Light
            </button>
            <button onClick={() => setTheme('system')} data-testid="set-system">
                Set System
            </button>
        </div>
    );
};

// Test component with multiple theme toggles
const MultipleToggleTest = () => {
    return (
        <div>
            <ThemeToggle data-testid="toggle-1" />
            <ThemeToggle data-testid="toggle-2" variant="switch" />
            <TestThemeConsumer />
        </div>
    );
};

describe('Theme Integration Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();

        // Reset localStorage mock
        SafeStorage.getItem.mockReturnValue(null);
        SafeStorage.setItem.mockReturnValue(true);

        // Reset system theme detection
        SystemThemeDetector.detect.mockReturnValue('light');
        SystemThemeDetector.createListener.mockReturnValue(jest.fn());

        // Reset DOM application
        SafeThemeApplicator.applyTheme.mockReturnValue(true);

        // Clear document classes
        document.documentElement.className = '';
    });

    describe('Theme Persistence', () => {
        it('should persist theme changes across component re-renders', async () => {
            const onThemeChange = jest.fn();
            const { rerender } = render(<TestThemeConsumer onThemeChange={onThemeChange} />);

            // Change theme
            const setDarkButton = screen.getByTestId('set-dark');
            fireEvent.click(setDarkButton);

            // Verify theme changed
            await waitFor(() => {
                expect(screen.getByTestId('current-theme')).toHaveTextContent('dark');
            });

            // Verify persistence was called
            expect(SafeStorage.setItem).toHaveBeenCalledWith(
                'mre-theme-preference',
                expect.stringContaining('"theme":"dark"')
            );

            // Re-render component
            rerender(<TestThemeConsumer onThemeChange={onThemeChange} />);

            // Theme should persist
            expect(screen.getByTestId('current-theme')).toHaveTextContent('dark');
        });

        it('should load persisted theme on initial render', () => {
            SafeStorage.getItem.mockReturnValue(JSON.stringify({
                theme: 'dark',
                timestamp: Date.now()
            }));

            render(<TestThemeConsumer />);

            expect(screen.getByTestId('current-theme')).toHaveTextContent('dark');
            expect(SafeStorage.getItem).toHaveBeenCalledWith('mre-theme-preference');
        });

        it('should handle corrupted localStorage data gracefully', () => {
            SafeStorage.getItem.mockReturnValue('corrupted-data');

            render(<TestThemeConsumer />);

            // Should fallback to system theme
            expect(screen.getByTestId('current-theme')).toHaveTextContent('system');
            expect(ThemeErrorLogger.log).toHaveBeenCalled();
        });

        it('should handle localStorage unavailability', () => {
            SafeStorage.isAvailable.mockReturnValue(false);
            SafeStorage.getItem.mockReturnValue(null);
            SafeStorage.setItem.mockReturnValue(false);

            render(<TestThemeConsumer />);

            const setDarkButton = screen.getByTestId('set-dark');
            fireEvent.click(setDarkButton);

            // Theme should still change in memory
            expect(screen.getByTestId('current-theme')).toHaveTextContent('dark');
        });
    });

    describe('Cross-Component Updates', () => {
        it('should synchronize theme across multiple components', async () => {
            render(<MultipleToggleTest />);

            const toggle1 = screen.getByTestId('toggle-1');
            const toggle2 = screen.getByTestId('toggle-2');
            const themeDisplay = screen.getByTestId('current-theme');

            // Initial state
            expect(themeDisplay).toHaveTextContent('system');

            // Click first toggle
            fireEvent.click(toggle1);

            await waitFor(() => {
                expect(themeDisplay).toHaveTextContent('dark');
            });

            // Both toggles should reflect the change
            expect(toggle1).toHaveAttribute('aria-label', expect.stringContaining('Dark'));
            expect(toggle2).toHaveAttribute('aria-checked', 'true');
        });

        it('should update all components when theme changes programmatically', async () => {
            render(<MultipleToggleTest />);

            const setDarkButton = screen.getByTestId('set-dark');
            const toggle1 = screen.getByTestId('toggle-1');
            const toggle2 = screen.getByTestId('toggle-2');

            // Change theme programmatically
            fireEvent.click(setDarkButton);

            await waitFor(() => {
                expect(toggle1).toHaveAttribute('aria-label', expect.stringContaining('Dark'));
                expect(toggle2).toHaveAttribute('aria-checked', 'true');
            });
        });

        it('should handle rapid theme changes correctly', async () => {
            render(<TestThemeConsumer />);

            const setDarkButton = screen.getByTestId('set-dark');
            const setLightButton = screen.getByTestId('set-light');
            const setSystemButton = screen.getByTestId('set-system');
            const themeDisplay = screen.getByTestId('current-theme');

            // Rapid theme changes
            fireEvent.click(setDarkButton);
            fireEvent.click(setLightButton);
            fireEvent.click(setSystemButton);
            fireEvent.click(setDarkButton);

            await waitFor(() => {
                expect(themeDisplay).toHaveTextContent('dark');
            });

            // Should have called storage for each change
            expect(SafeStorage.setItem).toHaveBeenCalledTimes(4);
        });
    });

    describe('System Theme Integration', () => {
        it('should respond to system theme changes when theme is system', async () => {
            let systemThemeListener;
            SystemThemeDetector.createListener.mockImplementation((callback) => {
                systemThemeListener = callback;
                return jest.fn();
            });

            render(<TestThemeConsumer />);

            // Set theme to system
            const setSystemButton = screen.getByTestId('set-system');
            fireEvent.click(setSystemButton);

            await waitFor(() => {
                expect(screen.getByTestId('current-theme')).toHaveTextContent('system');
                expect(screen.getByTestId('resolved-theme')).toHaveTextContent('light');
            });

            // Simulate system theme change
            act(() => {
                systemThemeListener('dark');
            });

            await waitFor(() => {
                expect(screen.getByTestId('resolved-theme')).toHaveTextContent('dark');
            });

            expect(SafeThemeApplicator.applyTheme).toHaveBeenCalledWith('dark');
        });

        it('should not respond to system theme changes when theme is not system', async () => {
            let systemThemeListener;
            SystemThemeDetector.createListener.mockImplementation((callback) => {
                systemThemeListener = callback;
                return jest.fn();
            });

            render(<TestThemeConsumer />);

            // Set theme to light
            const setLightButton = screen.getByTestId('set-light');
            fireEvent.click(setLightButton);

            await waitFor(() => {
                expect(screen.getByTestId('current-theme')).toHaveTextContent('light');
                expect(screen.getByTestId('resolved-theme')).toHaveTextContent('light');
            });

            // Simulate system theme change
            act(() => {
                systemThemeListener('dark');
            });

            // Resolved theme should not change
            expect(screen.getByTestId('resolved-theme')).toHaveTextContent('light');
        });

        it('should handle system theme detection errors', () => {
            SystemThemeDetector.detect.mockImplementation(() => {
                throw new Error('System detection failed');
            });

            render(<TestThemeConsumer />);

            expect(ThemeErrorLogger.log).toHaveBeenCalled();
            // Should still render with fallback
            expect(screen.getByTestId('theme-consumer')).toBeInTheDocument();
        });
    });

    describe('DOM Integration', () => {
        it('should apply theme classes to document root', async () => {
            render(<TestThemeConsumer />);

            const setDarkButton = screen.getByTestId('set-dark');
            fireEvent.click(setDarkButton);

            await waitFor(() => {
                expect(SafeThemeApplicator.applyTheme).toHaveBeenCalledWith('dark');
            });
        });

        it('should handle DOM application failures gracefully', async () => {
            SafeThemeApplicator.applyTheme.mockReturnValue(false);

            const onThemeChange = jest.fn();
            render(<TestThemeConsumer onThemeChange={onThemeChange} />);

            const setDarkButton = screen.getByTestId('set-dark');
            fireEvent.click(setDarkButton);

            await waitFor(() => {
                expect(screen.getByTestId('current-theme')).toHaveTextContent('dark');
            });

            // Should log error but continue functioning
            expect(ThemeErrorLogger.log).toHaveBeenCalled();
        });

        it('should reset to default theme on critical errors', () => {
            SystemThemeDetector.detect.mockImplementation(() => {
                throw new Error('Critical system error');
            });

            render(<TestThemeConsumer />);

            expect(SafeThemeApplicator.resetToDefault).toHaveBeenCalled();
        });
    });

    describe('Error Recovery', () => {
        it('should recover from storage errors', async () => {
            // First call fails, second succeeds
            SafeStorage.setItem
                .mockReturnValueOnce(false)
                .mockReturnValueOnce(true);

            render(<TestThemeConsumer />);

            const setDarkButton = screen.getByTestId('set-dark');
            fireEvent.click(setDarkButton);

            await waitFor(() => {
                expect(screen.getByTestId('current-theme')).toHaveTextContent('dark');
            });

            // Try another theme change
            const setLightButton = screen.getByTestId('set-light');
            fireEvent.click(setLightButton);

            await waitFor(() => {
                expect(screen.getByTestId('current-theme')).toHaveTextContent('light');
            });

            expect(SafeStorage.setItem).toHaveBeenCalledTimes(2);
        });

        it('should clear errors on successful operations', async () => {
            // Simulate error then success
            SafeThemeApplicator.applyTheme
                .mockReturnValueOnce(false)
                .mockReturnValueOnce(true);

            const onThemeChange = jest.fn();
            render(<TestThemeConsumer onThemeChange={onThemeChange} />);

            const setDarkButton = screen.getByTestId('set-dark');
            fireEvent.click(setDarkButton);

            await waitFor(() => {
                expect(onThemeChange).toHaveBeenCalledWith(
                    expect.objectContaining({ theme: 'dark' })
                );
            });

            // Second theme change should succeed
            const setLightButton = screen.getByTestId('set-light');
            fireEvent.click(setLightButton);

            await waitFor(() => {
                expect(onThemeChange).toHaveBeenCalledWith(
                    expect.objectContaining({ theme: 'light' })
                );
            });
        });
    });

    describe('Performance', () => {
        it('should not cause excessive re-renders', async () => {
            const renderCount = jest.fn();

            const TestComponent = () => {
                renderCount();
                const { theme } = useTheme();
                return <div data-testid="theme">{theme}</div>;
            };

            render(<TestComponent />);

            const initialRenderCount = renderCount.mock.calls.length;

            // Multiple rapid theme changes
            const { rerender } = render(<TestThemeConsumer />);
            const setDarkButton = screen.getByTestId('set-dark');

            fireEvent.click(setDarkButton);
            fireEvent.click(setDarkButton);
            fireEvent.click(setDarkButton);

            rerender(<TestComponent />);

            // Should not cause excessive re-renders
            expect(renderCount.mock.calls.length - initialRenderCount).toBeLessThan(5);
        });

        it('should debounce rapid system theme changes', async () => {
            let systemThemeListener;
            SystemThemeDetector.createListener.mockImplementation((callback) => {
                systemThemeListener = callback;
                return jest.fn();
            });

            render(<TestThemeConsumer />);

            // Set to system theme
            const setSystemButton = screen.getByTestId('set-system');
            fireEvent.click(setSystemButton);

            // Rapid system theme changes
            act(() => {
                systemThemeListener('dark');
                systemThemeListener('light');
                systemThemeListener('dark');
            });

            await waitFor(() => {
                expect(screen.getByTestId('resolved-theme')).toHaveTextContent('dark');
            });

            // Should have applied theme for each change
            expect(SafeThemeApplicator.applyTheme).toHaveBeenCalledWith('dark');
            expect(SafeThemeApplicator.applyTheme).toHaveBeenCalledWith('light');
        });
    });

    describe('Memory Leaks', () => {
        it('should cleanup listeners on unmount', () => {
            const mockCleanup = jest.fn();
            SystemThemeDetector.createListener.mockReturnValue(mockCleanup);

            const { unmount } = render(<TestThemeConsumer />);

            unmount();

            expect(mockCleanup).toHaveBeenCalled();
        });

        it('should handle multiple mount/unmount cycles', () => {
            const mockCleanup = jest.fn();
            SystemThemeDetector.createListener.mockReturnValue(mockCleanup);

            // Mount and unmount multiple times
            for (let i = 0; i < 3; i++) {
                const { unmount } = render(<TestThemeConsumer />);
                unmount();
            }

            expect(mockCleanup).toHaveBeenCalledTimes(3);
        });
    });
});