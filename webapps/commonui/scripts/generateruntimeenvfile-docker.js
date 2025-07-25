const fs = require('fs');
const path = require('path');

createRuntimeEnvFile();

/**
 * Creates a runtime environment file for the browser.
 * Filters out environment variables that start with "NEXT_PUBLIC" from the process environment object,
 * and then writes them to a file named "__ENV.js" in the "public" directory.
 * The environment variables are written as a JSON object assigned to the "window.__ENV" property.
 */
function createRuntimeEnvFile() {
  const browserEnvVars = {
    NEXT_PUBLIC_APP_NAME: process.env.APP_NAME || 'MicroRealEstate',
    NEXT_PUBLIC_NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_CORS_ENABLED: process.env.CORS_ENABLED,
    NEXT_PUBLIC_SIGNUP: process.env.SIGNUP,
    NEXT_PUBLIC_GATEWAY_URL: process.env.GATEWAY_URL,
    NEXT_PUBLIC_BASE_PATH: process.env.BASE_PATH,
    NEXT_PUBLIC_DEMO_MODE: process.env.DEMO_MODE
  };

  const workingDir = process.cwd();
  const publicDir = path.join(workingDir, 'public');
  const envFilePath = path.join(publicDir, '__ENV.js');

  console.log(`Creating runtime environment file at: ${envFilePath}`);
  console.log('Environment variables:', browserEnvVars);

  try {
    // Check if public directory exists
    if (!fs.existsSync(publicDir)) {
      console.error(`Error: public directory not found at ${publicDir}`);
      process.exit(1);
    }

    // Write environment variables to file (overwrite placeholder)
    const envContent = `window.__ENV = ${JSON.stringify(browserEnvVars, null, 2)}`;
    fs.writeFileSync(envFilePath, envContent);

    console.log('Successfully created runtime environment file');
  } catch (error) {
    console.error(`Error creating runtime environment file: ${error.message}`);

    // Try to create a fallback file in the working directory
    try {
      const fallbackPath = path.join(workingDir, '__ENV.js');
      const envContent = `window.__ENV = ${JSON.stringify(browserEnvVars, null, 2)}`;
      fs.writeFileSync(fallbackPath, envContent);
      console.log(`Created fallback environment file at: ${fallbackPath}`);
    } catch (fallbackError) {
      console.error(`Failed to create fallback file: ${fallbackError.message}`);
      // Don't exit with error - the app might still work without this file
      console.warn('Continuing without runtime environment file...');
    }
  }
}
