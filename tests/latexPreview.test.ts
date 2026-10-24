import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import {
  type BoardPreviewPosition,
  boardPreviewPosition,
  createPosition,
  previewDataUri
} from '../src/pages/LatexPage/utils/latexProject.ts';

const FEN = '8/8/8/3k4/8/4K3/3Q4/8 w - - 0 1';
const OPTIONS = { size: 240, showAnnotations: true };

describe('LaTeX board preview inputs', () => {
  test('keeps metadata outside the memoized board props', () => {
    const position = createPosition(FEN, {
      squares: 'e4',
      rings: 'f7',
      arrows: 'e2-e4'
    });
    const edited = {
      ...position,
      author: 'Loyd',
      source: 'Collection',
      caption: 'A new title',
      solution: '1.Qd3!',
      captionStyle: 'study' as const,
      stipulation: '#2',
      remark: 'Another remark'
    };

    assert.deepEqual(
      boardPreviewPosition(position),
      boardPreviewPosition(edited)
    );
    assert.equal(
      previewDataUri(position, OPTIONS),
      previewDataUri(boardPreviewPosition(edited), OPTIONS)
    );
  });

  test('retains every field that changes the printed board', () => {
    const position = createPosition(FEN, {
      squares: 'e4',
      rings: 'f7',
      arrows: 'e2-e4'
    });
    const original = previewDataUri(boardPreviewPosition(position), OPTIONS);
    const changes: BoardPreviewPosition = {
      fen: '8/8/8/3k4/8/4K3/2Q5/8 w - - 0 1',
      flipped: true,
      squares: 'd5',
      rings: 'e6',
      arrows: 'd2-d4',
      squareColor: '#112233',
      ringColor: '#445566',
      arrowColor: '#778899'
    };
    for (const key of Object.keys(changes) as (keyof BoardPreviewPosition)[]) {
      const changed = boardPreviewPosition({
        ...position,
        [key]: changes[key]
      });
      assert.notEqual(previewDataUri(changed, OPTIONS), original, key);
    }
  });

  test('does not include marks in plain thumbnails', () => {
    const position = createPosition(FEN);
    const edited = {
      ...position,
      squares: 'd5',
      rings: 'f7',
      arrows: 'e2-e4',
      squareColor: '#112233'
    };
    const options = { size: 40, showAnnotations: false };
    assert.equal(
      previewDataUri(position, options),
      previewDataUri(boardPreviewPosition(edited), options)
    );
  });

  test('retains neutral, rotated and named fairy pieces', () => {
    const fens = [
      '-B7/1*1B6/2-*2r5/3*3q4/8/8/8/8 b - - 12 34',
      'BeginProblem Pieces White Ka1 Ga4 Black Kh8 Neutral LIe4 EndProblem'
    ];
    for (const fen of fens) {
      const position = createPosition(fen, { flipped: true });
      const image = previewDataUri(boardPreviewPosition(position), OPTIONS);
      assert.ok(image, fen);
      assert.equal(image, previewDataUri(position, OPTIONS));
      const svg = decodeURIComponent(image.slice(image.indexOf(',') + 1));
      assert.match(svg, /<svg/);
      assert.match(svg, /clipPath/);
    }
  });

  test('keeps invalid diagrams out of the image renderer', () => {
    assert.equal(
      previewDataUri(boardPreviewPosition(createPosition('invalid')), OPTIONS),
      null
    );
  });
});
