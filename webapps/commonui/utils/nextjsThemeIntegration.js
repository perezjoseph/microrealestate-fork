/**
 * Next.js integration utilities for SSR-compatible theme system
 * Provides helpers for integrating the theme system with Next.js applications
 */

import React, { useState, useEffect } from 'react';
import { createNoFlashCSS, createNoFlashScript } from './noFlashTheme.js';
import { themeStorageUtils } from './themeStorage.js';
import { SSRThemeProvider } from '../components/SSRThemeProvider.jsx';

/**
 * Get theme from Next.js request cookies
 * @param {Object} req - Next.js request object
 * @returns {string|null} Theme from cookies
 */
export function getThemeFromRequest(req) {
  if (!req || !req.cookies) {
    return null;
  }

  try {
    const cookieValue = req.cookies.theme_preference || req.cookies['mre-theme-preference'];
    if (!cookieValue) {
      return null;
    }

    const decoded = decodeURIComponent(cookieValue);
    const parsed = JSON.parse(decoded);
    return parsed.theme || null;
  } catch (error) {
    console.warn('Error parsing theme from request cookies:', error);
    return null;
  }
}

/**
 * Create theme props for Next.js pages
 * @param {Object} context - Next.js context (getServerSideProps or getStaticProps)
 * @returns {Object} Theme props
 */
export function createThemeProps(context) {
  const cookieTheme = getThemeFromRequest(context.req);
  
  return {
    cookieTheme,
    noFlashCSS: createNoFlashCSS(cookieTheme),
    noFlashScript: createNoFlashScript(cookieTheme)
  };
}

/**
 * Next.js getServerSideProps helper for theme
 * @param {Object} context - Next.js context
 * @returns {Object} Props with theme data
 */
export function getServerSideThemeProps(context) {
  return {
    props: createThemeProps(context)
  };
}

/**
 * Next.js middleware helper for theme cookies
 * @param {Object} request - Next.js request
 * @param {Object} response - Next.js response
 * @returns {string|null} Theme from request
 */
export function handleThemeMiddleware(request, response) {
  const theme = getThemeFromRequest(request);
  
  // Add theme to response headers for debugging
  if (theme) {
    response.headers.set('X-Theme-Preference', theme);
  }
  
  return theme;
}

/**
 * Create Next.js Head component props for no-flash theme
 * @param {string} [cookieTheme] - Theme from cookies
 * @returns {Object} Head component props
 */
export function createHeadProps(cookieTheme) {
  return {
    dangerouslySetInnerHTML: {
      __html: createNoFlashCSS(cookieTheme) + createNoFlashScript(cookieTheme)
    }
  };
}

/**
 * Next.js Document component helper
 * @param {string} [cookieTheme] - Theme from cookies
 * @returns {Object} Document elements
 */
export function createDocumentElements(cookieTheme) {
  return {
    noFlashCSS: createNoFlashCSS(cookieTheme),
    noFlashScript: createNoFlashScript(cookieTheme)
  };
}

/**
 * Custom App component wrapper for theme
 * @param {React.ComponentType} App - Next.js App component
 * @param {Object} [themeOptions] - Theme provider options
 * @returns {React.ComponentType} Wrapped App component
 */
export function withThemeApp(App, themeOptions = {}) {
  return function ThemedApp(props) {
    const { cookieTheme, ...restProps } = props;
    
    return (
      <SSRThemeProvider 
        cookieTheme={cookieTheme}
        {...themeOptions}
      >
        <App {...restProps} />
      </SSRThemeProvider>
    );
  };
}

/**
 * Custom Document component wrapper for theme
 * @param {React.ComponentType} Document - Next.js Document component
 * @returns {React.ComponentType} Wrapped Document component
 */
export function withThemeDocument(Document) {
  return class ThemedDocument extends Document {
    static async getInitialProps(ctx) {
      const initialProps = await Document.getInitialProps(ctx);
      const cookieTheme = getThemeFromRequest(ctx.req);
      
      return {
        ...initialProps,
        cookieTheme,
        ...createDocumentElements(cookieTheme)
      };
    }
  };
}

/**
 * Hook for Next.js pages to get theme data
 * @returns {Object} Theme data
 */
export function useNextJSTheme() {
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState('system');

  useEffect(() => {
    setMounted(true);
    const currentTheme = themeStorageUtils.getTheme();
    setTheme(currentTheme);
  }, []);

  return {
    theme,
    setTheme: (newTheme) => {
      themeStorageUtils.setTheme(newTheme);
      setTheme(newTheme);
    },
    mounted
  };
}

/**
 * Next.js API route helper for theme
 * @param {Object} req - Next.js API request
 * @param {Object} res - Next.js API response
 * @returns {Object} API response
 */
export function handleThemeAPI(req, res) {
  if (req.method === 'GET') {
    const theme = getThemeFromRequest(req);
    return res.status(200).json({ theme: theme || 'system' });
  }
  
  if (req.method === 'POST') {
    const { theme } = req.body;
    
    if (!theme || !['light', 'dark', 'system'].includes(theme)) {
      return res.status(400).json({ error: 'Invalid theme' });
    }
    
    // Set cookie
    const cookieValue = JSON.stringify({
      theme,
      timestamp: Date.now()
    });
    
    res.setHeader('Set-Cookie', [
      `theme_preference=${encodeURIComponent(cookieValue)}; Max-Age=${365 * 24 * 60 * 60}; Path=/; SameSite=Lax${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`
    ]);
    
    return res.status(200).json({ theme, success: true });
  }
  
  return res.status(405).json({ error: 'Method not allowed' });
}

/**
 * Utility functions for Next.js integration
 */
export const nextjsThemeUtils = {
  getThemeFromRequest,
  createThemeProps,
  getServerSideThemeProps,
  handleThemeMiddleware,
  createHeadProps,
  createDocumentElements,
  handleThemeAPI
};

// Re-export SSRThemeProvider for convenience
export { SSRThemeProvider } from '../components/SSRThemeProvider.jsx';