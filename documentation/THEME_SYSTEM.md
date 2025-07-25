# Theme System Documentation

MicroRealEstate includes a comprehensive theme management system that provides light, dark, and system theme support across all frontend applications.

## Architecture Overview

The theme system is implemented at two levels:

1. **CommonUI Package**: Provides shared theme components and hooks
2. **Application Level**: Custom theme providers for advanced features

```
Theme System Architecture:
├── webapps/commonui/
│   ├── hooks/useTheme.js           # Basic theme hook
│   └── components/ThemeToggle.jsx  # Theme switching component
└── webapps/tenant/
    └── src/components/providers/
        └── ThemeProvider.tsx       # Advanced theme provider
```

## Implementation Details

### CommonUI Theme Hook

**Location**: `webapps/commonui/hooks/useTheme.js`

Basic theme management with system detection:

```javascript
import { useTheme } from '@microrealestate/commonui/hooks';

const {
  theme,           // 'light' | 'dark' | 'system'
  effectiveTheme,  // 'light' | 'dark' (resolved)
  systemTheme,     // 'light' | 'dark' (detected)
  toggleTheme,     // Toggle function
  setTheme,        // Set specific theme
  isDark,          // Boolean helpers
  isLight,
  isSystem,
  THEME_MODES      // Constants
} = useTheme();
```

### Tenant App Theme Provider

**Location**: `webapps/tenant/src/components/providers/ThemeProvider.tsx`

Advanced theme provider with React Context:

```typescript
import { ThemeProvider, useTheme } from '@/components/providers/ThemeProvider';

// Provider setup
<ThemeProvider defaultTheme="system">
  {children}
</ThemeProvider>

// Hook usage
const { theme, effectiveTheme, setTheme, toggleTheme } = useTheme();
```

## Features

### Theme Modes

| Mode | Description | Behavior |
|------|-------------|----------|
| `light` | Light theme | Fixed light appearance |
| `dark` | Dark theme | Fixed dark appearance |
| `system` | System theme | Follows OS/browser preference |

### Persistence

- **Storage Location**: `localStorage`
- **CommonUI Key**: `microrealestate-theme`
- **Tenant App Key**: `theme`
- **Default Value**: `system`

### System Detection

- **Media Query**: `(prefers-color-scheme: dark)`
- **Event Listening**: Automatic updates on system changes
- **Fallback**: Light theme if detection fails

### CSS Integration

Both implementations automatically apply CSS classes:

```css
/* Applied to document.documentElement */
.light { /* Light theme styles */ }
.dark { /* Dark theme styles */ }

/* Data attribute for advanced selectors */
[data-theme="light"] { /* Light theme styles */ }
[data-theme="dark"] { /* Dark theme styles */ }
```

## Usage Examples

### Basic Theme Toggle

```jsx
import { ThemeToggle } from '@microrealestate/commonui/components';

function Header() {
  return (
    <header>
      <ThemeToggle />
    </header>
  );
}
```

### Custom Theme Controls

```jsx
import { useTheme } from '@/components/providers/ThemeProvider';

function ThemeSelector() {
  const { theme, setTheme } = useTheme();
  
  return (
    <div>
      <button 
        onClick={() => setTheme('light')}
        className={theme === 'light' ? 'active' : ''}
      >
        Light
      </button>
      <button 
        onClick={() => setTheme('dark')}
        className={theme === 'dark' ? 'active' : ''}
      >
        Dark
      </button>
      <button 
        onClick={() => setTheme('system')}
        className={theme === 'system' ? 'active' : ''}
      >
        System
      </button>
    </div>
  );
}
```

### Conditional Rendering

```jsx
function MyComponent() {
  const { isDark, effectiveTheme } = useTheme();
  
  return (
    <div>
      {isDark ? (
        <DarkModeIcon />
      ) : (
        <LightModeIcon />
      )}
      <p>Current theme: {effectiveTheme}</p>
    </div>
  );
}
```

## Tailwind CSS Integration

The theme system works seamlessly with Tailwind's dark mode:

```jsx
// tailwind.config.js
module.exports = {
  darkMode: 'class', // Enable class-based dark mode
  // ... other config
}

// Component usage
<div className="bg-white dark:bg-gray-900 text-black dark:text-white">
  Content that adapts to theme
</div>
```

## Application Integration

### Tenant Application

The tenant app uses the advanced ThemeProvider:

```typescript
// app/[lang]/layout.tsx
import Providers from '@/components/providers';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}

// components/providers/index.tsx
import { ThemeProvider } from './ThemeProvider';

export default function Providers({ children }) {
  return (
    <ThemeProvider defaultTheme="system">
      {children}
    </ThemeProvider>
  );
}
```

### Landlord Application

The landlord app can use either approach:

```jsx
// Option 1: CommonUI hook (simpler)
import { useTheme } from '@microrealestate/commonui/hooks';

// Option 2: Custom provider (more features)
import { ThemeProvider } from './providers/ThemeProvider';
```

## Development Guidelines

### Adding Theme Support to Components

1. **Use theme-aware classes**:
   ```jsx
   <div className="bg-white dark:bg-gray-900">
   ```

2. **Access theme state**:
   ```jsx
   const { isDark } = useTheme();
   ```

3. **Provide theme variants**:
   ```jsx
   const iconColor = isDark ? 'white' : 'black';
   ```

### Testing Theme Components

```jsx
// Test with different themes
import { render } from '@testing-library/react';
import { ThemeProvider } from '@/components/providers/ThemeProvider';

function renderWithTheme(component, theme = 'light') {
  return render(
    <ThemeProvider defaultTheme={theme}>
      {component}
    </ThemeProvider>
  );
}

test('renders correctly in dark theme', () => {
  renderWithTheme(<MyComponent />, 'dark');
  // ... assertions
});
```

### Performance Considerations

- **Minimal Re-renders**: Theme changes only trigger necessary updates
- **Efficient Storage**: localStorage operations are debounced
- **Event Cleanup**: Media query listeners are properly cleaned up
- **SSR Safe**: Handles server-side rendering without hydration issues

## Troubleshooting

### Common Issues

1. **Theme not persisting**:
   - Check localStorage permissions
   - Verify storage key consistency

2. **System theme not detected**:
   - Ensure `window.matchMedia` is available
   - Check browser support for `prefers-color-scheme`

3. **CSS classes not applied**:
   - Verify theme provider is wrapping components
   - Check Tailwind dark mode configuration

4. **Hydration mismatches**:
   - Use `useEffect` for client-only theme operations
   - Handle SSR/client differences properly

### Debug Information

```jsx
function ThemeDebug() {
  const theme = useTheme();
  
  return (
    <pre>
      {JSON.stringify(theme, null, 2)}
    </pre>
  );
}
```

## Migration Guide

### From No Theme System

1. **Install theme provider** in app root
2. **Update components** to use theme-aware classes
3. **Add theme toggle** to navigation
4. **Test all components** in both themes

### From Basic to Advanced

1. **Replace CommonUI hook** with custom provider
2. **Update import statements**
3. **Add provider to app root**
4. **Migrate storage keys** if needed

---

**Last Updated**: January 2025  
**Supported Applications**: Tenant (full), Landlord (planned)  
**Browser Support**: Modern browsers with CSS custom properties