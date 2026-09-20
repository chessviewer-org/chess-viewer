# LaTeX Export

Technical reference for the **Copy as LaTeX** feature ([issue #165](https://github.com/chessviewer-org/chess-viewer/issues/165)).

---

## Table of Contents

- [Overview](#overview)
- [Supported Packages](#supported-packages)
- [Output Modes](#output-modes)
- [Option Mapping](#option-mapping)
- [Validation and Safety](#validation-and-safety)
- [API](#api)
- [Entry Points](#entry-points)
- [File Reference](#file-reference)

---

## Overview

The LaTeX exporter turns the current position into ready-to-paste markup for the two chess packages most commonly used in books, bulletins, and academic papers. Nothing is rendered or compiled in the browser — the output is plain text copied to the clipboard.

- Two packages: `skak` and `chessboard`
- Board orientation (flip) is carried into the markup
- Coordinate visibility is carried into the markup
- Snippet or full compilable document
- Out of scope for this release: move lists, PDF generation, `xskak`, `chessfss`

---

## Supported Packages

### skak

```latex
\usepackage{skak}
\fenboard{rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1}
\showboard
```

`\showinverseboard` replaces `\showboard` for a flipped board, and `\notationoff` precedes the diagram when coordinates are hidden.

### chessboard

```latex
\usepackage{chessboard}
\chessboard[setfen=rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1]
```

Extra keys are added only when they deviate from the package defaults, and the command switches to a multi-line key list as soon as there is more than one key:

```latex
\chessboard[
  setfen=rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1,
  inverse=true,
  label=false
]
```

---

## Output Modes

| Mode       | Result                                                        |
| ---------- | ------------------------------------------------------------- |
| `snippet`  | `\usepackage{…}` line plus the diagram commands (default)     |
| `document` | `\documentclass{article}` … `\end{document}` — compiles as-is |

---

## Option Mapping

| Board state         | skak                | chessboard     |
| ------------------- | ------------------- | -------------- |
| Default orientation | `\showboard`        | —              |
| Flipped             | `\showinverseboard` | `inverse=true` |
| Coordinates visible | —                   | —              |
| Coordinates hidden  | `\notationoff`      | `label=false`  |

---

## Validation and Safety

The FEN is the only caller-controlled value that reaches the output, so it passes three gates before it is written into a LaTeX command:

1. `normalizeFEN` — trims, completes a placement-only FEN, and throws on structural damage
2. `validateFENDetailed` and `MAX_FEN_LENGTH` — full six-field validation and length ceiling
3. An allowlist — `/^[A-Za-z0-9/ -]+$/`

The allowlist is what keeps `\`, `{`, `}`, `%`, and `$` out of the markup, so a hostile FEN cannot close the argument and inject `\input` or `\write18`. Rejected input throws `LaTeX export failed: <reason>`; nothing is ever escaped and emitted anyway.

---

## API

```ts
import { generateBoardLatex } from '@utils';

const latex = generateBoardLatex({
  fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
  latexPackage: 'chessboard',
  flipped: true,
  showCoords: false,
  mode: 'snippet'
});
```

| Field          | Type                      | Default     |
| -------------- | ------------------------- | ----------- |
| `fen`          | `string`                  | required    |
| `latexPackage` | `'skak' \| 'chessboard'`  | `'skak'`    |
| `flipped`      | `boolean`                 | `false`     |
| `showCoords`   | `boolean`                 | `true`      |
| `mode`         | `'snippet' \| 'document'` | `'snippet'` |

Also exported: `LATEX_PACKAGES`, `LATEX_PACKAGE_META` and `isLatexPackage`. The clipboard write reuses the existing `useCopyToClipboard` hook.

---

## Entry Points

- **Board editor** — `Copy as LaTeX` in the command bar opens the dialog for the current position
- **Advanced FEN** — `Copy as LaTeX` under the board preview covers the selected position of the batch

Both pass the live board orientation and coordinate setting into the dialog.

---

## File Reference

| File                                                                   | Role                             |
| ---------------------------------------------------------------------- | -------------------------------- |
| `src/shared/utils/latexExporter.ts`                                    | Markup generation and validation |
| `src/components/features/Latex/LatexExportDialog.tsx`                  | Package/mode picker and preview  |
| `src/components/interactions/Editor/components/CommandBar.tsx`         | Editor entry point               |
| `src/pages/AdvancedFENInputPage/components/InteractiveBoardColumn.tsx` | Advanced FEN entry point         |
| `tests/latexExporter.test.ts`                                          | 32 unit tests                    |
