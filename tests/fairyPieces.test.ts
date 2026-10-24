import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, test } from 'node:test';

import {
  BASE_COLORS,
  FAIRY_DIR,
  FAIRY_ROTATIONS,
  NEUTRAL_COLOR,
  PIECE_TYPES,
  fairyFileName,
  fairyPiecesForSet,
  neutralPiece,
  rotatedPiece
} from '../scripts/fairy-pieces.mjs';

const PIECE_ROOT = join(import.meta.dirname, '..', 'public', 'piece');
const FAIRY_ROOT = join(PIECE_ROOT, '..', FAIRY_DIR);
const SETS = readdirSync(PIECE_ROOT).filter(
  (name) => name !== FAIRY_DIR && statSync(join(PIECE_ROOT, name)).isDirectory()
);
const SAMPLE =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><rect id="a" class="x" width="10" height="10"/></svg>';

function embedded(svg: string): string[] {
  return [...svg.matchAll(/href="data:image\/svg\+xml;base64,([^"]+)"/g)].map(
    (match) => Buffer.from(match[1] ?? '', 'base64').toString('utf8')
  );
}

describe('fairy piece builders', () => {
  test('a rotated piece embeds the original and rotates about the centre', () => {
    const svg = rotatedPiece(SAMPLE, 90);
    assert.match(
      svg,
      /^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg" viewBox="0 0 100 100"/
    );
    assert.match(svg, /transform="rotate\(90 50 50\)"/);
    assert.deepEqual(embedded(svg), [SAMPLE]);
  });

  test('a neutral piece clips the white half left and the black half right', () => {
    const svg = neutralPiece('<svg>W</svg>', '<svg>B</svg>');
    assert.deepEqual(embedded(svg), ['<svg>W</svg>', '<svg>B</svg>']);
    assert.match(
      svg,
      /<clipPath id="left"><rect width="50" height="100"\/><\/clipPath>/
    );
    assert.match(
      svg,
      /<clipPath id="right"><rect x="50" width="50" height="100"\/><\/clipPath>/
    );
    assert.doesNotMatch(svg, /rotate\(/);
  });

  test('embedding keeps each copy isolated so ids and classes cannot collide', () => {
    const svg = neutralPiece(SAMPLE, SAMPLE);
    assert.doesNotMatch(svg, /id="a"|class="x"/);
  });

  test('file names follow colour, piece and clockwise rotation', () => {
    assert.equal(fairyFileName('w', 'Q'), 'wQ.svg');
    assert.equal(fairyFileName('b', 'N', 90), 'bN90.svg');
    assert.equal(fairyFileName(NEUTRAL_COLOR, 'K', 180), 'nK180.svg');
  });
});

describe('generated fairy piece files', () => {
  const expectedNames = [
    ...PIECE_TYPES.flatMap((type) =>
      BASE_COLORS.flatMap((color) =>
        FAIRY_ROTATIONS.map((rotation) => fairyFileName(color, type, rotation))
      )
    ),
    ...PIECE_TYPES.flatMap((type) =>
      [0 as const, ...FAIRY_ROTATIONS].map((rotation) =>
        fairyFileName(NEUTRAL_COLOR, type, rotation)
      )
    )
  ];

  test('every set ships its 60 fairy variants in fairypiece/<set>', () => {
    assert.equal(expectedNames.length, 60);
    for (const set of SETS) {
      const files = new Set(readdirSync(join(FAIRY_ROOT, set)));
      for (const name of expectedNames) {
        assert.ok(files.has(name), `${FAIRY_DIR}/${set}/${name} is missing`);
      }
    }
  });

  test('every set directory holds nothing but its 12 base pieces', () => {
    for (const set of SETS) {
      const files = readdirSync(join(PIECE_ROOT, set));
      assert.equal(
        files.length,
        12,
        `${set} should only contain its twelve base pieces`
      );
    }
  });

  test('every file is up to date with its source pieces', () => {
    for (const set of SETS) {
      const setDir = join(PIECE_ROOT, set);
      const fairyDir = join(FAIRY_ROOT, set);
      const generated = fairyPiecesForSet((name: string) =>
        readFileSync(join(setDir, name), 'utf8')
      );
      for (const [name, svg] of generated) {
        assert.equal(
          readFileSync(join(fairyDir, name), 'utf8'),
          svg,
          `${FAIRY_DIR}/${set}/${name} is stale — run pnpm pieces:fairy`
        );
      }
    }
  });
});
