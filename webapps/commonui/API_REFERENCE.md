# Theme System API Reference

## Hooks

### useTheme

The primary hook for accessing and controlling theme state.

```typescript
function useTheme(): UseThemeReturn
```

#### Return Value

```typescript
interface UseThemeReturn {
  theme: 'light' | 'dark' | 'system';
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  resolvedTheme: 'light' | 'dark';
  systemTheme: 'light' | 'dark';
  isLoading: boolean;
}
```

#### Properties

- **`theme`** - The user's selected theme preference
- **`setTheme`** - Function to change the theme preference
- **`resolvedTheme`** - The actual theme being applied (resolves 'system' to 'light' or 'dark')
- **`systemTheme`** - The detected system theme preference
- **`isLoading`** - Whether the theme system is still initializing (prevents hydration flash)

#### Example

```jsx
import { useTheme } from '@microrealestate/commonui/hooks/useTheme';

function MyComponent() {
  const { theme, setTheme, resolvedTheme, isLoading } = useTheme();
  
  if (isLoading) {
    return <div>Loading...</div>;
  }
  
  return (
    <div className={`p-4 ${resolvedTheme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
      <p>Current theme: {theme}</p>
      <button onClick={() => setTheme('dark')}>
        Switch to Dark
      </button>
    </div>
  );
}
```

## Components

### ThemeToggle

A customizable theme toggle button component.

```typescript
function ThemeToggle(props: ThemeToggleProps): JSX.Element
```

#### Props

```typescript
interface ThemeToggleProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'button' | 'switch';
  showLabel?: boolean;
  disabled?: boolean;
  'aria-label'?: string;
}
```

#### Props Details

- **`className`** - Additional CSS classes to apply
- **`size`** - Size variant of the toggle button
  - `'sm'` - Small (24px)
  - `'md'` - Medium (32px, default)
  - `'lg'` - Large (40px)
- **`variant`** - Visual style variant
  - `'button'` - Standard button appearance (default)
  - `'switch'` - Toggle switch appearance
- **`showLabel`** - Whether to show text label alongside icon
- **`disabled`** - Whether the toggle is disabled
- **`aria-label`** - Custom accessibility label

#### Examples

```jsx
import { ThemeToggle } from '@microrealestate/commonui/components/ThemeToggle';

// Basic usage
<ThemeToggle />

// With custom styling
<ThemeToggle 
  size="lg" 
  className="border-2 border-blue-500"
  aria-label="Toggle application theme"
/>

// Switch variant with label
<ThemeToggle variant="switch" showLabel />

// Disabled state
<ThemeToggle disabled />
```

### ThemeErrorBoundary

Error boundary component for theme-related errors.

```typescript
function ThemeErrorBoundary(props: ThemeErrorBoundaryProps): JSX.Element
```

#### Props

```typescript
interface ThemeErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}
```

#### Props Details

- **`children`** - Child components to wrap with error boundary
- **`fallback`** - Custom fallback component to render on error
- **`onError`** - Callback function called when an error occurs

#### Example

```jsx
import { ThemeErrorBoundary } from '@microrealestate/commonui/components/ThemeErrorBoundary';

function App() {
  return (
    <ThemeErrorBoundary
      onError={(error, errorInfo) => {
        console.error('Theme error:', error, errorInfo);
      }}
    >
      <ThemeProvider>
        <MyApp />
      </ThemeProvider>
    </ThemeErrorBoundary>
  );
}
```

## Providers

### ThemeProvider (Landlord App)

Theme provider for the landlord application using next-themes.

```typescript
function ThemeProvider(props: ThemeProviderProps): JSX.Element
```

#### Props

```typescript
interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: 'light' | 'dark' | 'system';
  enableSystem?: boolean;
  disableTransitionOnChange?: boolean;
}
```

#### Example

```jsx
// pages/_app.js
import { ThemeProvider } from 'next-themes';

function MyApp({ Component, pageProps }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange={false}
    >
      <Component {...pageProps} />
    </ThemeProvider>
  );
}
```

### ThemeProvider (Tenant App)

Custom theme provider for the tenant application.

```typescript
function ThemeProvider(props: TenantThemeProviderProps): JSX.Element
```

#### Props

```typescript
interface TenantThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: 'light' | 'dark' | 'system';
}
```

#### Example

```tsx
// src/components/providers/ThemeProvider.tsx
import { ThemeProvider } from './ThemeProvider';

function App() {
  return (
    <ThemeProvider defaultTheme="system">
      <YourAppContent />
    </ThemeProvider>
  );
}
```

## Utilities

### Theme Error Handling

Utility functions for handling theme-related errors.

```typescript
// Error handling utilities
function handleThemeError(
  error: Error, 
  options?: ThemeErrorOptions
): void

interface ThemeErrorOptions {
  context?: string;
  fallbackTheme?: 'light' | 'dark';
  silent?: boolean;
}
```

#### Example

```jsx
import { handleThemeError } from '@microrealestate/commonui/utils/themeErrorHandling';

function MyComponent() {
  const { setTheme } = useTheme();
  
  const handleThemeChange = async (newTheme) => {
    try {
      setTheme(newTheme);
    } catch (error) {
      handleThemeError(error, {
        context: 'MyComponent theme change',
        fallbackTheme: 'light',
        silent: false
      });
    }
  };
  
  return (
    <button onClick={() => handleThemeChange('dark')}>
      Switch to Dark
    </button>
  );
}
```

### Theme Performance Utilities

Performance optimization utilities for theme components.

```typescript
// Performance utilities
function useThemeOptimized(): UseThemeReturn
function withThemeOptimization<T>(Component: React.ComponentType<T>): React.ComponentType<T>
```

#### Example

```jsx
import { useThemeOptimized, withThemeOptimization } from '@microrealestate/commonui/utils/themePerformance';

// Optimized hook usage
function OptimizedComponent() {
  const { resolvedTheme } = useThemeOptimized();
  
  return (
    <div className={resolvedTheme === 'dark' ? 'dark-styles' : 'light-styles'}>
      Content
    </div>
  );
}

// HOC for optimization
const OptimizedMyComponent = withThemeOptimization(MyComponent);
```

## CSS Custom Properties

### Available Variables

The theme system provides CSS custom properties for consistent theming:

```css
:root {
  /* Colors */
  --color-background: #ffffff;
  --color-foreground: #111827;
  --color-primary: #3b82f6;
  --color-secondary: #64748b;
  --color-muted: #f1f5f9;
  --color-accent: #f59e0b;
  --color-destructive: #ef4444;
  
  /* Borders */
  --color-border: #e2e8f0;
  --color-input: #e2e8f0;
  --color-ring: #3b82f6;
  
  /* Chart colors */
  --color-chart-1: #3b82f6;
  --color-chart-2: #10b981;
  --color-chart-3: #f59e0b;
  --color-chart-4: #ef4444;
  --color-chart-5: #8b5cf6;
}

.dark {
  /* Dark theme overrides */
  --color-background: #111827;
  --color-foreground: #f9fafb;
  --color-primary: #60a5fa;
  --color-secondary: #94a3b8;
  --color-muted: #1f2937;
  --color-accent: #fbbf24;
  --color-destructive: #f87171;
  
  --color-border: #374151;
  --color-input: #374151;
  --color-ring: #60a5fa;
  
  --color-chart-1: #60a5fa;
  --color-chart-2: #34d399;
  --color-chart-3: #fbbf24;
  --color-chart-4: #f87171;
  --color-chart-5: #a78bfa;
}
```

### Usage in Components

```jsx
function CustomComponent() {
  return (
    <div 
      className="p-4 rounded-lg border transition-colors"
      style={{
        backgroundColor: 'var(--color-background)',
        color: 'var(--color-foreground)',
        borderColor: 'var(--color-border)'
      }}
    >
      <button
        className="px-4 py-2 rounded transition-colors"
        style={{
          backgroundColor: 'var(--color-primary)',
          color: 'white'
        }}
      >
        Primary Button
      </button>
    </div>
  );
}
```

## TypeScript Types

### Core Types

```typescript
// Theme values
type Theme = 'light' | 'dark' | 'system';
type ResolvedTheme = 'light' | 'dark';

// Hook return type
interface UseThemeReturn {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: ResolvedTheme;
  systemTheme: ResolvedTheme;
  isLoading: boolean;
}

// Component prop types
interface ThemeToggleProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'button' | 'switch';
  showLabel?: boolean;
  disabled?: boolean;
  'aria-label'?: string;
}

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
}

// Error handling types
interface ThemeErrorOptions {
  context?: string;
  fallbackTheme?: ResolvedTheme;
  silent?: boolean;
}

// Theme configuration
interface ThemeConfig {
  colors: {
    light: Record<string, string>;
    dark: Record<string, string>;
  };
  transitions: {
    duration: string;
    easing: string;
  };
}
```

### Extending Types

```typescript
// Extend theme types for custom implementations
declare module '@microrealestate/commonui/hooks/useTheme' {
  interface UseThemeReturn {
    // Add custom properties
    customProperty?: string;
  }
}

// Custom theme toggle props
interface CustomThemeToggleProps extends ThemeToggleProps {
  customProp?: boolean;
}
```

## Events

### Theme Change Events

The theme system dispatches custom events for theme changes:

```typescript
// Listen for theme changes
window.addEventListener('themechange', (event: CustomEvent) => {
  console.log('Theme changed to:', event.detail.theme);
  console.log('Resolved theme:', event.detail.resolvedTheme);
});

// Dispatch custom theme event
window.dispatchEvent(new CustomEvent('themechange', {
  detail: {
    theme: 'dark',
    resolvedTheme: 'dark',
    previousTheme: 'light'
  }
}));
```

## Configuration

### Theme Configuration Object

```typescript
interface ThemeSystemConfig {
  // Storage key for theme preference
  storageKey: string;
  
  // Default theme when no preference is saved
  defaultTheme: Theme;
  
  // Whether to enable system theme detection
  enableSystem: boolean;
  
  // CSS attribute to use for theme switching
  attribute: 'class' | 'data-theme';
  
  // Transition settings
  transitions: {
    enabled: boolean;
    duration: number;
    easing: string;
  };
  
  // Error handling settings
  errorHandling: {
    fallbackTheme: ResolvedTheme;
    logErrors: boolean;
    silent: boolean;
  };
}

// Default configuration
const defaultConfig: ThemeSystemConfig = {
  storageKey: 'mre-theme-preference',
  defaultTheme: 'system',
  enableSystem: true,
  attribute: 'class',
  transitions: {
    enabled: true,
    duration: 200,
    easing: 'ease-in-out'
  },
  errorHandling: {
    fallbackTheme: 'light',
    logErrors: true,
    silent: false
  }
};
```

## Migration Guide

### From Manual Theme Management

```jsx
// Before: Manual implementation
const [isDark, setIsDark] = useState(false);

useEffect(() => {
  const saved = localStorage.getItem('theme');
  setIsDark(saved === 'dark');
}, []);

useEffect(() => {
  document.documentElement.classList.toggle('dark', isDark);
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
}, [isDark]);

// After: Using theme system
const { resolvedTheme, setTheme } = useTheme();
const isDark = resolvedTheme === 'dark';
```

### From Other Theme Libraries

```jsx
// From react-use-dark-mode
// Before
import useDarkMode from 'use-dark-mode';
const darkMode = useDarkMode(false);

// After
import { useTheme } from '@microrealestate/commonui/hooks/useTheme';
const { resolvedTheme, setTheme } = useTheme();
const isDark = resolvedTheme === 'dark';
const toggle = () => setTheme(isDark ? 'light' : 'dark');
```

## Browser Support

### Supported Features

- **CSS Custom Properties**: IE11+ (with polyfill)
- **prefers-color-scheme**: Modern browsers (graceful fallback)
- **localStorage**: IE8+
- **matchMedia**: IE10+

### Polyfills

```html
<!-- For IE11 CSS Custom Properties support -->
<script src="https://cdn.jsdelivr.net/npm/css-vars-ponyfill@2"></script>

<!-- For older browsers matchMedia support -->
<script src="https://cdn.jsdelivr.net/npm/matchmedia-polyfill@0.3.2/matchMedia.js"></script>
```

## Performance Considerations

### Bundle Size Impact

- **Core theme system**: ~2KB gzipped
- **ThemeToggle component**: ~1KB gzipped
- **Error handling utilities**: ~0.5KB gzipped
- **Performance utilities**: ~0.5KB gzipped

### Runtime Performance

- **Theme switching**: <16ms (one frame)
- **Initial load**: <5ms
- **Memory usage**: <1MB
- **Re-render impact**: Minimal (optimized context)