import { test } from 'node:test';
import assert from 'node:assert/strict';
import { labelEntries, tagEntries } from './model.ts';
import { directoryMatches, identityIndex } from '../../components/browsing/directory-model.ts';
test('tag directory counts user labels once per accessible video, ignoring source tags', () => {
  assert.deepEqual(
    tagEntries([
      { labels: ['Quiet', 'Quiet', 'Travel'], tags: ['Imported'] },
      { labels: ['Quiet'] },
      { labels: null },
    ]),
    [
      { name: 'Quiet', displayName: 'Quiet', count: 2 },
      { name: 'Travel', displayName: 'Travel', count: 1 },
    ],
  );
});
test('label counts from the daemon become directory entries, skipping blank labels', () => {
  assert.deepEqual(
    labelEntries([
      { label: 'Quiet', count: 2 },
      { label: ' ', count: 1 },
    ]),
    [{ name: 'Quiet', displayName: 'Quiet', count: 2 }],
  );
});
test('directory colors follow identity and filtering supports aliases and zero-video people', () => {
  const entries = [
    { name: 'Alex & Casey', displayName: 'AC', count: 2 },
    { name: 'Empty', displayName: 'Empty', count: 0 },
  ];
  assert.equal(directoryMatches(entries, 'alex', 'count', 'used')[0].name, 'Alex & Casey');
  assert.equal(directoryMatches(entries, '', 'name', 'empty')[0].name, 'Empty');
  assert.equal(
    identityIndex(entries[0].name),
    identityIndex(directoryMatches(entries, '', 'count', 'all')[0].name),
  );
  assert(identityIndex('Alex') >= 0 && identityIndex('Alex') < 4);
});
