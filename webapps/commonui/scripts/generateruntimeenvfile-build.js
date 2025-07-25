const fs = require('fs');
const path = require('path');

// This script runs during Docker build to create the environment file template
function createBuildTimeEnvFile() {
  // Create a template that will be replaced at runtime
  const envTemplate = `window.__ENV = {
  NEXT_PUBLIC_APP_NAME: process.env.APP_NAME || 'MicroRealEstate',
  NEXT_PUBLIC_NODE_ENV: process.env.NODE_ENV,
  NEXT_PUBLIC_CORS_ENABLED: process.env.CORS_ENABLED,
  NEXT_PUBLIC_SIGNUP: process.env.SIGNUP,
  NEXT_PUBLIC_GATEWAY_URL: process.env.GATEWAY_URL,
  NEXT_PUBLIC_BASE_PATH: process.env.BASE_PATH,
  NEXT_PUBLIC_DEMO_MODE: process.env.DEMO_MODE
}`;

  const workingDir = process.cwd();
  const publicDir = path.join(workingDir, 'public');
  const envFilePath = path.join(publicDir, '__ENV.js');

  console.log(`Creating build-time environment template at: ${envFilePath}`);

  try {
    // Ensure public directory exists
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }

    // Write the template file
    fs.writeFileSync(envFilePath, envTemplate);
    console.log('Successfully created build-time environment template');
  } catch (error) {
    console.error(
      `Error creating build-time environment template: ${error.message}`
    );
    process.exit(1);
  }
}

createBuildTimeEnvFile();
