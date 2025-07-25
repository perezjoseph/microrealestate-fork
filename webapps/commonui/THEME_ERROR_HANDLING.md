# Theme Error Handling Documentation

This document describes the comprehensive error handling and fallback mechanisms implemented for the dark mode toggle system.

## Overview

The theme system includes robust error handling to ensure the application remains functional even when theme-related operations fail. This includes graceful fallbacks for localStorage unavailability, system theme detection failures, and DOM manipulation errors.

## Components

### 1. ThemeErrorBoundary

A React error boundary specifically designed for theme-related failures.

**Features:**
- Catches JavaScript errors in theme components
- Provides fallback UI with retry functionality
- Logs errors in development mode
- Applies safe fallback theme (light mode)
- Supports custom fallback components

**Usage:**
```jsx
import ThemeErrorBoundary from '@microrealestate/commonui/components/ThemeErrorBoundary';

<ThemeErrorBoundary onError={handleError} maxRetries={3}>
  <YourThemeComponent />
</ThemeErrorBoundary>
```

### 2. Theme Error Handling Utilities

Located in `utils/themeErrorHandling.js`, provides comprehensive error handling utilities.

#### ThemeError Class
Custom error class for theme-related errors with categorization and severity levels.

```javascript
const error = new ThemeError(
  'Storage operation failed',
  THEME_ERROR_TYPES.STORAGE_ERROR,
  THEME_ERROR_SEVERITY.MEDIUM,
  originalError
);
```

#### ThemeErrorLogger
Centralized logging system for theme errors.

**Features:**
- Development vs production logging modes
- Error storage in localStorage for debugging
- Structured error data with context
- Recent error history (max 10 entries)

#### SafeStorage
Safe localStorage operations with fallbacks.

**Features:**
- Availability detection
- Graceful error handling
- Fallback values for failed operations
- Automatic error logging

```javascript
const value = SafeStorage.getItem('theme-key', 'fallback-value');
const success = SafeStorage.setItem('theme-key', 'new-value');
```

#### SystemThemeDetector
Safe system theme detection with error handling.

**Features:**
- Fallback to light theme on detection failure
- Safe listener creation with cleanup
- Browser compatibility handling

```javascript
const systemTheme = SystemThemeDetector.detect(); // 'light' or 'dark'
const cleanup = SystemThemeDetector.createListener(callback);
```

#### SafeThemeApplicator
Safe DOM manipulation for theme application.

**Features:**
- Validation of theme values
- Safe DOM class manipulation
- Meta theme-color updates
- Reset to default functionality

```javascript
const success = SafeThemeApplicator.applyTheme('dark');
SafeThemeApplicator.resetToDefault(); // Emergency fallback
```

### 3. Enhanced Theme Providers

Both landlord and tenant theme providers have been enhanced with error handling:

**Landlord Provider (next-themes wrapper):**
- Error boundary integration
- Context exposure error handling
- Initialization error recovery

**Tenant Provider (custom implementation):**
- Comprehensive error handling in all operations
- Safe storage operations
- System theme detection with fallbacks
- Error state in context

### 4. Enhanced useTheme Hook

The unified theme hook includes error handling:

**Features:**
- Provider detection with error recovery
- Fallback implementation with error handling
- Error state exposure
- Safe theme operations

### 5. ThemeErrorDebugger (Development Only)

Development-only component for debugging theme errors.

**Features:**
- Real-time error display
- Error history with details
- Manual error clearing
- Only renders in development mode

## Error Types and Severity Levels

### Error Types
- `STORAGE_ERROR`: localStorage operation failures
- `SYSTEM_DETECTION_ERROR`: System theme detection failures
- `DOM_MANIPULATION_ERROR`: DOM operation failures
- `PROVIDER_ERROR`: Theme provider errors
- `HYDRATION_ERROR`: SSR/hydration issues

### Severity Levels
- `LOW`: Minor issues that don't affect functionality
- `MEDIUM`: Issues that may impact user experience
- `HIGH`: Significant issues requiring fallbacks
- `CRITICAL`: Severe issues requiring emergency fallbacks

## Fallback Hierarchy

When errors occur, the system follows this fallback hierarchy:

1. **User's saved preference** (localStorage)
2. **System preference** (prefers-color-scheme)
3. **Default to light theme** (safe fallback)

## Development vs Production Behavior

### Development Mode
- Detailed error logging to console
- Error debugger component available
- Error details in fallback UI
- Error storage in localStorage for debugging

### Production Mode
- Minimal error logging
- Clean fallback UI without technical details
- Optional external error reporting integration
- Focus on user experience preservation

## Testing the Error Handling

Use the `ThemeErrorHandlingDemo` component (development only) to test various error scenarios:

```jsx
import ThemeErrorHandlingDemo from '@microrealestate/commonui/components/ThemeErrorHandlingDemo';

// Add to your development page
<ThemeErrorHandlingDemo />
```

## Integration Examples

### Basic Error Boundary Usage
```jsx
import ThemeErrorBoundary from '@microrealestate/commonui/components/ThemeErrorBoundary';

function App() {
  return (
    <ThemeErrorBoundary>
      <ThemeProvider>
        <YourApp />
      </ThemeProvider>
    </ThemeErrorBoundary>
  );
}
```

### Custom Error Handling
```jsx
import { ThemeErrorLogger, ThemeError } from '@microrealestate/commonui/utils/themeErrorHandling';

function handleThemeError(error, context) {
  ThemeErrorLogger.log(error, context);
  
  // Send to external error reporting service
  if (process.env.NODE_ENV === 'production') {
    errorReportingService.captureException(error);
  }
}
```

### Safe Theme Operations
```jsx
import { SafeStorage, SafeThemeApplicator } from '@microrealestate/commonui/utils/themeErrorHandling';

function MyThemeComponent() {
  const handleThemeChange = (newTheme) => {
    // Safe storage operation
    const saved = SafeStorage.setItem('my-theme', newTheme);
    
    // Safe DOM application
    const applied = SafeThemeApplicator.applyTheme(newTheme);
    
    if (!saved || !applied) {
      // Handle errors gracefully
      console.warn('Theme operation partially failed');
    }
  };
}
```

## Monitoring and Debugging

### Error History Access
```javascript
import { ThemeErrorLogger } from '@microrealestate/commonui/utils/themeErrorHandling';

// Get recent errors for debugging
const recentErrors = ThemeErrorLogger.getRecentErrors();

// Clear error history
ThemeErrorLogger.clearErrors();
```

### Error Debugger Hook
```javascript
import { useThemeErrorDebugger } from '@microrealestate/commonui/components/ThemeErrorDebugger';

function MyComponent() {
  const { errors, hasErrors, errorCount, clearErrors } = useThemeErrorDebugger();
  
  // Use error information for debugging
}
```

## Best Practices

1. **Always use error boundaries** around theme-related components
2. **Implement graceful fallbacks** for all theme operations
3. **Log errors appropriately** for development vs production
4. **Test error scenarios** during development
5. **Monitor error rates** in production
6. **Provide user feedback** when theme operations fail
7. **Use safe utilities** instead of direct DOM/storage operations

## Requirements Compliance

This implementation satisfies all requirements from task 8:

✅ **Error boundaries for theme-related failures**
- `ThemeErrorBoundary` component with retry functionality
- Integration in both theme providers

✅ **Graceful fallbacks when localStorage is unavailable**
- `SafeStorage` utility with availability detection
- Fallback values for all storage operations

✅ **Handle system theme detection failures with appropriate defaults**
- `SystemThemeDetector` with safe detection and fallback to light theme
- Error handling in system theme listeners

✅ **Log theme-related errors in development mode for debugging**
- `ThemeErrorLogger` with development/production modes
- Structured error logging with context
- Error history storage for debugging
- Development-only error debugger component

The error handling system ensures the theme functionality remains robust and user-friendly even when underlying operations fail.