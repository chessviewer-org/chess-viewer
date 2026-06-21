# ChessVision

Chess position editor with high-resolution export.

[![React](https://img.shields.io/badge/React-19.x-61DAFB?style=flat-square&logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.x-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-8.x-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev)
[![License: AGPL-3.0](https://img.shields.io/badge/License-AGPL--3.0-blue.svg?style=flat-square)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](CONTRIBUTING.md)

[Live Demo](https://chessvision.org) · [Report Bug](https://github.com/chessvision-org/chess-vision/issues) · [Request Feature](https://github.com/chessvision-org/chess-vision/issues)

---

## What is it?

ChessVision is a browser-based diagram editor. You set up a position, choose how the board and pieces look, and export a sharp image at the size and quality you need — for print, a blog post, a video thumbnail, or wherever. No installation, no account required.

It does one thing: turn a chess position into a clean, high-quality image. There is no engine, no opponent, no analysis.

---

## Features

### Core

- Drag-and-drop board editor powered by `@dnd-kit`
- FEN input with real-time validation (93-character cap)
- Multi-position batch input — up to 10 positions simultaneously
- Board flip and coordinate label toggle
- Position database search (Lichess, PDB, YACPDB) on demand
- Clipboard copy

### Export

- PNG, JPEG, SVG export
- 4 quality presets: 1× (300 DPI), 2× (600 DPI), 3× (900 DPI), 4× (1200 DPI)
- Board size in centimetres (4 cm, 6 cm, 8 cm) for print-accurate output
- Batch export across multiple positions — downloaded as a ZIP
- Export pause, resume, and cancel
- DPI metadata embedded in PNG and JPEG

### Board Customisation

- 23 piece sets (Lichess CDN)
- 20 preset board themes
- Custom colour picker (HSV/RGB/HEX)
- Up to 48 total theme presets including user-created ones

### Position Management

- FEN history with favourites, pinning, and text search
- Freshness indicators (Fresh / Aging / Stale) with timestamps
- Batch FEN list with localStorage persistence
- Clipboard history panel

### Account and Sync (Optional)

- Email/password authentication with TOTP-based two-factor authentication
- Cloud sync via Supabase — your data, owner-scoped by row-level security
- 90-day re-verification gate for sensitive operations
- Data migration from localStorage on first sign-in

---

## Quick Start

**Requirements:** Node.js ≥ 22, pnpm ≥ 10

```bash
git clone https://github.com/chessvision-org/chess-vision.git
cd chess-vision
pnpm install
pnpm dev          # http://localhost:3000
```

```bash
pnpm build        # production build → dist/
pnpm preview      # serve dist/ locally
```

---

## Docker

```bash
# Production (nginx + static build)
docker compose up --build -d web    # http://localhost:3000

# Development (Vite HMR)
docker compose --profile dev up --build dev   # http://localhost:5173
```

---

## Project Structure

```
src/
├── shared/
│   ├── types/          # Canonical TypeScript types (@app-types alias)
│   ├── constants/      # Piece sets, theme data, drag-drop constants
│   ├── hooks/          # Cross-page reusable hooks
│   ├── utils/          # Canvas pipeline, FEN parser, export utilities
│   ├── ui/             # UI primitives (Modal, CustomSelect, Checkbox, etc.)
│   └── workers/        # Web Worker for SVG → raster off-thread
├── components/
│   ├── board/          # Board display (MiniPreview, BoardSquare)
│   ├── features/       # Domain modules (export, theme, FEN, color picker, history)
│   ├── interactions/   # Drag-and-drop editor (ChessEditor, DroppableSquare, etc.)
│   └── layout/         # Navbar
├── contexts/           # FENBatchContext, ModalContext, ThemeSettingsContext
├── features/auth/      # Supabase auth, MFA, cloud sync, security gate
├── pages/              # Route-level page components
└── routes/             # React Router config — all pages lazy-loaded
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
| Drag and drop   | @dnd-kit         | 6.x     |
| Animations      | Framer Motion    | 12.x    |
| Virtual lists   | react-window     | 2.x     |
| Icons           | Lucide React     | latest  |
| Backend / Auth  | Supabase         | 2.x     |
| Package manager | pnpm             | 10.x    |

---

## Export System

Board pixel dimensions are computed from a physical size (cm) and a quality multiplier:

```
pixels = round((boardSizeCm / 2.54) × 300 × multiplier)
```

| Preset | DPI   | 4 cm board       | 6 cm board       | 8 cm board       |
| ------ | ----- | ---------------- | ---------------- | ---------------- |
| 1×     | 300   | 472 × 472 px     | 708 × 708 px     | 944 × 944 px     |
| 2×     | 600   | 944 × 944 px     | 1,417 × 1,417 px | 1,890 × 1,890 px |
| 3×     | 900   | 1,417 × 1,417 px | 2,126 × 2,126 px | 2,835 × 2,835 px |
| 4×     | 1,200 | 1,890 × 1,890 px | 2,835 × 2,835 px | 3,780 × 3,780 px |

PNG exports embed DPI via the `pHYs` chunk. JPEG exports embed DPI via JFIF density fields.

Safari caps canvas at 16,384 px per dimension. All four quality presets are well within this limit.

---

## Browser Support

| Browser | Minimum version |
| ------- | --------------- |
| Chrome  | 90+             |
| Firefox | 88+             |
| Safari  | 14+             |
| Edge    | 90+             |

Required APIs: Canvas API, Web Workers, localStorage, ES2020+. Clipboard API is optional (copy-to-clipboard falls back gracefully).

---

## Security and Privacy

- Board rendering and export run entirely client-side — positions never leave your device.
- No analytics, tracking, or advertising cookies.
- FEN input is capped at 93 characters before any parsing begins.
- All localStorage and external response parsing uses `safeJSONParse` to prevent prototype pollution.
- Optional cloud sync stores data in Supabase with row-level security: each user can only read and write their own rows. No other user, and not us, can access your data.

See [SECURITY.md](SECURITY.md) for vulnerability reporting.

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for the full guide.

```bash
git checkout -b fix/your-fix develop
# make changes
pnpm validate        # typecheck + lint + format + tests
git commit -m "fix: brief description"
git push origin fix/your-fix
# open a pull request against develop
```

---

## License

AGPL-3.0. See [LICENSE](LICENSE).

&copy; 2026 Khatai Huseynzada
