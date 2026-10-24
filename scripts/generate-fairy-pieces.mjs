import {
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync
} from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { FAIRY_DIR, fairyPiecesForSet } from './fairy-pieces.mjs';

const pieceRoot = fileURLToPath(new URL('../public/piece', import.meta.url));
const fairyRoot = join(pieceRoot, '..', FAIRY_DIR);

const sets = readdirSync(pieceRoot).filter(
  (name) => name !== FAIRY_DIR && statSync(join(pieceRoot, name)).isDirectory()
);

let written = 0;
for (const set of sets) {
  const setDir = join(pieceRoot, set);
  const files = fairyPiecesForSet((name) =>
    readFileSync(join(setDir, name), 'utf8')
  );
  const outDir = join(fairyRoot, set);
  mkdirSync(outDir, { recursive: true });
  for (const [name, svg] of files) {
    writeFileSync(join(outDir, name), svg);
    written++;
  }
}

console.log(
  `Generated ${written} fairy piece files across ${sets.length} sets in ${FAIRY_DIR}/.`
);
