import assert from 'node:assert/strict';
import { test } from 'node:test';

import { estimateFileSizes, formatFileSize } from './imageOptimizer';

test('formatFileSize scales unit with magnitude', () => {
  assert.equal(formatFileSize(512), '512 B');
  assert.equal(formatFileSize(2048), '2 KB');
  assert.equal(formatFileSize(5 * 1024 * 1024), '5.0 MB');
});

test('estimateFileSizes stays positive and grows with resolution', () => {
  const small = estimateFileSizes(1000, 1000, 1);
  const large = estimateFileSizes(4000, 4000, 1);

  assert.ok(small.pngBytes > 0);
  assert.ok(small.jpegBytes > 0);
  assert.ok(large.pngBytes > small.pngBytes);
  assert.ok(large.jpegBytes > small.jpegBytes);
});

test('estimateFileSizes bytes-per-pixel falls as the image grows', () => {
  const small = estimateFileSizes(1000, 1000, 1);
  const large = estimateFileSizes(4000, 4000, 1);

  const smallBpp = small.pngBytes / (1000 * 1000);
  const largeBpp = large.pngBytes / (4000 * 4000);

  assert.ok(largeBpp < smallBpp);
});
