/**
 * Unit tests for useTheme hook
 * Tests theme state management, persistence, and error handling
 */

import { renderHook, act } from '@testing-library/react';
import { useTheme } from '../../hooks/useTheme';
import {
    ThemeError,
    ThemeErrorLogger,
    SafeStorage,
    SystemThemeDetector,
    SafeThemeApplicator,
    THEME_ERROR_TYPES,
    THEME_ERROR_SEVERITY
} from '../../utils/themeErrorHandling';

// Mock the theme error handling utilities
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

// Mock announceThemeChange
const mockAnnounceThemeChange = jest.fn();
jest.mock('../../utils/themeErrorHandling', () => ({
    ...jest.requireActual('../../utils/themeErrorHandling'),
    announceThemeChange: mockAnnounceThemeChange
}));

describe('useTheme Hook', () => {
    beforeEach(() => {
        jest.clearAllMocks();

        // Reset window object
        delete window.__NEXT_THEMES_CONTEXT__;
        delete window.__THEME_CONTEXT__;

        // Reset mocks to default values
        SafeStorage.getItem.mockReturnValue(null);
        SafeStorage.setItem.mockReturnValue(true);
        SystemThemeDetector.detect.mockReturnValue('light');
        SystemThemeDetector.createListener.mockReturnValue(jest.fn());
        SafeThemeApplicator.applyTheme.mockReturnValue(true);
    });

    describe('Initialization', () => {
        it('should initialize with fallback theme when no provider is available', () => {
            const { result } = renderHook(() => useTheme());

            expect(result.current.theme).toBe('system');
            expect(result.current.resolvedTheme).toBe('light');
            expect(result.current.systemTheme).toBe('light');
            expect(result.current.isLoading).toBe(false);
            expect(result.current.error).toBe(null);
        });

        it('should use next-themes context when available', () => {
            const mockNextThemes = {
                theme: 'dark',
                setTheme: jest.fn(),
                resolvedTheme: 'dark',
                systemTheme: 'light'
            };

            window.__NEXT_THEMES_CONTEXT__ = mockNextThemes;

            const { result } = renderHook(() => useTheme());

            expect(result.current.theme).toBe('dark');
            expect(result.current.resolvedTheme).toBe('dark');
            expect(result.current.systemTheme).toBe('light');
            expect(result.current.setTheme).toBe(mockNextThemes.setTheme);
        });

        it('should use custom theme context when available', () => {
            const mockCustomTheme = {
                theme: 'light',
                setTheme: jest.fn(),
                resolvedTheme: 'light',
                systemTheme: 'light'
            };

            window.__THEME_CONTEXT__ = mockCustomTheme;

            const { result } = renderHook(() => useTheme());

            expect(result.current.theme).toBe('light');
            expect(result.current.resolvedTheme).toBe('light');
            expect(result.current.systemTheme).toBe('light');
            expect(result.current.setTheme).toBe(mockCustomTheme.setTheme);
        });

        it('should load saved theme from localStorage', () => {
            SafeStorage.getItem.mockReturnValue(JSON.stringify({
                theme: 'dark',
                timestamp: Date.now()
            }));

            const { result } = renderHook(() => useTheme());

            expect(result.current.theme).toBe('dark');
            expect(SafeStorage.getItem).toHaveBeenCalledWith('mre-theme-preference');
        });

        it('should handle invalid saved theme gracefully', () => {
            SafeStorage.getItem.mockReturnValue(JSON.stringify({
                theme: 'invalid',
                timestamp: Date.now()
            }));

            const { result } = renderHook(() => useTheme());

            expect(result.current.theme).toBe('system');
            expect(ThemeErrorLogger.log).toHaveBeenCalled();
        });

        it('should handle localStorage parse errors', () => {
            SafeStorage.getItem.mockReturnValue('invalid-json');

            const { result } = renderHook(() => useTheme());

            expect(result.current.theme).toBe('system');
            expect(ThemeErrorLogger.log).toHaveBeenCalled();
        });
    });

    describe('Theme Setting', () => {
        it('should set theme and save to localStorage', () => {
            const { result } = renderHook(() => useTheme());

            act(() => {
                result.current.setTheme('dark');
            });

            expect(result.current.theme).toBe('dark');
            expect(SafeStorage.setItem).toHaveBeenCalledWith(
                'mre-theme-preference',
                expect.stringContaining('"theme":"dark"')
            );
            expect(SafeThemeApplicator.applyTheme).toHaveBeenCalledWith('dark');
        });

        it('should reject invalid theme values', () => {
            const { result } = renderHook(() => useTheme());

            act(() => {
                result.current.setTheme('invalid');
            });

            expect(result.current.theme).toBe('system'); // Should not change
            expect(ThemeErrorLogger.log).toHaveBeenCalled();
            expect(result.current.error).toBeTruthy();
        });

        it('should handle storage errors gracefully', () => {
            SafeStorage.setItem.mockReturnValue(false);

            const { result } = renderHook(() => useTheme());

            act(() => {
                result.current.setTheme('dark');
            });

            expect(result.current.theme).toBe('dark'); // Theme should still change
            expect(result.current.error).toBeTruthy(); // But error should be set
        });

        it('should handle DOM application errors', () => {
            SafeThemeApplicator.applyTheme.mockReturnValue(false);

            const { result } = renderHook(() => useTheme());

            act(() => {
                result.current.setTheme('dark');
            });

            expect(result.current.error).toBeTruthy();
        });

        it('should announce theme changes', () => {
            const { result } = renderHook(() => useTheme());

            act(() => {
                result.current.setTheme('dark');
            });

            expect(mockAnnounceThemeChange).toHaveBeenCalledWith('dark', 'dark');
        });

        it('should clear errors on successful theme change', () => {
            const { result } = renderHook(() => useTheme());

            // Set an error first
            act(() => {
                result.current.setTheme('invalid');
            });
            expect(result.current.error).toBeTruthy();

            // Clear error with valid theme
            act(() => {
                result.current.setTheme('dark');
            });
            expect(result.current.error).toBe(null);
        });
    });

    describe('System Theme Detection', () => {
        it('should detect system theme changes', () => {
            let systemThemeListener;
            SystemThemeDetector.createListener.mockImplementation((callback) => {
                systemThemeListener = callback;
                return jest.fn();
            });

            const { result } = renderHook(() => useTheme());

            // Simulate system theme change
            act(() => {
                systemThemeListener('dark');
            });

            expect(result.current.systemTheme).toBe('dark');
        });

        it('should update resolved theme when system theme changes and theme is system', () => {
            let systemThemeListener;
            SystemThemeDetector.createListener.mockImplementation((callback) => {
                systemThemeListener = callback;
                return jest.fn();
            });

            const { result } = renderHook(() => useTheme());

            // Set theme to system
            act(() => {
                result.current.setTheme('system');
            });

            // Simulate system theme change
            act(() => {
                systemThemeListener('dark');
            });

            expect(result.current.resolvedTheme).toBe('dark');
            expect(SafeThemeApplicator.applyTheme).toHaveBeenCalledWith('dark');
        });

        it('should not update resolved theme when theme is not system', () => {
            let systemThemeListener;
            SystemThemeDetector.createListener.mockImplementation((callback) => {
                systemThemeListener = callback;
                return jest.fn();
            });

            const { result } = renderHook(() => useTheme());

            // Set theme to light
            act(() => {
                result.current.setTheme('light');
            });

            // Simulate system theme change
            act(() => {
                systemThemeListener('dark');
            });

            expect(result.current.resolvedTheme).toBe('light'); // Should remain light
        });

        it('should handle system theme listener errors', () => {
            let systemThemeListener;
            SystemThemeDetector.createListener.mockImplementation((callback) => {
                systemThemeListener = callback;
                return jest.fn();
            });

            SafeThemeApplicator.applyTheme.mockImplementation(() => {
                throw new Error('DOM error');
            });

            const { result } = renderHook(() => useTheme());

            act(() => {
                result.current.setTheme('system');
            });

            // Simulate system theme change with error
            act(() => {
                systemThemeListener('dark');
            });

            expect(ThemeErrorLogger.log).toHaveBeenCalled();
            expect(result.current.error).toBeTruthy();
        });
    });

    describe('Error Handling', () => {
        it('should handle initialization errors gracefully', () => {
            SystemThemeDetector.detect.mockImplementation(() => {
                throw new Error('System detection failed');
            });

            const { result } = renderHook(() => useTheme());

            expect(result.current.error).toBeTruthy();
            expect(ThemeErrorLogger.log).toHaveBeenCalled();
            expect(SafeThemeApplicator.resetToDefault).toHaveBeenCalled();
        });

        it('should provide fallback state when initialization fails', () => {
            SystemThemeDetector.detect.mockImplementation(() => {
                throw new Error('System detection failed');
            });

            const { result } = renderHook(() => useTheme());

            expect(result.current.theme).toBeDefined();
            expect(result.current.setTheme).toBeInstanceOf(Function);
            expect(result.current.isLoading).toBe(false);
        });

        it('should handle context access errors', () => {
            Object.defineProperty(window, '__NEXT_THEMES_CONTEXT__', {
                get: () => {
                    throw new Error('Context access error');
                }
            });

            const { result } = renderHook(() => useTheme());

            expect(ThemeErrorLogger.log).toHaveBeenCalled();
            expect(result.current).toBeDefined(); // Should still provide fallback
        });
    });

    describe('SSR Compatibility', () => {
        it('should handle server-side rendering', () => {
            const originalWindow = global.window;
            delete global.window;

            const { result } = renderHook(() => useTheme());

            expect(result.current.theme).toBe('system');
            expect(result.current.resolvedTheme).toBe('light');
            expect(result.current.isLoading).toBe(false);

            global.window = originalWindow;
        });

        it('should show loading state initially', () => {
            const { result } = renderHook(() => useTheme());

            // During initialization, isLoading should be handled properly
            expect(typeof result.current.isLoading).toBe('boolean');
        });
    });

    describe('Memory Management', () => {
        it('should cleanup system theme listener on unmount', () => {
            const mockCleanup = jest.fn();
            SystemThemeDetector.createListener.mockReturnValue(mockCleanup);

            const { unmount } = renderHook(() => useTheme());

            unmount();

            expect(mockCleanup).toHaveBeenCalled();
        });

        it('should handle missing cleanup function gracefully', () => {
            SystemThemeDetector.createListener.mockReturnValue(null);

            const { unmount } = renderHook(() => useTheme());

            expect(() => unmount()).not.toThrow();
        });
    });
});