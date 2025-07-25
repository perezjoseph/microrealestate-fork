# Theme System Quick Start Guide

## 5-Minute Setup

### 1. Install Dependencies (Already Done)

The theme system is already set up in both applications:
- `next-themes` is installed in the landlord app
- Custom theme provider is implemented in the tenant app

### 2. Add Theme Provider

#### Landlord App
```jsx
// pages/_app.js (Already implemented)
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

#### Tenant App
```tsx
// src/components/providers/ThemeProvider.tsx (Already implemented)
import { ThemeProvider } from './ThemeProvider';

function App() {
  return (
    <ThemeProvider defaultTheme="system">
      <YourAppContent />
    </ThemeProvider>
  );
}
```

### 3. Add Theme Toggle

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

### 4. Make Components Theme-Aware

```jsx
function MyComponent() {
  return (
    <div className="p-4 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
      <h2 className="text-xl font-semibold mb-4">Hello World</h2>
      <p className="text-gray-600 dark:text-gray-400">
        This content adapts to the current theme automatically.
      </p>
    </div>
  );
}
```

### 5. Use Theme Hook (Optional)

```jsx
import { useTheme } from '@microrealestate/commonui/hooks/useTheme';

function CustomComponent() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  
  return (
    <div>
      <p>Current theme: {resolvedTheme}</p>
      <button onClick={() => setTheme('dark')}>
        Switch to Dark
      </button>
    </div>
  );
}
```

## Common Patterns

### Theme-Aware Styling

```jsx
// Using Tailwind classes
<div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
  Content
</div>

// Using CSS custom properties
<div style={{
  backgroundColor: 'var(--color-background)',
  color: 'var(--color-text)'
}}>
  Content
</div>

// Using theme hook
const { resolvedTheme } = useTheme();
<div className={resolvedTheme === 'dark' ? 'dark-styles' : 'light-styles'}>
  Content
</div>
```

### Form Components

```jsx
function Input({ className = '', ...props }) {
  return (
    <input
      className={`
        px-3 py-2 border rounded-md
        bg-white dark:bg-gray-800
        border-gray-300 dark:border-gray-600
        text-gray-900 dark:text-gray-100
        placeholder-gray-500 dark:placeholder-gray-400
        focus:ring-2 focus:ring-blue-500 focus:border-blue-500
        ${className}
      `}
      {...props}
    />
  );
}
```

### Buttons

```jsx
function Button({ variant = 'primary', children, ...props }) {
  const variants = {
    primary: 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white',
    secondary: 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100'
  };
  
  return (
    <button
      className={`px-4 py-2 rounded font-medium transition-colors ${variants[variant]}`}
      {...props}
    >
      {children}
    </button>
  );
}
```

### Cards

```jsx
function Card({ children, className = '' }) {
  return (
    <div className={`
      p-6 rounded-lg border shadow-sm
      bg-white dark:bg-gray-800
      border-gray-200 dark:border-gray-700
      ${className}
    `}>
      {children}
    </div>
  );
}
```

## Testing Your Implementation

### 1. Visual Check
- Toggle between themes and verify all components update
- Check for proper contrast in both modes
- Ensure no elements are invisible or hard to read

### 2. Accessibility Check
- Test keyboard navigation (Tab, Enter, Space)
- Verify screen reader announcements
- Check focus indicators are visible

### 3. Persistence Check
- Change theme and reload page
- Verify theme preference is remembered
- Test in incognito mode

## Troubleshooting

### Theme Not Persisting
```jsx
// Check if localStorage is available
if (typeof window !== 'undefined' && window.localStorage) {
  console.log('Stored theme:', localStorage.getItem('mre-theme-preference'));
}
```

### Components Not Updating
```jsx
// Ensure components use the theme hook
const { resolvedTheme } = useTheme();

// Or check if provider wraps the component
<ThemeProvider>
  <YourComponent />
</ThemeProvider>
```

### Theme Flashing
```jsx
// Use loading state to prevent flash
const { isLoading, resolvedTheme } = useTheme();

if (isLoading) {
  return <div className="min-h-screen bg-transparent" />;
}
```

## Next Steps

1. **Read the full documentation**: Check `THEME_SYSTEM_DOCUMENTATION.md`
2. **Explore examples**: Look at files in the `examples/` directory
3. **Review best practices**: Read `BEST_PRACTICES.md`
4. **Check API reference**: See `API_REFERENCE.md`
5. **Troubleshooting**: Consult `THEME_TROUBLESHOOTING.md`

## Need Help?

- Check the troubleshooting guide for common issues
- Review the examples for implementation patterns
- Test your components with the provided test utilities
- Ensure accessibility compliance with the accessibility examples

## CSS Custom Properties Reference

```css
/* Add to your globals.css */
:root {
  --color-background: #ffffff;
  --color-foreground: #111827;
  --color-primary: #3b82f6;
  --color-border: #e2e8f0;
}

.dark {
  --color-background: #111827;
  --color-foreground: #f9fafb;
  --color-primary: #60a5fa;
  --color-border: #374151;
}
```

That's it! Your theme system is ready to use. The components will automatically adapt to theme changes, and users can toggle between light and dark modes seamlessly.