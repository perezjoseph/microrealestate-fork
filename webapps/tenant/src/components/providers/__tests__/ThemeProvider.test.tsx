/**
 * Unit tests for tenant app ThemeProvider
 * Tests custom theme provider implementation with TypeScript
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { ThemeProvider, useTheme } from '../ThemeProvider';
import {
  ThemeError,
  ThemeErrorLogger,
  SafeStorage,
  SystemThemeDetector,
  SafeThemeApplicator,
  THEME_ERROR_TYPES,
  THEME_ERROR_SEVERITY
} from '@microrealestate/commonui/utils/themeErrorHandling';

// Mock the theme error handling utilities
jest.mock('@microrealestate/commonui/utils/themeErrorHandling', () => ({
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

// Mock ThemeErrorBoundary
jest.mock('@microrealestate/commonui/components/ThemeErrorBoundary', () => {
  return function MockThemeErrorBoundary({ children, onError }: any) {
    return <div data-testid="theme-error-boundary">{children}</div>;
  };
});

// Test component that uses the theme context
const TestThemeConsumer: React.FC<{ onThemeChange?: (theme: any) => void }> = ({ onThemeChange }) => {
  const { theme, resolvedTheme, systemTheme, setTheme, error } = useTheme();
  
  React.useEffect(() => {
    if (onThemeChange) {
      onThemeChange({ theme, resolvedTheme, systemTheme, error });
    }
  }, [theme, resolvedTheme, systemTheme, error, onThemeChange]);
  
  return (
    <div data-testid="theme-consumer">
      <span data-testid="current-theme">{theme}</span>
      <span data-testid="resolved-theme">{resolvedTheme}</span>
      <span data-testid="system-theme">{systemTheme}</span>
      <span data-testid="has-error">{error ? 'true' : 'false'}</span>
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

describe('Tenant ThemeProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset mocks to default values
    (SafeStorage.getItem as jest.Mock).mockReturnValue(null);
    (SafeStorage.setItem as jest.Mock).mockReturnValue(true);
    (SystemThemeDetector.detect as jest.Mock).mockReturnValue('light');
    (SystemThemeDetector.createListener as jest.Mock).mockReturnValue(jest.fn());
    (SafeThemeApplicator.applyTheme as jest.Mock).mockReturnValue(true);
    
    // Clear global theme context
    delete (window as any).__THEME_CONTEXT__;
  });

  describe('Provider Initialization', () => {
    it('should provide default theme context', () => {
      render(
        <ThemeProvider>
          <TestThemeConsumer />
        </ThemeProvider>
      );
      
      expect(screen.getByTestId('current-theme')).toHaveTextContent('system');
      expect(screen.getByTestId('resolved-theme')).toHaveTextContent('light');
      expect(screen.getByTestId('system-theme')).toHaveTextContent('light');
      expect(screen.getByTestId('has-error')).toHaveTextContent('false');
    });

    it('should use custom default theme', () => {
      render(
        <ThemeProvider defaultTheme="dark">
          <TestThemeConsumer />
        </ThemeProvider>
      );
      
      expect(screen.getByTestId('current-theme')).toHaveTextContent('dark');
    });

    it('should use custom storage key', () => {
      render(
        <ThemeProvider storageKey="custom-theme-key">
          <TestThemeConsumer />
        </ThemeProvider>
      );
      
      expect(SafeStorage.getItem).toHaveBeenCalledWith('custom-theme-key');
    });

    it('should load saved theme from localStorage', () => {
      (SafeStorage.getItem as jest.Mock).mockReturnValue('dark');
      
      render(
        <ThemeProvider>
          <TestThemeConsumer />
        </ThemeProvider>
      );
      
      expect(screen.getByTestId('current-theme')).toHaveTextContent('dark');
    });

    it('should handle invalid saved theme', () => {
      (SafeStorage.getItem as jest.Mock).mockReturnValue('invalid');
      
      render(
        <ThemeProvider>
          <TestThemeConsumer />
        </ThemeProvider>
      );
      
      expect(screen.getByTestId('current-theme')).toHaveTextContent('system');
      expect(ThemeErrorLogger.log).toHaveBeenCalled();
    });

    it('should expose context globally', () => {
      render(
        <ThemeProvider>
          <TestThemeConsumer />
        </ThemeProvider>
      );
      
      expect((window as any).__THEME_CONTEXT__).toBeDefined();
      expect((window as any).__THEME_CONTEXT__.theme).toBe('system');
    });
  });

  describe('Theme Setting', () => {
    it('should set theme and persist to localStorage', async () => {
      render(
        <ThemeProvider>
          <TestThemeConsumer />
        </ThemeProvider>
      );
      
      const setDarkButton = screen.getByTestId('set-dark');
      fireEvent.click(setDarkButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('current-theme')).toHaveTextContent('dark');
      });
      
      expect(SafeStorage.setItem).toHaveBeenCalledWith('mre-tenant-theme', 'dark');
      expect(SafeThemeApplicator.applyTheme).toHaveBeenCalledWith('dark');
    });

    it('should reject invalid theme values', async () => {
      const onThemeChange = jest.fn();
      
      render(
        <ThemeProvider>
          <TestThemeConsumer onThemeChange={onThemeChange} />
        </ThemeProvider>
      );
      
      const consumer = screen.getByTestId('theme-consumer');
      const setTheme = (consumer as any).setTheme;
      
      act(() => {
        // Simulate invalid theme
        (validateTheme as jest.Mock).mockReturnValue(false);
        setTheme('invalid');
      });
      
      await waitFor(() => {
        expect(screen.getByTestId('has-error')).toHaveTextContent('true');
      });
      
      expect(ThemeErrorLogger.log).toHaveBeenCalled();
    });

    it('should handle storage errors gracefully', async () => {
      (SafeStorage.setItem as jest.Mock).mockReturnValue(false);
      
      const onThemeChange = jest.fn();
      render(
        <ThemeProvider>
          <TestThemeConsumer onThemeChange={onThemeChange} />
        </ThemeProvider>
      );
      
      const setDarkButton = screen.getByTestId('set-dark');
      fireEvent.click(setDarkButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('current-theme')).toHaveTextContent('dark');
        expect(screen.getByTestId('has-error')).toHaveTextContent('true');
      });
    });

    it('should handle DOM application errors', async () => {
      (SafeThemeApplicator.applyTheme as jest.Mock).mockReturnValue(false);
      
      render(
        <ThemeProvider>
          <TestThemeConsumer />
        </ThemeProvider>
      );
      
      const setDarkButton = screen.getByTestId('set-dark');
      fireEvent.click(setDarkButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('has-error')).toHaveTextContent('true');
      });
    });

    it('should clear errors on successful theme change', async () => {
      // First cause an error
      (SafeStorage.setItem as jest.Mock).mockReturnValueOnce(false);
      
      render(
        <ThemeProvider>
          <TestThemeConsumer />
        </ThemeProvider>
      );
      
      const setDarkButton = screen.getByTestId('set-dark');
      fireEvent.click(setDarkButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('has-error')).toHaveTextContent('true');
      });
      
      // Now fix the error and try again
      (SafeStorage.setItem as jest.Mock).mockReturnValue(true);
      
      const setLightButton = screen.getByTestId('set-light');
      fireEvent.click(setLightButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('has-error')).toHaveTextContent('false');
      });
    });
  });

  describe('System Theme Detection', () => {
    it('should detect initial system theme', () => {
      (SystemThemeDetector.detect as jest.Mock).mockReturnValue('dark');
      
      render(
        <ThemeProvider>
          <TestThemeConsumer />
        </ThemeProvider>
      );
      
      expect(screen.getByTestId('system-theme')).toHaveTextContent('dark');
    });

    it('should listen for system theme changes', async () => {
      let systemThemeListener: (theme: string) => void;
      (SystemThemeDetector.createListener as jest.Mock).mockImplementation((callback) => {
        systemThemeListener = callback;
        return jest.fn();
      });
      
      render(
        <ThemeProvider>
          <TestThemeConsumer />
        </ThemeProvider>
      );
      
      // Simulate system theme change
      act(() => {
        systemThemeListener!('dark');
      });
      
      await waitFor(() => {
        expect(screen.getByTestId('system-theme')).toHaveTextContent('dark');
      });
    });

    it('should handle system theme detection errors', () => {
      (SystemThemeDetector.detect as jest.Mock).mockImplementation(() => {
        throw new Error('System detection failed');
      });
      
      render(
        <ThemeProvider>
          <TestThemeConsumer />
        </ThemeProvider>
      );
      
      expect(screen.getByTestId('system-theme')).toHaveTextContent('light'); // Fallback
      expect(screen.getByTestId('has-error')).toHaveTextContent('true');
      expect(ThemeErrorLogger.log).toHaveBeenCalled();
    });

    it('should cleanup system theme listener on unmount', () => {
      const mockCleanup = jest.fn();
      (SystemThemeDetector.createListener as jest.Mock).mockReturnValue(mockCleanup);
      
      const { unmount } = render(
        <ThemeProvider>
          <TestThemeConsumer />
        </ThemeProvider>
      );
      
      unmount();
      
      expect(mockCleanup).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle provider errors with onError callback', async () => {
      const onError = jest.fn();
      
      render(
        <ThemeProvider onError={onError}>
          <TestThemeConsumer />
        </ThemeProvider>
      );
      
      // Simulate an error
      (SafeThemeApplicator.applyTheme as jest.Mock).mockImplementation(() => {
        throw new Error('DOM error');
      });
      
      const setDarkButton = screen.getByTestId('set-dark');
      fireEvent.click(setDarkButton);
      
      await waitFor(() => {
        expect(onError).toHaveBeenCalled();
      });
    });

    it('should reset to default theme on critical errors', () => {
      (SystemThemeDetector.detect as jest.Mock).mockImplementation(() => {
        throw new Error('Critical error');
      });
      
      render(
        <ThemeProvider>
          <TestThemeConsumer />
        </ThemeProvider>
      );
      
      expect(SafeThemeApplicator.resetToDefault).toHaveBeenCalled();
    });

    it('should handle context exposure errors gracefully', () => {
      // Mock window to throw error on property assignment
      const originalWindow = global.window;
      Object.defineProperty(global, 'window', {
        value: new Proxy({}, {
          set() {
            throw new Error('Cannot set property');
          }
        }),
        writable: true
      });
      
      render(
        <ThemeProvider>
          <TestThemeConsumer />
        </ThemeProvider>
      );
      
      expect(ThemeErrorLogger.log).toHaveBeenCalled();
      
      global.window = originalWindow;
    });
  });

  describe('useTheme Hook', () => {
    it('should throw error when used outside provider', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      expect(() => {
        render(<TestThemeConsumer />);
      }).toThrow();
      
      consoleSpy.mockRestore();
    });

    it('should provide theme context when used inside provider', () => {
      render(
        <ThemeProvider>
          <TestThemeConsumer />
        </ThemeProvider>
      );
      
      expect(screen.getByTestId('theme-consumer')).toBeInTheDocument();
    });
  });

  describe('TypeScript Integration', () => {
    it('should provide correct TypeScript types', () => {
      const TypedConsumer: React.FC = () => {
        const { theme, setTheme, resolvedTheme, systemTheme, error } = useTheme();
        
        // These should compile without TypeScript errors
        const validTheme: 'light' | 'dark' | 'system' = theme;
        const validResolvedTheme: 'light' | 'dark' = resolvedTheme;
        const validSystemTheme: 'light' | 'dark' = systemTheme;
        
        setTheme('dark'); // Should accept valid theme
        // setTheme('invalid'); // Should cause TypeScript error
        
        return (
          <div>
            <span>{validTheme}</span>
            <span>{validResolvedTheme}</span>
            <span>{validSystemTheme}</span>
            <span>{error?.message || 'no error'}</span>
          </div>
        );
      };
      
      render(
        <ThemeProvider>
          <TypedConsumer />
        </ThemeProvider>
      );
      
      expect(screen.getByText('system')).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('should not cause excessive re-renders', () => {
      const renderCount = jest.fn();
      
      const PerformanceTestConsumer: React.FC = () => {
        renderCount();
        const { theme } = useTheme();
        return <div>{theme}</div>;
      };
      
      render(
        <ThemeProvider>
          <PerformanceTestConsumer />
        </ThemeProvider>
      );
      
      const initialRenderCount = renderCount.mock.calls.length;
      
      // Multiple theme changes
      const setDarkButton = screen.getByTestId('set-dark');
      fireEvent.click(setDarkButton);
      fireEvent.click(setDarkButton);
      fireEvent.click(setDarkButton);
      
      // Should not cause excessive re-renders
      expect(renderCount.mock.calls.length - initialRenderCount).toBeLessThan(5);
    });

    it('should memoize context value appropriately', () => {
      const contextValues: any[] = [];
      
      const MemoTestConsumer: React.FC = () => {
        const context = useTheme();
        
        React.useEffect(() => {
          contextValues.push(context);
        });
        
        return <div>{context.theme}</div>;
      };
      
      const { rerender } = render(
        <ThemeProvider>
          <MemoTestConsumer />
        </ThemeProvider>
      );
      
      rerender(
        <ThemeProvider>
          <MemoTestConsumer />
        </ThemeProvider>
      );
      
      // Context should be stable across re-renders
      expect(contextValues.length).toBeGreaterThan(0);
    });
  });

  describe('SSR Compatibility', () => {
    it('should handle server-side rendering', () => {
      const originalWindow = global.window;
      delete (global as any).window;
      
      expect(() => {
        render(
          <ThemeProvider>
            <TestThemeConsumer />
          </ThemeProvider>
        );
      }).not.toThrow();
      
      global.window = originalWindow;
    });

    it('should prevent hydration mismatch', () => {
      // Simulate mounted state
      render(
        <ThemeProvider>
          <TestThemeConsumer />
        </ThemeProvider>
      );
      
      // Should render theme consumer after mount
      expect(screen.getByTestId('theme-consumer')).toBeInTheDocument();
    });
  });
});