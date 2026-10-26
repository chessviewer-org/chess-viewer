# ChessViewer — roadmap

This is the current feature map. See [CHANGELOG.md](CHANGELOG.md) for release
history and [open issues](https://github.com/chessviewer-org/chess-viewer/issues)
for work in progress.

## Available now

- Standard and Fairy Chess diagram editors with FEN input, board editing,
  history, piece palettes, keyboard controls and board styling.
- Local computer analysis: Stockfish 18/19 Lite for standard positions and
  Popeye 4.103 for fairy compositions. Both run in browser Web Workers; their
  notation and rules stay separate. See [engine documentation](docs/reference/ENGINES.md).
- PNG, JPEG and vector SVG export, four 300–1200 DPI raster quality presets,
  physical board sizing, batch ZIP export and LaTeX Studio.
- 18 self-hosted piece sets with attribution, including generated fairy
  variants. Some artwork licenses restrict commercial use; see
  [piece-set attribution](public/piece/ATTRIBUTION.md).
- Board arrows and square marks for on-screen analysis. Exporting these marks
  is tracked separately in [#161](https://github.com/chessviewer-org/chess-viewer/issues/161).
- Position search through Lichess, ChessDB, PDB and YACPDB; optional Supabase
  account and cloud sync.

## Open work

- Exportable board annotations and their full interaction contract:
  [#161](https://github.com/chessviewer-org/chess-viewer/issues/161),
  [#188](https://github.com/chessviewer-org/chess-viewer/issues/188),
  [#189](https://github.com/chessviewer-org/chess-viewer/issues/189).
- Image-to-position import:
  [#163](https://github.com/chessviewer-org/chess-viewer/issues/163).
- PGN and direct game import require their own scoped design and issue before
  implementation.

## Current limits

- Popeye search limits can produce partial solution lists; the analysis panel
  reports this explicitly. Fairy piece movement is determined by Popeye's named
  walks and conditions, not by rotating an arbitrary diagram symbol.
- The browser's canvas size and memory limit affect very large raster exports.
  SVG export uses actual vector piece artwork and does not have a DPI setting.
- Browser tests and accessibility checks continue to grow alongside the product.
