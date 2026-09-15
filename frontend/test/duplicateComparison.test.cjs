const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const source = fs.readFileSync(require.resolve('../src/duplicateComparison.ts'), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
const exportsObject = {};
vm.runInNewContext(compiled, { exports: exportsObject });
const { comparisonRows, formatBytes, formatDuration, videoKey } = exportsObject;
const v = (width, height, duration, filesize) => ({width,height,duration,filesize,site:'Local',ext:'mp4'});
test('comparison highlights resolution by pixel count and shows duration and size differences', () => {
 const rows = comparisonRows([v(1080,1920,3670,10485760),v(1920,1080,3600,5242880),v(3840,2160,3700,20971520)]);
 assert.equal(rows[0].cells[0].note, 'Portrait');
 assert.equal(rows[0].cells[2].note, 'Highest resolution');
 assert.equal(rows[1].cells[0].value, '1:01:10');
 assert.equal(rows[1].cells[0].note, '0:30 shorter');
 assert.equal(rows[2].cells[1].note, 'Smallest file');
 assert.equal(rows[2].cells[0].note, '5.0 MB larger');
});
test('unknown specs do not become winners or appear as zero-sized files', () => {
 const rows = comparisonRows([v(undefined,undefined,undefined,undefined),v(0,0,0,0)]);
 for (const row of rows.slice(0,3)) for (const cell of row.cells) {
  assert.equal(cell.value,'Unknown'); assert.ok(!cell.highlight); assert.ok(!cell.note);
 }
});
test('identical known specs do not arbitrarily favor one copy', () => {
 const rows = comparisonRows([v(1920,1080,60,1024),v(1920,1080,60,1024)]);
 assert.equal(rows[1].cells[0].note,'Same length');
 assert.equal(rows[2].cells[1].note,'Same size');
 for (const row of rows) for (const cell of row.cells) assert.ok(!cell.highlight);
});
test('formatting and identities remain unambiguous', () => {
 assert.equal(formatDuration(3600),'1:00:00'); assert.equal(formatDuration(59.8),'1:00');
 assert.equal(formatBytes(1073741824),'1.00 GB');
 assert.notEqual(videoKey({site:'A',id:'same'}),videoKey({site:'B',id:'same'}));
});
