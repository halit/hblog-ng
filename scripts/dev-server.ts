import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('🚀 Starting development server with data watcher...');

const watchProcess = spawn('npm', ['run', 'watch-data'], {
  cwd: rootDir,
  stdio: 'inherit',
  shell: true,
});

const nextProcess = spawn('npx', ['next', 'dev'], {
  cwd: rootDir,
  stdio: 'inherit',
  shell: true,
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
