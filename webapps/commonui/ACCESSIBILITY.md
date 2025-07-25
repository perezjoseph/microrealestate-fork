# Theme Toggle Accessibility Guide

This document outlines the accessibility features implemented in the MicroRealEstate theme toggle system and provides guidance for testing and maintaining accessibility compliance.

## WCAG AA Compliance

The theme toggle system has been designed and tested to meet WCAG 2.1 AA accessibility standards.

### Color Contrast

All color combinations in both light and dark themes meet or exceed WCAG AA contrast requirements:

- **Normal text**: Minimum 4.5:1 contrast ratio
- **Large text**: Minimum 3:1 contrast ratio
- **Interactive elements**: Minimum 4.5:1 contrast ratio

#### Validated Color Combinations

✅ **Body text**: 20.01:1 (light) / 19.12:1 (dark)
✅ **Primary buttons**: 4.94:1 (light) / 4.85:1 (dark)
✅ **Secondary buttons**: 16.3:1 (light) / 13.98:1 (dark)
✅ **Accent elements**: 16.3:1 (light) / 13.98:1 (dark)
✅ **Muted text**: 4.76:1 (light) / 7.8:1 (dark)
✅ **Card content**: 20.01:1 (light) / 19.12:1 (dark)
✅ **Error messages**: 4.52:1 (light) / 9.58:1 (dark)
✅ **Success messages**: 4.55:1 (light) / 4.55:1 (dark)
✅ **Warning messages**: 5.52:1 (light) / 5.52:1 (dark)

### Keyboard Navigation

The theme toggle components support full keyboard navigation:

- **Tab**: Focus the theme toggle button
- **Enter/Space**: Activate theme toggle
- **Escape**: Remove focus from the button
- **Shift+Tab**: Navigate backwards

### Screen Reader Support

#### ARIA Labels and Descriptions

- `aria-label`: Descriptive label indicating current theme and action
- `aria-describedby`: Links to detailed usage instructions
- `role="switch"`: Proper semantic role for switch variant
- `aria-checked`: Current state for switch variant

#### Live Announcements

Theme changes are announced to screen readers using:

- `aria-live="polite"`: Non-intrusive announcements
- `aria-atomic="true"`: Complete message replacement
- Timed announcements that clear after 3 seconds

#### Example Announcements

- "Theme switched to dark mode"
- "Theme switched to system preference: light mode"

### Focus Management

#### Visual Focus Indicators

- High-contrast focus rings that meet WCAG AA requirements
- Visible focus indicators for keyboard navigation
- Distinct focus states from hover states

#### Focus Behavior

- Focus visible only when navigating with keyboard
- Mouse clicks don't show focus indicators
- Escape key removes focus from active element

## Component Variants

### Button Variant (Default)

```jsx
<ThemeToggle 
  variant="button"
  id="theme-button"
  onThemeChange={handleThemeChange}
/>
```

**Accessibility Features:**
- Standard button semantics
- Descriptive aria-label
- Keyboard activation support
- Focus management

### Switch Variant

```jsx
<ThemeToggle 
  variant="switch"
  showLabel={true}
  id="theme-switch"
  onThemeChange={handleThemeChange}
/>
```

**Accessibility Features:**
- `role="switch"` semantics
- `aria-checked` state indication
- Associated label element
- Toggle behavior indication

### Dropdown Variant

```jsx
<ThemeToggle 
  variant="dropdown"
  showLabel={true}
  id="theme-dropdown"
  onThemeChange={handleThemeChange}
/>
```

**Accessibility Features:**
- `aria-expanded` and `aria-haspopup` attributes
- Menu semantics preparation
- Dropdown indicator icon

## Testing Guidelines

### Automated Testing

Run the accessibility validation script:

```bash
cd webapps/commonui
node scripts/validate-accessibility.js
```

This script validates:
- WCAG AA color contrast compliance
- Theme color consistency
- Accessibility report generation

### Manual Testing Checklist

#### Screen Reader Testing

**NVDA (Windows):**
- [ ] Button labels announced correctly
- [ ] Theme changes announced
- [ ] Navigation instructions provided
- [ ] Current state communicated

**JAWS (Windows):**
- [ ] Virtual cursor navigation works
- [ ] Button roles recognized
- [ ] State changes announced
- [ ] Keyboard shortcuts functional

**VoiceOver (macOS):**
- [ ] VO+Arrow navigation works
- [ ] Rotor lists buttons correctly
- [ ] Announcements are clear
- [ ] Interaction hints provided

**TalkBack (Android):**
- [ ] Swipe navigation works
- [ ] Double-tap activation works
- [ ] State feedback provided
- [ ] Explore by touch works

#### Keyboard Testing

- [ ] Tab navigation reaches all toggles
- [ ] Enter key activates toggles
- [ ] Space key activates toggles
- [ ] Escape key removes focus
- [ ] Focus indicators visible
- [ ] No keyboard traps

#### Visual Testing

- [ ] Sufficient contrast in both themes
- [ ] Focus indicators clearly visible
- [ ] Icons recognizable and clear
- [ ] Text readable at 200% zoom
- [ ] No information conveyed by color alone

### Assistive Technology Testing

#### Voice Control

Test voice commands:
- "Click theme toggle"
- "Press theme button"
- "Switch theme"

#### Switch Control

Test with external switches:
- Single switch scanning
- Two-switch navigation
- Activation timing

#### High Contrast Mode

Test in high contrast mode:
- Windows High Contrast
- macOS Increase Contrast
- Browser high contrast extensions

## Implementation Best Practices

### Required Props for Accessibility

```jsx
<ThemeToggle
  id="unique-id"              // Required for aria-describedby
  onThemeChange={callback}    // Recommended for state management
  announceChanges={true}      // Default: true
/>
```

### Accessibility-First Development

1. **Always provide IDs** for complex components
2. **Test with keyboard only** during development
3. **Verify screen reader announcements** for all state changes
4. **Validate color contrast** before deployment
5. **Test with real assistive technologies** when possible

### Common Pitfalls to Avoid

❌ **Don't:**
- Rely only on color to convey information
- Use generic button labels like "Toggle"
- Forget to announce state changes
- Skip keyboard testing
- Ignore focus management

✅ **Do:**
- Provide descriptive labels and instructions
- Test with multiple assistive technologies
- Validate contrast ratios regularly
- Implement proper focus management
- Follow semantic HTML practices

## Maintenance

### Regular Accessibility Audits

1. **Monthly**: Run automated contrast validation
2. **Quarterly**: Manual screen reader testing
3. **Bi-annually**: Full assistive technology audit
4. **Before releases**: Complete accessibility checklist

### Updating Color Schemes

When modifying theme colors:

1. Run the accessibility validation script
2. Fix any contrast issues identified
3. Test with high contrast mode
4. Verify with screen readers
5. Update documentation if needed

### Monitoring and Reporting

The accessibility validation script generates detailed reports:

- Contrast ratio measurements
- WCAG compliance status
- Specific issue identification
- Improvement recommendations

Reports are saved to `accessibility-report.json` for tracking and compliance documentation.

## Resources

### WCAG Guidelines
- [WCAG 2.1 AA Guidelines](https://www.w3.org/WAI/WCAG21/AA/)
- [Understanding WCAG 2.1](https://www.w3.org/WAI/WCAG21/Understanding/)

### Testing Tools
- [NVDA Screen Reader](https://www.nvaccess.org/download/)
- [WAVE Web Accessibility Evaluator](https://wave.webaim.org/)
- [axe DevTools](https://www.deque.com/axe/devtools/)
- [Colour Contrast Analyser](https://www.tpgi.com/color-contrast-checker/)

### Assistive Technology
- [Screen Reader Testing Guide](https://webaim.org/articles/screenreader_testing/)
- [Keyboard Navigation Testing](https://webaim.org/techniques/keyboard/)
- [Voice Control Testing](https://support.apple.com/guide/mac-help/use-voice-control-mchlc06d90f1/mac)

## Support

For accessibility questions or issues:

1. Check this documentation first
2. Run the validation script for contrast issues
3. Test with the accessibility test page
4. Consult WCAG guidelines for specific requirements
5. Consider user feedback and real-world testing

Remember: Accessibility is not a one-time implementation but an ongoing commitment to inclusive design.