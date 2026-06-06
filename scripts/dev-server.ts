import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// On Windows the npm/npx executables are `.cmd` scripts. Resolving the correct
// binary name lets us spawn without `shell: true`, which avoids the DEP0190
// deprecation warning emitted when passing an args array to a shell.
const isWindows = process.platform === 'win32';
const npm = isWindows ? 'npm.cmd' : 'npm';
const npx = isWindows ? 'npx.cmd' : 'npx';

// Opt out of Next.js' anonymous telemetry for the dev server.
const env = { ...process.env, NEXT_TELEMETRY_DISABLED: '1' };

console.log('🚀 Starting development server with data watcher...');

const watchProcess = spawn(npm, ['run', 'watch-data'], {
  cwd: rootDir,
  stdio: 'inherit',
  env,
});

const nextProcess = spawn(npx, ['next', 'dev'], {
  cwd: rootDir,
  stdio: 'inherit',
  env,
});

const cleanup = () => {
  console.log('\nStopping development processes...');
  watchProcess.kill();
  nextProcess.kill();
  process.exit();
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

watchProcess.on('exit', (code) => {
  if (code !== 0 && code !== null) {
    console.error(`Watcher process exited with code ${code}`);
    cleanup();
  }
});

nextProcess.on('exit', (code) => {
  if (code !== 0 && code !== null) {
    console.error(`Next.js process exited with code ${code}`);
    cleanup();
  }
});
