// Exercise the tarball, not a workspace symlink, in an isolated consumer.
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const { createRequire } = require('node:module');
const root = path.resolve(__dirname, '..');
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'clipkit-tokens-'));
function npm(args, cwd) {
  assert(process.env.npm_execpath, 'Run via npm run test:tokens');
  const result = spawnSync(process.execPath, [process.env.npm_execpath, ...args], { cwd, encoding: 'utf8', windowsHide: true });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  return result.stdout;
}
(async () => {
  const result = JSON.parse(npm(['pack', '--workspace', '@clipkit/design-tokens', '--pack-destination', temp, '--json', '--ignore-scripts'], root));
  const packed = Array.isArray(result) ? result[0] : result['@clipkit/design-tokens'];
  assert.deepEqual(packed.files.map(f => f.path).sort(), ['README.md', 'package.json', 'tokens.css']);
  const consumer = path.join(temp, 'consumer');
  fs.mkdirSync(consumer);
  fs.writeFileSync(path.join(consumer, 'package.json'), JSON.stringify({ name: 'token-consumer-fixture', private: true }));
  npm(['install', path.join(temp, packed.filename), '--offline', '--ignore-scripts', '--no-audit', '--no-fund'], consumer);
  const resolve = createRequire(path.join(consumer, 'package.json'));
  const css = fs.readFileSync(resolve.resolve('@clipkit/design-tokens/tokens.css'));
  assert(css.equals(fs.readFileSync(path.join(root, 'packages/design-tokens/tokens.css'))), 'Tarball preserves exact token bytes');
  fs.writeFileSync(path.join(consumer, 'index.html'), '<link rel="stylesheet" href="/theme.css"><main class="finder-shell">Token consumer</main>');
  fs.writeFileSync(path.join(consumer, 'theme.css'), '@import "@clipkit/design-tokens/tokens.css";');
  const { build } = require('vite');
  await build({ root: consumer, configFile: false, logLevel: 'silent' });
  const assets = path.join(consumer, 'dist/assets');
  const output = fs.readdirSync(assets).filter(f => f.endsWith('.css')).map(f => fs.readFileSync(path.join(assets,f),'utf8')).join('');
  assert(output.includes('--ui-canvas') && output.includes('--ui-space-4'), 'Consumer bundles exported variables');
  console.log(JSON.stringify({ passed: true, checks: ['package contents', 'CSS export resolution', 'token bytes', 'isolated consumer build'] }));
})().catch(error => { console.error(error); process.exitCode = 1; });
