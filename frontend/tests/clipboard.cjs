// Run with `node frontend/tests/clipboard.cjs`.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const ts = require('typescript');
const code = ts.transpileModule(fs.readFileSync(path.join(__dirname, '../src/api.ts'), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;

function api(native, write) {
  const context = { exports: {}, window: native ? { runtime: {} } : {}, navigator: { clipboard: write && { writeText: write } },
    require: name => name.includes('runtime') ? { ClipboardSetText: write } : {} };
  vm.runInNewContext(code, context);
  return context.exports;
}

(async () => {
  const file = 'G:\\Archive\\Summer light\\étude, 01.mp4';
  for (const native of [true, false]) {
    let copied;
    await api(native, async text => { copied = text; return true; }).CopyText(file);
    assert.equal(copied, file, 'Clipboard must preserve the exact path');
    await assert.rejects(api(native, async () => { throw Error('denied'); }).CopyText(file));
  }
  await assert.rejects(api(true, async () => false).CopyText(file), /failed/);
  await assert.rejects(api(false, undefined).CopyText(file), /unavailable/);
  console.log('Native/browser clipboard routing, exact paths, and failure handling passed.');
})().catch(error => { console.error(error); process.exitCode = 1; });
