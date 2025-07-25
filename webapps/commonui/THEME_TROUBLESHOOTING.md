# Theme System Troubleshooting Guide

## Common Issues and Solutions

### 1. Theme Flashing on Page Load

**Problem**: Brief flash of wrong theme during page load/hydration.

**Symptoms**:
- Page loads in light mode then switches to dark
- Flickering during SSR hydration
- Inconsistent theme on first render

**Solutions**:

```jsx
// ✅ Solution 1: Use loading state
function MyComponent() {
  const { isLoading, resolvedTheme } = useTheme();
  
  if (isLoading) {
    return <div className="min-h-screen bg-transparent" />; // Transparent during load
  }
  
  return (
    <div className={`min-h-screen ${resolvedTheme === 'dark' ? 'bg-gray-900' : 'bg-white'}`}>
      {/* Content */}
    </div>
  );
}

// ✅ Solution 2: CSS-only initial styling
/* In your CSS */
html {
  background-color: white;
}

html.dark {
  background-color: #111827;
}

/* Prevent flash with CSS */
.theme-loading {
  visibility: hidden;
}

.theme-loaded {
  visibility: visible;
  transition: all 0.2s ease;
}
```

**Prevention**:
- Always check `isLoading` state before rendering theme-dependent content
- Use CSS custom properties for immediate theme application
- Implement proper SSR theme detection

### 2. Theme Not Persisting

**Problem**: Theme resets to default on page reload.

**Symptoms**:
- Theme preference not saved
- Always defaults to system/light theme
- localStorage not working

**Diagnosis**:

```jsx
// Debug localStorage
function debugThemeStorage() {
  console.log('Stored theme:', localStorage.getItem('mre-theme-preference'));
  console.log('Current theme:', document.documentElement.classList.contains('dark') ? 'dark' : 'light');
  console.log('System preference:', window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
}
```

**Solutions**:

```jsx
// ✅ Check localStorage availability
function isStorageAvailable() {
  try {
    const test = '__storage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch (e) {
    return false;
  }
}

// ✅ Fallback for storage issues
function useThemeWithFallback() {
  const [theme, setThemeState] = useState('system');
  
  const setTheme = useCallback((newTheme) => {
    setThemeState(newTheme);
    
    if (isStorageAvailable()) {
      try {
        localStorage.setItem('mre-theme-preference', newTheme);
      } catch (error) {
        console.warn('Failed to save theme preference:', error);
      }
    }
  }, []);
  
  return { theme, setTheme };
}
```

### 3. Inconsistent Theme Across Components

**Problem**: Some components don't update when theme changes.

**Symptoms**:
- Mixed light/dark components on same page
- Some components stuck in one theme
- Theme changes don't propagate

**Solutions**:

```jsx
// ✅ Ensure proper provider wrapping
function App() {
  return (
    <ThemeProvider> {/* Must wrap entire app */}
      <Header />
      <Main />
      <Footer />
    </ThemeProvider>
  );
}

// ✅ Use theme hook consistently
function Component() {
  const { resolvedTheme } = useTheme(); // Always use the hook
  
  // Don't rely on external theme state
  return (
    <div className={resolvedTheme === 'dark' ? 'dark-styles' : 'light-styles'}>
      Content
    </div>
  );
}

// ❌ Don't use multiple theme sources
function BadComponent() {
  const [localTheme] = useState('dark'); // Don't do this
  const { resolvedTheme } = useTheme();
  
  // Conflicting theme sources cause issues
}
```

### 4. Performance Issues

**Problem**: Theme changes cause excessive re-renders or lag.

**Symptoms**:
- Slow theme switching
- UI freezes during theme change
- High CPU usage

**Diagnosis**:

```jsx
// Debug re-renders
import { useEffect, useRef } from 'react';

function useRenderCount(componentName) {
  const renderCount = useRef(0);
  
  useEffect(() => {
    renderCount.current += 1;
    console.log(`${componentName} rendered ${renderCount.current} times`);
  });
}

function MyComponent() {
  useRenderCount('MyComponent');
  const { resolvedTheme } = useTheme();
  
  return <div>Content</div>;
}
```

**Solutions**:

```jsx
// ✅ Memoize expensive calculations
const ExpensiveComponent = memo(({ data }) => {
  const { resolvedTheme } = useTheme();
  
  const processedData = useMemo(() => {
    return processDataForTheme(data, resolvedTheme);
  }, [data, resolvedTheme]);
  
  return <ComplexVisualization data={processedData} />;
});

// ✅ Optimize context updates
function OptimizedThemeProvider({ children }) {
  const [theme, setTheme] = useState('system');
  const [resolvedTheme, setResolvedTheme] = useState('light');
  
  // Separate contexts for different update frequencies
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
```

### 5. Accessibility Issues

**Problem**: Theme toggle not accessible or poor contrast.

**Symptoms**:
- Screen readers can't understand theme state
- Poor keyboard navigation
- Insufficient color contrast

**Solutions**:

```jsx
// ✅ Proper accessibility implementation
function AccessibleThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  
  return (
    <button
      onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
      aria-label={`Switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} theme`}
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
      {resolvedTheme === 'dark' ? (
        <SunIcon className="w-5 h-5" aria-hidden="true" />
      ) : (
        <MoonIcon className="w-5 h-5" aria-hidden="true" />
      )}
    </button>
  );
}

// ✅ Announce theme changes to screen readers
function useThemeAnnouncement() {
  const { resolvedTheme } = useTheme();
  const [announcement, setAnnouncement] = useState('');
  
  useEffect(() => {
    setAnnouncement(`Theme changed to ${resolvedTheme} mode`);
    const timer = setTimeout(() => setAnnouncement(''), 1000);
    return () => clearTimeout(timer);
  }, [resolvedTheme]);
  
  return announcement;
}
```

### 6. CSS Custom Properties Not Working

**Problem**: CSS variables don't update with theme changes.

**Symptoms**:
- Colors don't change with theme
- CSS variables show default values
- Inconsistent styling

**Solutions**:

```css
/* ✅ Proper CSS custom property setup */
:root {
  --color-background: #ffffff;
  --color-text: #111827;
  --color-primary: #3b82f6;
}

.dark {
  --color-background: #111827;
  --color-text: #f9fafb;
  --color-primary: #60a5fa;
}

/* ✅ Use with fallbacks */
.my-component {
  background-color: var(--color-background, #ffffff);
  color: var(--color-text, #111827);
}
```

```jsx
// ✅ Ensure class is applied to document
useEffect(() => {
  if (resolvedTheme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}, [resolvedTheme]);
```

### 7. System Theme Detection Not Working

**Problem**: System theme preference not detected correctly.

**Symptoms**:
- Always defaults to light theme
- Doesn't follow system preference
- System theme changes not detected

**Solutions**:

```jsx
// ✅ Robust system theme detection
function useSystemTheme() {
  const [systemTheme, setSystemTheme] = useState(() => {
    if (typeof window === 'undefined') return 'light';
    
    try {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } catch (error) {
      console.warn('System theme detection failed:', error);
      return 'light';
    }
  });
  
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    try {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      
      const handleChange = (e) => {
        setSystemTheme(e.matches ? 'dark' : 'light');
      };
      
      // Modern browsers
      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
      }
      
      // Legacy browsers
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    } catch (error) {
      console.warn('System theme listener setup failed:', error);
    }
  }, []);
  
  return systemTheme;
}
```

### 8. Theme Provider Errors

**Problem**: Theme provider crashes or fails to initialize.

**Symptoms**:
- White screen of death
- Theme context undefined errors
- Provider initialization failures

**Solutions**:

```jsx
// ✅ Error boundary for theme provider
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
    
    // Fallback to light theme
    try {
      document.documentElement.classList.remove('dark');
      localStorage.removeItem('mre-theme-preference');
    } catch (e) {
      console.warn('Failed to reset theme:', e);
    }
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-white text-gray-900 p-8">
          <h1>Theme system error</h1>
          <p>The application has fallen back to light mode.</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
          >
            Reload Application
          </button>
        </div>
      );
    }
    
    return this.props.children;
  }
}

// ✅ Graceful provider fallback
function SafeThemeProvider({ children }) {
  const [error, setError] = useState(null);
  
  if (error) {
    return (
      <div className="theme-fallback">
        {children}
      </div>
    );
  }
  
  try {
    return (
      <ThemeProvider onError={setError}>
        {children}
      </ThemeProvider>
    );
  } catch (err) {
    setError(err);
    return <div className="theme-fallback">{children}</div>;
  }
}
```

## Debugging Tools

### Theme Debug Component

```jsx
function ThemeDebugger() {
  const { theme, resolvedTheme, systemTheme, isLoading } = useTheme();
  
  if (process.env.NODE_ENV !== 'development') return null;
  
  return (
    <div className="fixed bottom-4 right-4 p-4 bg-black/80 text-white text-xs rounded z-50">
      <div>Theme: {theme}</div>
      <div>Resolved: {resolvedTheme}</div>
      <div>System: {systemTheme}</div>
      <div>Loading: {isLoading ? 'Yes' : 'No'}</div>
      <div>Storage: {localStorage.getItem('mre-theme-preference') || 'None'}</div>
      <div>HTML Class: {document.documentElement.className}</div>
    </div>
  );
}
```

### Performance Monitor

```jsx
function ThemePerformanceMonitor() {
  const { resolvedTheme } = useTheme();
  const renderCount = useRef(0);
  const lastTheme = useRef(resolvedTheme);
  
  useEffect(() => {
    renderCount.current += 1;
    
    if (lastTheme.current !== resolvedTheme) {
      console.log(`Theme changed from ${lastTheme.current} to ${resolvedTheme}`);
      console.log(`Component rendered ${renderCount.current} times`);
      lastTheme.current = resolvedTheme;
    }
  });
  
  return null;
}
```

## Testing Checklist

When troubleshooting theme issues, verify:

- [ ] Theme provider wraps entire application
- [ ] `useTheme` hook used consistently
- [ ] Loading states handled properly
- [ ] localStorage permissions available
- [ ] CSS custom properties defined correctly
- [ ] System theme detection working
- [ ] Accessibility attributes present
- [ ] Error boundaries in place
- [ ] Performance optimizations applied
- [ ] SSR hydration handled correctly

## Getting Help

1. **Check Browser Console**: Look for theme-related errors or warnings
2. **Use Debug Components**: Add `<ThemeDebugger />` to see current state
3. **Test in Incognito**: Rule out localStorage/extension issues
4. **Verify CSS**: Check if dark class is applied to `<html>`
5. **Test System Changes**: Change OS theme to verify detection
6. **Review Network Tab**: Check for failed CSS/JS loads
7. **Validate HTML**: Ensure proper document structure

## Common Error Messages

### "Cannot read property 'theme' of undefined"
- **Cause**: Component not wrapped in ThemeProvider
- **Fix**: Ensure ThemeProvider wraps the component tree

### "localStorage is not defined"
- **Cause**: SSR environment doesn't have localStorage
- **Fix**: Add typeof window checks before localStorage access

### "matchMedia is not a function"
- **Cause**: Running in Node.js environment
- **Fix**: Add window/browser checks before matchMedia usage

### "Theme flashing on load"
- **Cause**: Hydration mismatch between server and client
- **Fix**: Use loading states and proper SSR handling

### "CSS variables not updating"
- **Cause**: Dark class not applied to document
- **Fix**: Verify theme provider applies class to document.documentElement