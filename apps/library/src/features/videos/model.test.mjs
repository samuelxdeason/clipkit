import { test } from 'node:test';
import assert from 'node:assert/strict';
import { filterVideos, emptyFilters, fromCatalogue } from './model.ts';
import { initialVideos } from './fixtures.ts';

test('filters intersect, search includes people and tags, and source array is untouched', () => {
  const before = initialVideos.map((video) => video.id);
  const filters = { ...emptyFilters, query: 'Alex', resolution: '4K', watch: 'progress' };
  const result = filterVideos(initialVideos, filters, 'title');
  assert(result.length > 0);
  assert(
    result.every(
      (video) =>
        video.person.includes('Alex') &&
        video.resolution === '4K' &&
        video.progress > 0 &&
        video.progress < 1,
    ),
  );
  assert.deepEqual(
    initialVideos.map((video) => video.id),
    before,
  );
});

test('real metadata preserves derived people, manual tags, progress and source identity', () => {
  const row = {
    site: 'Local',
    id: 'same',
    title: '',
    filename: 'Fallback.mp4',
    filepath: 'path',
    people: ['Alex', 'Casey'],
    models: ['Casey'],
    labels: ['Quiet', 'Travel'],
    tags: ['Imported'],
    added: '2026-10-27 12:00:00',
    height: 2160,
    duration: 100,
    position: 96,
    favorite: true,
  };
  const video = fromCatalogue(row, [{ name: 'Alex', nickname: 'Lex' }], (path) => path);
  const other = fromCatalogue({ ...row, site: 'Other' }, [], (path) => path);
  assert.notEqual(video.id, other.id);
  assert.equal(video.title, 'Fallback.mp4');
  assert.deepEqual(video.tags, ['Quiet', 'Travel']);
  assert.equal(
    filterVideos(
      [video],
      {
        ...emptyFilters,
        people: ['Alex'],
        tags: ['Quiet', 'Travel'],
        query: 'Lex Imported',
        resolution: '1080p',
        watch: 'finished',
      },
      'newest',
    ).length,
    1,
  );
  assert.equal(
    filterVideos([video], { ...emptyFilters, tags: ['Quiet', 'Missing'] }, 'newest').length,
    0,
  );
  assert.equal(
    filterVideos(
      [video],
      { ...emptyFilters, tags: ['Quiet', 'Missing'], tagMatch: 'any' },
      'newest',
    ).length,
    1,
  );
});
test('newest, oldest and duration sorting are deterministic', () => {
  assert.equal(filterVideos(initialVideos, emptyFilters, 'newest')[0].id, 'demo-38');
  assert.equal(filterVideos(initialVideos, emptyFilters, 'oldest')[0].id, 'demo-1');
  assert.equal(filterVideos(initialVideos, emptyFilters, 'duration')[0].id, 'demo-38');
});
test('unorganized includes missing people or tags and empty queries recover', () => {
  const result = filterVideos(initialVideos, { ...emptyFilters, unorganized: true }, 'newest');
  assert(result.every((video) => !video.person || !video.tags.length));
  assert.equal(
    filterVideos(initialVideos, { ...emptyFilters, query: 'not-in-this-library' }, 'newest').length,
    0,
  );
  assert.equal(filterVideos(initialVideos, emptyFilters, 'newest').length, 38);
});
