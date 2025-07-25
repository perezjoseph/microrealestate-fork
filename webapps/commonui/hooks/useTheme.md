# Unified Theme Hook

The `useTheme` hook provides a consistent interface for theme management across both landlord and tenant applications.

## Features

- **Automatic Provider Detection**: Detects and uses the appropriate theme provider (next-themes or custom)
- **Consistent API**: Same interface regardless of the underlying provider
- **Fallback Implementation**: Works even without a theme provider
- **SSR Safe**: Handles server-side rendering without hydration issues
- **Error Handling**: Graceful error handling with fallbacks

## Usage

```javascript
import { useTheme } from '@microrealestate/commonui/hooks/useTheme';

function MyComponent() {
  const { theme, setTheme, resolvedTheme, systemTheme, isLoading, error } = useTheme();

  if (isLoading) {
    return <div>Loading theme...</div>;
  }

  if (error) {
    return <div>Theme error: {error.message}</div>;
  }

  return (
    <div>
      <p>Current theme: {theme}</p>
      <p>Resolved theme: {resolvedTheme}</p>
      <p>System theme: {systemTheme}</p>
      
      <button onClick={() => setTheme('light')}>Light</button>
      <button onClick={() => setTheme('dark')}>Dark</button>
      <button onClick={() => setTheme('system')}>System</button>
    </div>
  );
}
```

## Return Values

- `theme`: The current theme setting ('light', 'dark', or 'system')
- `setTheme`: Function to change the theme
- `resolvedTheme`: The actual theme being applied ('light' or 'dark')
- `systemTheme`: The system's preferred theme ('light' or 'dark')
- `isLoading`: Boolean indicating if the theme is still loading
- `error`: Any error that occurred during theme operations

## Provider Detection

The hook automatically detects which theme provider is available:

1. **next-themes** (landlord app): Uses `window.__NEXT_THEMES_CONTEXT__`
2. **Custom provider** (tenant app): Uses `window.__THEME_CONTEXT__`
3. **Fallback**: Uses localStorage and system preferences

## Error Handling

The hook includes comprehensive error handling:

- localStorage access failures
- DOM manipulation errors
- System theme detection failures
- Invalid theme values

All errors are logged and the hook continues to function with safe defaults.

## SSR Compatibility

The hook is designed to work with server-side rendering:

- Returns safe defaults during SSR
- Prevents hydration mismatches
- Initializes properly on the client

## Testing

To test the hook, you can use the `ThemeTest` component:

```javascript
import { ThemeTest } from '@microrealestate/commonui/components/ThemeTest';

// Add to your page temporarily
<ThemeTest />
```

This will show the current theme state and allow you to test theme switching.