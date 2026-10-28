// One build queue keeps app and catalogue CSS synchronized without racing generators.
import { spawn } from 'node:child_process';
import { watch } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const npm = process.env.npm_execpath;
if (!npm) throw new Error('Run through npm run dev:library, storybook or dev:foundation');
const mode = process.argv[2];
const children = new Set();
const watchers = [];
let closing = false;
function start(args) {
  const child = spawn(process.execPath, [npm, ...args], { cwd: root, stdio: 'inherit', windowsHide: true });
  children.add(child);
  child.on('exit', () => children.delete(child));
  return child;
}
function run(args) {
  return new Promise((resolve, reject) => {
    const child = start(args);
    child.on('error', reject);
    child.on('exit', code => code === 0 ? resolve() : reject(new Error(`Command failed (${code}): ${args.join(' ')}`)));
  });
}
async function build() {
  await run(['run', 'build:tokens']);
  await run(['run', 'build:ui']);
  await run(['exec', '--workspace', '@clipkit/library', '--', 'panda', 'codegen']);
  await run(['exec', '--workspace', '@clipkit/library', '--', 'panda', 'cssgen', '--outfile', 'styled-system/styles.css']);
}
function close() {
  if (closing) return;
  closing = true;
  watchers.forEach(watcher => watcher.close());
  for (const child of children) {
    if (process.platform === 'win32') spawn('taskkill', ['/pid', String(child.pid), '/t', '/f'], { windowsHide: true, stdio: 'ignore' });
    else child.kill('SIGTERM');
  }
}
process.on('SIGINT', close);
process.on('SIGTERM', close);

await build();
let rebuilding = false;
let pending = false;
let timer;
async function rebuild() {
  if (closing) return;
  if (rebuilding) { pending = true; return; }
  rebuilding = true;
  try { await build(); } catch (error) { console.error(error.message); }
  finally {
    rebuilding = false;
    if (pending) { pending = false; void rebuild(); }
  }
}
for (const relative of ['packages/ui/src', 'packages/design-tokens/src', 'apps/library/src', 'packages/ui/panda.config.ts', 'apps/library/panda.config.ts']) {
  watchers.push(watch(path.join(root, relative), { recursive: !relative.endsWith('.ts') }, () => {
    clearTimeout(timer);
    timer = setTimeout(() => void rebuild(), 150);
  }));
}
for (const [selected, args] of [
  [mode !== 'storybook', ['run', 'dev', '--workspace', '@clipkit/library']],
  [mode !== 'library', ['run', 'storybook', '--workspace', '@clipkit/ui']],
]) {
  if (selected) {
    const child = start(args);
    child.on('exit', () => close());
  }
}
