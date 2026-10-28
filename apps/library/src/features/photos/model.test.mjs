import { test } from 'node:test';
import assert from 'node:assert/strict';
import { emptyPhotoFilters, filterPhotos } from './model.ts';
const rows = [
  {
    id: 'a',
    filename: 'Mountain.jpg',
    model: 'Alex',
    album: 'Weekend',
    added: '2026-10-26',
    filepath: 'a.jpg',
  },
  {
    id: 'b',
    filename: 'Beach.jpg',
    model: '',
    album: 'Weekend',
    added: '2026-10-27',
    filepath: 'b.jpg',
  },
];
test('photo filters intersect and collection membership cannot introduce inaccessible rows', () => {
  assert.deepEqual(
    filterPhotos(
      rows,
      { ...emptyPhotoFilters, query: 'weekend mountain', person: 'Alex' },
      'newest',
    ).map((row) => row.id),
    ['a'],
  );
  assert.deepEqual(
    filterPhotos(
      rows,
      { ...emptyPhotoFilters, collection: '1' },
      'newest',
      new Set(['hidden', 'b']),
    ).map((row) => row.id),
    ['b'],
  );
  assert.equal(filterPhotos(rows, { ...emptyPhotoFilters, collection: '1' }, 'newest').length, 0);
  assert.deepEqual(
    filterPhotos(rows, { ...emptyPhotoFilters, unassigned: true }, 'name').map((row) => row.id),
    ['b'],
  );
  assert.deepEqual(
    rows.map((row) => row.id),
    ['a', 'b'],
  );
});
