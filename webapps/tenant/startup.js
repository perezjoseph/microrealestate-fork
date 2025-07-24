#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

async function runScript(scriptPath) {
  return new Promise((resolve, reject) => {
    console.log(`Running: ${scriptPath}`);
    const child = spawn(process.execPath, [scriptPath], {
      stdio: 'inherit',
      env: process.env,
      cwd: '/usr/app/webapps/tenant'
    });
    
    child.on('exit', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Script ${scriptPath} exited with code ${code}`));
      }
    });
    
    child.on('error', reject);
  });
}

async function main() {
  try {
    // Change to the tenant directory
    process.chdir('/usr/app/webapps/tenant');
    
    // Run base path replacement script (Docker version)
    await runScript('/usr/app/webapps/commonui/scripts/replacebasepath-docker.js');
    
    // Run runtime environment file generation script (Docker version)
    await runScript('/usr/app/webapps/commonui/scripts/generateruntimeenvfile-docker.js');
    
    // Start the Next.js server
    console.log('Starting Next.js server...');
    const server = spawn(process.execPath, ['server.js'], {
      stdio: 'inherit',
      env: process.env,
      cwd: '/usr/app/webapps/tenant'
    });
    
    server.on('exit', (code) => {
      process.exit(code);
    });
    
    process.on('SIGTERM', () => {
      server.kill('SIGTERM');
    });
    
    process.on('SIGINT', () => {
      server.kill('SIGINT');
    });
    
  } catch (error) {
    console.error('Startup failed:', error.message);
    process.exit(1);
  }
}

main();
