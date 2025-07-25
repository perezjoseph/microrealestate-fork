# CommonUI - Shared Components Library

Shared React components, hooks, and utilities used across MicroRealEstate frontend applications.

## Overview

The CommonUI package provides reusable components and utilities that are shared between the landlord and tenant applications, ensuring consistency and reducing code duplication.

## Package Structure

```
webapps/commonui/
├── components/           # Shared React components
│   ├── FormFields/      # Reusable form components
│   ├── ThemeToggle.jsx  # Theme switching component
│   ├── Illustration.js  # Illustration component
│   ├── Loading.js       # Loading component
│   └── index.js         # Component exports
├── hooks/               # Shared custom hooks
│   ├── __tests__/       # Hook tests
│   └── useTheme.js      # Theme management hook
├── utils/               # Shared utilities
├── locales/             # Shared translations
└── scripts/             # Build and utility scripts
```

## Components

### ThemeToggle

A flexible theme switching component with multiple variants:

```jsx
import { ThemeToggle } from '@microrealestate/commonui/components';

// Button variant (default)
<ThemeToggle />

// Dropdown variant
<ThemeToggle variant="dropdown" />

// With label
<ThemeToggle showLabel={true} />

// Different sizes
<ThemeToggle size="sm" />
<ThemeToggle size="md" />
<ThemeToggle size="lg" />
```

**Props:**
- `variant`: `'button' | 'dropdown'` - Component style
- `showLabel`: `boolean` - Show theme name text
- `className`: `string` - Additional CSS classes
- `size`: `'sm' | 'md' | 'lg'` - Component size

**Features:**
- Automatic icon switching (Sun/Moon/System)
- Accessible with proper ARIA labels
- Tailwind CSS styling with dark mode support
- Keyboard navigation support

### Form Components

Located in `components/FormFields/`, these provide consistent form styling across applications.

### Loading Component

```jsx
import { Loading } from '@microrealestate/commonui/components';

<Loading />
```

### Illustration Component

```jsx
import { Illustration } from '@microrealestate/commonui/components';

<Illustration name="welcome" />
```

## Hooks

### useTheme

Comprehensive theme management hook with system theme detection:

```javascript
import { useTheme } from '@microrealestate/commonui/hooks';

function MyComponent() {
  const {
    theme,           // Current theme setting: 'light' | 'dark' | 'system'
    effectiveTheme,  // Resolved theme: 'light' | 'dark'
    systemTheme,     // Detected system theme: 'light' | 'dark'
    toggleTheme,     // Function to toggle between light/dark
    setTheme,        // Function to set specific theme
    isDark,          // Boolean: is dark theme active
    isLight,         // Boolean: is light theme active
    isSystem,        // Boolean: is system theme selected
    THEME_MODES      // Theme constants object
  } = useTheme();

  return (
    <div className={isDark ? 'dark-styles' : 'light-styles'}>
      <button onClick={toggleTheme}>
        Switch to {isDark ? 'light' : 'dark'} theme
      </button>
      <button onClick={() => setTheme(THEME_MODES.SYSTEM)}>
        Use system theme
      </button>
    </div>
  );
}
```

**Features:**
- **System Theme Detection**: Automatically detects OS/browser preference
- **Persistent Storage**: Saves preference in localStorage
- **Real-time Updates**: Listens for system theme changes
- **CSS Integration**: Applies classes to document root
- **TypeScript Ready**: Full type definitions available

**Storage:**
- **Key**: `microrealestate-theme`
- **Values**: `'light'`, `'dark'`, `'system'`

**CSS Classes Applied:**
- `light` or `dark` on `document.documentElement`
- `data-theme` attribute with current theme

## Usage in Applications

### Installation

The CommonUI package is automatically available in workspace applications:

```json
{
  "dependencies": {
    "@microrealestate/commonui": "workspace:*"
  }
}
```

### Importing Components

```javascript
// Individual imports
import { ThemeToggle } from '@microrealestate/commonui/components';
import { useTheme } from '@microrealestate/commonui/hooks';

// Barrel imports
import { ThemeToggle, Loading } from '@microrealestate/commonui/components';
```

### Integration with Application Themes

For applications using their own theme providers (like tenant app), you can:

1. **Use CommonUI hook directly** for simple theme management
2. **Integrate with custom providers** for advanced features
3. **Use ThemeToggle component** with any theme system

```jsx
// Using with custom theme provider
import { useTheme as useAppTheme } from '@/components/providers/ThemeProvider';
import { ThemeToggle } from '@microrealestate/commonui/components';

function Header() {
  const { toggleTheme } = useAppTheme();
  
  return (
    <header>
      <ThemeToggle onClick={toggleTheme} />
    </header>
  );
}
```

## Development

### Building Components

```bash
cd webapps/commonui
yarn build
```

### Testing Components

```bash
yarn test
yarn test:watch
```

### Linting

```bash
yarn lint
yarn lint:fix
```

## Contributing

When adding new shared components:

1. **Create component** in appropriate subdirectory
2. **Add TypeScript types** if using TypeScript
3. **Export from index.js** for easy importing
4. **Add tests** in `__tests__` directory
5. **Update documentation** in this README
6. **Test in both applications** (landlord and tenant)

### Component Guidelines

- **Accessibility**: Include proper ARIA attributes
- **Responsive**: Work on mobile and desktop
- **Themeable**: Support light/dark themes
- **Consistent**: Follow existing component patterns
- **Documented**: Include JSDoc comments

---

**Package Version**: Workspace managed  
**Dependencies**: React 18+, Tailwind CSS  
**License**: Same as main project