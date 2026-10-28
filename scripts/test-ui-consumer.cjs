// A tarball consumer cannot silently rely on workspace aliases or legacy styles.
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const { createRequire } = require('node:module');
const { pathToFileURL } = require('node:url');
const root = path.resolve(__dirname, '..');
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'clipkit-ui-consumer-'));
function npm(args, cwd = root) {
  assert(process.env.npm_execpath, 'Run via npm');
  const result = spawnSync(process.execPath, [process.env.npm_execpath, ...args], { cwd, encoding: 'utf8', windowsHide: true });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  return result.stdout;
}
(async () => {
  const tarballs = [];
  for (const name of ['@clipkit/design-tokens', '@clipkit/ui']) {
    const result = JSON.parse(npm(['pack', '--workspace', name, '--pack-destination', temp, '--json', '--ignore-scripts']));
    const packed = Array.isArray(result) ? result[0] : result[name];
    tarballs.push(path.join(temp, packed.filename));
  }
  const consumer = path.join(temp, 'consumer'); fs.mkdirSync(consumer);
  fs.writeFileSync(path.join(consumer, 'package.json'), JSON.stringify({ name: 'ui-consumer-test', private: true, type: 'module' }));
  npm(['install', ...tarballs, 'react@18.3.1', 'react-dom@18.3.1', '--offline', '--ignore-scripts', '--no-audit', '--no-fund'], consumer);
  fs.writeFileSync(path.join(consumer, 'index.html'), '<div id="root"></div><script type="module" src="/main.tsx"></script>');
  fs.writeFileSync(path.join(consumer, 'main.tsx'), `import React from 'react'; import {createRoot} from 'react-dom/client'; import {Button, Input} from '@clipkit/ui'; import '@clipkit/ui/styles.css'; import '@clipkit/ui/fonts.css'; createRoot(document.getElementById('root')!).render(<><Button variant="solid">Save</Button><Input aria-label="Name"/></>);`);
  const localRequire = createRequire(path.join(root, 'apps/library/package.json'));
  const { build } = await import(pathToFileURL(localRequire.resolve('vite')).href);
  await build({ root: consumer, configFile: false, logLevel: 'silent', esbuild: { jsx: 'automatic' } });
  const assets = path.join(consumer, 'dist/assets');
  const css = fs.readdirSync(assets).filter(file => file.endsWith('.css')).map(file => fs.readFileSync(path.join(assets, file), 'utf8')).join('');
  assert(css.includes('ck-button') && css.includes('#bd2342'), 'Packed consumer includes recipes and theme');
  console.log('Isolated UI tarball consumer build passed.');
})().catch(error => { console.error(error); process.exitCode = 1; });
