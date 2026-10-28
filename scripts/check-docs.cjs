// Verify current documentation paths; historical prose is deliberately excluded.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const files = ['README.md', 'AGENTS.md', 'frontend/AGENTS.md', 'frontend/DESIGN_SYSTEM.md', 'internal/AGENTS.md', 'apps/README.md', 'packages/README.md', 'packages/AGENTS.md', 'packages/design-tokens/README.md'];
function collect(dir) {
  for (const entry of fs.readdirSync(path.join(root, dir), { withFileTypes: true })) {
    if (entry.name === 'history') continue;
    const file = path.posix.join(dir, entry.name);
    if (entry.isDirectory()) collect(file);
    else if (file.endsWith('.md')) files.push(file);
  }
}
files.push('packages/ui/README.md', 'packages/ui/AGENTS.md', 'packages/ui/NOTICE.md', 'apps/library/README.md', 'apps/library/AGENTS.md');
collect('docs');
let links = 0;
for (const file of files) {
  const content = fs.readFileSync(path.join(root, file), 'utf8');
  for (const match of content.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
    const target = match[1].split('#')[0];
    if (!target || /^(?:https?:|mailto:)/.test(target)) continue;
    assert(!path.isAbsolute(target), file + ': use a repository-relative link');
    assert(fs.existsSync(path.resolve(root, path.dirname(file), target)), file + ': missing target ' + target);
    links++;
  }
}
console.log(JSON.stringify({ passed: true, documents: files.length, localLinks: links }));
