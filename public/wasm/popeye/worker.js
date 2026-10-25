import createPopeye from './py.mjs';

let buffered = '';
let moves = [];
let positionCount = 0;
let lastFlush = 0;
let hasRun = false;
const flush = () => {
  if (!buffered && !moves.length) return;
  postMessage({ type: 'output', text: buffered, moves });
  buffered = '';
  moves = [];
  lastFlush = performance.now();
};
const print = (text) => {
  buffered += `${text}\n`;
  if (performance.now() - lastFlush >= 100 || buffered.length >= 8192) flush();
};

try {
  const engine = await createPopeye({
    noInitialRun: true,
    print,
    printErr: print,
    onPosition: (
      text,
      board,
      before,
      effects,
      from,
      to,
      capture,
      exact,
      exchange
    ) => {
      if (++positionCount > 4096)
        throw new Error('Position output limit reached. Narrow the search.');
      moves.push({
        text,
        board,
        before,
        effects,
        from,
        to,
        capture,
        exact,
        exchange
      });
      if (performance.now() - lastFlush >= 100) flush();
    }
  });
  self.onmessage = (event) => {
    if (hasRun) return;
    hasRun = true;
    try {
      engine.previousMove = event.data.previousMove;
      engine.FS.writeFile('/problem.inp', event.data.input);
      const code = engine.callMain([
        '-maxmem',
        `${event.data.memoryMb}M`,
        '/problem.inp'
      ]);
      flush();
      postMessage(
        code
          ? {
              type: 'error',
              text: 'Popeye rejected this problem. Check the pieces, conditions and stipulation.'
            }
          : { type: 'done' }
      );
    } catch (error) {
      flush();
      postMessage({
        type: 'error',
        text:
          error instanceof Error
            ? error.message
            : 'Popeye stopped unexpectedly.'
      });
    }
  };
  postMessage({ type: 'ready' });
} catch {
  postMessage({
    type: 'error',
    text: 'Popeye could not load. Check your connection and try again.'
  });
}
