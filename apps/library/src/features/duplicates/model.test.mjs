import { test } from 'node:test';
import assert from 'node:assert/strict';
import { comparisonRows, formatBytes, formatDuration, videoKey } from './model.ts';

test('sizes and durations read as the existing app wrote them', () => {
  assert.equal(formatBytes(0), 'Unknown');
  assert.equal(formatBytes(512), '1 KB');
  assert.equal(formatBytes(1048576 * 1.5), '1.5 MB');
  assert.equal(formatBytes(1073741824 * 2.25), '2.25 GB');
  assert.equal(formatDuration(65), '1:05');
  assert.equal(formatDuration(3725), '1:02:05');
  assert.equal(videoKey({ site: 'a', id: '1' }), '["a","1"]');
});

test('comparison rows mark the highest resolution, longest version and smallest file', () => {
  const rows = comparisonRows([
    {
      site: 'youtube',
      id: 'a',
      width: 1920,
      height: 1080,
      duration: 120,
      filesize: 300 * 1024,
      ext: 'mp4',
    },
    {
      site: 'youtube',
      id: 'b',
      width: 1280,
      height: 720,
      duration: 100,
      filesize: 200 * 1024,
      filename: 'b.webm',
    },
    { site: 'local', id: 'c', duration: 120, filesize: 0 },
  ]);
  const [resolution, duration, size, source] = rows;
  assert.deepEqual(
    resolution.cells.map((cell) => [cell.value, cell.note, !!cell.highlight]),
    [
      ['1,920 × 1,080', 'Highest resolution', true],
      ['1,280 × 720', 'Landscape', false],
      ['Unknown', undefined, false],
    ],
  );
  assert.deepEqual(
    duration.cells.map((cell) => [cell.value, cell.note]),
    [
      ['2:00', 'Longest version'],
      ['1:40', '0:20 shorter'],
      ['2:00', 'Longest version'],
    ],
  );
  assert.deepEqual(
    size.cells.map((cell) => [cell.value, cell.note, !!cell.highlight]),
    [
      ['300 KB', '100 KB larger', false],
      ['200 KB', 'Smallest file', true],
      ['Unknown', undefined, false],
    ],
  );
  assert.deepEqual(
    source.cells.map((cell) => [cell.value, cell.note]),
    [
      ['youtube', 'MP4'],
      ['youtube', 'WEBM'],
      ['local', 'Unknown format'],
    ],
  );
});

test('identical copies say so instead of naming a best one', () => {
  const [resolution, duration, size] = comparisonRows([
    { site: 'a', id: '1', width: 640, height: 480, duration: 60, filesize: 100 },
    { site: 'a', id: '2', width: 640, height: 480, duration: 60, filesize: 100 },
  ]);
  assert.equal(resolution.cells[0].note, 'Landscape');
  assert.equal(duration.cells[0].note, 'Same length');
  assert.equal(size.cells[1].note, 'Same size');
  assert(!size.cells[0].highlight);
});
