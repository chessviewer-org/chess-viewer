# Native engine sources

Build inputs for the engines shipped in `public/wasm/`. Nothing here is served.

- `popeye/build.sh` builds Popeye with Emscripten 6.0.13 from a clean upstream checkout
  and writes the runtime to `public/wasm/popeye/` and the license set to
  `public/licenses/popeye/`.
- `popeye/patches/` and `popeye/position-preview.h` are ChessViewer's modifications to
  upstream.
- Stockfish is consumed as the unmodified `stockfish` npm release; see
  `public/licenses/stockfish/NOTICE.txt`.
