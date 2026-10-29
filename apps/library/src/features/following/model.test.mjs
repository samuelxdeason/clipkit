import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  accountLookup,
  canDownload,
  hostOf,
  isInLibrary,
  itemState,
  jobIndex,
  libraryIndex,
  sourceKeys,
} from './model.ts';

test('source keys canonicalize URLs and read site ids from them', () => {
  const keys = sourceKeys({ url: 'http://www.youtube.com/watch?v=abc123&utm_source=x#t=1' });
  assert(keys.includes('url:https://youtube.com/watch?v=abc123'));
  assert(keys.includes('youtube:abc123'));
  assert.deepEqual(sourceKeys({ site: 'X', id: '42', url: 'https://x.com/a/status/42' }), [
    'twitter:42',
    'url:https://x.com/a/status/42',
  ]);
  assert.deepEqual(sourceKeys({ url: 'not a url' }), []);
});

test('library membership matches on any shared key', () => {
  const index = libraryIndex([{ site: 'youtube', id: 'abc123', webpage_url: '' }]);
  assert(isInLibrary({ url: 'https://youtu.be/abc123' }, index));
  assert(!isInLibrary({ url: 'https://youtu.be/other' }, index));
});

test('the longest matching account covers a source, and the host reads cleanly', () => {
  const find = accountLookup([
    { url: 'https://example.test/alex', name: 'short' },
    { url: 'https://example.test/alex/videos', name: 'long' },
  ]);
  assert.equal(find('https://www.example.test/alex/videos/recent')?.name, 'long');
  assert.equal(find('https://example.test/alex')?.name, 'short');
  assert.equal(find('https://example.test/casey'), undefined);
  assert.equal(hostOf('https://www.example.test/x'), 'example.test');
  assert.equal(hostOf('nope'), 'Source');
});

test('item state follows ownership, the library, the queue and pending requests in that order', () => {
  const saved = libraryIndex([{ url: 'https://example.test/v/1' }]);
  const jobs = jobIndex([
    { url: 'https://example.test/v/2', status: 'downloading', percent: 40.4 },
    { url: 'https://example.test/v/3', status: 'queued' },
    { url: 'https://example.test/v/4', status: 'error' },
    { url: 'https://example.test/v/6', status: 'removed' },
  ]);
  const context = {
    saved,
    jobs,
    pending: new Set(['https://example.test/v/5']),
    libraryReady: true,
  };
  const state = (url, owned = false) => itemState({ url, title: '', id: '', owned }, context);
  assert.equal(state('https://example.test/v/0', true).kind, 'downloaded');
  assert.equal(state('https://example.test/v/1').kind, 'downloaded');
  assert.equal(state('https://example.test/v/2').label, 'Downloading 40%');
  assert.equal(state('https://example.test/v/3').kind, 'queued');
  assert.equal(state('https://example.test/v/4').kind, 'failed');
  assert.equal(state('https://example.test/v/5').kind, 'queued');
  assert.equal(state('https://example.test/v/6').kind, 'available');
  assert.equal(
    itemState(
      { url: 'https://example.test/v/7', title: '', id: '', owned: false },
      { ...context, libraryReady: false },
    ).kind,
    'checking',
  );
  assert(canDownload(state('https://example.test/v/4')));
  assert(!canDownload(state('https://example.test/v/3')));
});
