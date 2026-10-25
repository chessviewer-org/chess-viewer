import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { join } from 'node:path';
import { test } from 'node:test';
import {
  buildMoveInput,
  matchingMoves,
  type PreviousMove
} from '../src/engines/popeye/moves';
import {
  analysisProblemError,
  decodePreviewMove
} from '../src/engines/popeye/output';
import { parseFEN } from '../src/shared/utils/fenParser';

const diagram = (condition: string, black = 'Sb2') =>
  `BeginProblem\nStipulation #2\nPieces White Kh1 Ra2\nPieces Black Kh8 ${black}\nCondition ${condition}\nEndProblem`;

async function run(input: string, previous?: PreviousMove) {
  const { stdout } = await promisify(execFile)(
    process.execPath,
    [
      join(process.cwd(), 'tests/fixtures/popeyeRunner.mjs'),
      input,
      ...(previous ? [JSON.stringify(previous)] : [])
    ],
    { timeout: 10_000 }
  );
  const result = JSON.parse(stdout) as {
    code: number;
    output: string;
    moves: unknown[];
  };
  assert.equal(result.code, 0);
  assert.equal(analysisProblemError(result.output), undefined);
  const moves = result.moves.map(decodePreviewMove);
  assert.ok(
    moves.every((move) => move !== null),
    'Every native journal must decode'
  );
  return moves;
}

test('Circe animates the capture and rebirth from native piece identities', async () => {
  const source = diagram('Circe');
  const moves = await run(buildMoveInput(source, 'w'));
  const [capture] = matchingMoves(moves, 48, 49);
  assert.ok(capture);
  assert.equal(capture.text, 'Ra2*b2[+bSb8]');
  assert.equal(capture.board[6]![0], '');
  assert.equal(capture.board[6]![1], 'R');
  assert.equal(capture.board[0]![1], 'n');
  assert.deepEqual(capture.animation?.before, parseFEN(source));
  assert.deepEqual(
    capture.animation?.motions.map(({ piece, path, removed }) => ({
      piece,
      path,
      removed
    })),
    [
      { piece: 'n', path: [49, 1], removed: false },
      { piece: 'R', path: [48, 49], removed: false }
    ]
  );
});

test('AntiCirce keeps the capture square and the capturer rebirth as two stages', async () => {
  const source = diagram('AntiCirce');
  const [capture] = matchingMoves(
    await run(buildMoveInput(source, 'w')),
    48,
    49
  );
  assert.ok(capture);
  assert.equal(capture.text, 'Ra2*b2[wRb2->a1]');
  assert.equal(capture.board[6]![1], '');
  assert.equal(capture.board[7]![0], 'R');
  assert.deepEqual(capture.animation?.before, parseFEN(source));
  assert.deepEqual(
    capture.animation?.motions.map(({ piece, path, removed }) => ({
      piece,
      path,
      removed
    })),
    [
      { piece: 'n', path: [49], removed: true },
      { piece: 'R', path: [48, 49, 56], removed: false }
    ]
  );
});

test('Take & Make exposes all legal second stages without choosing one silently', async () => {
  const source = diagram('Take&MakeChess');
  const moves = await run(buildMoveInput(source, 'w'));
  const choices = matchingMoves(moves, 48, 49);
  assert.deepEqual(
    choices.map((move) => move.text),
    ['Ra2*b2-d1', 'Ra2*b2-d3', 'Ra2*b2-c4', 'Ra2*b2-a4']
  );
  const [selected] = matchingMoves(moves, 48, 34);
  assert.ok(selected);
  assert.equal(selected.text, 'Ra2*b2-c4');
  assert.deepEqual(selected.animation?.before, parseFEN(source));
  assert.deepEqual(
    selected.animation?.motions.find(({ piece }) => piece === 'R')?.path,
    [48, 49, 34]
  );
  assert.equal(selected.board[4]![2], 'R');
  assert.equal(selected.board[6]![1], '');
});

test('Messigny offers capture and swap separately and animates both exchanged units', async () => {
  const source = diagram('MessignyChess', 'Rb2');
  const choices = matchingMoves(await run(buildMoveInput(source, 'w')), 48, 49);
  assert.deepEqual(
    choices.map((move) => move.text),
    ['Ra2<->Rb2', 'Ra2*b2']
  );
  const swap = choices[0]!;
  assert.ok(swap.intent.exchange);
  assert.equal(swap.board[6]![0], 'r');
  assert.equal(swap.board[6]![1], 'R');
  assert.deepEqual(swap.animation?.before, parseFEN(source));
  assert.deepEqual(
    swap.animation?.motions.map(({ piece, path }) => ({ piece, path })),
    [
      { piece: 'r', path: [49, 48] },
      { piece: 'R', path: [48, 49] }
    ]
  );
});

test('native synchron and antisynchron restrictions retain the preceding vector for both sides', async () => {
  for (const [condition, side, expected] of [
    ['WhiteSynchronMover', 'w', ['Kh1-h2', 'Ra2-a3']],
    ['WhiteAntiSynchronMover', 'w', ['Ra2-a1']],
    ['BlackSynchronMover', 'b', ['Rb7-b8']]
  ] as const) {
    const input = buildMoveInput(diagram(condition, 'Rb7'), side);
    const unrestricted = await run(input);
    assert.ok(unrestricted.length > expected.length);
    const restricted = await run(input, { from: 56, to: 48 });
    assert.deepEqual(
      restricted.map((move) => move.text),
      expected
    );
    assert.ok(
      restricted.every((move) => move.animation?.motions.length === 1),
      'A synchron restriction must not invent simultaneous partner motion'
    );
  }
});

test('Exchange Place is solved as a goal with a sequence, not an opponent swap command', async () => {
  const source =
    'BeginProblem\nStipulation h<>3\nPieces White Kh1 Qa1 Qb2\nPieces Black Kh8\nOption NoBoard MaxSolutions 1 Variation\nEndProblem';
  const moves = await run(source);
  assert.equal(moves.length, 6);
  assert.ok(moves.every((move) => !move.intent.exchange));
  const white = moves.filter((move) => move.text.startsWith('Q'));
  assert.deepEqual(
    white.map((move) => [move.intent.from, move.intent.to]),
    [
      [56, 40],
      [49, 56],
      [40, 49]
    ]
  );
  assert.ok(white.every((move) => move.animation?.motions.length === 1));
});

test('manual move generation preserves rules but drops search limits, twins and analysis-only play', () => {
  const input = buildMoveInput(
    diagram('Circe').replace(
      'EndProblem',
      'Option MaxSolutions 1 MaxTime 1 Variation SetPlay Duplex\nTwin Move a2 a3\nEndProblem'
    ),
    'b'
  );
  assert.match(input, /condition Circe/i);
  assert.match(input, /stipulation ~1/i);
  assert.match(input, /NoBoard HalfDuplex/);
  assert.doesNotMatch(
    input,
    /MaxSolutions|MaxTime|Variation|SetPlay|\btwin\b/i
  );
  assert.equal(matchingMoves([], 48, 49).length, 0);
});
