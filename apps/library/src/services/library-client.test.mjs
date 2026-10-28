import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LibraryClient, validateServer, resolveServer } from './library-client.ts';

test('server origins are explicit and desktop discovery takes precedence', async () => {
  assert.equal(validateServer(' http://localhost:8899/ '), 'http://localhost:8899');
  for (const address of [
    'file:///vault',
    'http://user:password@localhost:8899',
    'http://localhost:8899/path',
    'http://localhost:8899/?token=secret',
  ])
    assert.throws(() => validateServer(address));
  const previous = globalThis.window;
  try {
    globalThis.window = {
      go: { main: { App: { APIBase: async () => 'http://127.0.0.1:12345' } } },
    };
    assert.equal(await resolveServer('http://localhost:8899'), 'http://127.0.0.1:12345');
    globalThis.window = {};
    assert.equal(await resolveServer(''), '');
  } finally {
    globalThis.window = previous;
  }
});

test('request errors remain readable and aborts are preserved', async () => {
  const previous = globalThis.fetch;
  const client = new LibraryClient('');
  try {
    globalThis.fetch = async () =>
      new Response('<html>Vite</html>', { headers: { 'Content-Type': 'text/html' } });
    await assert.rejects(client.request('/api/videos'), /webpage instead/);
    globalThis.fetch = async () =>
      new Response(JSON.stringify({ error: 'Locked collection' }), { status: 409 });
    await assert.rejects(client.request('/api/videos'), /Locked collection/);
    globalThis.fetch = async () => {
      throw new DOMException('Aborted', 'AbortError');
    };
    await assert.rejects(client.request('/api/videos'), { name: 'AbortError' });
  } finally {
    globalThis.fetch = previous;
  }
});

test('nullable catalogue lists normalize and media URLs encode server paths', async () => {
  const client = new LibraryClient('http://localhost:8899');
  client.request = async () => null;
  assert.deepEqual(await client.catalogue(new AbortController().signal), {
    videos: [],
    people: [],
    collections: [],
  });
  assert.equal(
    client.media('folder/a #1.jpg'),
    'http://localhost:8899/media?p=folder%2Fa%20%231.jpg',
  );
});
