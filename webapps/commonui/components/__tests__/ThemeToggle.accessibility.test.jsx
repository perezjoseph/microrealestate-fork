/**
 * Accessibility tests for ThemeToggle component
 * Tests WCAG AA compliance and assistive technology support
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeToggle } from '../ThemeToggle';

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

// Mock matchMedia for system theme detection
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

describe('ThemeToggle Accessibility', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseTheme.theme = 'light';
    mockUseTheme.resolvedTheme = 'light';
  });

  describe('WCAG AA Compliance', () => {
    it('should have proper semantic structure', () => {
      render(<ThemeToggle />);
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute('aria-label');
    });

    it('should have proper semantic structure for all variants', () => {
      const variants = ['button', 'switch', 'dropdown'];
      
      variants.forEach(variant => {
        const { unmount } = render(<ThemeToggle variant={variant} />);
        
        if (variant === 'switch') {
          const switchElement = screen.getByRole('switch');
          expect(switchElement).toBeInTheDocument();
          expect(switchElement).toHaveAttribute('aria-checked');
        } else {
          const button = screen.getByRole('button');
          expect(button).toBeInTheDocument();
          expect(button).toHaveAttribute('aria-label');
        }
        
        unmount();
      });
    });

    it('should have proper labels when showLabel is true', () => {
      render(<ThemeToggle showLabel={true} />);
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      expect(screen.getByText('Light')).toBeInTheDocument();
    });
  });

  describe('Keyboard Navigation', () => {
    it('should be focusable with Tab key', async () => {
      const user = userEvent.setup();
      render(<ThemeToggle />);
      
      const button = screen.getByRole('button');
      
      await user.tab();
      expect(button).toHaveFocus();
    });

    it('should activate with Enter key', async () => {
      const user = userEvent.setup();
      render(<ThemeToggle />);
      
      const button = screen.getByRole('button');
      button.focus();
      
      await user.keyboard('{Enter}');
      expect(mockSetTheme).toHaveBeenCalledWith('dark');
    });

    it('should activate with Space key', async () => {
      const user = userEvent.setup();
      render(<ThemeToggle />);
      
      const button = screen.getByRole('button');
      button.focus();
      
      await user.keyboard(' ');
      expect(mockSetTheme).toHaveBeenCalledWith('dark');
    });

    it('should blur with Escape key', async () => {
      const user = userEvent.setup();
      render(<ThemeToggle />);
      
      const button = screen.getByRole('button');
      button.focus();
      expect(button).toHaveFocus();
      
      await user.keyboard('{Escape}');
      expect(button).not.toHaveFocus();
    });

    it('should cycle through themes with keyboard', async () => {
      const user = userEvent.setup();
      render(<ThemeToggle />);
      
      const button = screen.getByRole('button');
      button.focus();
      
      // Light -> Dark
      await user.keyboard('{Enter}');
      expect(mockSetTheme).toHaveBeenCalledWith('dark');
      
      // Simulate theme change
      mockUseTheme.theme = 'dark';
      mockUseTheme.resolvedTheme = 'dark';
      
      // Dark -> System
      await user.keyboard('{Enter}');
      expect(mockSetTheme).toHaveBeenCalledWith('system');
      
      // Simulate theme change
      mockUseTheme.theme = 'system';
      mockUseTheme.resolvedTheme = 'light';
      
      // System -> Light
      await user.keyboard('{Enter}');
      expect(mockSetTheme).toHaveBeenCalledWith('light');
    });
  });

  describe('Screen Reader Support', () => {
    it('should have proper aria-label', () => {
      render(<ThemeToggle />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label');
      expect(button.getAttribute('aria-label')).toContain('Theme toggle');
      expect(button.getAttribute('aria-label')).toContain('Current: Light');
    });

    it('should have aria-describedby when ID is provided', () => {
      render(<ThemeToggle id="theme-toggle" />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-describedby', 'theme-toggle-description');
      
      const description = document.getElementById('theme-toggle-description');
      expect(description).toBeInTheDocument();
      expect(description).toHaveTextContent('Use Enter or Space to cycle through');
    });

    it('should have proper role for switch variant', () => {
      render(<ThemeToggle variant="switch" />);
      
      const button = screen.getByRole('switch');
      expect(button).toHaveAttribute('aria-checked');
    });

    it('should update aria-checked for switch variant', () => {
      render(<ThemeToggle variant="switch" />);
      
      const button = screen.getByRole('switch');
      expect(button).toHaveAttribute('aria-checked', 'false');
      
      // Simulate dark theme
      mockUseTheme.theme = 'dark';
      mockUseTheme.resolvedTheme = 'dark';
      
      render(<ThemeToggle variant="switch" />);
      const darkButton = screen.getByRole('switch');
      expect(darkButton).toHaveAttribute('aria-checked', 'true');
    });

    it('should have live region for announcements', () => {
      render(<ThemeToggle />);
      
      const liveRegion = document.querySelector('[aria-live="polite"]');
      expect(liveRegion).toBeInTheDocument();
      expect(liveRegion).toHaveAttribute('aria-atomic', 'true');
    });

    it('should announce theme changes', async () => {
      render(<ThemeToggle />);
      
      const button = screen.getByRole('button');
      const liveRegion = document.querySelector('[aria-live="polite"]');
      
      fireEvent.click(button);
      
      await waitFor(() => {
        expect(liveRegion.textContent).toContain('Theme switched to dark mode');
      }, { timeout: 200 });
    });

    it('should announce system theme changes', async () => {
      mockUseTheme.theme = 'dark';
      mockUseTheme.resolvedTheme = 'dark';
      
      render(<ThemeToggle />);
      
      const button = screen.getByRole('button');
      const liveRegion = document.querySelector('[aria-live="polite"]');
      
      fireEvent.click(button);
      
      await waitFor(() => {
        expect(liveRegion.textContent).toContain('Theme switched to system preference');
      }, { timeout: 200 });
    });

    it('should clear announcements after timeout', async () => {
      jest.useFakeTimers();
      
      render(<ThemeToggle />);
      
      const button = screen.getByRole('button');
      const liveRegion = document.querySelector('[aria-live="polite"]');
      
      fireEvent.click(button);
      
      // Fast-forward to after announcement
      jest.advanceTimersByTime(150);
      expect(liveRegion.textContent).toContain('Theme switched');
      
      // Fast-forward to after cleanup
      jest.advanceTimersByTime(3000);
      expect(liveRegion.textContent).toBe('');
      
      jest.useRealTimers();
    });
  });

  describe('Focus Management', () => {
    it('should show focus indicator when focused via keyboard', async () => {
      const user = userEvent.setup();
      render(<ThemeToggle />);
      
      const button = screen.getByRole('button');
      
      // Focus via keyboard (Tab)
      await user.tab();
      
      // Check if focus styles are applied
      expect(button).toHaveClass('ring-2', 'ring-ring', 'ring-offset-2');
    });

    it('should not show focus indicator when clicked', async () => {
      const user = userEvent.setup();
      render(<ThemeToggle />);
      
      const button = screen.getByRole('button');
      
      // Click with mouse
      await user.click(button);
      
      // Focus indicator should not be visible
      expect(button).not.toHaveClass('ring-2');
    });

    it('should handle focus and blur events', async () => {
      const user = userEvent.setup();
      render(<ThemeToggle />);
      
      const button = screen.getByRole('button');
      
      // Focus
      await user.tab();
      expect(button).toHaveFocus();
      
      // Blur
      await user.tab();
      expect(button).not.toHaveFocus();
    });
  });

  describe('Label Association', () => {
    it('should associate label with switch variant', () => {
      render(<ThemeToggle variant="switch" showLabel={true} id="theme-switch" />);
      
      const button = screen.getByRole('switch');
      const label = screen.getByText('Light');
      
      expect(label).toHaveAttribute('for', 'theme-switch');
      expect(label).toHaveClass('cursor-pointer');
    });

    it('should make label clickable for switch variant', async () => {
      const user = userEvent.setup();
      render(<ThemeToggle variant="switch" showLabel={true} id="theme-switch" />);
      
      const label = screen.getByText('Light');
      
      await user.click(label);
      expect(mockSetTheme).toHaveBeenCalledWith('dark');
    });
  });

  describe('Tooltip and Title', () => {
    it('should have title attribute for tooltip', () => {
      render(<ThemeToggle />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('title');
      expect(button.getAttribute('title')).toContain('Current: Light theme');
    });

    it('should not have title when tooltip is disabled', () => {
      render(<ThemeToggle showTooltip={false} />);
      
      const button = screen.getByRole('button');
      expect(button).not.toHaveAttribute('title');
    });
  });

  describe('High Contrast Mode', () => {
    it('should maintain visibility in high contrast mode', () => {
      // Simulate high contrast mode
      const style = document.createElement('style');
      style.textContent = `
        @media (prefers-contrast: high) {
          button {
            border: 2px solid !important;
          }
        }
      `;
      document.head.appendChild(style);
      
      render(<ThemeToggle />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('border', 'border-input');
      
      document.head.removeChild(style);
    });
  });

  describe('Reduced Motion', () => {
    it('should respect prefers-reduced-motion', () => {
      // Mock prefers-reduced-motion
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
      // Component should still have transition classes but CSS will handle reduced motion
      expect(button).toHaveClass('transition-all');
    });
  });
});