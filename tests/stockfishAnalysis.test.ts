import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
import { STARTING_FEN } from '@chessviewer-org/chess-viewer';
import { parseFEN } from '../src/shared/utils/fenParser';
import { directMoveAnimation } from '../src/engines/animation';
import { orthodoxMoveAnimation } from '../src/engines/rules/animation';
import {
  buildSearchInput,
  gameEndMessage
} from '../src/engines/stockfish/input';
import { recommendedHash } from '../src/engines/core/device';
import { lineArrows, moveArrow } from '../src/engines/core/arrows';
import { hintColor, threatColor } from '../src/shared/utils/color/accent';
import {
  contrastRatio,
  hueChroma,
  parseColor,
  toLab
} from '../src/shared/utils/color/space';
import {
  boardMove,
  flipTurn,
  moveDestinations
} from '../src/engines/rules/position';
import { parseInfo, searchLine } from '../src/engines/stockfish/output';
import {
  legalMoves,
  parseUciMove,
  play,
  positionFromFen,
  type Position
} from '../src/engines/rules/moves';
import {
  StockfishClient,
  type AnalysisState
} from '../src/engines/stockfish/client';
import {
  analysisSettings,
  DEFAULT_ANALYSIS_SETTINGS
} from '../src/engines/stockfish/settings';

const KIWIPETE =
  'r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1';
const ENDGAME = '8/2p5/3p4/KP5r/1R3p1k/8/4P1P1/8 w - - 0 1';

const load = (fen: string): Position => positionFromFen(parseFEN(fen), fen);
const perft = (position: Position, depth: number): number =>
  depth === 0
    ? 1
    : legalMoves(position).reduce(
        (total, move) => total + perft(play(position, move), depth - 1),
        0
      );

test('move generation matches the published perft counts', () => {
  assert.equal(perft(load(STARTING_FEN), 3), 8902);
  assert.equal(perft(load(KIWIPETE), 2), 2039);
  assert.equal(perft(load(ENDGAME), 3), 2812);
});

test('engine lines become numbered SAN with a board per move', () => {
  const fen = `${STARTING_FEN}`;
  const info = parseInfo(
    'info depth 12 seldepth 16 multipv 2 score cp -31 nodes 1 nps 1 time 5 pv g1f3 g8f6 b1c3 e7e5'
  );
  assert.ok(info);
  const line = searchLine(load(fen), 1, info);
  assert.equal(line.id, 2);
  assert.equal(line.key, '-0.3  1. Nf3 Nf6 2. Nc3 e5');
  assert.deepEqual(
    line.moves.map((move) => move.text),
    ['Nf3', 'Nf6', 'Nc3', 'e5']
  );
  assert.equal(line.moves[0]!.board[5]![5], 'N');
});

test('SAN covers castling, disambiguation, promotion and mate', () => {
  const castle = parseInfo('info depth 1 score cp 0 pv e1g1')!;
  assert.match(
    searchLine(load('r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1'), 1, castle).key,
    /1\. O-O$/
  );
  const rooks = parseInfo('info depth 1 score cp 0 pv a1a3')!;
  assert.match(
    searchLine(load('4k3/8/8/8/8/7R/8/R3K3 w - - 0 1'), 1, rooks).key,
    /Raa3$/
  );
  const promote = parseInfo('info depth 1 score mate 1 pv a7a8q')!;
  assert.match(
    searchLine(load('7k/P7/8/8/8/8/8/K7 w - - 0 1'), 1, promote).key,
    /^#1 {2}1\. a8=Q\+$/
  );
  const mate = parseInfo('info depth 1 score mate 1 pv a1a8')!;
  assert.match(
    searchLine(load('7k/6pp/8/8/8/8/8/R3K3 w - - 0 1'), 1, mate).key,
    /Ra8#$/
  );
});

test("scores are shown from White's point of view", () => {
  const black = load('4k3/8/8/8/8/8/8/4K3 b - - 0 1');
  const info = parseInfo('info depth 8 score cp 150 pv e8d8')!;
  assert.match(searchLine(black, 7, info).key, /^-1\.5 {2}7\.\.\. Kd8$/);
});

test('info lines without a usable score or bound are ignored', () => {
  assert.equal(parseInfo('info depth 3 currmove e2e4'), null);
  assert.equal(parseInfo('info depth 3 score cp 10 lowerbound pv e2e4'), null);
  assert.equal(parseInfo('bestmove e2e4'), null);
});

test('positions Stockfish cannot search are rejected before the worker starts', () => {
  assert.throws(() => buildSearchInput('8/8/8/8/8/8/8/8 w - - 0 1'));
  assert.throws(() =>
    buildSearchInput('4k3/8/8/8/8/8/8/3QK3 w - - 0 1'.replace('3QK3', '3QKQ1'))
  );
  assert.throws(() => buildSearchInput('wKe1'));
  assert.equal(
    gameEndMessage(buildSearchInput('7k/5Q2/6K1/8/8/8/8/8 b - - 0 1')),
    'Stalemate. The game is drawn.'
  );
  assert.match(
    gameEndMessage(buildSearchInput('R5k1/5ppp/8/8/8/8/8/6K1 b - - 0 1')),
    /^Checkmate\. White wins\./
  );
  assert.equal(gameEndMessage(buildSearchInput(STARTING_FEN)), '');
});

test('saved settings are clamped to supported values', () => {
  assert.deepEqual(analysisSettings(null), DEFAULT_ANALYSIS_SETTINGS);
  assert.equal(
    analysisSettings({ lines: 9 }).lines,
    DEFAULT_ANALYSIS_SETTINGS.lines
  );
  assert.equal(analysisSettings({ seconds: 30, lines: 5 }).seconds, 30);
});

class FakeWorker {
  sent: string[] = [];
  progressPort: MessagePort | null = null;
  terminated = false;
  onmessage: ((event: MessageEvent<unknown>) => void) | null = null;
  onerror: ((event: ErrorEvent) => void) | null = null;
  postMessage(command: string | { progressPort: MessagePort }) {
    if (typeof command !== 'string') {
      this.progressPort = command.progressPort;
      return;
    }
    this.sent.push(command);
  }
  terminate() {
    this.terminated = true;
  }
  say(text: string) {
    this.onmessage?.({ data: text } as MessageEvent<unknown>);
  }
}

const created: StockfishClient[] = [];
afterEach(() => created.splice(0).forEach((client) => client.destroy()));

function harness() {
  const workers: FakeWorker[] = [];
  const files: string[] = [];
  const states: AnalysisState[] = [];
  const client = new StockfishClient(
    (state) => states.push(state),
    (file) => {
      const worker = new FakeWorker();
      workers.push(worker);
      files.push(file);
      return worker as unknown as Worker;
    }
  );
  created.push(client);
  return { client, workers, files, states };
}

test('one worker serves successive positions and stale output is ignored', () => {
  const { client, workers, states } = harness();
  const settings = { ...DEFAULT_ANALYSIS_SETTINGS, model: '19' as const };
  client.start(STARTING_FEN, settings);
  const worker = workers[0]!;
  assert.deepEqual(worker.sent, [
    'setoption name CanOutputEngineDownloadProgress',
    'uci'
  ]);
  worker.say('uciok');
  assert.ok(worker.sent.includes('isready'));
  worker.say('readyok');
  assert.ok(worker.sent.includes(`position fen ${STARTING_FEN}`));
  worker.say('info depth 5 multipv 1 score cp 20 pv e2e4 e7e5');
  assert.equal(states.at(-1)?.status, 'running');

  const second = '4k3/8/8/8/8/8/4P3/4K3 w - - 0 1';
  client.start(second, settings);
  assert.equal(workers.length, 1);
  assert.equal(worker.sent.at(-2), 'stop');
  assert.equal(worker.sent.at(-1), 'isready');
  worker.say('info depth 9 multipv 1 score cp 99 pv d2d4');
  worker.say('bestmove e2e4');
  assert.notEqual(states.at(-1)?.status, 'complete');
  worker.say('readyok');
  assert.ok(worker.sent.includes(`position fen ${second}`));
  worker.say('info depth 6 multipv 1 score cp 50 pv e2e4');
  worker.say('bestmove e2e4');
  assert.equal(states.at(-1)?.status, 'complete');
  assert.equal(worker.terminated, false);
});

test('changing the model starts a fresh worker and destroy terminates it', () => {
  const { client, workers, files } = harness();
  client.start(STARTING_FEN, { ...DEFAULT_ANALYSIS_SETTINGS, model: '19' });
  client.start(STARTING_FEN, { ...DEFAULT_ANALYSIS_SETTINGS, model: '18' });
  assert.equal(workers.length, 2);
  assert.ok(workers[0]!.terminated);
  assert.deepEqual(files, [
    'stockfish-19-lite-single.js',
    'stockfish-18-lite-single.js'
  ]);
  client.destroy();
  assert.ok(workers[1]!.terminated);
});

test('finished games never reach the engine', () => {
  const { client, workers, states } = harness();
  client.start('7k/5Q2/6K1/8/8/8/8/8 b - - 0 1', DEFAULT_ANALYSIS_SETTINGS);
  assert.equal(workers.length, 0);
  assert.equal(states.at(-1)?.status, 'complete');
  assert.match(states.at(-1)?.message ?? '', /Stalemate/);
});

test('illogical positions are rejected with a reason', () => {
  const black = STARTING_FEN.replace(' w ', ' b ');
  assert.throws(() => buildSearchInput(black), /starting position.*White/);
  assert.throws(
    () => buildSearchInput('4k3/8/8/8/8/8/8/3KK3 w - - 0 1'),
    /exactly one king/
  );
  assert.throws(
    () => buildSearchInput('8/8/8/8/8/8/3kK3/8 w - - 0 1'),
    /next to each other/
  );
  assert.throws(
    () => buildSearchInput('4k2R/8/8/8/8/8/8/4K3 w - - 0 1'),
    /in check but it is not their move/
  );
  assert.throws(
    () => buildSearchInput('P3k3/8/8/8/8/8/8/4K3 w - - 0 1'),
    /first or last rank/
  );
  assert.throws(
    () => buildSearchInput('4k3/pppppppp/p7/8/8/8/8/4K3 w - - 0 1'),
    /eight pawns/
  );
  assert.throws(
    () => buildSearchInput('4k3/8/8/8/8/8/PPPPPPPP/QQQQKQQQ w - - 0 1'),
    /promoted/
  );
});

test('stale castling and en passant fields are dropped before the search', () => {
  const search = buildSearchInput('4k3/8/8/8/8/8/8/R3K3 w KQkq e3 3 9');
  assert.equal(search.fen, '4k3/8/8/8/8/8/8/R3K3 w Q - 3 9');
});

test('board moves follow the rules and update the position fields', () => {
  const board = parseFEN(STARTING_FEN);
  const ok = boardMove(STARTING_FEN, board, [6, 4], [4, 4]);
  assert.ok(ok && ok !== 'free');
  assert.equal(ok.fenMetadata, 'b KQkq e3 0 1');
  assert.equal(boardMove(STARTING_FEN, board, [6, 4], [3, 4]), null);
  assert.equal(boardMove(STARTING_FEN, board, [1, 4], [3, 4]), null);
  const castleFen = 'r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1';
  const moved = boardMove(castleFen, parseFEN(castleFen), [7, 4], [7, 6]);
  assert.ok(moved && moved !== 'free');
  assert.equal(moved.board[7]![5], 'R');
  assert.equal(moved.fenMetadata, 'b kq - 1 1');
});

test('standard move animations follow legal castling, en passant and promotion effects', () => {
  const animation = (fen: string, uci: string) => {
    const position = load(fen);
    const move = parseUciMove(position, uci);
    assert.ok(move, `${uci} is legal`);
    return {
      animation: orthodoxMoveAnimation(position, move),
      after: play(position, move)
    };
  };

  const castle = animation('r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1', 'e1g1');
  assert.deepEqual(
    castle.animation.motions.map(({ piece, path }) => [piece, ...path]),
    [
      ['K', 60, 62],
      ['R', 63, 61]
    ]
  );
  assert.equal(castle.after.board[7]![5], 'R');

  const ep = animation('4k3/8/8/3pP3/8/8/8/4K3 w - d6 0 1', 'e5d6');
  assert.deepEqual(
    ep.animation.motions.map(({ piece, path, removed }) => [
      piece,
      ...path,
      removed
    ]),
    [
      ['p', 27, true],
      ['P', 28, 19, false]
    ]
  );
  assert.equal(ep.after.board[3]![3], '');

  const promotion = animation('7k/P7/8/8/8/8/8/K7 w - - 0 1', 'a7a8q');
  assert.deepEqual(
    promotion.animation.motions.map(({ piece, path }) => [piece, ...path]),
    [['P', 8, 0]]
  );
  assert.equal(promotion.after.board[0]![0], 'Q');

  const free = directMoveAnimation(parseFEN(STARTING_FEN), [6, 4], [4, 4]);
  assert.deepEqual(free?.motions[0]?.path, [52, 36]);
});

test('move targets mark captures and respect pins', () => {
  const fen = '4k3/8/8/8/1b6/8/3N4/4K3 w - - 0 1';
  const targets = moveDestinations(parseFEN(fen), fen, 6, 3);
  assert.deepEqual(targets, []);
  const free = '4k3/8/8/2p5/8/3N4/8/4K3 w - - 0 1';
  const reachable = moveDestinations(parseFEN(free), free, 5, 3);
  assert.equal(reachable.length, 7);
  assert.ok(
    reachable.some(({ to, capture }) => to[0] === 3 && to[1] === 2 && capture)
  );
});

test('fairy pieces use their own move tables and conditions switch hints off', () => {
  const doc = [
    'BeginProblem',
    'Stipulation #2',
    'Pieces White Ka1 AMd4',
    'Pieces Black Kh8',
    'EndProblem'
  ].join('\n');
  const board = parseFEN(doc);
  const amazon = board[4]![3]!;
  assert.match(amazon, /@AM/);
  const targets = moveDestinations(board, doc, 4, 3);
  assert.ok(targets.length > 20);
  const conditioned = doc.replace(
    'Stipulation #2',
    'Stipulation #2\nCondition Circe'
  );
  assert.deepEqual(
    moveDestinations(parseFEN(conditioned), conditioned, 4, 3),
    []
  );
  assert.equal(
    boardMove(conditioned, parseFEN(conditioned), [4, 3], [0, 3]),
    'free'
  );
});

test('every engine move carries the full position that playing it produces', () => {
  const info = parseInfo('info depth 4 score cp 0 pv e2e4 e7e5')!;
  const line = searchLine(load(STARTING_FEN), 1, info);
  assert.equal(
    line.moves[0]!.fen,
    'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1'
  );
  assert.equal(
    line.moves[1]!.fen,
    'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq e6 0 2'
  );
  assert.deepEqual(line.moves[0]!.animation?.before, parseFEN(STARTING_FEN));
  assert.deepEqual(line.moves[0]!.animation?.motions[0]?.path, [52, 36]);
});

test('isolated pages use the threaded build and send the thread count', () => {
  const scope = globalThis as { crossOriginIsolated?: boolean };
  scope.crossOriginIsolated = true;
  try {
    const { client, workers, files } = harness();
    client.start(STARTING_FEN, {
      ...DEFAULT_ANALYSIS_SETTINGS,
      model: '19',
      threads: 3
    });
    assert.deepEqual(files, ['stockfish-19-lite.js']);
    workers[0]!.say('uciok');
    assert.ok(workers[0]!.sent.includes('setoption name Threads value 3'));
  } finally {
    delete scope.crossOriginIsolated;
  }
});

test('arrows follow the piece that moved, including castling, en passant and promotion', () => {
  const arrowOf = (fen: string, uci: string) => {
    const board = parseFEN(fen);
    const position = load(fen);
    const move = parseUciMove(position, uci)!;
    return moveArrow(board, play(position, move).board);
  };
  const squares = (arrow: ReturnType<typeof moveArrow>) =>
    arrow && [arrow.from.join(), arrow.to.join()];
  assert.deepEqual(squares(arrowOf(STARTING_FEN, 'g1f3')), ['7,6', '5,5']);
  assert.deepEqual(
    squares(arrowOf('r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1', 'e1g1')),
    ['7,4', '7,6']
  );
  assert.deepEqual(
    squares(arrowOf('4k3/8/8/3pP3/8/8/8/4K3 w - d6 0 1', 'e5d6')),
    ['3,4', '2,3']
  );
  assert.deepEqual(squares(arrowOf('7k/P7/8/8/8/8/8/K7 w - - 0 1', 'a7a8q')), [
    '1,0',
    '0,0'
  ]);
  const first = parseFEN(STARTING_FEN);
  const after = play(
    load(STARTING_FEN),
    parseUciMove(load(STARTING_FEN), 'e2e4')!
  );
  assert.equal(
    lineArrows(first, [after.board, after.board, undefined]).length,
    1
  );
});

const ratio = (a: string, b: string) =>
  contrastRatio(parseColor(a)!, parseColor(b)!);
const hueOf = (color: string) => hueChroma(toLab(parseColor(color)!)).hue;

test('accent colours stay yellow and red when visible and otherwise adapt to the board', () => {
  assert.equal(hintColor('#1c1c1c', '#3a3a3a'), '#f5c400');
  assert.equal(threatColor('#f0d9b5'), '#e53935');
  for (const [light, dark] of [
    ['#f0d9b5', '#b58863'],
    ['#eeeed2', '#769656'],
    ['#dee3e6', '#8ca2ad'],
    ['#f5c400', '#fff2a8']
  ] as const) {
    const hint = hintColor(light!, dark!);
    for (const square of [light!, dark!])
      assert.ok(ratio(hint, square) >= 1.4, `${hint} on ${square}`);
    const hue = hueOf(hint);
    assert.ok(hue < 280 || hue > 335, `hint ${hint} is purple on ${light}`);
  }
});

test('threat colours stay in the red family and away from a green board', () => {
  const green = threatColor('#eeeed2', '#769656');
  const hue = hueOf(green);
  assert.ok(hue < 70 || hue > 340, `threat ${green} is not warm`);
  assert.ok(ratio(green, '#769656') >= 1.4);
});

test('threat mode hands the move to the opponent', () => {
  assert.equal(
    flipTurn(STARTING_FEN),
    'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR b KQkq - 0 1'
  );
  assert.equal(
    flipTurn('4k3/8/8/8/8/8/4P3/4K3 b - e3 5 9'),
    '4k3/8/8/8/8/8/4P3/4K3 w - - 5 9'
  );
});

test('hash follows the device: cores and a sixteenth of memory', () => {
  const sizes = [16, 32, 64, 128, 256];
  assert.equal(recommendedHash(sizes, 5, 8), 64);
  assert.equal(recommendedHash(sizes, 2, 1), 32);
  assert.equal(recommendedHash(sizes, 16, 16), 256);
  assert.equal(recommendedHash(sizes, 8, 1), 64);
  assert.equal(recommendedHash(sizes, 1, 0.25), 16);
});

test('engine download progress reaches the state while loading', async () => {
  const { client, workers, states } = harness();
  client.start(STARTING_FEN, DEFAULT_ANALYSIS_SETTINGS);
  const port = workers[0]!.progressPort!;
  port.postMessage({ percent: 0.4 });
  await new Promise((resolve) => setTimeout(resolve, 20));
  assert.equal(states.at(-1)?.status, 'loading');
  assert.equal(states.at(-1)?.download, 0.4);
  port.close();
});
