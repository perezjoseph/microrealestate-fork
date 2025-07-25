/**
 * Accessibility test page for ThemeToggle component
 * Use this page to manually test with screen readers and other assistive technologies
 */

'use client';

import React, { useEffect, useState } from 'react';
import { ThemeToggle } from './ThemeToggle';
import { generateAccessibilityReport, logAccessibilityReport } from '../utils/accessibility';

export function ThemeToggleAccessibilityTest() {
  const [report, setReport] = useState(null);
  const [announcements, setAnnouncements] = useState([]);

  useEffect(() => {
    // Generate accessibility report on mount
    const accessibilityReport = generateAccessibilityReport();
    setReport(accessibilityReport);
    
    // Log report in development
    logAccessibilityReport();

    // Monitor theme announcements
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' || mutation.type === 'characterData') {
          const target = mutation.target;
          if (target.getAttribute && target.getAttribute('aria-live') === 'polite') {
            const text = target.textContent.trim();
            if (text) {
              setAnnouncements(prev => [...prev.slice(-4), {
                id: Date.now(),
                text,
                timestamp: new Date().toLocaleTimeString()
              }]);
            }
          }
        }
      });
    });

    // Observe all live regions
    const liveRegions = document.querySelectorAll('[aria-live]');
    liveRegions.forEach(region => {
      observer.observe(region, {
        childList: true,
        characterData: true,
        subtree: true
      });
    });

    return () => observer.disconnect();
  }, []);

  const handleThemeChange = (newTheme) => {
    console.log('Theme changed to:', newTheme);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <header>
        <h1 className="text-3xl font-bold mb-2">Theme Toggle Accessibility Test</h1>
        <p className="text-muted-foreground">
          Use this page to test the theme toggle component with assistive technologies.
        </p>
      </header>

      {/* Accessibility Report */}
      {report && (
        <section className="bg-card p-6 rounded-lg border">
          <h2 className="text-xl font-semibold mb-4">WCAG AA Compliance Report</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{report.summary.passRate}%</div>
              <div className="text-sm text-muted-foreground">Pass Rate</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-success">{report.summary.passed}</div>
              <div className="text-sm text-muted-foreground">Passed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-destructive">{report.summary.failed}</div>
              <div className="text-sm text-muted-foreground">Failed</div>
            </div>
          </div>
          
          {report.contrast.overall.issues.length > 0 && (
            <div className="mt-4">
              <h3 className="font-medium text-destructive mb-2">Contrast Issues:</h3>
              <ul className="space-y-1 text-sm">
                {report.contrast.overall.issues.map((issue, index) => (
                  <li key={index} className="text-muted-foreground">
                    {issue.combination}: {issue.ratio}:1 (needs {issue.required}:1)
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      {/* Theme Toggle Variants */}
      <section className="bg-card p-6 rounded-lg border">
        <h2 className="text-xl font-semibold mb-4">Theme Toggle Variants</h2>
        <div className="space-y-6">
          
          {/* Button Variant */}
          <div className="space-y-2">
            <h3 className="font-medium">Button Variant</h3>
            <div className="flex items-center gap-4">
              <ThemeToggle 
                variant="button" 
                onThemeChange={handleThemeChange}
                id="theme-button"
              />
              <ThemeToggle 
                variant="button" 
                showLabel={true}
                onThemeChange={handleThemeChange}
                id="theme-button-label"
              />
              <ThemeToggle 
                variant="button" 
                size="sm"
                onThemeChange={handleThemeChange}
                id="theme-button-sm"
              />
              <ThemeToggle 
                variant="button" 
                size="lg"
                onThemeChange={handleThemeChange}
                id="theme-button-lg"
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
                id="theme-switch"
              />
              <ThemeToggle 
                variant="switch" 
                showLabel={true}
                onThemeChange={handleThemeChange}
                id="theme-switch-label"
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
                id="theme-dropdown"
              />
              <ThemeToggle 
                variant="dropdown" 
                showLabel={true}
                onThemeChange={handleThemeChange}
                id="theme-dropdown-label"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Keyboard Navigation Test */}
      <section className="bg-card p-6 rounded-lg border">
        <h2 className="text-xl font-semibold mb-4">Keyboard Navigation Test</h2>
        <div className="space-y-4">
          <p className="text-muted-foreground">
            Test keyboard navigation with the following sequence:
          </p>
          <ol className="list-decimal list-inside space-y-1 text-sm">
            <li>Press <kbd className="px-2 py-1 bg-muted rounded text-xs">Tab</kbd> to focus each theme toggle</li>
            <li>Press <kbd className="px-2 py-1 bg-muted rounded text-xs">Enter</kbd> or <kbd className="px-2 py-1 bg-muted rounded text-xs">Space</kbd> to activate</li>
            <li>Press <kbd className="px-2 py-1 bg-muted rounded text-xs">Escape</kbd> to blur the focused element</li>
            <li>Use <kbd className="px-2 py-1 bg-muted rounded text-xs">Shift+Tab</kbd> to navigate backwards</li>
          </ol>
          
          <div className="flex items-center gap-4 p-4 bg-muted/50 rounded">
            <ThemeToggle id="kb-test-1" onThemeChange={handleThemeChange} />
            <ThemeToggle id="kb-test-2" variant="switch" onThemeChange={handleThemeChange} />
            <ThemeToggle id="kb-test-3" variant="dropdown" onThemeChange={handleThemeChange} />
          </div>
        </div>
      </section>

      {/* Screen Reader Announcements */}
      <section className="bg-card p-6 rounded-lg border">
        <h2 className="text-xl font-semibold mb-4">Screen Reader Announcements</h2>
        <p className="text-muted-foreground mb-4">
          This section shows theme change announcements that are sent to screen readers:
        </p>
        
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {announcements.length === 0 ? (
            <p className="text-muted-foreground italic">No announcements yet. Try changing the theme.</p>
          ) : (
            announcements.map(announcement => (
              <div key={announcement.id} className="flex justify-between items-start p-2 bg-muted/50 rounded text-sm">
                <span>{announcement.text}</span>
                <span className="text-xs text-muted-foreground ml-2">{announcement.timestamp}</span>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Accessibility Checklist */}
      <section className="bg-card p-6 rounded-lg border">
        <h2 className="text-xl font-semibold mb-4">Accessibility Testing Checklist</h2>
        <div className="space-y-3">
          <h3 className="font-medium">Screen Reader Testing:</h3>
          <ul className="space-y-1 text-sm">
            <li className="flex items-center gap-2">
              <input type="checkbox" id="sr-labels" className="rounded" />
              <label htmlFor="sr-labels">Button labels are announced correctly</label>
            </li>
            <li className="flex items-center gap-2">
              <input type="checkbox" id="sr-state" className="rounded" />
              <label htmlFor="sr-state">Current theme state is announced</label>
            </li>
            <li className="flex items-center gap-2">
              <input type="checkbox" id="sr-changes" className="rounded" />
              <label htmlFor="sr-changes">Theme changes are announced</label>
            </li>
            <li className="flex items-center gap-2">
              <input type="checkbox" id="sr-instructions" className="rounded" />
              <label htmlFor="sr-instructions">Usage instructions are provided</label>
            </li>
          </ul>

          <h3 className="font-medium mt-4">Keyboard Testing:</h3>
          <ul className="space-y-1 text-sm">
            <li className="flex items-center gap-2">
              <input type="checkbox" id="kb-focus" className="rounded" />
              <label htmlFor="kb-focus">All buttons are focusable with Tab</label>
            </li>
            <li className="flex items-center gap-2">
              <input type="checkbox" id="kb-activate" className="rounded" />
              <label htmlFor="kb-activate">Enter and Space keys activate buttons</label>
            </li>
            <li className="flex items-center gap-2">
              <input type="checkbox" id="kb-escape" className="rounded" />
              <label htmlFor="kb-escape">Escape key blurs focused button</label>
            </li>
            <li className="flex items-center gap-2">
              <input type="checkbox" id="kb-visible" className="rounded" />
              <label htmlFor="kb-visible">Focus indicators are clearly visible</label>
            </li>
          </ul>

          <h3 className="font-medium mt-4">Visual Testing:</h3>
          <ul className="space-y-1 text-sm">
            <li className="flex items-center gap-2">
              <input type="checkbox" id="visual-contrast" className="rounded" />
              <label htmlFor="visual-contrast">Sufficient color contrast in both themes</label>
            </li>
            <li className="flex items-center gap-2">
              <input type="checkbox" id="visual-focus" className="rounded" />
              <label htmlFor="visual-focus">Focus indicators meet contrast requirements</label>
            </li>
            <li className="flex items-center gap-2">
              <input type="checkbox" id="visual-states" className="rounded" />
              <label htmlFor="visual-states">All interactive states are visually distinct</label>
            </li>
            <li className="flex items-center gap-2">
              <input type="checkbox" id="visual-icons" className="rounded" />
              <label htmlFor="visual-icons">Icons are clear and recognizable</label>
            </li>
          </ul>
        </div>
      </section>

      {/* Testing Instructions */}
      <section className="bg-card p-6 rounded-lg border">
        <h2 className="text-xl font-semibold mb-4">Testing with Assistive Technologies</h2>
        <div className="space-y-4 text-sm">
          <div>
            <h3 className="font-medium">NVDA (Windows):</h3>
            <p className="text-muted-foreground">
              Start NVDA, navigate to this page, and use Tab to move between theme toggles. 
              Listen for proper announcements of button labels and theme changes.
            </p>
          </div>
          
          <div>
            <h3 className="font-medium">JAWS (Windows):</h3>
            <p className="text-muted-foreground">
              Use virtual cursor mode to navigate. Test both Tab navigation and arrow key navigation.
              Verify that button roles and states are announced correctly.
            </p>
          </div>
          
          <div>
            <h3 className="font-medium">VoiceOver (macOS):</h3>
            <p className="text-muted-foreground">
              Use Cmd+F5 to start VoiceOver. Navigate with Tab or VO+Arrow keys.
              Test the rotor (VO+U) to ensure buttons are listed correctly.
            </p>
          </div>
          
          <div>
            <h3 className="font-medium">TalkBack (Android):</h3>
            <p className="text-muted-foreground">
              Enable TalkBack in accessibility settings. Use swipe gestures to navigate.
              Double-tap to activate theme toggles and listen for feedback.
            </p>
          </div>
          
          <div>
            <h3 className="font-medium">Voice Control:</h3>
            <p className="text-muted-foreground">
              Test voice commands like "Click theme toggle" or "Press button".
              Ensure all interactive elements can be activated by voice.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default ThemeToggleAccessibilityTest;