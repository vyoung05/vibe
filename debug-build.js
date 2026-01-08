#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const LOG_FILE = path.join(__dirname, '.cursor', 'debug.log');
const SESSION_ID = 'debug-session';
const RUN_ID = `run_${Date.now()}`;

// Ensure log directory exists
const logDir = path.dirname(LOG_FILE);
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

function log(location, message, data = {}, hypothesisId = null) {
  const entry = {
    sessionId: SESSION_ID,
    runId: RUN_ID,
    hypothesisId,
    location,
    message,
    data,
    timestamp: Date.now()
  };
  fs.appendFileSync(LOG_FILE, JSON.stringify(entry) + '\n');
  console.log(`[DEBUG] ${location}: ${message}`, data);
}

// #region agent log
log('debug-build.js:1', 'Starting debug build', { nodeVersion: process.version, platform: process.platform }, 'A');
// #endregion

async function runCommand(command, args, hypothesis) {
  return new Promise((resolve, reject) => {
    // #region agent log
    log('debug-build.js:2', `Running command: ${command} ${args.join(' ')}`, { command, args }, hypothesis);
    // #endregion

    const proc = spawn(command, args, {
      shell: true,
      stdio: ['inherit', 'pipe', 'pipe'],
      env: { ...process.env, EXPO_NO_METRO_LAZY: '1' }
    });

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (data) => {
      const text = data.toString();
      stdout += text;
      process.stdout.write(text);
    });

    proc.stderr.on('data', (data) => {
      const text = data.toString();
      stderr += text;
      process.stderr.write(text);
      
      // #region agent log
      if (text.includes('error') || text.includes('Error') || text.includes('ERROR')) {
        log('debug-build.js:3', 'Error detected in stderr', { errorText: text.substring(0, 500) }, hypothesis);
      }
      // #endregion
    });

    proc.on('close', (code) => {
      // #region agent log
      log('debug-build.js:4', `Command completed with exit code ${code}`, { 
        code, 
        stdoutLength: stdout.length,
        stderrLength: stderr.length,
        hasError: stderr.includes('error') || stderr.includes('Error')
      }, hypothesis);
      // #endregion

      if (code === 0) {
        resolve({ stdout, stderr, code });
      } else {
        reject({ stdout, stderr, code, error: `Process exited with code ${code}` });
      }
    });

    proc.on('error', (err) => {
      // #region agent log
      log('debug-build.js:5', 'Process error', { error: err.message }, hypothesis);
      // #endregion
      reject(err);
    });
  });
}

async function main() {
  try {
    console.log('\n=== Step 1: Installing Dependencies ===\n');
    // #region agent log
    log('debug-build.js:6', 'Starting npm install', {}, 'B');
    // #endregion
    
    await runCommand('npm', ['install', '--legacy-peer-deps'], 'B');
    
    // #region agent log
    log('debug-build.js:7', 'npm install completed successfully', {}, 'B');
    // #endregion

    console.log('\n=== Step 2: Checking TypeScript ===\n');
    // #region agent log
    log('debug-build.js:8', 'Running TypeScript check', {}, 'A');
    // #endregion

    try {
      await runCommand('npx', ['tsc', '--noEmit'], 'A');
      // #region agent log
      log('debug-build.js:9', 'TypeScript check passed', {}, 'A');
      // #endregion
    } catch (err) {
      // #region agent log
      log('debug-build.js:10', 'TypeScript check failed (non-fatal)', { error: err.error }, 'A');
      // #endregion
      console.warn('TypeScript check failed but continuing...');
    }

    console.log('\n=== Step 3: Running Expo Export ===\n');
    // #region agent log
    log('debug-build.js:11', 'Starting expo export', { 
      memoryUsage: process.memoryUsage(),
      env: { EXPO_NO_METRO_LAZY: process.env.EXPO_NO_METRO_LAZY }
    }, 'C');
    // #endregion

    const result = await runCommand('npx', ['expo', 'export', '--platform', 'web'], 'C,D,E');

    // #region agent log
    log('debug-build.js:12', 'Expo export completed', { 
      outputLength: result.stdout.length,
      memoryUsage: process.memoryUsage()
    }, 'C,D,E');
    // #endregion

    // Check if dist folder was created
    const distExists = fs.existsSync(path.join(__dirname, 'dist'));
    // #region agent log
    log('debug-build.js:13', 'Checking dist folder', { distExists }, 'D');
    // #endregion

    if (distExists) {
      const distFiles = fs.readdirSync(path.join(__dirname, 'dist'));
      // #region agent log
      log('debug-build.js:14', 'Build successful - dist folder created', { 
        fileCount: distFiles.length,
        files: distFiles.slice(0, 10)
      }, 'D');
      // #endregion
      console.log('\n✅ Build completed successfully!');
      console.log(`📁 Output in dist/ folder (${distFiles.length} files)`);
    } else {
      // #region agent log
      log('debug-build.js:15', 'Build failed - no dist folder', {}, 'D');
      // #endregion
      console.error('\n❌ Build failed - dist folder not created');
    }

  } catch (error) {
    // #region agent log
    log('debug-build.js:16', 'Build process failed', { 
      error: error.message || error.error,
      code: error.code,
      stderrPreview: error.stderr ? error.stderr.substring(0, 1000) : 'N/A'
    }, 'A,B,C,D,E');
    // #endregion
    
    console.error('\n❌ Build failed!');
    console.error('Error:', error.message || error.error);
    if (error.stderr) {
      console.error('\nError output:', error.stderr.substring(0, 500));
    }
    process.exit(1);
  }
}

// #region agent log
log('debug-build.js:17', 'Debug build script initialized', { cwd: __dirname }, null);
// #endregion

main();
