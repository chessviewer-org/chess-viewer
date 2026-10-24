import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { fairyPiecesForSet } from './fairy-pieces.mjs';

const pieceRoot = fileURLToPath(new URL('../public/piece', import.meta.url));

const sets = readdirSync(pieceRoot).filter((name) =>
  statSync(join(pieceRoot, name)).isDirectory()
);

let written = 0;
for (const set of sets) {
  const dir = join(pieceRoot, set);
  const files = fairyPiecesForSet((name) =>
    readFileSync(join(dir, name), 'utf8')
  );
  for (const [name, svg] of files) {
    writeFileSync(join(dir, name), svg);
    written++;
  }
}

console.log(
  `Generated ${written} fairy piece files across ${sets.length} sets.`
);
