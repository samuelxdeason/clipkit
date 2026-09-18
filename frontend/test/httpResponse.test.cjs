const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const compiled = ts.transpileModule(fs.readFileSync(require.resolve('../src/httpResponse.ts'), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 }
}).outputText;
const api = {};
let fetchImpl;
vm.runInNewContext(compiled, { exports: api, Error, fetch: (...args) => fetchImpl(...args) });

test('HTML fallback pages produce an actionable message rather than parser output', async () => {
  for (const status of [200, 502]) {
    await assert.rejects(api.readJSONResponse(new Response('<!doctype html><h1>Unavailable</h1>', { status, headers: { 'Content-Type': 'text/html' } })), /library server is unavailable/);
  }
});
test('successful empty and populated catalogue responses remain distinct from errors', async () => {
  assert.equal(JSON.stringify(await api.readJSONResponse(new Response('[]'))), '[]');
  assert.equal((await api.readJSONResponse(new Response('[{"id":"one"}]')))[0].id, 'one');
  await assert.rejects(api.readJSONResponse(new Response('{broken')), /unreadable response/);
});
test('server validation messages survive plain text and JSON responses', async () => {
  await assert.rejects(api.readJSONResponse(new Response('Collection is locked', { status: 403 })), /Collection is locked/);
  await assert.rejects(api.readJSONResponse(new Response('{"error":"Invalid URL"}', { status: 400 })), /Invalid URL/);
});
test('network failures explain recovery without converting cancellations', async () => {
  fetchImpl = async () => { throw new TypeError('Failed to fetch'); };
  await assert.rejects(api.requestJSON('/api/videos'), /Couldn’t connect to your library/);
  const cancellation = new Error('cancelled'); cancellation.name = 'AbortError';
  fetchImpl = async () => { throw cancellation; };
  await assert.rejects(api.requestJSON('/api/videos'), error => error === cancellation);
});
