import { test } from 'node:test';
import assert from 'node:assert/strict';
import { collectionItems, filterItems } from './model.ts';
import {
  canMoveCollection,
  childCollections,
  collectionPath,
  collectionTrail,
} from '../../components/browsing/collection-model.ts';

const collection = (id, name, parentId = 0, extra = {}) => ({
  id,
  name,
  parentId,
  hidden: false,
  locked: false,
  inheritedHidden: false,
  inheritedLocked: false,
  ...extra,
});
const collections = [
  collection(1, 'Trips'),
  collection(2, 'Summer', 1),
  collection(3, 'Beach', 2),
  collection(4, 'Private', 0, { locked: true }),
  collection(5, 'Alone'),
];

test('trails walk to the root and stop on cycles', () => {
  assert.equal(collectionPath(collections, 3), 'Trips / Summer / Beach');
  const loop = [collection(1, 'A', 2), collection(2, 'B', 1)];
  assert.deepEqual(
    collectionTrail(loop, 1).map((item) => item.name),
    ['B', 'A'],
  );
});

test('a collection cannot move into itself, its descendants, its parent or a locked folder', () => {
  assert.equal(canMoveCollection(collections, 2, 3), false);
  assert.equal(canMoveCollection(collections, 2, 2), false);
  assert.equal(canMoveCollection(collections, 2, 1), false);
  assert.equal(canMoveCollection(collections, 2, 4), false);
  assert.equal(canMoveCollection(collections, 2, 5), true);
  assert.equal(canMoveCollection(collections, 2, 0), true);
});

test('subfolders list direct children, and a search finds descendants by name', () => {
  assert.deepEqual(
    childCollections(collections, 1, '').map((item) => item.name),
    ['Summer'],
  );
  assert.deepEqual(
    childCollections(collections, 1, 'bea').map((item) => item.name),
    ['Beach'],
  );
  assert.deepEqual(
    childCollections(collections, 0, 'a').map((item) => item.name),
    ['Alone', 'Beach', 'Private'],
  );
});

test('items mix photos and videos, filter by kind and text, and sort newest or by name', () => {
  const items = collectionItems(
    [
      { site: 's', id: 'v1', title: 'Blue hour', added: '2026-01-02', people: ['Alex'] },
      { site: 's', id: 'v2', title: '', filename: 'clip.mp4', added: '2026-01-03' },
    ],
    [
      {
        id: 'p1',
        filename: 'IMG.jpg',
        model: 'Casey',
        album: '',
        filepath: '',
        added: '2026-01-01',
      },
    ],
  );
  assert.deepEqual(
    filterItems(items, 'all', '', 'newest').map((item) => item.title),
    ['clip.mp4', 'Blue hour', 'IMG.jpg'],
  );
  assert.deepEqual(
    filterItems(items, 'all', '', 'name').map((item) => item.title),
    ['Blue hour', 'clip.mp4', 'IMG.jpg'],
  );
  assert.deepEqual(
    filterItems(items, 'photos', 'casey', 'newest').map((item) => item.key),
    ['["photo","p1"]'],
  );
  assert.deepEqual(
    filterItems(items, 'videos', 'alex', 'newest').map((item) => item.title),
    ['Blue hour'],
  );
});
