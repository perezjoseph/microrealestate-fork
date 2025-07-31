'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

/**
 * Test component to verify theme integration is working correctly
 * This component can be temporarily added to pages for testing
 */
export function ThemeTest() {
  const { theme, setTheme, resolvedTheme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div>Loading theme...</div>;
  }

  return (
    <div className="p-4 border rounded-lg bg-card text-card-foreground">
      <h3 className="text-lg font-semibold mb-2">
        Theme Test Component (Landlord)
      </h3>
      <div className="space-y-2 text-sm">
        <p>
          Current theme: <strong>{theme}</strong>
        </p>
        <p>
          Resolved theme: <strong>{resolvedTheme}</strong>
        </p>
        <p>
          System theme: <strong>{systemTheme}</strong>
        </p>
        <div className="flex gap-2 mt-4">
          <button
            onClick={() => setTheme('light')}
            className="px-3 py-1 bg-primary text-primary-foreground rounded"
          >
            Light
          </button>
          <button
            onClick={() => setTheme('dark')}
            className="px-3 py-1 bg-primary text-primary-foreground rounded"
          >
            Dark
          </button>
          <button
            onClick={() => setTheme('system')}
            className="px-3 py-1 bg-primary text-primary-foreground rounded"
          >
            System
          </button>
        </div>
      </div>
    </div>
  );
}

export default ThemeTest;
