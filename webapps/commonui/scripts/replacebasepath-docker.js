const fs = require('fs');
const path = require('path');

replaceBasePath();

/**
 * Replaces /__MRE_BASE_PATH__ with the env BASE_PATH in all files in the .next directory.
 * This is necessary because the BASE_PATH is not known at build time.
 * Workaround of issue https://github.com/vercel/next.js/discussions/41769
 */
function replaceBasePath() {
  const BASE_PATH = process.env.BASE_PATH || '';
  
  // Use current working directory to find .next directory
  const nextDir = path.join(process.cwd(), '.next');
  const serverJsPath = path.join(process.cwd(), 'server.js');
  
  console.log(`Looking for .next directory at: ${nextDir}`);
  console.log(`Looking for server.js at: ${serverJsPath}`);
  
  // Check if .next directory exists
  if (!fs.existsSync(nextDir)) {
    console.error(`Error: .next directory not found at ${nextDir}`);
    process.exit(1);
  }
  
  // Start with server.js if it exists
  const nextDirFiles = [];
  if (fs.existsSync(serverJsPath)) {
    nextDirFiles.push(serverJsPath);
  }
  
  // crawl nextDir and return all files
  _crawl(nextDir, nextDirFiles);

  // filter files which end with .js, .json, .html, .css, .map and trace file
  const nextDirFilesToReplace = nextDirFiles.filter((f) => {
    const ext = path.extname(f);
    if (['.js', '.json', '.html', '.css', '.map'].includes(ext)) {
      return true;
    }
    const filename = path.basename(f);
    return filename === 'trace';
  });

  console.log(`Found ${nextDirFilesToReplace.length} files to process`);

  // replace /__MRE_BASE_PATH__ with the env BASE_PATH in all files in the .next directory
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
      console.warn(`Warning: Could not process file ${f}: ${error.message}`);
    }
  });
  
  console.log(`Base path replacement completed. BASE_PATH: ${BASE_PATH}`);
}

/**
 * Recursively crawls a directory and returns all files in the directory.
 * @param {string} dir
 * @param {Array} nextDirFiles
 */
function _crawl(dir, nextDirFiles) {
  try {
    const files = fs.readdirSync(dir);
    files.forEach((file) => {
      const filePath = path.join(dir, file);
      try {
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
          _crawl(filePath, nextDirFiles);
        } else {
          nextDirFiles.push(filePath);
        }
      } catch (error) {
        console.warn(`Warning: Could not stat ${filePath}: ${error.message}`);
      }
    });
  } catch (error) {
    console.warn(`Warning: Could not read directory ${dir}: ${error.message}`);
  }
}
