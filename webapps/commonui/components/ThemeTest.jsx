'use client';

import { useTheme } from '../hooks/useTheme';
import { useEffect, useState } from 'react';

/**
 * Test component to verify unified theme hook is working correctly
 * This component can be temporarily added to pages for testing
 */
export function ThemeTest() {
  const { theme, setTheme, resolvedTheme, systemTheme, isLoading, error } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div>Loading theme...</div>;
  }

  if (error) {
    return <div className="text-red-500">Theme error: {error.message}</div>;
  }

  return (
    <div className="p-4 border rounded-lg bg-card text-card-foreground">
      <h3 className="text-lg font-semibold mb-2">Unified Theme Hook Test</h3>
      <div className="space-y-2 text-sm">
        <p>Current theme: <strong>{theme}</strong></p>
        <p>Resolved theme: <strong>{resolvedTheme}</strong></p>
        <p>System theme: <strong>{systemTheme}</strong></p>
        <p>Loading: <strong>{isLoading ? 'Yes' : 'No'}</strong></p>
        <p>Error: <strong>{error ? error.message : 'None'}</strong></p>
        <div className="flex gap-2 mt-4">
          <button
            onClick={() => setTheme('light')}
            className="px-3 py-1 bg-primary text-primary-foreground rounded hover:bg-primary/90"
          >
            Light
          </button>
          <button
            onClick={() => setTheme('dark')}
            className="px-3 py-1 bg-primary text-primary-foreground rounded hover:bg-primary/90"
          >
            Dark
          </button>
          <button
            onClick={() => setTheme('system')}
            className="px-3 py-1 bg-primary text-primary-foreground rounded hover:bg-primary/90"
          >
            System
          </button>
        </div>
      </div>
    </div>
  );
}

export default ThemeTest;