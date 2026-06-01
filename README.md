# ChessVision

**High-performance chess visualization engine. Renders FEN-described positions to print-quality raster and vector images, entirely client-side.**

**Status:** v5.5.3 — stable.

[![React](https://img.shields.io/badge/React-19.x-61DAFB?style=flat-square&logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.x-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-8.x-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.x-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)

[Live Demo](https://chessvision.org) · [Report Bug](https://github.com/BilgeGates/chess-vision/issues) · [Request Feature](https://github.com/BilgeGates/chess-vision/issues)

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [Technology Stack](#technology-stack)
- [Export System](#export-system)
- [Browser Support](#browser-support)
- [Security and Privacy](#security-and-privacy)
- [Contributing](#contributing)
- [Contact and Support](#contact-and-support)
- [License](#license)

---

## Overview

ChessVision parses FEN notation and renders chess positions as high-resolution raster or vector images. It is designed for chess players, coaches, authors, and developers who need precise, customizable board diagrams without a backend dependency.

All processing happens in the browser. No data leaves the user's device. The v5.5.3 release is the current stable milestone of the v5.x line; the line is in maintenance mode and accepts security, dependency, build, and documentation changes only. New feature work is staged on the `develop` branch.

---

## Features

### Core

- Full FEN notation support with real-time validation (`MAX_FEN_LENGTH = 93`)
- Multi-position batch input on the Advanced FEN page
- PNG and JPEG export with resolutions up to 30,208 × 30,208 px
- SVG export
- ZIP-bundled batch export across positions and formats
- Clipboard copy

### Board and Themes

- 23 professional piece sets (Classic to Modern)
- Complete color picker with HSL, RGB, and HEX modes
- 20+ preset themes plus custom theme creation and preset management
- Board flip and coordinate toggle
- Adjustable physical board dimensions (cm-based)

### Position Management

- FEN history with favorites, pinning, and search
- Auto-archival of older entries
- Archive browser with filter and restore

---

## Quick Start

### Prerequisites

- Node.js >= 20
- pnpm >= 9 (the lockfile is produced by pnpm 10.33.0)

### Installation

```bash
git clone https://github.com/BilgeGates/chess-vision.git
cd chess-vision
pnpm install
pnpm dev
```

The dev server starts at `http://localhost:3000`.

### Production Build

```bash
pnpm build    # outputs to dist/
pnpm preview  # serves the dist/ locally
```

---

## Project Structure

```
src/
├── components/
│   ├── board/          # Board rendering (BoardGrid, BoardSquare, ChessBoard, MiniPreview)
│   ├── features/       # Domain modules (Export, Theme, Fen, ColorPicker, History, HelpCenter)
│   ├── interactions/   # DnD editor (ChessEditor, DraggablePiece, DroppableSquare, PiecePalette)
│   ├── layout/         # App shell (Navbar)
│   └── ui/             # Primitive components (Button, Modal, Input, Select, Badge)
├── contexts/           # FENBatchContext, LayoutContext, ThemeSettingsContext
├── hooks/              # Custom hooks (useFENHistory, useTheme, useNotifications, ...)
├── pages/              # Route-level page components
├── routes/             # React Router configuration
├── utils/              # Utility functions, canvas pipeline, validation, logger
└── constants/          # App-wide constants
docs/                   # Extended documentation
```

Each directory exports symbols through an `index.js` barrel file. The source tree is predominantly `.jsx` / `.js`; TypeScript coverage on the v5.x line is partial.

### Key Architecture Decisions

- **Feature-based component grouping** — each major feature has its own subdirectory under `components/features/`
- **No prop drilling for theme** — theme state is managed through `ThemeSettingsContext`
- **Canvas pipeline** — high-res export uses a multi-stage canvas pipeline (`canvasRenderer.js` → `canvasExporter.js` → `advancedExport.js`)
- **Lazy-loaded routes** — all page components are loaded with `React.lazy` / `Suspense`

---

## Technology Stack

| Category        | Library / Tool   | Version |
| --------------- | ---------------- | ------- |
| UI framework    | React            | 19.x    |
| Language        | TypeScript       | 6.x     |
| Build tool      | Vite             | 8.x     |
| Styling         | Tailwind CSS     | 4.x     |
| Routing         | React Router DOM | 7.x     |
| Drag and drop   | React DnD        | 16.x    |
| Animations      | Framer Motion    | 12.x    |
| Virtual lists   | react-window     | 2.x     |
| Icons           | Lucide React     | 1.x     |
| Rendering       | HTML5 Canvas     | —       |
| Storage         | localStorage     | —       |
| Test runner     | `node --test`    | —       |
| Linting         | ESLint           | 9.x     |
| Package manager | pnpm             | 10.x    |
| Release         | semantic-release | 25.x    |
| Deployment      | GitHub Pages     | —       |

---

## Export System

Board export dimensions are computed from a physical board size (cm) and a quality multiplier:

```
pixelDimension = boardSizeCm × qualityMultiplier × 118.11
```

### Print Mode (8x, 16x)

Output dimensions scale with the selected board size. Suitable for print-quality diagrams.

| Quality | Board size | Dimensions         | Est. file size | DPI   |
| ------- | ---------- | ------------------ | -------------- | ----- |
| 8x      | 4 cm       | 3,776 × 3,776 px   | 70–150 KB      | 2,400 |
| 8x      | 6 cm       | 5,664 × 5,664 px   | 140–300 KB     | 2,400 |
| 8x      | 8 cm       | 7,552 × 7,552 px   | 250–500 KB     | 2,400 |
| 16x     | 4 cm       | 7,552 × 7,552 px   | 250–500 KB     | 4,800 |
| 16x     | 6 cm       | 11,328 × 11,328 px | 500–900 KB     | 4,800 |
| 16x     | 8 cm       | 15,104 × 15,104 px | 900–1,500 KB   | 4,800 |

### Social Mode (24x, 32x)

Output dimensions scale with the selected board size. Suitable for high-resolution digital use and professional print.

| Quality | Board size | Dimensions         | Est. file size | DPI   |
| ------- | ---------- | ------------------ | -------------- | ----- |
| 24x     | 4 cm       | 11,328 × 11,328 px | 1.2–2.0 MB     | 7,200 |
| 24x     | 6 cm       | 16,992 × 16,992 px | 2.5–4.0 MB     | 7,200 |
| 24x     | 8 cm       | 22,656 × 22,656 px | 4.0–6.5 MB     | 7,200 |
| 32x     | 4 cm       | 15,104 × 15,104 px | 4.6–6.0 MB     | 9,600 |
| 32x     | 6 cm       | 22,656 × 22,656 px | 7.0–10.0 MB    | 9,600 |
| 32x     | 8 cm       | 30,208 × 30,208 px | 12.0–18.0 MB   | 9,600 |

---

## Browser Support

| Browser | Minimum version |
| ------- | --------------- |
| Chrome  | 90+             |
| Firefox | 88+             |
| Safari  | 14+             |
| Edge    | 90+             |

Required browser APIs: Canvas API, Clipboard API (optional), localStorage, ES2020+.

---

## Security and Privacy

ChessVision has no backend. All computation runs client-side.

- No server-side data storage
- No cookies, trackers, or telemetry
- No external API calls during runtime
- No user accounts or authentication
- Positions, exports, favorites, and settings remain local to the user's device

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for the full guide, including the label taxonomy, project-board workflow, and the v5.x maintenance scope.

Quick workflow:

```bash
# Fork the repository, then:
git checkout -b feature/your-feature
# ...make changes...
git commit -m "feat: brief description"
git push origin feature/your-feature
# Open a pull request on GitHub
```

Commit messages follow [Conventional Commits](https://www.conventionalcommits.org/). Commitlint enforces the format on the `commit-msg` hook.

---

## Contact and Support

| Channel         | Address                                           |
| --------------- | ------------------------------------------------- |
| Repository      | https://github.com/BilgeGates/chess-vision        |
| Live demo       | https://chessvision.org                           |
| Project board   | https://github.com/users/BilgeGates/projects/4    |
| Bug reports     | https://github.com/BilgeGates/chess-vision/issues |
| Support email   | contact@chessvision.org                           |
| Security policy | [SECURITY.md](SECURITY.md)                        |

For security-sensitive disclosures, do not open a public issue. Use the channel documented in `SECURITY.md`.

---

## License

Copyright (c) 2026 Khatai Huseynzada. Released under the AGPL-3.0 License.
