#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

// Replace __MRE_BASE_PATH__ with actual BASE_PATH
function replaceBasePath() {
  const BASE_PATH = process.env.BASE_PATH || '';
  console.log(`Replacing __MRE_BASE_PATH__ with: ${BASE_PATH}`);

  // Get all files in the .next directory and server.js
  const nextDir = path.join(__dirname, '.next');
  const nextDirFiles = [path.join(__dirname, 'server.js')];

  // Crawl nextDir and return all files
  function crawl(dir, files) {
    if (!fs.existsSync(dir)) return;

    const dirFiles = fs.readdirSync(dir);
    dirFiles.forEach((file) => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      if (stat.isDirectory()) {
        crawl(filePath, files);
      } else {
        files.push(filePath);
      }
    });
  }

  crawl(nextDir, nextDirFiles);

  // Filter files which end with .js, .json, .html, .css, .map and trace file
  const nextDirFilesToReplace = nextDirFiles.filter((f) => {
    const ext = path.extname(f);
    if (['.js', '.json', '.html', '.css', '.map'].includes(ext)) {
      return true;
    }
    const filename = path.basename(f);
    return filename === 'trace';
  });

  // Replace /__MRE_BASE_PATH__ with the env BASE_PATH in all files
  nextDirFilesToReplace.forEach((f) => {
    try {
      const fileContents = fs.readFileSync(f, 'utf8');
      let replaced = fileContents.replace(
        /\/__MRE_BASE_PATH__/g,
        BASE_PATH || ''
      );
      replaced = replaced.replace(/%2F__MRE_BASE_PATH__/g, BASE_PATH || '');

      if (fileContents !== replaced) {
        fs.writeFileSync(f, replaced);
        console.log(`Updated: ${f}`);
      }
    } catch (error) {
      console.warn(`Could not process file ${f}: ${error.message}`);
    }
  });
}

// Run the replacement
replaceBasePath();

// Start the Next.js server
console.log('Starting Next.js server...');
const serverPath = path.join(__dirname, 'server.js');
const server = spawn(process.execPath, [serverPath], {
  stdio: 'inherit',
  env: process.env
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
