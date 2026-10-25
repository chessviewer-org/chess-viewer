import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { stripForbiddenNameChars, toSafeName } from '@utils/safeFileName';

describe('stripForbiddenNameChars', () => {
  test('drops characters Windows and Linux reject', () => {
    assert.equal(
      stripForbiddenNameChars('a<b>c:d"e/f\\g|h?i*j\u0000k'),
      'abcdefghijk'
    );
  });

  test('keeps commas, dashes and non-Latin letters', () => {
    assert.equal(stripForbiddenNameChars('Şahmat, ağ-1'), 'Şahmat, ağ-1');
  });
});

describe('toSafeName', () => {
  test('falls back when nothing usable is left', () => {
    assert.equal(toSafeName('  ..?*  ', 'chessboard'), 'chessboard');
  });

  test('replaces spaces and trims edge dots', () => {
    assert.equal(toSafeName(' my diagram. ', 'x'), 'my_diagram');
    assert.equal(toSafeName('.hidden', 'x'), 'hidden');
  });

  test('suffixes Windows reserved device names', () => {
    assert.equal(toSafeName('CON', 'x'), 'CON_');
    assert.equal(toSafeName('lpt1', 'x'), 'lpt1_');
    assert.equal(toSafeName('console', 'x'), 'console');
  });

  test('caps the length', () => {
    assert.equal(toSafeName('a'.repeat(300), 'x').length, 80);
  });

  test('is stable when sanitised again', () => {
    const once = toSafeName('Opening & Endgame: part 2', 'x');
    assert.equal(toSafeName(once, 'x'), once);
  });
});
