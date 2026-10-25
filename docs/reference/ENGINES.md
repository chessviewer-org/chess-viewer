# Engine delivery

Engines run on the visitor's device in Web Workers. Nothing is analysed on a server.

## First use

An engine is downloaded when it is first needed and then served from the browser cache:

- Stockfish files under `/wasm/stockfish/` are sent with `Cache-Control: public, max-age=31536000, immutable`. File names carry the version, so a file is never edited in place; an upgrade ships under a new name.
- Popeye under `/wasm/popeye/` revalidates on every load (it is 0.7 MB) because `py.wasm` keeps its name across rebuilds.
- The Stockfish worker reports download progress through the `progressPort` protocol of Stockfish.js. The panel shows `Downloading engine · N%` and the progress bar follows it. The load timeout restarts on every progress message, so a slow connection does not fail while bytes are arriving.

Clearing site data removes the engines; the next analysis downloads them again.

## Device defaults

`engines/core/device.ts` reads `navigator.hardwareConcurrency` and `navigator.deviceMemory` (4 GB and 2 cores when the browser hides them).

| Setting | Default                                                                                    |
| ------- | ------------------------------------------------------------------------------------------ |
| Threads | `min(cores, 8) − 1`, at least 1; multi-threaded builds only on cross-origin isolated pages |
| Hash    | largest of 16 / 32 / 64 / 128 / 256 MB that is `≤ min(16 MB × cores, memory ÷ 16)`         |

Saved choices always win over the defaults.

## Files

- `public/wasm/<engine>/`: runtime binaries and workers
- `public/licenses/<engine>/`: licenses and notices; upstream Popeye source is linked from its NOTICE instead of being shipped
- `native/<engine>/`: build inputs, never served
