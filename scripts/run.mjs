import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

const python = resolve(
  process.platform === 'win32'
    ? '.venv/Scripts/python.exe'
    : '.venv/bin/python',
);
if (!existsSync(python)) {
  console.error(
    'Create .venv and install scripts/requirements.txt first. See README.md.',
  );
  process.exit(1);
}
const production = process.argv.includes('--production');
const children = [
  spawn(
    python,
    ['-u', 'scripts/serve_lotto.py', '--port', production ? '4173' : '8787'],
    { stdio: 'inherit' },
  ),
];
if (!production)
  children.push(
    spawn(
      process.execPath,
      [
        'node_modules/vite/bin/vite.js',
        '--host',
        '127.0.0.1',
        ...process.argv.slice(2),
      ],
      { stdio: 'inherit' },
    ),
  );
let stopping = false;
function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  children.forEach((child) => child.kill());
  process.exitCode = code;
}
process.on('SIGINT', () => stop());
process.on('SIGTERM', () => stop());
for (const child of children) {
  child.on('error', (error) => {
    console.error(error.message);
    stop(1);
  });
  child.on('exit', (code) => stop(code ?? 0));
}
