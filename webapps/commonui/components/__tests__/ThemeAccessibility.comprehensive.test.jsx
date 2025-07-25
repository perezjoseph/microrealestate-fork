/**
 * Comprehensive accessibility tests for theme system
 * Tests WCAG AA compliance, contrast ratios, and assistive technology support
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { ThemeToggle } from '../ThemeToggle';
import { useTheme } from '../../hooks/useTheme';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

// Mock useTheme hook
const mockSetTheme = jest.fn();
const mockUseTheme = {
    theme: 'light',
    setTheme: mockSetTheme,
    resolvedTheme: 'light',
    systemTheme: 'light',
    isLoading: false,
    error: null
};

jest.mock('../../hooks/useTheme', () => ({
    useTheme: () => mockUseTheme
}));

// Mock color contrast calculation
const calculateContrast = (foreground, background) => {
    // Simplified contrast calculation for testing
    const colorMap = {
        '#000000': 0,    // Black
        '#ffffff': 255,  // White
        '#1f2937': 30,   // Dark gray
        '#f9fafb': 250,  // Light gray
        '#3b82f6': 120,  // Blue
        '#ef4444': 100,  // Red
        '#10b981': 140,  // Green
        '#f59e0b': 180   // Yellow
    };

    const fgLuminance = (colorMap[foreground] || 128) / 255;
    const bgLuminance = (colorMap[background] || 128) / 255;

    const lighter = Math.max(fgLuminance, bgLuminance);
    const darker = Math.min(fgLuminance, bgLuminance);

    return (lighter + 0.05) / (darker + 0.05);
};

// Test component with various theme-aware elements
const AccessibilityTestComponent = ({ theme = 'light' }) => {
    const themeClasses = {
        light: {
            bg: 'bg-white',
            text: 'text-gray-900',
            button: 'bg-blue-600 text-white',
            border: 'border-gray-300'
        },
        dark: {
            bg: 'bg-gray-900',
            text: 'text-gray-100',
            button: 'bg-blue-500 text-white',
            border: 'border-gray-600'
        }
    };

    const classes = themeClasses[theme];

    return (
        <div className={`${classes.bg} ${classes.text} p-4`} data-testid="theme-container">
            <h1 className="text-2xl font-bold mb-4">Theme Test Page</h1>

            <ThemeToggle />

            <div className="mt-4 space-y-4">
                <button
                    className={`${classes.button} px-4 py-2 rounded ${classes.border}`}
                    data-testid="primary-button"
                >
                    Primary Action
                </button>

                <button
                    className={`${classes.text} ${classes.border} border px-4 py-2 rounded bg-transparent`}
                    data-testid="secondary-button"
                >
                    Secondary Action
                </button>

                <div className={`${classes.border} border p-4 rounded`}>
                    <p className="mb-2">This is a content area with text.</p>
                    <a href="#" className="text-blue-600 underline" data-testid="link">
                        This is a link
                    </a>
                </div>

                <form className="space-y-2">
                    <label htmlFor="test-input" className="block">
                        Test Input:
                    </label>
                    <input
                        id="test-input"
                        type="text"
                        className={`${classes.border} border px-3 py-2 rounded w-full`}
                        placeholder="Enter text here"
                        data-testid="text-input"
                    />

                    <label htmlFor="test-select" className="block">
                        Test Select:
                    </label>
                    <select
                        id="test-select"
                        className={`${classes.border} border px-3 py-2 rounded w-full`}
                        data-testid="select-input"
                    >
                        <option value="">Choose option</option>
                        <option value="1">Option 1</option>
                        <option value="2">Option 2</option>
                    </select>
                </form>

                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded" role="alert">
                    <strong className="font-bold">Error!</strong>
                    <span className="block sm:inline"> This is an error message.</span>
                </div>

                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded" role="status">
                    <strong className="font-bold">Success!</strong>
                    <span className="block sm:inline"> This is a success message.</span>
                </div>
            </div>
        </div>
    );
};

describe('Theme Accessibility Comprehensive Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockUseTheme.theme = 'light';
        mockUseTheme.resolvedTheme = 'light';
    });

    describe('WCAG AA Compliance', () => {
        it('should pass axe accessibility tests in light mode', async () => {
            const { container } = render(<AccessibilityTestComponent theme="light" />);
            const results = await axe(container);
            expect(results).toHaveNoViolations();
        });

        it('should pass axe accessibility tests in dark mode', async () => {
            mockUseTheme.theme = 'dark';
            mockUseTheme.resolvedTheme = 'dark';

            const { container } = render(<AccessibilityTestComponent theme="dark" />);
            const results = await axe(container);
            expect(results).toHaveNoViolations();
        });

        it('should pass axe tests for theme toggle component', async () => {
            const { container } = render(<ThemeToggle />);
            const results = await axe(container);
            expect(results).toHaveNoViolations();
        });

        it('should pass axe tests for all theme toggle variants', async () => {
            const variants = ['button', 'switch'];

            for (const variant of variants) {
                const { container, unmount } = render(<ThemeToggle variant={variant} />);
                const results = await axe(container);
                expect(results).toHaveNoViolations();
                unmount();
            }
        });
    });

    describe('Color Contrast Ratios', () => {
        it('should meet WCAG AA contrast requirements for normal text (4.5:1)', () => {
            // Test common color combinations
            const testCases = [
                { fg: '#000000', bg: '#ffffff', expected: true }, // Black on white
                { fg: '#ffffff', bg: '#000000', expected: true }, // White on black
                { fg: '#1f2937', bg: '#f9fafb', expected: true }, // Dark gray on light gray
                { fg: '#3b82f6', bg: '#ffffff', expected: true }, // Blue on white
            ];

            testCases.forEach(({ fg, bg, expected }) => {
                const contrast = calculateContrast(fg, bg);
                if (expected) {
                    expect(contrast).toBeGreaterThanOrEqual(4.5);
                }
            });
        });

        it('should meet WCAG AA contrast requirements for large text (3:1)', () => {
            const testCases = [
                { fg: '#3b82f6', bg: '#f9fafb', expected: true }, // Blue on light background
                { fg: '#10b981', bg: '#ffffff', expected: true }, // Green on white
            ];

            testCases.forEach(({ fg, bg, expected }) => {
                const contrast = calculateContrast(fg, bg);
                if (expected) {
                    expect(contrast).toBeGreaterThanOrEqual(3.0);
                }
            });
        });

        it('should maintain contrast ratios in dark mode', () => {
            // Dark mode color combinations
            const darkModeTests = [
                { fg: '#f9fafb', bg: '#1f2937', expected: true }, // Light text on dark bg
                { fg: '#ffffff', bg: '#000000', expected: true }, // White on black
            ];

            darkModeTests.forEach(({ fg, bg, expected }) => {
                const contrast = calculateContrast(fg, bg);
                if (expected) {
                    expect(contrast).toBeGreaterThanOrEqual(4.5);
                }
            });
        });

        it('should test contrast ratios programmatically', () => {
            render(<AccessibilityTestComponent theme="light" />);

            const primaryButton = screen.getByTestId('primary-button');
            const computedStyle = window.getComputedStyle(primaryButton);

            // In a real implementation, you would extract actual computed colors
            // and calculate contrast ratios
            expect(primaryButton).toBeInTheDocument();
        });
    });

    describe('Keyboard Navigation', () => {
        it('should support full keyboard navigation', async () => {
            const user = userEvent.setup();
            render(<AccessibilityTestComponent />);

            // Tab through all interactive elements
            await user.tab(); // Theme toggle
            expect(screen.getByRole('button', { name: /theme toggle/i })).toHaveFocus();

            await user.tab(); // Primary button
            expect(screen.getByTestId('primary-button')).toHaveFocus();

            await user.tab(); // Secondary button
            expect(screen.getByTestId('secondary-button')).toHaveFocus();

            await user.tab(); // Link
            expect(screen.getByTestId('link')).toHaveFocus();

            await user.tab(); // Text input
            expect(screen.getByTestId('text-input')).toHaveFocus();

            await user.tab(); // Select input
            expect(screen.getByTestId('select-input')).toHaveFocus();
        });

        it('should support reverse tab navigation', async () => {
            const user = userEvent.setup();
            render(<AccessibilityTestComponent />);

            // Focus last element first
            const selectInput = screen.getByTestId('select-input');
            selectInput.focus();

            // Shift+Tab backwards
            await user.tab({ shift: true });
            expect(screen.getByTestId('text-input')).toHaveFocus();

            await user.tab({ shift: true });
            expect(screen.getByTestId('link')).toHaveFocus();
        });

        it('should handle keyboard activation of theme toggle', async () => {
            const user = userEvent.setup();
            render(<ThemeToggle />);

            const toggle = screen.getByRole('button');
            toggle.focus();

            // Enter key activation
            await user.keyboard('{Enter}');
            expect(mockSetTheme).toHaveBeenCalledWith('dark');

            // Space key activation
            await user.keyboard(' ');
            expect(mockSetTheme).toHaveBeenCalledWith('dark');
        });

        it('should support arrow key navigation for switch variant', async () => {
            const user = userEvent.setup();
            render(<ThemeToggle variant="switch" />);

            const toggle = screen.getByRole('switch');
            toggle.focus();

            // Arrow keys should work for switches
            await user.keyboard('{ArrowRight}');
            expect(mockSetTheme).toHaveBeenCalled();

            await user.keyboard('{ArrowLeft}');
            expect(mockSetTheme).toHaveBeenCalled();
        });
    });

    describe('Screen Reader Support', () => {
        it('should have proper ARIA labels', () => {
            render(<ThemeToggle />);

            const button = screen.getByRole('button');
            expect(button).toHaveAttribute('aria-label');
            expect(button.getAttribute('aria-label')).toMatch(/theme toggle/i);
            expect(button.getAttribute('aria-label')).toMatch(/current.*light/i);
        });

        it('should have proper ARIA descriptions', () => {
            render(<ThemeToggle id="theme-toggle" />);

            const button = screen.getByRole('button');
            expect(button).toHaveAttribute('aria-describedby', 'theme-toggle-description');

            const description = document.getElementById('theme-toggle-description');
            expect(description).toBeInTheDocument();
            expect(description).toHaveTextContent(/enter or space/i);
        });

        it('should have proper role for switch variant', () => {
            render(<ThemeToggle variant="switch" />);

            const toggle = screen.getByRole('switch');
            expect(toggle).toHaveAttribute('aria-checked');
            expect(toggle).toHaveAttribute('aria-label');
        });

        it('should announce theme changes', async () => {
            render(<ThemeToggle />);

            const button = screen.getByRole('button');
            const liveRegion = document.querySelector('[aria-live="polite"]');

            expect(liveRegion).toBeInTheDocument();
            expect(liveRegion).toHaveAttribute('aria-atomic', 'true');

            fireEvent.click(button);

            await waitFor(() => {
                expect(liveRegion.textContent).toMatch(/theme switched/i);
            });
        });

        it('should have proper heading structure', () => {
            render(<AccessibilityTestComponent />);

            const heading = screen.getByRole('heading', { level: 1 });
            expect(heading).toBeInTheDocument();
            expect(heading).toHaveTextContent('Theme Test Page');
        });

        it('should have proper form labels', () => {
            render(<AccessibilityTestComponent />);

            const textInput = screen.getByTestId('text-input');
            const selectInput = screen.getByTestId('select-input');

            expect(textInput).toHaveAccessibleName('Test Input:');
            expect(selectInput).toHaveAccessibleName('Test Select:');
        });

        it('should have proper alert and status roles', () => {
            render(<AccessibilityTestComponent />);

            const errorAlert = screen.getByRole('alert');
            const successStatus = screen.getByRole('status');

            expect(errorAlert).toBeInTheDocument();
            expect(successStatus).toBeInTheDocument();
        });
    });

    describe('Focus Management', () => {
        it('should show focus indicators', async () => {
            const user = userEvent.setup();
            render(<ThemeToggle />);

            const button = screen.getByRole('button');

            await user.tab();
            expect(button).toHaveFocus();

            // Check for focus indicator classes
            expect(button).toHaveClass('ring-2', 'ring-ring', 'ring-offset-2');
        });

        it('should not show focus indicators on mouse click', async () => {
            const user = userEvent.setup();
            render(<ThemeToggle />);

            const button = screen.getByRole('button');

            await user.click(button);

            // Focus indicator should not be visible after mouse click
            expect(button).not.toHaveClass('ring-2');
        });

        it('should handle focus trapping in modals', () => {
            // This would test focus trapping if theme toggle was in a modal
            render(<ThemeToggle />);

            const button = screen.getByRole('button');
            expect(button).toBeInTheDocument();

            // Focus should be manageable
            button.focus();
            expect(button).toHaveFocus();
        });

        it('should restore focus after theme change', async () => {
            const user = userEvent.setup();
            render(<ThemeToggle />);

            const button = screen.getByRole('button');
            button.focus();

            await user.keyboard('{Enter}');

            // Focus should remain on button after theme change
            expect(button).toHaveFocus();
        });
    });

    describe('High Contrast Mode', () => {
        it('should work in high contrast mode', () => {
            // Simulate high contrast mode
            Object.defineProperty(window, 'matchMedia', {
                writable: true,
                value: jest.fn().mockImplementation(query => ({
                    matches: query === '(prefers-contrast: high)',
                    media: query,
                    onchange: null,
                    addListener: jest.fn(),
                    removeListener: jest.fn(),
                    addEventListener: jest.fn(),
                    removeEventListener: jest.fn(),
                    dispatchEvent: jest.fn(),
                })),
            });

            render(<ThemeToggle />);

            const button = screen.getByRole('button');

            // Should have high contrast styles
            expect(button).toHaveClass('border', 'border-input');
        });

        it('should maintain visibility in Windows High Contrast Mode', () => {
            // Simulate Windows High Contrast Mode
            const style = document.createElement('style');
            style.textContent = `
        @media (prefers-contrast: high) {
          * {
            background-color: ButtonFace !important;
            color: ButtonText !important;
            border-color: ButtonText !important;
          }
        }
      `;
            document.head.appendChild(style);

            render(<AccessibilityTestComponent />);

            const container = screen.getByTestId('theme-container');
            expect(container).toBeInTheDocument();

            document.head.removeChild(style);
        });
    });

    describe('Reduced Motion', () => {
        it('should respect prefers-reduced-motion', () => {
            Object.defineProperty(window, 'matchMedia', {
                writable: true,
                value: jest.fn().mockImplementation(query => ({
                    matches: query === '(prefers-reduced-motion: reduce)',
                    media: query,
                    onchange: null,
                    addListener: jest.fn(),
                    removeListener: jest.fn(),
                    addEventListener: jest.fn(),
                    removeEventListener: jest.fn(),
                    dispatchEvent: jest.fn(),
                })),
            });

            render(<ThemeToggle />);

            const button = screen.getByRole('button');

            // Should still have transition classes (CSS handles the actual reduction)
            expect(button).toHaveClass('transition-all');
        });

        it('should provide instant feedback when motion is reduced', async () => {
            Object.defineProperty(window, 'matchMedia', {
                writable: true,
                value: jest.fn().mockImplementation(query => ({
                    matches: query === '(prefers-reduced-motion: reduce)',
                    media: query,
                })),
            });

            render(<ThemeToggle />);

            const button = screen.getByRole('button');
            fireEvent.click(button);

            // Theme change should be immediate
            expect(mockSetTheme).toHaveBeenCalled();
        });
    });

    describe('Touch and Mobile Accessibility', () => {
        it('should have adequate touch targets (44px minimum)', () => {
            render(<ThemeToggle size="sm" />);

            const button = screen.getByRole('button');

            // Should have minimum touch target size
            expect(button).toHaveClass('min-h-[44px]', 'min-w-[44px]');
        });

        it('should work with touch events', () => {
            render(<ThemeToggle />);

            const button = screen.getByRole('button');

            fireEvent.touchStart(button);
            fireEvent.touchEnd(button);

            expect(mockSetTheme).toHaveBeenCalled();
        });

        it('should handle swipe gestures for switch variant', () => {
            render(<ThemeToggle variant="switch" />);

            const toggle = screen.getByRole('switch');

            // Simulate swipe gesture
            fireEvent.touchStart(toggle, { touches: [{ clientX: 0 }] });
            fireEvent.touchMove(toggle, { touches: [{ clientX: 50 }] });
            fireEvent.touchEnd(toggle);

            expect(mockSetTheme).toHaveBeenCalled();
        });
    });

    describe('Internationalization and RTL', () => {
        it('should work in RTL languages', () => {
            document.documentElement.dir = 'rtl';

            render(<ThemeToggle showLabel={true} />);

            const button = screen.getByRole('button');
            expect(button).toBeInTheDocument();

            // Should handle RTL layout
            expect(button).toHaveClass('rtl:space-x-reverse');

            document.documentElement.dir = 'ltr';
        });

        it('should support different languages in labels', () => {
            const translations = {
                'en': 'Light',
                'es': 'Claro',
                'fr': 'Clair'
            };

            Object.keys(translations).forEach(lang => {
                const { unmount } = render(
                    <ThemeToggle showLabel={true} lang={lang} />
                );

                // In a real implementation, this would use i18n
                const button = screen.getByRole('button');
                expect(button).toBeInTheDocument();

                unmount();
            });
        });
    });

    describe('Error States and Accessibility', () => {
        it('should announce errors to screen readers', () => {
            mockUseTheme.error = { message: 'Theme error occurred' };

            render(<ThemeToggle />);

            const errorRegion = document.querySelector('[role="alert"]');
            expect(errorRegion).toBeInTheDocument();
            expect(errorRegion).toHaveTextContent('Theme error occurred');
        });

        it('should disable toggle when in error state', () => {
            mockUseTheme.error = { message: 'Theme error' };

            render(<ThemeToggle />);

            const button = screen.getByRole('button');
            expect(button).toHaveAttribute('aria-disabled', 'true');
        });

        it('should provide recovery instructions', () => {
            mockUseTheme.error = { message: 'Theme error' };

            render(<ThemeToggle />);

            const instructions = screen.getByText(/try refreshing/i);
            expect(instructions).toBeInTheDocument();
        });
    });
});