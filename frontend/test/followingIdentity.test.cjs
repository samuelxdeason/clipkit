const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const source = fs.readFileSync(require.resolve('../src/followingIdentity.ts'), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
const exportsObject = {};
vm.runInNewContext(compiled, { exports: exportsObject, URL });
const { accountLookup, matchesAccount } = exportsObject;

test('lookup preserves host aliases, path boundaries, queries and longest match', () => {
  const accounts = [
    { url: 'https://twitter.com/alex', person: 'Alex' },
    { url: 'https://twitter.com/alex/media', person: 'Media' },
    { url: 'https://example.com/profile?list=1', person: 'List' },
    { url: 'https://www.pornhub.com/model/example', person: 'Example' },
    { url: 'invalid', person: 'Invalid' },
  ];
  const lookup = accountLookup(accounts);
  for (const source of ['https://x.com/alex', 'https://mobile.twitter.com/alex/media/', 'https://x.com/alexandra', 'https://example.com/profile?list=1', 'https://example.com/profile?list=2', 'https://de.pornhub.com/model/example/videos', 'invalid']) {
    const expected = accounts.filter(account => matchesAccount(source, account.url)).sort((a,b) => b.url.length-a.url.length)[0];
    assert.equal(lookup(source), expected, source);
  }
  assert.equal(lookup('https://x.com/alex/media')?.person, 'Media');
  assert.equal(lookup('https://x.com/alexandra'), undefined);
});

test('repeated source lookups do not rescan or reparse account URLs', () => {
  let reads = 0;
  const accounts = Array.from({length:1000}, (_,i) => ({get url() { reads++; return `https://example.com/person/${i}`; }, person: String(i)}));
  const lookup = accountLookup(accounts);
  const preparationReads = reads;
  for (let i=0;i<100;i++) {
    assert.equal(lookup('https://example.com/person/999/videos').person, '999');
    assert.equal(lookup('https://unmatched.example/person'), undefined);
  }
  assert.equal(reads, preparationReads);
  assert.equal(accountLookup([{url:'https://example.com/person/999',person:'Updated'}])('https://example.com/person/999/videos').person, 'Updated');
});
