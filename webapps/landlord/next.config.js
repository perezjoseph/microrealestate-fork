const path = require('path');
const nextTranslate = require('next-translate-plugin');

module.exports = nextTranslate({
  output: 'standalone',
  experimental: {
    externalDir: true,
    esmExternals: true // Enable ESM support
  },
  webpack: (config) => {
    // Handle ES modules properly
    config.experiments = {
      ...config.experiments,
      topLevelAwait: true
    };

    // Remove the problematic pdfjs-dist alias since we're using dynamic imports
    // The dynamic imports will handle the ES module loading properly
    
    return config;
  },
  // base path cannot be set at runtime: https://github.com/vercel/next.js/discussions/41769
  basePath: process.env.BASE_PATH || '',
  productionBrowserSourceMaps: true
});
