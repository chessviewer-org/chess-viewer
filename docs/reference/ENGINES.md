# Computer analysis

ChessViewer runs two separate WebAssembly engines in browser Web Workers. The
Standard editor sends orthodox FEN to Stockfish; the Fairy Chess editor sends a
Popeye problem with its stipulation, named walks and conditions to Popeye.
Neither engine receives the other editor's notation or rule set. The board
position is not sent to a remote analysis server.

## In the editor

Select the computer icon beside the board to open or close analysis. The switch
in the panel pauses or resumes the engine, and the thin line above it shows
search time or download progress. Engine settings are saved locally.

| Editor      | Engine                  | Result                                                                                             | Settings                                                                             |
| ----------- | ----------------------- | -------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Standard    | Stockfish 18 or 19 Lite | White-side evaluation, depth and candidate lines                                                   | Model, search time, hash memory, threads, line count and board move rules            |
| Fairy Chess | Popeye 4.103            | Stipulation and a bounded number of solutions, including optional threats and defensive variations | Search time, memory, solution limit, threat display, variations and board move rules |

Hover over a result move to preview its position. Selecting a move shows it on
the main board. Standard Stockfish moves can be played from the line. Fairy
continuations come from Popeye's own move journal so multi-stage moves and
rebirths use the solver's actual positions. Popeye does not produce a
centipawn evaluation. A time or solution limit can leave more solutions
undiscovered; the UI reports this rather than claiming the list is complete.

## Delivery and resources

The engines download only when needed and then use the browser cache. The
Stockfish worker reports byte progress while it loads; a slow transfer extends
its load timeout when bytes continue to arrive. Versioned Stockfish files use
long-lived immutable caching. Popeye's `py.wasm` filename is stable, so its
files are revalidated on every load.

`src/engines/stockfish/` owns UCI messages, models and settings;
`src/engines/popeye/` owns problem input, solution parsing and solver settings.
`src/engines/rules/` handles standard board interactions without pretending
that a fairy glyph defines a movement rule. The workers and binaries live in
`public/wasm/<engine>/`; board and analysis styling lives in SCSS modules.

`engines/core/device.ts` reads `navigator.hardwareConcurrency` and
`navigator.deviceMemory` (4 GB and 2 cores when the browser hides them).

| Setting | Default                                                                                          |
| ------- | ------------------------------------------------------------------------------------------------ |
| Threads | `min(cores, 8) − 1`, at least 1; the multi-threaded Stockfish build needs cross-origin isolation |
| Hash    | Largest of 16 / 32 / 64 / 128 / 256 MB that is `≤ min(16 MB × cores, memory ÷ 16)`               |

Saved choices override the defaults. If the page is not cross-origin isolated,
Stockfish uses its single-threaded build.

## Licenses and matching source

- Stockfish.js 18.0.8 and 19.0.1: [notice](../../public/licenses/stockfish/NOTICE.txt),
  [GPL-3.0 text](../../public/licenses/stockfish/Copying.txt), and exact
  [18.0.8](https://github.com/nmrugg/stockfish.js/tree/v18.0.8) and
  [19.0.1](https://github.com/nmrugg/stockfish.js/tree/v19.0.1) source tags.
  All eight served JS/WASM files match those npm releases byte for byte.
- Popeye 4.103: [upstream distribution terms and build notice](../../public/licenses/popeye/NOTICE.txt),
  [complete source archive](../../public/licenses/popeye/popeye-4.103-source.tar.gz)
  at commit `8bf65b054482cae04fc36e07c6b880fb4f93c673`, and ChessViewer's
  [patches and build recipe](../../native/popeye/). Popeye retains its own
  terms rather than being relicensed under the application's AGPL.
- Emscripten: [runtime license](../../public/licenses/popeye/EMSCRIPTEN-LICENSE.txt).

The [third-party notices](../../public/licenses/README.md) list the other
bundled art, font and icon licenses. The `native/` build inputs are in the Git
repository; `public/` files are served with the site.
