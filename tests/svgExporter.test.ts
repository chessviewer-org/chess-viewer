import assert from 'node:assert/strict';
import { test } from 'node:test';

import { escapeXmlAttr } from '@utils/svgExporter';

test('SVG metadata escapes XML controls without changing Unicode text', () => {
  assert.equal(
    escapeXmlAttr('A & B: "<şahmat>"'),
    'A &amp; B: &quot;&lt;şahmat&gt;&quot;'
  );
});
