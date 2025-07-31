import { useState, useEffect } from 'react';
import { LuSun, LuMoon } from 'react-icons/lu';
import { Button } from './ui/button';

export default function SimpleThemeToggle({ size = 'default' }) {
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    setMounted(true);
    // Check current theme from document class or localStorage
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme') || 'light';
      const isDark = document.documentElement.classList.contains('dark');
      setTheme(isDark ? 'dark' : savedTheme);
    }
  }, []);

  const toggleTheme = () => {
    if (typeof window === 'undefined') return;

    const newTheme = theme === 'light' ? 'dark' : 'light';

    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  return (
    <div suppressHydrationWarning>
      <Button
        variant="ghost"
        size={size}
        onClick={toggleTheme}
        className="w-9 h-9"
        title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        disabled={!mounted}
      >
        {mounted ? (
          theme === 'light' ? (
            <LuSun className="h-4 w-4" />
          ) : (
            <LuMoon className="h-4 w-4" />
          )
        ) : (
          <LuSun className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
}
