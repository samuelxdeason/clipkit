// Build a source-only checkout in a temporary directory, without disturbing running dev servers.
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'clipkit-clean-install-'));
const files = spawnSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', '-z'], { cwd: root, encoding: 'utf8', windowsHide: true });
assert.equal(files.status, 0, files.stderr);
for (const relative of new Set(files.stdout.split('\0').filter(Boolean))) {
  if (relative.endsWith('.log') || !fs.existsSync(path.join(root, relative))) continue;
  const target = path.join(temp, relative);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(path.join(root, relative), target);
}
assert(process.env.npm_execpath, 'Run through npm');
for (const args of [['ci'], ['run', 'build'], ['run', 'build:library'], ['run', 'build:storybook']]) {
  console.log('Clean checkout: npm ' + args.join(' '));
  const result = spawnSync(process.execPath, [process.env.npm_execpath, ...args], { cwd: temp, encoding: 'utf8', windowsHide: true });
  fs.appendFileSync(path.join(temp, 'verification.log'), result.stdout + result.stderr);
  assert.equal(result.status, 0, `Clean-checkout command failed; see ${path.join(temp, 'verification.log')}\n${result.stderr}`);
}
console.log(JSON.stringify({ passed: true, checkout: temp, checks: ['clean npm ci', 'legacy build', 'new app build without generated files', 'Storybook build'] }));
