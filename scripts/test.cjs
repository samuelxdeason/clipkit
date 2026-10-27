// Portable suite selection. Run sequentially: browser suites own fixed local ports.
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const [kind, ...requested] = process.argv.slice(2);
const run = args => {
  const result = spawnSync(process.execPath, args, { cwd: root, stdio: 'inherit', windowsHide: true });
  if (result.error) { console.error(result.error.message); process.exit(1); }
  if (result.status !== 0) process.exit(result.status || 1);
};
if (kind === 'unit') {
  run(['--test', ...fs.readdirSync(path.join(root, 'frontend/test')).filter(f => f.endsWith('.test.cjs')).map(f => path.join(root, 'frontend/test', f))]);
} else if (kind === 'ui') {
  const suites = fs.readdirSync(path.join(root, 'frontend/tests')).filter(f => f.endsWith('-smoke.cjs')).map(f => f.replace('-smoke.cjs', '')).sort();
  if (!requested.length || requested.includes('--list')) { console.log('Available suites: ' + suites.join(', ')); process.exit(0); }
  const selected = requested.length === 1 && requested[0] === 'all' ? suites : requested;
  for (const suite of selected) {
    if (!suites.includes(suite)) { console.error('Unknown suite: ' + suite); process.exit(1); }
  }
  for (const suite of [...new Set(selected)]) {
    console.log('Running UI suite: ' + suite);
    run([path.join(root, 'frontend/tests', suite + '-smoke.cjs')]);
  }
} else {
  console.error('Usage: node scripts/test.cjs unit | ui --list | ui all | ui <suite...>');
  process.exit(1);
}
