/**
 * Demo page for testing ThemeToggle accessibility features
 * Use this component to manually test the theme toggle with assistive technologies
 */

'use client';

import React, { useState } from 'react';
import { ThemeToggle } from './ThemeToggle';

export function ThemeToggleDemo() {
  const [currentTheme, setCurrentTheme] = useState('light');
  const [announcements, setAnnouncements] = useState([]);

  const handleThemeChange = (newTheme) => {
    setCurrentTheme(newTheme);
    console.log('Theme changed to:', newTheme);
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-8">
      <header>
        <h1 className="text-2xl font-bold mb-2">Theme Toggle Accessibility Demo</h1>
        <p className="text-muted-foreground">
          Test the theme toggle components with keyboard navigation and screen readers.
        </p>
      </header>

      {/* Current Theme Display */}
      <section className="bg-card p-4 rounded-lg border">
        <h2 className="text-lg font-semibold mb-2">Current Theme</h2>
        <p className="text-muted-foreground">
          Active theme: <span className="font-medium text-foreground">{currentTheme}</span>
        </p>
      </section>

      {/* Theme Toggle Variants */}
      <section className="bg-card p-6 rounded-lg border space-y-6">
        <h2 className="text-lg font-semibold">Theme Toggle Variants</h2>
        
        {/* Button Variant */}
        <div className="space-y-2">
          <h3 className="font-medium">Button Variant</h3>
          <div className="flex items-center gap-4">
            <ThemeToggle 
              variant="button" 
              onThemeChange={handleThemeChange}
              id="demo-button"
            />
            <ThemeToggle 
              variant="button" 
              showLabel={true}
              onThemeChange={handleThemeChange}
              id="demo-button-label"
            />
            <ThemeToggle 
              variant="button" 
              size="sm"
              onThemeChange={handleThemeChange}
              id="demo-button-sm"
            />
            <ThemeToggle 
              variant="button" 
              size="lg"
              onThemeChange={handleThemeChange}
              id="demo-button-lg"
            />
          </div>
        </div>

        {/* Switch Variant */}
        <div className="space-y-2">
          <h3 className="font-medium">Switch Variant</h3>
          <div className="flex items-center gap-4">
            <ThemeToggle 
              variant="switch" 
              onThemeChange={handleThemeChange}
              id="demo-switch"
            />
            <ThemeToggle 
              variant="switch" 
              showLabel={true}
              onThemeChange={handleThemeChange}
              id="demo-switch-label"
            />
          </div>
        </div>

        {/* Dropdown Variant */}
        <div className="space-y-2">
          <h3 className="font-medium">Dropdown Variant</h3>
          <div className="flex items-center gap-4">
            <ThemeToggle 
              variant="dropdown" 
              onThemeChange={handleThemeChange}
              id="demo-dropdown"
            />
            <ThemeToggle 
              variant="dropdown" 
              showLabel={true}
              onThemeChange={handleThemeChange}
              id="demo-dropdown-label"
            />
          </div>
        </div>
      </section>

      {/* Keyboard Testing Instructions */}
      <section className="bg-card p-6 rounded-lg border">
        <h2 className="text-lg font-semibold mb-4">Keyboard Testing</h2>
        <div className="space-y-2 text-sm">
          <p><kbd className="px-2 py-1 bg-muted rounded text-xs">Tab</kbd> - Focus next theme toggle</p>
          <p><kbd className="px-2 py-1 bg-muted rounded text-xs">Shift+Tab</kbd> - Focus previous theme toggle</p>
          <p><kbd className="px-2 py-1 bg-muted rounded text-xs">Enter</kbd> or <kbd className="px-2 py-1 bg-muted rounded text-xs">Space</kbd> - Activate theme toggle</p>
          <p><kbd className="px-2 py-1 bg-muted rounded text-xs">Escape</kbd> - Remove focus from active element</p>
        </div>
      </section>

      {/* Screen Reader Testing */}
      <section className="bg-card p-6 rounded-lg border">
        <h2 className="text-lg font-semibold mb-4">Screen Reader Testing</h2>
        <div className="space-y-2 text-sm">
          <p>✅ Each button has a descriptive aria-label</p>
          <p>✅ Current theme state is announced</p>
          <p>✅ Theme changes are announced via live regions</p>
          <p>✅ Usage instructions are provided via aria-describedby</p>
          <p>✅ Switch variant uses proper role and aria-checked</p>
        </div>
      </section>

      {/* Accessibility Checklist */}
      <section className="bg-card p-6 rounded-lg border">
        <h2 className="text-lg font-semibold mb-4">Accessibility Checklist</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <h3 className="font-medium mb-2">Visual</h3>
            <ul className="space-y-1">
              <li>□ Focus indicators visible</li>
              <li>□ Sufficient color contrast</li>
              <li>□ Icons are recognizable</li>
              <li>□ Text readable at 200% zoom</li>
            </ul>
          </div>
          <div>
            <h3 className="font-medium mb-2">Functional</h3>
            <ul className="space-y-1">
              <li>□ Keyboard navigation works</li>
              <li>□ Screen reader announcements</li>
              <li>□ Theme changes properly</li>
              <li>□ No keyboard traps</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Color Contrast Information */}
      <section className="bg-card p-6 rounded-lg border">
        <h2 className="text-lg font-semibold mb-4">WCAG AA Compliance</h2>
        <div className="text-sm space-y-2">
          <p>✅ All color combinations meet WCAG AA standards (4.5:1 minimum)</p>
          <p>✅ Focus indicators have sufficient contrast</p>
          <p>✅ Interactive elements are clearly distinguishable</p>
          <p>✅ No information conveyed by color alone</p>
        </div>
        <div className="mt-4 p-3 bg-muted/50 rounded text-xs">
          <p>Run <code>node scripts/validate-accessibility.js</code> to verify contrast ratios</p>
        </div>
      </section>
    </div>
  );
}

export default ThemeToggleDemo;