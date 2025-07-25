# Design Document

## Overview

This design implements a comprehensive dark mode toggle system for the MicroRealEstate platform. The system leverages the existing Tailwind CSS dark mode configuration and CSS custom properties that are already in place, while adding a centralized theme management system using `next-themes` for the landlord app and a custom implementation for the tenant app.

## Architecture

### Theme Management Strategy

The system uses a hybrid approach:

1. **Landlord App**: Utilizes `next-themes` library (already installed) with React Context for theme state management
2. **Tenant App**: Implements a custom theme provider using React Context and localStorage for persistence
3. **Common UI**: Provides shared theme-aware components that work with both implementations

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Theme Management Layer                    │
├─────────────────────────────────────────────────────────────┤
│  Landlord App          │           Tenant App               │
│  ┌─────────────────┐   │   ┌─────────────────────────────┐  │
│  │ next-themes     │   │   │ Custom Theme Provider       │  │
│  │ ThemeProvider   │   │   │ - React Context             │  │
│  │                 │   │   │ - localStorage persistence  │  │
│  └─────────────────┘   │   └─────────────────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│                    Component Layer                          │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐   ┌─────────────────┐                 │
│  │ Theme Toggle    │   │ Theme-aware     │                 │
│  │ Button          │   │ Components      │                 │
│  └─────────────────┘   └─────────────────┘                 │
├─────────────────────────────────────────────────────────────┤
│                     Styling Layer                          │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ Tailwind CSS + CSS Custom Properties                   │ │
│  │ - :root (light theme variables)                        │ │
│  │ - .dark (dark theme variables)                         │ │
│  │ - Automatic class-based theme switching                │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. Theme Provider Components

#### Landlord App Theme Provider
```typescript
// webapps/landlord/src/components/theme/ThemeProvider.jsx
interface ThemeProviderProps {
  children: React.ReactNode;
}

// Wraps next-themes ThemeProvider with app-specific configuration
```

#### Tenant App Theme Provider
```typescript
// webapps/tenant/src/components/theme/ThemeProvider.tsx
interface ThemeContextValue {
  theme: 'light' | 'dark' | 'system';
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  resolvedTheme: 'light' | 'dark';
}

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: 'light' | 'dark' | 'system';
}
```

### 2. Theme Toggle Component

#### Shared Theme Toggle (CommonUI)
```typescript
// webapps/commonui/components/ThemeToggle.jsx
interface ThemeToggleProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'button' | 'switch';
  showLabel?: boolean;
}
```

The component will:
- Display appropriate icons (sun/moon/system)
- Provide smooth transitions between states
- Support keyboard navigation
- Include ARIA labels for accessibility
- Offer multiple visual variants

### 3. Theme Hook

#### Unified Theme Hook
```typescript
// webapps/commonui/hooks/useTheme.js
interface UseThemeReturn {
  theme: 'light' | 'dark' | 'system';
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  resolvedTheme: 'light' | 'dark';
  systemTheme: 'light' | 'dark';
}
```

## Data Models

### Theme Persistence Model

```typescript
interface ThemePreference {
  theme: 'light' | 'dark' | 'system';
  timestamp: number;
}

// Storage key: 'mre-theme-preference'
// Storage location: localStorage
```

### Theme State Model

```typescript
interface ThemeState {
  // User's explicit choice
  theme: 'light' | 'dark' | 'system';
  
  // Resolved theme (what's actually applied)
  resolvedTheme: 'light' | 'dark';
  
  // System preference detection
  systemTheme: 'light' | 'dark';
  
  // Loading state for hydration
  isLoading: boolean;
}
```

## Error Handling

### Theme Loading Errors
- **Hydration Mismatch**: Prevent flash of incorrect theme during SSR
- **localStorage Access**: Graceful fallback when localStorage is unavailable
- **System Preference Detection**: Default to light theme if media query fails

### Error Recovery Strategies
```typescript
// Fallback hierarchy
1. User's saved preference (localStorage)
2. System preference (prefers-color-scheme)
3. Default to 'light' theme
```

### Error Boundaries
- Theme provider includes error boundary for theme-related failures
- Individual components handle theme application errors gracefully
- Logging for theme-related errors in development mode

## Testing Strategy

### Unit Tests
1. **Theme Provider Tests**
   - Theme state management
   - Persistence functionality
   - System preference detection
   - Error handling scenarios

2. **Theme Toggle Tests**
   - User interaction handling
   - Visual state updates
   - Accessibility compliance
   - Keyboard navigation

3. **Theme Hook Tests**
   - State synchronization
   - Persistence behavior
   - System theme detection

### Integration Tests
1. **Cross-Component Theme Application**
   - Verify theme changes propagate to all components
   - Test theme persistence across page reloads
   - Validate smooth transitions

2. **SSR/Hydration Tests**
   - Prevent theme flashing
   - Ensure consistent server/client rendering
   - Test theme initialization

### Accessibility Tests
1. **WCAG Compliance**
   - Color contrast ratios in both themes
   - Keyboard navigation support
   - Screen reader compatibility

2. **User Experience Tests**
   - Theme toggle responsiveness
   - Visual feedback clarity
   - Transition smoothness

## Implementation Phases

### Phase 1: Foundation Setup
1. Configure theme providers in both applications
2. Set up theme persistence mechanism
3. Create base theme toggle component
4. Implement theme detection utilities

### Phase 2: Component Integration
1. Update existing components to use theme-aware styling
2. Add theme toggle to navigation areas
3. Implement smooth transitions
4. Add accessibility features

### Phase 3: Enhancement & Polish
1. Add advanced theme options (if needed)
2. Implement theme-aware charts and graphs
3. Optimize performance
4. Add comprehensive testing

### Phase 4: Documentation & Deployment
1. Create developer documentation
2. Add user documentation
3. Performance testing
4. Production deployment

## Performance Considerations

### Optimization Strategies
1. **Lazy Loading**: Theme toggle component loaded only when needed
2. **CSS Variables**: Leverage existing CSS custom properties for instant theme switching
3. **Minimal Re-renders**: Optimize context updates to prevent unnecessary re-renders
4. **Bundle Size**: Keep theme management code lightweight

### Monitoring
- Track theme toggle usage analytics
- Monitor theme switching performance
- Measure impact on Core Web Vitals

## Security Considerations

### Data Privacy
- Theme preferences stored locally (no server transmission)
- No sensitive data in theme-related localStorage
- Clear theme data on logout (if required)

### XSS Prevention
- Sanitize any theme-related user inputs
- Validate theme values before application
- Use TypeScript for type safety

## Browser Compatibility

### Supported Features
- CSS Custom Properties (IE11+)
- prefers-color-scheme media query (modern browsers)
- localStorage API (IE8+)
- CSS transitions (IE10+)

### Fallback Strategy
- Graceful degradation for older browsers
- Default to light theme if dark mode unsupported
- Progressive enhancement approach