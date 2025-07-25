# Implementation Plan

## Foundation (Already Complete)
- [x] Tailwind CSS dark mode configuration (`darkMode: ['class']`) - Already configured in both apps
- [x] CSS custom properties for light and dark themes - Already defined in both apps' globals.css
- [x] next-themes dependency - Already installed in landlord app

## Implementation Tasks

- [x] 1. Create theme provider for landlord application
  - Wrap landlord application with next-themes ThemeProvider in _app.js
  - Configure ThemeProvider with proper attributes and default theme
  - Ensure proper SSR handling to prevent theme flashing during hydration
  - _Requirements: 1.2, 1.3, 3.1, 3.2, 3.3_

- [x] 2. Create custom theme provider for tenant application
  - Install next-themes dependency in tenant app package.json
  - Create custom theme provider using React Context and localStorage for persistence
  - Implement system theme detection using prefers-color-scheme media query
  - Add theme provider to tenant app layout with proper SSR handling
  - _Requirements: 1.2, 1.3, 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 3. Create shared theme toggle component in CommonUI
  - Implement theme toggle button component with multiple variants (button/switch)
  - Add proper ARIA labels and keyboard navigation support for accessibility
  - Include smooth transitions and visual feedback for theme changes
  - Support different sizes and styling options for various use cases
  - Add sun/moon/system icons with appropriate visual states
  - _Requirements: 1.1, 2.1, 2.2, 4.1, 4.2, 4.3, 4.4_

- [x] 4. Create unified theme hook for consistent API
  - Implement useTheme hook that works with both next-themes and custom provider
  - Provide consistent interface for theme state and theme switching functions
  - Handle loading states and hydration properly across both applications
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [x] 5. Add theme toggle to navigation components
  - Integrate theme toggle button into landlord app Layout component header area
  - Add theme toggle to tenant app AppHeader component (bars/app-header.tsx)
  - Position toggle buttons for optimal user accessibility and visual hierarchy
  - _Requirements: 1.1, 4.1, 4.2, 4.3_

- [x] 6. Update existing components for dark mode compatibility
  - Review and update Material-UI components in landlord app for dark theme support
  - Ensure all form components maintain proper contrast and visibility in dark mode
  - Update chart and graph components (recharts) to use theme-appropriate colors
  - Verify modal, dialog, and overlay components work correctly in both themes
  - Test Radix UI components in both apps for proper dark mode styling
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 5.1, 5.2, 5.3, 5.4_

- [x] 7. Implement theme-aware styling for data visualization
  - Update recharts components to use CSS custom properties for theme-aware colors
  - Ensure proper contrast for chart elements in both light and dark modes
  - Test data tables with row striping and hover states in dark theme
  - Update chart color variables in both apps' globals.css if needed
  - _Requirements: 2.1, 2.2, 5.4_

- [x] 8. Add comprehensive error handling and fallbacks
  - Implement error boundaries for theme-related failures
  - Add graceful fallbacks when localStorage is unavailable
  - Handle system theme detection failures with appropriate defaults
  - Log theme-related errors in development mode for debugging
  - _Requirements: 1.2, 1.3, 3.1, 3.2, 3.3_

- [x] 9. Implement accessibility enhancements
  - Ensure all theme toggle components meet WCAG AA contrast requirements
  - Add proper focus indicators and keyboard navigation support
  - Include screen reader announcements for theme changes
  - Test with assistive technologies to verify accessibility compliance
  - _Requirements: 2.1, 2.2, 4.2, 4.3_

- [x] 10. Create comprehensive test suite
  - Write unit tests for theme providers, hooks, and toggle components
  - Add integration tests for theme persistence and cross-component updates
  - Implement accessibility tests for contrast ratios and keyboard navigation
  - Create tests for SSR hydration and theme flashing prevention
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 3.1, 3.2, 3.3, 4.1, 4.2, 4.3_

- [x] 11. Optimize performance and bundle size
  - Implement lazy loading for theme toggle component when appropriate
  - Optimize context updates to minimize unnecessary re-renders
  - Ensure theme switching performance meets user experience standards
  - Monitor and optimize bundle size impact of theme management code
  - _Requirements: 1.1, 3.1, 3.2, 3.3_

- [x] 12. Add developer documentation and examples
  - Create documentation for theme system usage and best practices
  - Add code examples for implementing theme-aware components
  - Document the theme provider APIs and available hooks
  - Include troubleshooting guide for common theme-related issues
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_