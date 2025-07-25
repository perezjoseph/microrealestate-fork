# MicroRealEstate Theme System Documentation

## Overview

The MicroRealEstate theme system provides a comprehensive dark mode toggle implementation across both landlord and tenant applications. The system is built with performance, accessibility, and developer experience in mind.

## Architecture

### System Components

```
Theme System Architecture
├── Theme Providers
│   ├── Landlord App (next-themes)
│   └── Tenant App (Custom React Context)
├── Shared Components (CommonUI)
│   ├── ThemeToggle
│   ├── ThemeErrorBoundary
│   └── Utility Components
├── Hooks & Utilities
│   ├── useTheme (Unified API)
│   ├── Theme Error Handling
│   └── Performance Utilities
└── Styling Layer
    ├── Tailwind CSS (class-based)
    └── CSS Custom Properties
```

### Key Features

- **Unified API**: Consistent theme management across both applications
- **Performance Optimized**: Minimal re-renders and bundle size impact
- **Accessibility First**: WCAG AA compliant with full keyboard navigation
- **SSR Compatible**: Prevents theme flashing during hydration
- **Error Resilient**: Comprehensive error handling and fallbacks
- **Developer Friendly**: Rich debugging tools and clear APIs

## Quick Start

### 1. Basic Theme Toggle Implementation

```jsx
import { ThemeToggle } from '@microrealestate/commonui/components/ThemeToggle';

function Header() {
  return (
    <header className="flex justify-between items-center p-4">
      <h1>My App</h1>
      <ThemeToggle />
    </header>
  );
}
```

### 2. Using the Theme Hook

```jsx
import { useTheme } from '@microrealestate/commonui/hooks/useTheme';

function MyComponent() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  
  return (
    <div className={`p-4 ${resolvedTheme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
      <p>Current theme: {theme}</p>
      <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
        Toggle Theme
      </button>
    </div>
  );
}
```

### 3. Theme-Aware Component

```jsx
function Card({ children, className = '' }) {
  return (
    <div className={`
      rounded-lg border p-4 shadow-sm
      bg-white dark:bg-gray-800
      border-gray-200 dark:border-gray-700
      text-gray-900 dark:text-gray-100
      ${className}
    `}>
      {children}
    </div>
  );
}
```

## API Reference

### useTheme Hook

The unified theme hook provides consistent API across both applications.

```typescript
interface UseThemeReturn {
  theme: 'light' | 'dark' | 'system';
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  resolvedTheme: 'light' | 'dark';
  systemTheme: 'light' | 'dark';
  isLoading: boolean;
}

const useTheme: () => UseThemeReturn;
```

#### Usage Examples

```jsx
// Basic theme switching
const { theme, setTheme } = useTheme();

// Check resolved theme for styling
const { resolvedTheme } = useTheme();
const isDark = resolvedTheme === 'dark';

// Handle loading state during hydration
const { isLoading, resolvedTheme } = useTheme();
if (isLoading) return <div>Loading theme...</div>;

// System theme detection
const { systemTheme } = useTheme();
console.log('System prefers:', systemTheme);
```

### ThemeToggle Component

Customizable theme toggle button with multiple variants.

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

#### Variants and Customization

```jsx
// Default button variant
<ThemeToggle />

// Switch variant with label
<ThemeToggle variant="switch" showLabel />

// Custom styling and size
<ThemeToggle 
  size="lg" 
  className="border-2 border-blue-500"
  aria-label="Toggle application theme"
/>

// Disabled state
<ThemeToggle disabled />
```

### Theme Providers

#### Landlord App (next-themes)

```jsx
// webapps/landlord/src/pages/_app.js
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

#### Tenant App (Custom Provider)

```tsx
// webapps/tenant/src/components/providers/ThemeProvider.tsx
import { ThemeProvider } from './ThemeProvider';

function App() {
  return (
    <ThemeProvider defaultTheme="system">
      <YourAppContent />
    </ThemeProvider>
  );
}
```

## Advanced Usage

### Custom Theme-Aware Components

#### Using CSS Custom Properties

```jsx
function CustomChart() {
  return (
    <div 
      className="chart-container"
      style={{
        '--chart-primary': 'var(--color-primary)',
        '--chart-secondary': 'var(--color-secondary)',
        '--chart-background': 'var(--color-background)'
      }}
    >
      {/* Chart implementation */}
    </div>
  );
}
```

#### Dynamic Theme Classes

```jsx
import { useTheme } from '@microrealestate/commonui/hooks/useTheme';

function DataTable({ data }) {
  const { resolvedTheme } = useTheme();
  
  const getRowClassName = (index) => {
    const baseClasses = 'border-b transition-colors';
    const lightClasses = 'hover:bg-gray-50 even:bg-gray-25';
    const darkClasses = 'hover:bg-gray-800 even:bg-gray-850';
    
    return `${baseClasses} ${resolvedTheme === 'dark' ? darkClasses : lightClasses}`;
  };
  
  return (
    <table className="w-full">
      <tbody>
        {data.map((row, index) => (
          <tr key={row.id} className={getRowClassName(index)}>
            {/* Row content */}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

### Performance Optimization

#### Memoizing Theme-Dependent Values

```jsx
import { useMemo } from 'react';
import { useTheme } from '@microrealestate/commonui/hooks/useTheme';

function ExpensiveThemeComponent() {
  const { resolvedTheme } = useTheme();
  
  const themeConfig = useMemo(() => ({
    colors: resolvedTheme === 'dark' 
      ? { primary: '#3b82f6', secondary: '#64748b' }
      : { primary: '#1e40af', secondary: '#475569' },
    animations: resolvedTheme === 'dark' ? 'reduced' : 'full'
  }), [resolvedTheme]);
  
  return <ComplexVisualization config={themeConfig} />;
}
```

#### Lazy Loading Theme Components

```jsx
import { lazy, Suspense } from 'react';

const ThemeToggle = lazy(() => 
  import('@microrealestate/commonui/components/ThemeToggle')
);

function Header() {
  return (
    <header>
      <h1>My App</h1>
      <Suspense fallback={<div className="w-8 h-8" />}>
        <ThemeToggle />
      </Suspense>
    </header>
  );
}
```

## Error Handling

### Using Theme Error Boundary

```jsx
import { ThemeErrorBoundary } from '@microrealestate/commonui/components/ThemeErrorBoundary';

function App() {
  return (
    <ThemeErrorBoundary>
      <ThemeProvider>
        <YourAppContent />
      </ThemeProvider>
    </ThemeErrorBoundary>
  );
}
```

### Custom Error Handling

```jsx
import { useTheme } from '@microrealestate/commonui/hooks/useTheme';
import { handleThemeError } from '@microrealestate/commonui/utils/themeErrorHandling';

function MyComponent() {
  const { setTheme } = useTheme();
  
  const handleThemeChange = async (newTheme) => {
    try {
      setTheme(newTheme);
    } catch (error) {
      handleThemeError(error, {
        context: 'MyComponent theme change',
        fallbackTheme: 'light'
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

## Testing

### Testing Theme Components

```jsx
import { render, screen } from '@testing-library/react';
import { ThemeTestProvider } from '@microrealestate/commonui/test-utils';
import MyComponent from './MyComponent';

describe('MyComponent', () => {
  it('renders correctly in dark mode', () => {
    render(
      <ThemeTestProvider theme="dark">
        <MyComponent />
      </ThemeTestProvider>
    );
    
    expect(screen.getByRole('button')).toHaveClass('dark:bg-gray-800');
  });
  
  it('handles theme changes', async () => {
    const { rerender } = render(
      <ThemeTestProvider theme="light">
        <MyComponent />
      </ThemeTestProvider>
    );
    
    // Test light mode
    expect(screen.getByText('Light mode active')).toBeInTheDocument();
    
    // Switch to dark mode
    rerender(
      <ThemeTestProvider theme="dark">
        <MyComponent />
      </ThemeTestProvider>
    );
    
    expect(screen.getByText('Dark mode active')).toBeInTheDocument();
  });
});
```

### Accessibility Testing

```jsx
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

describe('Theme Accessibility', () => {
  it('meets accessibility standards in both themes', async () => {
    const { container: lightContainer } = render(
      <ThemeTestProvider theme="light">
        <ThemeToggle />
      </ThemeTestProvider>
    );
    
    const lightResults = await axe(lightContainer);
    expect(lightResults).toHaveNoViolations();
    
    const { container: darkContainer } = render(
      <ThemeTestProvider theme="dark">
        <ThemeToggle />
      </ThemeTestProvider>
    );
    
    const darkResults = await axe(darkContainer);
    expect(darkResults).toHaveNoViolations();
  });
});
```

## Best Practices

### 1. Theme-First Design

Always design components to work in both themes from the start:

```jsx
// ✅ Good: Theme-aware from the beginning
function Button({ children, variant = 'primary' }) {
  const baseClasses = 'px-4 py-2 rounded font-medium transition-colors';
  const variantClasses = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-500 dark:hover:bg-blue-600',
    secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-900 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-100'
  };
  
  return (
    <button className={`${baseClasses} ${variantClasses[variant]}`}>
      {children}
    </button>
  );
}

// ❌ Bad: Theme added as afterthought
function Button({ children }) {
  return (
    <button className="px-4 py-2 bg-blue-600 text-white">
      {children}
    </button>
  );
}
```

### 2. Use CSS Custom Properties for Complex Theming

```css
/* globals.css */
:root {
  --color-primary: #3b82f6;
  --color-primary-hover: #2563eb;
  --color-background: #ffffff;
  --color-text: #111827;
}

.dark {
  --color-primary: #60a5fa;
  --color-primary-hover: #3b82f6;
  --color-background: #111827;
  --color-text: #f9fafb;
}
```

```jsx
// Use in components
function CustomComponent() {
  return (
    <div 
      className="p-4 transition-colors"
      style={{
        backgroundColor: 'var(--color-background)',
        color: 'var(--color-text)'
      }}
    >
      <button 
        className="px-4 py-2 rounded transition-colors"
        style={{
          backgroundColor: 'var(--color-primary)',
          color: 'white'
        }}
        onMouseEnter={(e) => {
          e.target.style.backgroundColor = 'var(--color-primary-hover)';
        }}
      >
        Custom Button
      </button>
    </div>
  );
}
```

### 3. Optimize Performance

```jsx
// ✅ Good: Memoize theme-dependent calculations
const ThemeAwareChart = memo(({ data }) => {
  const { resolvedTheme } = useTheme();
  
  const chartConfig = useMemo(() => ({
    colors: resolvedTheme === 'dark' ? DARK_COLORS : LIGHT_COLORS,
    grid: resolvedTheme === 'dark' ? DARK_GRID : LIGHT_GRID
  }), [resolvedTheme]);
  
  return <Chart data={data} config={chartConfig} />;
});

// ❌ Bad: Recalculating on every render
function ThemeAwareChart({ data }) {
  const { resolvedTheme } = useTheme();
  
  const chartConfig = {
    colors: resolvedTheme === 'dark' ? DARK_COLORS : LIGHT_COLORS,
    grid: resolvedTheme === 'dark' ? DARK_GRID : LIGHT_GRID
  };
  
  return <Chart data={data} config={chartConfig} />;
}
```

### 4. Handle Loading States

```jsx
function ThemeAwareComponent() {
  const { isLoading, resolvedTheme } = useTheme();
  
  // Prevent flash of incorrect theme
  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      </div>
    );
  }
  
  return (
    <div className={resolvedTheme === 'dark' ? 'dark-styles' : 'light-styles'}>
      {/* Component content */}
    </div>
  );
}
```

### 5. Accessibility Considerations

```jsx
function AccessibleThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  
  return (
    <button
      onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
      aria-label={`Switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} mode`}
      aria-pressed={resolvedTheme === 'dark'}
      className="p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      <span className="sr-only">
        Current theme: {resolvedTheme}. Click to switch to {resolvedTheme === 'dark' ? 'light' : 'dark'} mode.
      </span>
      {resolvedTheme === 'dark' ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}
```

## Migration Guide

### From Manual Theme Management

If you have existing manual theme management:

```jsx
// Before: Manual theme management
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

### Updating Existing Components

```jsx
// Before: Hard-coded colors
function OldComponent() {
  return (
    <div className="bg-white text-black border-gray-300">
      Content
    </div>
  );
}

// After: Theme-aware
function NewComponent() {
  return (
    <div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600">
      Content
    </div>
  );
}
```

## Next Steps

1. **Explore Examples**: Check the `/examples` directory for complete implementations
2. **Run Tests**: Use `yarn test:theme` to run theme-related tests
3. **Performance Analysis**: Use `yarn analyze:theme` to check bundle impact
4. **Accessibility Audit**: Run `yarn a11y:theme` for accessibility validation

## Support

For questions or issues:
1. Check the troubleshooting guide below
2. Review existing tests for usage patterns
3. Create an issue in the project repository