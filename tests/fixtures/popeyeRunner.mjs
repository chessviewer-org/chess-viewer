import createPopeye from '../../public/wasm/popeye/py.mjs';
import { readFile } from 'node:fs/promises';

let output = '';
const moves = [];
const print = (text) => {
  output += `${text}\n`;
};
const engine = await createPopeye({
  noInitialRun: true,
  previousMove: process.argv[3] ? JSON.parse(process.argv[3]) : undefined,
  wasmBinary: await readFile(
    new URL('../../public/wasm/popeye/py.wasm', import.meta.url)
  ),
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
  ) =>
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
    })
});
engine.FS.writeFile('/problem.inp', process.argv[2]);
const code = engine.callMain(['-maxmem', '32M', '/problem.inp']);
console.log(JSON.stringify({ code, output, moves }));
