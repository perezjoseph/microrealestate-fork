# Theme System Best Practices

## Design Principles

### 1. Theme-First Development

Always design components with both themes in mind from the beginning:

```jsx
// ✅ Good: Designed for both themes
function Card({ children, variant = 'default' }) {
  const variants = {
    default: 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700',
    primary: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
    danger: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
  };
  
  return (
    <div className={`p-4 rounded-lg border ${variants[variant]} transition-colors`}>
      {children}
    </div>
  );
}

// ❌ Bad: Only considers light theme
function Card({ children }) {
  return (
    <div className="p-4 bg-white border-gray-200 rounded-lg">
      {children}
    </div>
  );
}
```

### 2. Consistent Color Patterns

Use consistent color patterns across your application:

```jsx
// ✅ Good: Consistent color patterns
const colorPatterns = {
  background: 'bg-white dark:bg-gray-800',
  text: 'text-gray-900 dark:text-gray-100',
  textMuted: 'text-gray-600 dark:text-gray-400',
  border: 'border-gray-200 dark:border-gray-700',
  hover: 'hover:bg-gray-50 dark:hover:bg-gray-700'
};

function Button({ children, variant = 'primary' }) {
  const baseClasses = `px-4 py-2 rounded font-medium transition-colors ${colorPatterns.text}`;
  
  const variants = {
    primary: `${baseClasses} bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white`,
    secondary: `${baseClasses} ${colorPatterns.background} ${colorPatterns.border} border ${colorPatterns.hover}`
  };
  
  return (
    <button className={variants[variant]}>
      {children}
    </button>
  );
}
```

### 3. Semantic Color Usage

Use semantic colors that convey meaning:

```jsx
// ✅ Good: Semantic color usage
const semanticColors = {
  success: 'text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900/20',
  warning: 'text-yellow-700 dark:text-yellow-300 bg-yellow-50 dark:bg-yellow-900/20',
  error: 'text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/20',
  info: 'text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/20'
};

function Alert({ type, children }) {
  return (
    <div className={`p-4 rounded-lg border ${semanticColors[type]}`}>
      {children}
    </div>
  );
}
```

## Performance Optimization

### 1. Memoize Theme-Dependent Calculations

```jsx
import { useMemo } from 'react';
import { useTheme } from '@microrealestate/commonui/hooks/useTheme';

// ✅ Good: Memoized calculations
function ExpensiveChart({ data }) {
  const { resolvedTheme } = useTheme();
  
  const chartConfig = useMemo(() => ({
    colors: resolvedTheme === 'dark' ? DARK_CHART_COLORS : LIGHT_CHART_COLORS,
    grid: resolvedTheme === 'dark' ? DARK_GRID_CONFIG : LIGHT_GRID_CONFIG,
    animations: resolvedTheme === 'dark' ? 'reduced' : 'full'
  }), [resolvedTheme]);
  
  const processedData = useMemo(() => 
    processChartData(data, chartConfig), 
    [data, chartConfig]
  );
  
  return <Chart data={processedData} config={chartConfig} />;
}

// ❌ Bad: Recalculating on every render
function ExpensiveChart({ data }) {
  const { resolvedTheme } = useTheme();
  
  const chartConfig = {
    colors: resolvedTheme === 'dark' ? DARK_CHART_COLORS : LIGHT_CHART_COLORS,
    grid: resolvedTheme === 'dark' ? DARK_GRID_CONFIG : LIGHT_GRID_CONFIG
  };
  
  return <Chart data={processChartData(data, chartConfig)} config={chartConfig} />;
}
```

### 2. Use CSS Custom Properties for Instant Updates

```css
/* ✅ Good: CSS custom properties for instant theme switching */
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

.my-component {
  background-color: var(--color-background);
  color: var(--color-text);
  transition: background-color 0.2s, color 0.2s;
}

.my-button {
  background-color: var(--color-primary);
  transition: background-color 0.2s;
}

.my-button:hover {
  background-color: var(--color-primary-hover);
}
```

### 3. Optimize Context Usage

```jsx
// ✅ Good: Separate contexts for different update frequencies
const ThemeContext = createContext();
const ResolvedThemeContext = createContext();

function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('system');
  const [resolvedTheme, setResolvedTheme] = useState('light');
  
  // Memoize values to prevent unnecessary re-renders
  const themeValue = useMemo(() => ({ theme, setTheme }), [theme]);
  const resolvedValue = useMemo(() => ({ resolvedTheme }), [resolvedTheme]);
  
  return (
    <ThemeContext.Provider value={themeValue}>
      <ResolvedThemeContext.Provider value={resolvedValue}>
        {children}
      </ResolvedThemeContext.Provider>
    </ThemeContext.Provider>
  );
}

// Separate hooks for different needs
function useThemeControl() {
  return useContext(ThemeContext);
}

function useResolvedTheme() {
  return useContext(ResolvedThemeContext);
}
```

## Accessibility Best Practices

### 1. Proper ARIA Attributes

```jsx
// ✅ Good: Comprehensive accessibility
function AccessibleThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [announcement, setAnnouncement] = useState('');
  
  const handleToggle = () => {
    const newTheme = resolvedTheme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    
    // Announce to screen readers
    setAnnouncement(`Theme changed to ${newTheme} mode`);
    setTimeout(() => setAnnouncement(''), 1000);
  };
  
  return (
    <>
      <button
        onClick={handleToggle}
        aria-label={`Switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} mode`}
        aria-pressed={resolvedTheme === 'dark'}
        className="
          p-2 rounded-md
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
          dark:focus:ring-offset-gray-800
          hover:bg-gray-100 dark:hover:bg-gray-700
          transition-colors duration-200
        "
      >
        <span className="sr-only">
          Current theme is {resolvedTheme}. 
          Click to switch to {resolvedTheme === 'dark' ? 'light' : 'dark'} theme.
        </span>
        {resolvedTheme === 'dark' ? <SunIcon /> : <MoonIcon />}
      </button>
      
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {announcement}
      </div>
    </>
  );
}
```

### 2. Keyboard Navigation Support

```jsx
// ✅ Good: Full keyboard support
function KeyboardFriendlyThemeSelector() {
  const { theme, setTheme } = useTheme();
  const [focusedIndex, setFocusedIndex] = useState(0);
  const themes = ['light', 'dark', 'system'];
  
  const handleKeyDown = (event, index) => {
    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        event.preventDefault();
        const nextIndex = (index + 1) % themes.length;
        setFocusedIndex(nextIndex);
        break;
        
      case 'ArrowLeft':
      case 'ArrowUp':
        event.preventDefault();
        const prevIndex = (index - 1 + themes.length) % themes.length;
        setFocusedIndex(prevIndex);
        break;
        
      case 'Enter':
      case ' ':
        event.preventDefault();
        setTheme(themes[index]);
        break;
    }
  };
  
  return (
    <div role="radiogroup" aria-label="Theme selection">
      {themes.map((themeOption, index) => (
        <button
          key={themeOption}
          role="radio"
          aria-checked={theme === themeOption}
          tabIndex={focusedIndex === index ? 0 : -1}
          onKeyDown={(e) => handleKeyDown(e, index)}
          onFocus={() => setFocusedIndex(index)}
          onClick={() => setTheme(themeOption)}
        >
          {themeOption}
        </button>
      ))}
    </div>
  );
}
```

### 3. Color Contrast Compliance

```jsx
// ✅ Good: WCAG AA compliant colors
const accessibleColors = {
  // Light theme - ensure 4.5:1 contrast ratio for normal text
  light: {
    background: '#ffffff',
    text: '#111827',        // 16.75:1 contrast
    textMuted: '#4b5563',   // 7.59:1 contrast
    primary: '#1e40af',     // 8.59:1 contrast
    border: '#d1d5db'
  },
  
  // Dark theme - ensure 4.5:1 contrast ratio for normal text
  dark: {
    background: '#111827',
    text: '#f9fafb',        // 16.75:1 contrast
    textMuted: '#9ca3af',   // 7.59:1 contrast
    primary: '#60a5fa',     // 8.59:1 contrast
    border: '#374151'
  }
};

function AccessibleText({ variant = 'default', children }) {
  const { resolvedTheme } = useTheme();
  const colors = accessibleColors[resolvedTheme];
  
  const variants = {
    default: { color: colors.text },
    muted: { color: colors.textMuted },
    primary: { color: colors.primary }
  };
  
  return (
    <span style={variants[variant]}>
      {children}
    </span>
  );
}
```

## Error Handling

### 1. Graceful Fallbacks

```jsx
// ✅ Good: Comprehensive error handling
function RobustThemeProvider({ children }) {
  const [error, setError] = useState(null);
  const [theme, setTheme] = useState('light');
  
  const handleThemeChange = useCallback((newTheme) => {
    try {
      // Validate theme value
      if (!['light', 'dark', 'system'].includes(newTheme)) {
        throw new Error(`Invalid theme: ${newTheme}`);
      }
      
      setTheme(newTheme);
      
      // Try to save to localStorage
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('mre-theme-preference', newTheme);
      }
    } catch (err) {
      console.warn('Theme change failed:', err);
      setError(err);
      
      // Fallback to light theme
      setTheme('light');
      
      // Clear error after a delay
      setTimeout(() => setError(null), 5000);
    }
  }, []);
  
  // Error recovery
  if (error) {
    return (
      <div className="theme-error-fallback">
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-800">
            Theme system error. Using light mode as fallback.
          </p>
          <button 
            onClick={() => setError(null)}
            className="mt-2 px-3 py-1 bg-red-600 text-white rounded text-sm"
          >
            Retry
          </button>
        </div>
        {children}
      </div>
    );
  }
  
  return (
    <ThemeContext.Provider value={{ theme, setTheme: handleThemeChange }}>
      {children}
    </ThemeContext.Provider>
  );
}
```

### 2. Error Boundaries

```jsx
// ✅ Good: Theme-specific error boundary
class ThemeErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  
  componentDidCatch(error, errorInfo) {
    console.error('Theme system error:', error, errorInfo);
    
    // Reset to safe state
    try {
      document.documentElement.classList.remove('dark');
      localStorage.removeItem('mre-theme-preference');
    } catch (e) {
      console.warn('Failed to reset theme state:', e);
    }
    
    // Report error if analytics available
    if (window.analytics) {
      window.analytics.track('Theme Error', {
        error: error.message,
        stack: error.stack
      });
    }
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-white text-gray-900 p-8">
          <div className="max-w-md mx-auto">
            <h1 className="text-xl font-semibold mb-4">Theme System Error</h1>
            <p className="text-gray-600 mb-4">
              The theme system encountered an error. The application has been reset to light mode.
            </p>
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }
    
    return this.props.children;
  }
}
```

## Testing Best Practices

### 1. Comprehensive Test Coverage

```jsx
// ✅ Good: Comprehensive theme testing
describe('ThemeToggle', () => {
  beforeEach(() => {
    // Reset theme state
    localStorage.clear();
    document.documentElement.className = '';
  });
  
  it('renders with correct initial state', () => {
    render(
      <MockThemeProvider initialTheme="light">
        <ThemeToggle />
      </MockThemeProvider>
    );
    
    const toggle = screen.getByRole('button');
    expect(toggle).toHaveAttribute('aria-pressed', 'false');
    expect(toggle).toHaveAttribute('aria-label', 'Switch to dark mode');
  });
  
  it('toggles theme on click', async () => {
    const onThemeChange = jest.fn();
    
    render(
      <MockThemeProvider onThemeChange={onThemeChange}>
        <ThemeToggle />
      </MockThemeProvider>
    );
    
    await userEvent.click(screen.getByRole('button'));
    
    expect(onThemeChange).toHaveBeenCalledWith('dark', 'dark');
  });
  
  it('supports keyboard navigation', async () => {
    render(
      <MockThemeProvider>
        <ThemeToggle />
      </MockThemeProvider>
    );
    
    const toggle = screen.getByRole('button');
    toggle.focus();
    
    await userEvent.keyboard('{Enter}');
    
    expect(toggle).toHaveAttribute('aria-pressed', 'true');
  });
  
  it('meets accessibility standards', async () => {
    const { container } = render(
      <MockThemeProvider>
        <ThemeToggle />
      </MockThemeProvider>
    );
    
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
```

### 2. Visual Regression Testing

```jsx
// ✅ Good: Visual regression tests
describe('Theme Visual Tests', () => {
  it('matches light theme snapshot', () => {
    const { container } = render(
      <MockThemeProvider initialTheme="light">
        <MyComponent />
      </MockThemeProvider>
    );
    
    expect(container.firstChild).toMatchSnapshot();
  });
  
  it('matches dark theme snapshot', () => {
    const { container } = render(
      <MockThemeProvider initialTheme="dark">
        <MyComponent />
      </MockThemeProvider>
    );
    
    expect(container.firstChild).toMatchSnapshot();
  });
  
  it('transitions smoothly between themes', async () => {
    const { rerender } = render(
      <MockThemeProvider initialTheme="light">
        <MyComponent />
      </MockThemeProvider>
    );
    
    // Capture initial state
    const lightSnapshot = screen.getByTestId('component');
    
    rerender(
      <MockThemeProvider initialTheme="dark">
        <MyComponent />
      </MockThemeProvider>
    );
    
    // Verify transition classes are applied
    expect(lightSnapshot).toHaveClass('transition-colors');
  });
});
```

## Code Organization

### 1. Theme-Related File Structure

```
src/
├── components/
│   ├── theme/
│   │   ├── ThemeProvider.tsx
│   │   ├── ThemeToggle.tsx
│   │   ├── ThemeErrorBoundary.tsx
│   │   └── index.ts
│   └── ui/
│       ├── Button.tsx          # Theme-aware components
│       ├── Card.tsx
│       └── ...
├── hooks/
│   ├── useTheme.ts
│   ├── useSystemTheme.ts
│   └── useThemeOptimized.ts
├── utils/
│   ├── themeUtils.ts
│   ├── themeErrorHandling.ts
│   └── themePerformance.ts
├── styles/
│   ├── globals.css             # CSS custom properties
│   ├── themes.css              # Theme-specific styles
│   └── components.css          # Component styles
└── types/
    └── theme.ts                # Theme-related types
```

### 2. Consistent Naming Conventions

```jsx
// ✅ Good: Consistent naming
const THEME_STORAGE_KEY = 'mre-theme-preference';
const THEME_CHANGE_EVENT = 'themechange';
const DEFAULT_THEME = 'system';

// Theme-related CSS classes
const themeClasses = {
  light: 'theme-light',
  dark: 'theme-dark',
  transition: 'theme-transition'
};

// Theme-related test IDs
const themeTestIds = {
  toggle: 'theme-toggle',
  provider: 'theme-provider',
  indicator: 'theme-indicator'
};
```

## Documentation Standards

### 1. Component Documentation

```jsx
/**
 * ThemeToggle - A customizable theme toggle button
 * 
 * @example
 * ```jsx
 * // Basic usage
 * <ThemeToggle />
 * 
 * // With custom styling
 * <ThemeToggle size="lg" variant="switch" showLabel />
 * ```
 * 
 * @param {Object} props - Component props
 * @param {string} [props.className] - Additional CSS classes
 * @param {'sm'|'md'|'lg'} [props.size='md'] - Size variant
 * @param {'button'|'switch'} [props.variant='button'] - Visual variant
 * @param {boolean} [props.showLabel=false] - Show text label
 * @param {boolean} [props.disabled=false] - Disable the toggle
 * @param {string} [props['aria-label']] - Custom accessibility label
 * 
 * @returns {JSX.Element} Theme toggle button component
 */
export function ThemeToggle({
  className = '',
  size = 'md',
  variant = 'button',
  showLabel = false,
  disabled = false,
  'aria-label': ariaLabel,
  ...props
}) {
  // Implementation...
}
```

### 2. Hook Documentation

```jsx
/**
 * useTheme - Hook for accessing and controlling theme state
 * 
 * @example
 * ```jsx
 * function MyComponent() {
 *   const { theme, setTheme, resolvedTheme, isLoading } = useTheme();
 *   
 *   if (isLoading) return <div>Loading...</div>;
 *   
 *   return (
 *     <div className={resolvedTheme === 'dark' ? 'dark-styles' : 'light-styles'}>
 *       <button onClick={() => setTheme('dark')}>Dark Mode</button>
 *     </div>
 *   );
 * }
 * ```
 * 
 * @returns {Object} Theme state and controls
 * @returns {string} returns.theme - User's theme preference ('light'|'dark'|'system')
 * @returns {Function} returns.setTheme - Function to change theme preference
 * @returns {string} returns.resolvedTheme - Actual applied theme ('light'|'dark')
 * @returns {string} returns.systemTheme - Detected system theme preference
 * @returns {boolean} returns.isLoading - Whether theme is still initializing
 */
export function useTheme() {
  // Implementation...
}
```

## Migration Strategies

### 1. Gradual Migration

```jsx
// Phase 1: Add theme provider without changing components
function App() {
  return (
    <ThemeProvider>
      <ExistingApp />
    </ThemeProvider>
  );
}

// Phase 2: Update components one by one
function UpdatedButton({ children, ...props }) {
  return (
    <button 
      className="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded"
      {...props}
    >
      {children}
    </button>
  );
}

// Phase 3: Add theme toggle when ready
function Header() {
  return (
    <header className="flex justify-between items-center p-4">
      <Logo />
      <ThemeToggle />
    </header>
  );
}
```

### 2. Backward Compatibility

```jsx
// ✅ Good: Maintain backward compatibility
function LegacyThemeWrapper({ children, legacyTheme }) {
  const { setTheme } = useTheme();
  
  // Support legacy theme prop
  useEffect(() => {
    if (legacyTheme) {
      setTheme(legacyTheme === 'dark' ? 'dark' : 'light');
    }
  }, [legacyTheme, setTheme]);
  
  return children;
}

// Usage
<LegacyThemeWrapper legacyTheme={oldThemeValue}>
  <ExistingComponent />
</LegacyThemeWrapper>
```

This comprehensive documentation provides developers with everything they need to effectively implement and maintain the theme system in the MicroRealEstate application.