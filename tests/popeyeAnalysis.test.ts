import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { join } from 'node:path';
import { test } from 'node:test';
import { STARTING_FEN } from '@chessviewer-org/chess-viewer';
import {
  analysisSettings,
  DEFAULT_ANALYSIS_SETTINGS
} from '../src/engines/popeye/settings';
import { buildAnalysisInput } from '../src/engines/popeye/input';
import { parseFEN } from '../src/shared/utils/fenParser';
import { POPEYE_PROBLEMS } from './fixtures/popeyeProblems';
import {
  analysisProblemError,
  decodePreviewMove,
  solutionLines
} from '../src/engines/popeye/output';
import { PopeyeClient, type AnalysisState } from '../src/engines/popeye/client';

const neutral = '7k/5K2/6Q1/8/8/8/-P7/8 w - - 0 1';

test('ordinary editor cells and neutral units produce real Popeye declarations', () => {
  const standard = buildAnalysisInput(
    STARTING_FEN,
    '#2',
    DEFAULT_ANALYSIS_SETTINGS
  );
  assert.match(standard, /Pieces White.*Ke1/);
  assert.match(standard, /Sb1/);
  const input = buildAnalysisInput(neutral, '#1', DEFAULT_ANALYSIS_SETTINGS);
  assert.match(input, /Pieces Neutral Pa2/);
  assert.match(input, /MaxSolutions 3 Variation/);
  assert.doesNotMatch(input, /MaxTime/);
});

test('diagram rotations are never silently solved as orthodox pieces', () => {
  assert.throws(
    () =>
      buildAnalysisInput(
        '7k/5K2/6*2Q1/8/8/8/8/8 w - - 0 1',
        '#1',
        DEFAULT_ANALYSIS_SETTINGS
      ),
    /named fairy pieces/
  );
});

test('named fairy conditions and structured stipulations survive engine input', () => {
  const original =
    'BeginProblem\nSStipulation h#2\nCondition Circe\nPieces White Kf7 Gg6\nPieces Black Kh8\nOption NoCastling h1\nEndProblem';
  const input = buildAnalysisInput(original, 'h#3', {
    ...DEFAULT_ANALYSIS_SETTINGS,
    threats: false
  });
  assert.match(input, /sstipulation h#3/i);
  assert.match(input, /condition Circe/i);
  assert.match(input, /Gg6/);
  assert.match(input, /NoCastling h1/);
  assert.match(input, /NoThreat/);
  assert.equal((input.match(/sstipulation/gi) ?? []).length, 1);
});

test('ordinary FEN castling and en passant rights are carried into Popeye', () => {
  const input = buildAnalysisInput(
    '7k/8/8/8/8/8/8/K7 b Kq e3 0 1',
    '#2',
    DEFAULT_ANALYSIS_SETTINGS
  );
  assert.match(input, /NoCastling a1h8/);
  assert.match(input, /EnPassant e2e3e4/);
  assert.doesNotMatch(input, /NoCastling[^\n]*h1/);
});

test('invalid positions and multiline stipulations are rejected before starting an engine', () => {
  assert.throws(
    () => buildAnalysisInput('bad input', '#2', DEFAULT_ANALYSIS_SETTINGS),
    /valid position/
  );
  assert.throws(
    () =>
      buildAnalysisInput(neutral, '#1\nEndProblem', DEFAULT_ANALYSIS_SETTINGS),
    /one line/
  );
});

test('saved settings cannot request arbitrary memory or unbounded search time', () => {
  assert.deepEqual(
    analysisSettings({
      seconds: Infinity,
      memoryMb: 4096,
      solutions: -1,
      variations: 'yes'
    }),
    DEFAULT_ANALYSIS_SETTINGS
  );
  assert.equal(
    analysisSettings({
      solutions: 10,
      memoryMb: 128,
      seconds: 5,
      threats: false
    }).threats,
    false
  );
});

test('defensive continuations stay under their key instead of counting as separate solutions', () => {
  const parsed = solutionLines(
    'Popeye WASM-32Bit v4.103\n   1.Qg6-h5 !\n      1...Kh8-g8\n         2.Qh5-g6 #\n   1.Qg6-g7 # !\nPartial solution Time = 0.018 s'
  );
  assert.equal(parsed.length, 2);
  assert.deepEqual(
    parsed[0]?.variations.map((variation) => variation.text.trimStart()),
    ['1...Kh8-g8', '2.Qh5-g6 #']
  );
  assert.equal(parsed[1]?.variations.length, 0);
  assert.equal(
    analysisProblemError('both sides need a king\nsolution finished.'),
    'both sides need a king'
  );
  assert.equal(
    analysisProblemError('solution finished. Time = 0.1 s'),
    undefined
  );
});

class FakeWorker {
  onmessage: ((event: MessageEvent<unknown>) => void) | null = null;
  onerror: ((event: ErrorEvent) => void) | null = null;
  terminated = false;
  messages: unknown[] = [];
  postMessage(value: unknown) {
    this.messages.push(value);
  }
  terminate() {
    this.terminated = true;
  }
  emit(value: unknown) {
    this.onmessage?.({ data: value } as MessageEvent<unknown>);
  }
}

function session() {
  const workers: FakeWorker[] = [];
  const states: AnalysisState[] = [];
  const client = new PopeyeClient(
    (state) => states.push(state),
    () => {
      const worker = new FakeWorker();
      workers.push(worker);
      return worker as unknown as Worker;
    }
  );
  return { client, workers, states };
}

test('replacing a position terminates its worker and ignores late messages', () => {
  const { client, workers, states } = session();
  try {
    client.start('first', DEFAULT_ANALYSIS_SETTINGS);
    workers[0]!.emit({ type: 'ready' });
    workers[0]!.emit({ type: 'output', text: 'old output' });
    client.start('second', DEFAULT_ANALYSIS_SETTINGS);
    assert.ok(workers[0]!.terminated);
    workers[0]!.emit({ type: 'output', text: 'stale result' });
    workers[0]!.emit({ type: 'done' });
    assert.equal(states.at(-1)?.status, 'loading');
    assert.equal(states.at(-1)?.output, '');
    workers[1]!.emit({ type: 'ready' });
    assert.equal(workers[1]!.messages.length, 1);
    workers[1]!.emit({ type: 'output', text: 'new output' });
    workers[1]!.emit({ type: 'done' });
    assert.equal(states.at(-1)?.output, 'new output');
    assert.equal(states.at(-1)?.status, 'complete');
  } finally {
    client.dispose();
  }
});

test('time limit produces an incomplete result and releases the worker', (context) => {
  context.mock.timers.enable({ apis: ['setTimeout'] });
  const { client, workers, states } = session();
  try {
    client.start('position', { ...DEFAULT_ANALYSIS_SETTINGS, seconds: 5 });
    workers[0]!.emit({ type: 'ready' });
    context.mock.timers.tick(5000);
    assert.equal(states.at(-1)?.status, 'timeout');
    assert.match(states.at(-1)?.message ?? '', /incomplete/);
    assert.ok(workers[0]!.terminated);
  } finally {
    client.dispose();
  }
});

test('Popeye validation errors never become a false no-solution success', () => {
  const { client, workers, states } = session();
  try {
    client.start('position', DEFAULT_ANALYSIS_SETTINGS);
    workers[0]!.emit({ type: 'ready' });
    workers[0]!.emit({
      type: 'output',
      text: 'both sides need a king\nsolution finished.\n'
    });
    workers[0]!.emit({ type: 'done' });
    assert.equal(states.at(-1)?.status, 'error');
    assert.equal(states.at(-1)?.message, 'both sides need a king');
  } finally {
    client.dispose();
  }
});

test('unreadable native moves stop the search instead of silently disappearing', () => {
  const { client, workers, states } = session();
  try {
    client.start('position', DEFAULT_ANALYSIS_SETTINGS, { from: 48, to: 40 });
    workers[0]!.emit({ type: 'ready' });
    assert.deepEqual(workers[0]!.messages[0], {
      input: 'position',
      memoryMb: DEFAULT_ANALYSIS_SETTINGS.memoryMb,
      previousMove: { from: 48, to: 40 }
    });
    workers[0]!.emit({ type: 'output', text: '1.Ra2-a3 !', moves: [{}] });
    assert.equal(states.at(-1)?.status, 'error');
    assert.match(states.at(-1)?.message ?? '', /unreadable move/);
    assert.ok(workers[0]!.terminated);
    workers[0]!.emit({ type: 'done' });
    assert.equal(states.at(-1)?.status, 'error');
  } finally {
    client.destroy();
  }
});

test('the shipped Popeye WASM solves the neutral-pawn position with three real mates', async () => {
  // Keep Emscripten's process/stdio lifecycle outside the Node test runner.
  const { stdout } = await promisify(execFile)(process.execPath, [
    join(process.cwd(), 'tests/fixtures/popeyeRunner.mjs'),
    buildAnalysisInput(neutral, '#1', DEFAULT_ANALYSIS_SETTINGS)
  ]);
  const { code, output, moves } = JSON.parse(stdout) as {
    code: number;
    output: string;
    moves: unknown[];
  };
  assert.equal(code, 0);
  assert.equal(analysisProblemError(output), undefined);
  assert.match(output, /v4\.103/);
  assert.deepEqual(
    solutionLines(output).map((line) => line.key),
    ['1.Qg6-h5 # !', '1.Qg6-g8 # !', '1.Qg6-g7 # !']
  );
  assert.match(output, /Partial solution/);
  const positions = moves.map(decodePreviewMove);
  assert.ok(positions.every((position) => position !== null));
  const lines = solutionLines(output, positions);
  assert.equal(lines.length, 3);
  assert.equal(lines[0]?.moves[0]?.board[3]?.[7], 'Q'); // h5
  assert.equal(lines[1]?.moves[0]?.board[0]?.[6], 'Q'); // g8
  assert.equal(lines[2]?.moves[0]?.board[1]?.[6], 'Q'); // g7
  for (const line of lines) {
    assert.equal(line.moves[0]?.board[2]?.[6], ''); // g6 vacated
    assert.equal(line.moves[0]?.board[6]?.[0], 'nP'); // neutral a2 unchanged
    assert.equal(line.moves[0]?.board[0]?.[7], 'k');
  }
});

test('malformed engine snapshots cannot replace the displayed board', () => {
  for (const value of [
    null,
    {},
    { text: 'Qh5', board: 'wQ;' },
    { text: 2, board: ';'.repeat(64) },
    { text: 'Qh5', board: 'xQ;' + ';'.repeat(63) }
  ]) {
    assert.equal(decodePreviewMove(value), null);
  }
});

for (const problem of POPEYE_PROBLEMS) {
  test(`published Popeye problem: ${problem.id}`, async () => {
    const input = buildAnalysisInput(
      problem.source,
      '#2',
      DEFAULT_ANALYSIS_SETTINGS
    );
    assert.doesNotMatch(input, /ChessViewerFEN|\bw - - 0 1\b/);
    const { stdout } = await promisify(execFile)(
      process.execPath,
      [join(process.cwd(), 'tests/fixtures/popeyeRunner.mjs'), input],
      { timeout: 15_000 }
    );
    const result = JSON.parse(stdout) as {
      code: number;
      output: string;
      moves: unknown[];
    };
    assert.equal(result.code, 0);
    assert.equal(analysisProblemError(result.output), undefined);
    const moves = result.moves.map(decodePreviewMove);
    assert.ok(moves.length > 0);
    assert.ok(moves.every((move) => move !== null));
    const solutions = solutionLines(result.output, moves);
    assert.equal(solutions.length, 1);
    assert.equal(solutions[0]?.key, problem.firstSolution);
    assert.ok(solutions[0]!.variations.length > 0);
    assert.equal(
      solutions.flatMap((solution) => [
        ...solution.moves,
        ...solution.variations.flatMap((variation) => variation.moves)
      ]).length,
      moves.length,
      'Every move remains attached to its own variation'
    );
    if (problem.id === 'circe-kamikaze') {
      assert.equal(solutions[0]?.moves[0]?.board[7]?.[2], 'w@Q~Kamikaze');
      const edited = parseFEN(
        buildAnalysisInput(problem.source, '#2', DEFAULT_ANALYSIS_SETTINGS)
      );
      assert.equal(edited[7]?.[7], 'w@Q~Kamikaze');
    }
  });
}

test('Popeye S knights and N nightriders remain distinct through engine input', () => {
  const source = POPEYE_PROBLEMS[4].source;
  const board = parseFEN(source);
  assert.equal(board[0]?.[4], 'w@N'); // e8: white nightrider
  assert.equal(board[7]?.[2], 'b@N'); // c1: black nightrider
  assert.equal(board[1]?.[1], 'N'); // b7: white knight
  assert.equal(board[6]?.[1], 'n'); // b2: black knight
  const input = buildAnalysisInput(source, '#2', DEFAULT_ANALYSIS_SETTINGS);
  assert.match(input, /Ne8/);
  assert.match(input, /Nc1/);
  assert.match(input, /Sb7/);
  assert.match(input, /Sb2/);
});

test('engine controls and the starting board precede all twin transformations', () => {
  const input = buildAnalysisInput(
    'BeginProblem\nStipulation #1\nPieces White Kf7 Qg6\nPieces Black Kh8\nTwin Move g6 h6\nEndProblem',
    '#1',
    DEFAULT_ANALYSIS_SETTINGS
  );
  assert.ok(
    input.indexOf('NoBoard MaxSolutions 3') < input.indexOf('twin Move')
  );
  assert.ok(input.indexOf('Pieces Black Kh8') < input.indexOf('twin Move'));
});

test('a warm spare worker serves the next search and is terminated on destroy', () => {
  const { client, workers } = session();
  client.warm();
  client.warm();
  assert.equal(workers.length, 1);
  client.start('first', DEFAULT_ANALYSIS_SETTINGS);
  assert.equal(workers.length, 1);
  client.warm();
  assert.equal(workers.length, 2);
  client.start('second', DEFAULT_ANALYSIS_SETTINGS);
  assert.equal(workers.length, 2);
  assert.ok(workers[0]!.terminated);
  client.warm();
  client.destroy();
  assert.ok(workers.every((worker) => worker.terminated));
});

test('a spare worker that became ready before the search is not waited for again', () => {
  const { client, workers, states } = session();
  client.warm();
  workers[0]!.emit({ type: 'ready' });
  client.start('problem', DEFAULT_ANALYSIS_SETTINGS);
  assert.equal(states.at(-1)?.status, 'running');
  assert.equal(workers[0]!.messages.length, 1);
  client.destroy();
});
