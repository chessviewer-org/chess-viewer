# ChessVision

Chess position visualizer with high-resolution export capabilities.

[![React](https://img.shields.io/badge/React-19.x-61DAFB?style=flat-square&logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.x-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-8.x-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev)
[![License: AGPL-3.0](https://img.shields.io/badge/License-AGPL--3.0-blue.svg?style=flat-square)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](CONTRIBUTING.md)

[Live Demo](https://chessvision.org) · [Report Bug](https://github.com/chessvision-org/chess-vision/issues) · [Request Feature](https://github.com/chessvision-org/chess-vision/issues)

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Quick Start](#quick-start)
- [Docker](#docker)
- [Project Structure](#project-structure)
- [Technology Stack](#technology-stack)
- [Export System](#export-system)
- [Browser Support](#browser-support)
- [Security and Privacy](#security-and-privacy)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

ChessVision parses FEN notation and renders chess positions as high-resolution raster or vector images. Designed for chess players, coaches, authors, and developers who need precise, customizable board diagrams.

All board rendering and export runs in the browser. Optional cloud sync is available for signed-in users and uses end-to-end encryption before any data leaves the device.

---

## Features

### Core

- Full FEN notation support with real-time validation (max length: 93 characters)
- Multi-position input — up to 10 positions simultaneously
- PNG and JPEG export with resolutions up to 30,208 × 30,208 px
- SVG vector export
- Batch export across multiple positions and formats
- Clipboard copy

### Board and Themes

- 23 piece sets
- Color picker with HSL, RGB, and HEX input modes
- 20+ preset board themes; up to 48 total presets including user-created ones
- Board flip and coordinate label toggle
- Adjustable physical board dimensions (cm-based) for print-accurate output

### Position Management

- FEN history with favorites, pinning, and text search
- Freshness indicators (Fresh / Aging / Stale) with timestamps
- Auto-archival of older entries
- Batch FEN list with localStorage persistence

### Account and Sync (Optional)

- Email/password authentication with TOTP-based multi-factor authentication
- End-to-end encrypted cloud sync via Supabase
- 90-day re-verification gate for privileged operations
- Data migration from localStorage on first sign-in

---

## Quick Start

### Prerequisites

- Node.js >= 20
- pnpm >= 9

### Installation

```bash
git clone https://github.com/chessvision-org/chess-vision.git
cd chess-vision
pnpm install
pnpm dev
```

Dev server starts at `http://localhost:3000`.

### Production Build

```bash
pnpm build    # outputs to dist/
pnpm preview  # serves dist/ locally
```

---

## Docker

### Production (Nginx + static build)

```bash
docker compose up --build -d web
```

Served at `http://localhost:3000`.

### Development (Vite with hot reload)

```bash
docker compose --profile dev up --build dev
```

Dev server at `http://localhost:5173`.

---

## Project Structure

```
src/
├── shared/
│   ├── types/          # Canonical TypeScript types (@app-types alias)
│   ├── constants/      # Static data: piece sets, theme defaults, DnD constants
│   ├── hooks/          # Cross-page reusable hooks
│   ├── utils/          # Canvas pipeline, FEN parser, export utilities
│   ├── ui/             # Reusable UI primitives (Button, Modal, Input, etc.)
│   └── workers/        # Web Workers for off-thread SVG rasterization
├── components/
│   ├── board/          # Board rendering (BoardGrid, BoardSquare, ChessBoard, MiniPreview)
│   ├── features/       # Domain modules (export, theme, FEN, color picker, history)
│   ├── interactions/   # DnD editor (ChessEditor, DraggablePiece, DroppableSquare)
│   └── layout/         # App shell (Navbar)
├── contexts/           # ThemeSettingsContext, FENBatchContext
├── features/auth/      # Supabase auth, MFA, E2EE cloud sync, security gate
├── pages/              # Route-level page components
└── routes/             # React Router configuration
docs/                   # Extended technical documentation
```

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
| Icons           | Lucide React     | latest  |
| Backend / Auth  | Supabase         | 2.x     |
| Rendering       | HTML5 Canvas     | —       |
| Package manager | pnpm             | 10.x    |

---

## Export System

Board pixel dimensions are computed from a physical size (cm) and a quality multiplier:

```
pixelDimension = round((boardSizeCm / 2.54) × 300 × qualityMultiplier)
```

### Print Mode (8× and 16×)

Board size selection (4 cm, 6 cm, 8 cm) sets the physical print dimension. Quality multiplier increases pixel density without changing the printed size.

| Quality | Board size | Dimensions         | DPI   |
| ------- | ---------- | ------------------ | ----- |
| 8×      | 4 cm       | 3,776 × 3,776 px   | 2,400 |
| 8×      | 6 cm       | 5,664 × 5,664 px   | 2,400 |
| 8×      | 8 cm       | 7,552 × 7,552 px   | 2,400 |
| 16×     | 4 cm       | 7,552 × 7,552 px   | 4,800 |
| 16×     | 6 cm       | 11,328 × 11,328 px | 4,800 |
| 16×     | 8 cm       | 15,104 × 15,104 px | 4,800 |

### Social Mode (24× and 32×)

Fixed pixel output regardless of board size selection.

| Quality | Board size | Dimensions         | DPI   |
| ------- | ---------- | ------------------ | ----- |
| 24×     | 4 cm       | 11,328 × 11,328 px | 7,200 |
| 24×     | 6 cm       | 16,992 × 16,992 px | 7,200 |
| 24×     | 8 cm       | 22,656 × 22,656 px | 7,200 |
| 32×     | 4 cm       | 15,104 × 15,104 px | 9,600 |
| 32×     | 6 cm       | 22,656 × 22,656 px | 9,600 |
| 32×     | 8 cm       | 30,208 × 30,208 px | 9,600 |

PNG exports embed DPI metadata via the `pHYs` chunk. JPEG exports embed DPI via JFIF density fields.

---

## Browser Support

| Browser | Minimum version |
| ------- | --------------- |
| Chrome  | 90+             |
| Firefox | 88+             |
| Safari  | 14+             |
| Edge    | 90+             |

Required APIs: Canvas API, Web Workers, localStorage, ES2020+. Clipboard API is optional.

Safari caps canvas dimensions at 16,384 px. The 24× and 32× Social export modes may fail on Safari/iOS.

---

## Security and Privacy

- Board rendering and export run entirely client-side.
- Optional cloud sync encrypts all data end-to-end before transmission. The encryption key is stored locally in `localStorage` under `cv_privacy_key` and never sent to the server.
- No analytics, tracking, or cookies.
- FEN input is capped at 93 characters before parsing begins.
- All localStorage and external response parsing uses `safeJSONParse` to prevent prototype pollution.

See [SECURITY.md](SECURITY.md) for vulnerability reporting.

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for the full guide.

```bash
git checkout -b feature/your-feature
# make changes
pnpm test && npx tsc --noEmit && pnpm lint
git commit -m "feat: brief description"
git push origin feature/your-feature
# open a pull request
```

---

## License

AGPL-3.0. See [LICENSE](LICENSE).

&copy; 2026 Khatai Huseynzada
