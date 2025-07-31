/**
 * Browser Environment Check Utility
 * Provides safe access to browser-specific APIs during SSR
 */

// Check if we're in a browser environment
export const isBrowser = typeof window !== 'undefined';

// Safe access to navigator
export const safeNavigator = isBrowser ? navigator : {
  onLine: true,
  userAgent: 'SSR',
  connection: {
    effectiveType: '4g',
    downlink: 10,
    rtt: 100,
    saveData: false
  }
};

// Safe access to localStorage
export const safeLocalStorage = {
  getItem: (key) => {
    if (!isBrowser) return null;
    try {
      return localStorage.getItem(key);
    } catch (e) {
      return null;
    }
  },
  setItem: (key, value) => {
    if (!isBrowser) return false;
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (e) {
      return false;
    }
  },
  removeItem: (key) => {
    if (!isBrowser) return false;
    try {
      localStorage.removeItem(key);
      return true;
    } catch (e) {
      return false;
    }
  }
};

// Safe access to document
export const safeDocument = isBrowser ? document : {
  addEventListener: () => {},
  removeEventListener: () => {},
  querySelector: () => null,
  querySelectorAll: () => [],
  createElement: () => ({}),
  body: { appendChild: () => {} },
  head: { appendChild: () => {} }
};

// Safe access to window
export const safeWindow = isBrowser ? window : {
  addEventListener: () => {},
  removeEventListener: () => {},
  location: { href: '', pathname: '/' },
  innerHeight: 768,
  innerWidth: 1024,
  scrollY: 0
};

// Safe performance API
export const safePerformance = isBrowser && typeof performance !== 'undefined' ? performance : {
  now: () => Date.now(),
  memory: { usedJSHeapSize: 0, totalJSHeapSize: 0, jsHeapSizeLimit: 0 },
  getEntriesByType: () => []
};

// Utility function to run code only in browser
export const runInBrowser = (fn) => {
  if (isBrowser) {
    return fn();
  }
  return null;
};

// Utility function to provide fallback for SSR
export const withSSRFallback = (browserFn, ssrFallback = null) => {
  if (isBrowser) {
    return browserFn();
  }
  return ssrFallback;
};
