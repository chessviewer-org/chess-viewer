# Piece Set Attribution

The artists and projects below created these chess piece sets. ChessViewer
self-hosts SVG copies obtained from [Lichess's piece collection](https://github.com/lichess-org/lila/tree/995e7ccc4a719bf45923202a1e8d55121df78283/public/piece)
so the editor can load them without the Lichess CDN. Lichess's
[COPYING.md](https://github.com/lichess-org/lila/blob/995e7ccc4a719bf45923202a1e8d55121df78283/COPYING.md)
records each original author and license. `kosal` follows its author's own
[CC BY 4.0 notice](https://github.com/philatype/kosal/blob/master/LICENSE.txt).

ChessViewer application code is AGPLv3. The artwork has the separate terms
shown here, including restrictions on commercial use for some sets. “Freeware”
is the source's description for `companion` and `leipzig`, rather than a
standard open-source license.

| Piece set  | Author(s)                                                         | License                                                                                              |
| ---------- | ----------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| california | [Jerry S.](https://sites.google.com/view/jerrychess/home)         | [CC BY-NC-SA 4.0](../licenses/piece/CC-BY-NC-SA-4.0.txt)                                             |
| cardinal   | sadsnake1                                                         | [CC BY-NC-SA 4.0](../licenses/piece/CC-BY-NC-SA-4.0.txt)                                             |
| cburnett   | [Colin M.L. Burnett](https://en.wikipedia.org/wiki/User:Cburnett) | [GPLv2+](../licenses/piece/GPL-2.0.txt)                                                              |
| companion  | David L. Brown                                                    | [Freeware — Good Companion](https://www.enpassant.dk/chess/fonteng.htm#GC)                           |
| dubrovny   | sadsnake1                                                         | [CC BY-NC-SA 4.0](../licenses/piece/CC-BY-NC-SA-4.0.txt)                                             |
| fantasy    | [Maurizio Monge](https://github.com/maurimo/chess-art)            | [MIT](../licenses/chess-art/LICENSE.txt)                                                             |
| fresca     | sadsnake1                                                         | [CC BY-NC-SA 4.0](../licenses/piece/CC-BY-NC-SA-4.0.txt)                                             |
| gioco      | sadsnake1                                                         | [CC BY-NC-SA 4.0](../licenses/piece/CC-BY-NC-SA-4.0.txt)                                             |
| governor   | Lichess authors                                                   | [AGPLv3+](https://github.com/lichess-org/lila/blob/995e7ccc4a719bf45923202a1e8d55121df78283/LICENSE) |
| horsey     | cham, michael1241                                                 | [CC BY-NC-SA 4.0](../licenses/piece/CC-BY-NC-SA-4.0.txt)                                             |
| icpieces   | sadsnake1                                                         | [CC BY-NC-SA 4.0](../licenses/piece/CC-BY-NC-SA-4.0.txt)                                             |
| kosal      | [philatype](https://github.com/philatype/kosal)                   | [CC BY 4.0](../licenses/piece/CC-BY-4.0.txt)                                                         |
| leipzig    | Armando Hernandez Marroquin                                       | [Freeware — Chess Leipzig](https://www.enpassant.dk/chess/fonteng.htm#LEIPZIG)                       |
| maestro    | sadsnake1                                                         | [CC BY-NC-SA 4.0](../licenses/piece/CC-BY-NC-SA-4.0.txt)                                             |
| merida     | Armando Hernandez Marroquin                                       | [GPLv2+](../licenses/piece/GPL-2.0.txt)                                                              |
| pirouetti  | [pirouetti](https://lichess.org/@/pirouetti)                      | [AGPLv3+](https://www.gnu.org/licenses/agpl-3.0.txt)                                                 |
| pixel      | therealqtpi                                                       | [AGPLv3+](https://www.gnu.org/licenses/agpl-3.0.txt)                                                 |
| spatial    | [Maurizio Monge](https://github.com/maurimo/chess-art)            | [MIT](../licenses/chess-art/LICENSE.txt)                                                             |
| staunty    | sadsnake1                                                         | [CC BY-NC-SA 4.0](../licenses/piece/CC-BY-NC-SA-4.0.txt)                                             |
| tatiana    | sadsnake1                                                         | [CC BY-NC-SA 4.0](../licenses/piece/CC-BY-NC-SA-4.0.txt)                                             |

## Fairy chess variants

`fairypiece/<set>/` holds the 60 derived files per set for fairy chess
diagrams, generated by `pnpm pieces:fairy` (`scripts/generate-fairy-pieces.mjs`)
from that set's own twelve pieces (`/fairypiece/<set>/wQ90.svg`, …). The
set directories above stay untouched, twelve files each.

| File                                    | Meaning                                           |
| --------------------------------------- | ------------------------------------------------- |
| `wQ90.svg`, `bN180.svg`, `wR270.svg`, … | The piece rotated 90°, 180° or 270° clockwise     |
| `nK.svg`, `nQ.svg`, …                   | Neutral piece: white left half, black right half  |
| `nN90.svg`, `nB180.svg`, …              | Neutral piece rotated 90°, 180° or 270° clockwise |

Problem diagrams use these by convention for fairy pieces (for example an
inverted queen for a grasshopper or an inverted knight for a nightrider), with
the meaning given in the diagram legend. These files modify source artwork by
rotation and, for neutral pieces, by combining its white and black versions.
For explicitly licensed sets, the generated artwork retains its source terms;
this paragraph records those changes for Creative Commons attribution. The
`companion` and `leipzig` source descriptions say only “freeware”; no broader
permission should be inferred from that word.

`governor` is not listed as an exception in Lichess's `COPYING.md`, so Lila's
AGPLv3+ default applies to it.

With gratitude to each piece-set author and to Lichess for distributing the
SVG collection.
