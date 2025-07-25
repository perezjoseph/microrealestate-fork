# Manual Cross-Browser Testing Checklist

## Overview
This checklist provides step-by-step manual testing procedures for the PhoneInput component across different browsers and devices.

## Pre-Testing Setup

### Environment Preparation
- [ ] Start the development server: `yarn dev`
- [ ] Open browser developer tools
- [ ] Clear browser cache and localStorage
- [ ] Disable browser extensions (for clean testing)
- [ ] Set browser to default zoom level (100%)

### Test Data Preparation
```javascript
// Test phone numbers for different countries
const testNumbers = {
  US: '+1 555 123 4567',
  DE: '+49 30 12345678',
  DO: '+1 809 555 1234', // Dominican Republic
  FR: '+33 1 23 45 67 89',
  BR: '+55 11 99999 9999'
};
```

## Browser Testing Matrix

### Desktop Browsers

#### Chrome (Latest)
**URL**: http://localhost:3000/en/signin

**Basic Functionality**
- [ ] Page loads without errors
- [ ] Phone input field renders correctly
- [ ] Country selector button displays flag and dial code
- [ ] Clicking country selector opens dropdown
- [ ] Country search works (type "Germany")
- [ ] Selecting country updates dial code
- [ ] Phone number validation shows real-time feedback
- [ ] Form submission works with valid number
- [ ] Error messages display for invalid numbers

**Country Detection**
- [ ] Browser locale detection works (check console for detected locale)
- [ ] Country preference persists after page reload
- [ ] Manual country selection overrides detection
- [ ] localStorage stores selected country

**Performance**
- [ ] Component loads within 2 seconds
- [ ] Country dropdown opens instantly
- [ ] Validation response time < 300ms
- [ ] No memory leaks after extended use (check DevTools Memory tab)

**Accessibility**
- [ ] Tab navigation works through all elements
- [ ] Space/Enter opens country selector
- [ ] Arrow keys navigate country list
- [ ] Escape closes dropdown
- [ ] Screen reader announces changes (test with built-in screen reader)
- [ ] Focus indicators are visible
- [ ] Error messages have proper ARIA attributes

#### Firefox (Latest)
**Repeat all Chrome tests above, plus:**

**Firefox-Specific**
- [ ] CSS Grid layout renders correctly
- [ ] Focus outlines are visible (Firefox has different focus styles)
- [ ] Flexbox country selector layout works
- [ ] Font rendering is consistent
- [ ] Input placeholder text displays correctly

#### Safari (Latest - macOS only)
**Repeat all Chrome tests above, plus:**

**Safari-Specific**
- [ ] WebKit-specific CSS properties work
- [ ] Input field styling matches other browsers
- [ ] Country flags (emoji) render correctly
- [ ] Date/time formatting in validation messages
- [ ] localStorage persistence works correctly

#### Edge (Latest)
**Repeat all Chrome tests above, plus:**

**Edge-Specific**
- [ ] Chromium-based features work identically to Chrome
- [ ] Microsoft-specific accessibility features
- [ ] Windows high contrast mode support

### Mobile Browsers

#### Mobile Chrome (Android)
**URL**: http://localhost:3000/en/signin (use device or Chrome DevTools mobile emulation)

**Mobile-Specific Tests**
- [ ] Touch interactions work smoothly
- [ ] Country selector is touch-friendly (minimum 44px touch targets)
- [ ] Virtual keyboard doesn't overlap input field
- [ ] Pinch-to-zoom doesn't break layout
- [ ] Orientation change (portrait/landscape) works
- [ ] Swipe gestures don't interfere with component

**Responsive Design**
- [ ] Layout adapts to screen width
- [ ] Country selector dropdown fits screen
- [ ] Text remains readable at mobile sizes
- [ ] Buttons are appropriately sized for touch

#### Mobile Safari (iOS)
**Repeat all Mobile Chrome tests above, plus:**

**iOS-Specific**
- [ ] iOS virtual keyboard behavior
- [ ] Safari-specific touch events
- [ ] iOS accessibility features (VoiceOver)
- [ ] Safe area handling (iPhone X+ notch)
- [ ] iOS-specific input focus behavior

## Device-Specific Testing

### iPhone Testing
**Devices**: iPhone 12, iPhone 14 Pro, iPhone SE

**Test Scenarios**
- [ ] Portrait mode functionality
- [ ] Landscape mode functionality
- [ ] VoiceOver navigation
- [ ] Dynamic Type (text size) support
- [ ] Dark mode compatibility
- [ ] iOS keyboard shortcuts

### Android Testing
**Devices**: Samsung Galaxy S23, Google Pixel 7, OnePlus 9

**Test Scenarios**
- [ ] Various Android keyboard apps
- [ ] TalkBack accessibility
- [ ] Android-specific gestures
- [ ] Different screen densities
- [ ] Android dark theme

### Tablet Testing
**Devices**: iPad Pro, Samsung Galaxy Tab

**Test Scenarios**
- [ ] Larger screen layout
- [ ] Touch interactions on larger screens
- [ ] Split-screen mode (if applicable)
- [ ] External keyboard support

## Accessibility Testing

### Screen Reader Testing

#### NVDA (Windows)
- [ ] Install NVDA screen reader
- [ ] Navigate to phone input with Tab
- [ ] Verify component is announced correctly
- [ ] Test country selection with screen reader
- [ ] Verify error messages are announced
- [ ] Test form submission flow

#### VoiceOver (macOS/iOS)
- [ ] Enable VoiceOver (Cmd+F5)
- [ ] Navigate with VoiceOver gestures
- [ ] Test country selector accessibility
- [ ] Verify proper role announcements
- [ ] Test error state announcements

#### TalkBack (Android)
- [ ] Enable TalkBack in Android settings
- [ ] Test touch exploration
- [ ] Verify proper content descriptions
- [ ] Test gesture navigation

### Keyboard Navigation Testing
- [ ] Tab through all interactive elements
- [ ] Shift+Tab for reverse navigation
- [ ] Space/Enter to activate buttons
- [ ] Arrow keys for dropdown navigation
- [ ] Escape to close modals/dropdowns
- [ ] Home/End keys in input fields

## Performance Testing

### Load Time Testing
**Tools**: Browser DevTools Network tab

- [ ] Measure initial page load time
- [ ] Check component render time
- [ ] Verify lazy loading of libphonenumber-js
- [ ] Monitor bundle size impact
- [ ] Test with slow 3G simulation

### Memory Usage Testing
**Tools**: Browser DevTools Memory tab

- [ ] Take heap snapshot before component load
- [ ] Use component extensively (100+ validations)
- [ ] Take heap snapshot after usage
- [ ] Check for memory leaks
- [ ] Verify garbage collection works

### Network Testing
- [ ] Test with slow network (3G simulation)
- [ ] Test with intermittent connectivity
- [ ] Verify offline behavior (if applicable)
- [ ] Check CDN loading for dependencies

## Error Handling Testing

### Network Errors
- [ ] Disconnect internet during validation
- [ ] Test with blocked CDN requests
- [ ] Verify graceful degradation

### JavaScript Errors
- [ ] Test with JavaScript disabled
- [ ] Simulate script loading failures
- [ ] Test with ad blockers enabled

### Input Edge Cases
- [ ] Very long phone numbers
- [ ] Special characters in input
- [ ] Copy/paste phone numbers
- [ ] Rapid typing/deletion

## Internationalization Testing

### Language Testing
**Test with each supported locale:**

- [ ] English (en): http://localhost:3000/en/signin
- [ ] Spanish Colombia (es-CO): http://localhost:3000/es-CO/signin
- [ ] Spanish Dominican Republic (es-DO): http://localhost:3000/es-DO/signin
- [ ] French (fr): http://localhost:3000/fr/signin
- [ ] German (de-DE): http://localhost:3000/de-DE/signin
- [ ] Portuguese Brazil (pt-BR): http://localhost:3000/pt-BR/signin

**For each language:**
- [ ] Placeholder text is translated
- [ ] Error messages are translated
- [ ] Country names are localized
- [ ] Number formatting follows locale conventions

### RTL Testing (if applicable)
- [ ] Test with RTL languages
- [ ] Verify layout direction
- [ ] Check text alignment

## Security Testing

### Input Sanitization
- [ ] Test XSS attempts in phone input
- [ ] Verify phone number sanitization
- [ ] Test SQL injection attempts (should be blocked)

### Data Privacy
- [ ] Verify localStorage data is minimal
- [ ] Check for sensitive data in browser storage
- [ ] Test data clearing on logout

## Integration Testing

### Form Integration
- [ ] Test with React Hook Form
- [ ] Verify Zod validation integration
- [ ] Test form reset functionality
- [ ] Check form state persistence

### WhatsApp OTP Integration
- [ ] Test complete sign-in flow
- [ ] Verify E.164 number formatting
- [ ] Test OTP delivery (if possible)
- [ ] Check error handling for failed OTP

## Regression Testing

### Previous Bug Fixes
- [ ] Dominican Republic number formatting
- [ ] Country detection edge cases
- [ ] Mobile keyboard overlap issues
- [ ] Accessibility improvements

### Component Updates
- [ ] Test after dependency updates
- [ ] Verify after React/Next.js updates
- [ ] Check after styling changes

## Documentation Testing

### Code Examples
- [ ] Test all code examples in documentation
- [ ] Verify TypeScript types are correct
- [ ] Check prop documentation accuracy

### API Documentation
- [ ] Test all documented props
- [ ] Verify callback functions work
- [ ] Check default values

## Reporting Issues

### Bug Report Template
When issues are found, document:

1. **Browser/Device**: Specific version and OS
2. **Steps to Reproduce**: Detailed steps
3. **Expected Behavior**: What should happen
4. **Actual Behavior**: What actually happens
5. **Screenshots**: Visual evidence
6. **Console Errors**: Any JavaScript errors
7. **Network Issues**: Failed requests
8. **Workarounds**: Temporary fixes if found

### Issue Severity Levels
- **Critical**: Component doesn't load/work at all
- **High**: Major functionality broken
- **Medium**: Minor functionality issues
- **Low**: Cosmetic or edge case issues

## Test Completion Checklist

### Before Marking Complete
- [ ] All critical and high severity issues resolved
- [ ] At least 95% of tests passing across all browsers
- [ ] Performance benchmarks met
- [ ] Accessibility standards met (WCAG 2.1 AA)
- [ ] Documentation updated with any known issues
- [ ] Regression tests added for fixed bugs

### Sign-off Requirements
- [ ] Frontend developer testing complete
- [ ] QA testing complete (if applicable)
- [ ] Accessibility testing complete
- [ ] Performance testing complete
- [ ] Product owner approval (if applicable)

## Automated Testing Integration

### CI/CD Pipeline
- [ ] Cross-browser tests run on every PR
- [ ] Performance regression tests
- [ ] Accessibility tests automated
- [ ] Visual regression tests (if available)

### Monitoring
- [ ] Real user monitoring enabled
- [ ] Error tracking configured
- [ ] Performance monitoring active
- [ ] Browser usage analytics

---

## Quick Test Commands

```bash
# Start development server
yarn dev

# Run unit tests
yarn test

# Run cross-browser tests
yarn test:cross-browser

# Run accessibility tests
yarn test:a11y

# Run performance tests
yarn test:performance

# Generate test report
yarn test:report
```

## Contact for Issues

- **GitHub Issues**: Create issue with "cross-browser" label
- **Slack**: #frontend-support channel
- **Email**: dev-team@microrealestate.com

---

**Last Updated**: 2024-01-15
**Next Review**: 2024-02-15