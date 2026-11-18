// Starts the whole ShareAPlate app with one command: `npm start`
//
// It runs two programs side by side:
//   1. the backend  (the server + database connection)  -> http://localhost:5001
//   2. the frontend (the website you see in the browser) -> http://localhost:5173
//
// Press Ctrl+C once to stop both.

const { spawn } = require('node:child_process');

const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';

const parts = [
  { name: 'backend ', folder: 'backend', color: '\x1b[33m' },
  { name: 'frontend', folder: 'frontend', color: '\x1b[36m' },
];

const running = parts.map(({ name, folder, color }) => {
  const child = spawn(npm, ['run', 'dev', '--prefix', folder], {
    shell: process.platform === 'win32',
  });

  // Label every line so you can tell which part printed it.
  const label = `${color}[${name}]\x1b[0m `;
  const print = (data) =>
    data
      .toString()
      .split('\n')
      .filter((line) => line.trim())
      .forEach((line) => console.log(label + line));

  child.stdout.on('data', print);
  child.stderr.on('data', print);
  child.on('exit', (code) => {
    console.log(`${label}stopped${code ? ` (exit code ${code})` : ''}`);
  });
  return child;
});

console.log('\nShareAPlate is starting... open http://localhost:5173 in your browser.\n');

process.on('SIGINT', () => {
  running.forEach((child) => child.kill('SIGINT'));
  process.exit(0);
});
