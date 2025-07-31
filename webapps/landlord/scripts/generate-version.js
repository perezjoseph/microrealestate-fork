#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Get current commit hash
let commitHash = 'unknown';
try {
  commitHash = execSync('git rev-parse --short HEAD', {
    encoding: 'utf8'
  }).trim();
} catch (error) {
  console.warn('Could not get git commit hash:', error.message);
}

// Get current date
const releaseDate = new Date().toISOString().split('T')[0];

// Version info template
const versionInfo = {
  version: 'v1.0.0',
  commit: commitHash,
  releaseDate: releaseDate,
  codename: 'Production Ready',
  features: [
    'Complete Property Management System',
    'WhatsApp Integration & Notifications',
    'Enhanced Security & Authentication',
    'Multi-language Support (6 Languages)',
    'Microservices Architecture',
    'Production-Ready Infrastructure'
  ]
};

// Generate the version file content
const versionFileContent = `export const VERSION_INFO = ${JSON.stringify(versionInfo, null, 2)};

export default VERSION_INFO;
`;

// Write to version.js
const versionFilePath = path.join(__dirname, '..', 'src', 'version.js');
fs.writeFileSync(versionFilePath, versionFileContent);

console.log(`Version file generated with commit ${commitHash}`);
