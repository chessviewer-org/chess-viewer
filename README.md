# ChessViewer

[![License: AGPL-3.0](https://img.shields.io/badge/License-AGPL--3.0-blue.svg?style=flat-square)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](CONTRIBUTING.md)

ChessViewer is a browser-based chess diagram editor. Set up any position — orthodox or fairy — choose how the board looks, and export a sharp image at the resolution you need, or LaTeX for a book. No installation, no account required.

**[chessvision.org](https://chessvision.org)** · [Report a bug](https://github.com/chessviewer-org/chess-viewer/issues) · [Request a feature](https://github.com/chessviewer-org/chess-viewer/issues)

---

![ChessViewer — standard diagram editor](docs/assets/screenshot-home.png)

<table>
  <tr>
    <td><img src="docs/assets/screenshot-fairy-chess.png" alt="Fairy chess editor" /></td>
    <td><img src="docs/assets/screenshot-latex-export.png" alt="LaTeX Studio export" /></td>
  </tr>
  <tr>
    <td align="center">Fairy chess</td>
    <td align="center">LaTeX Studio</td>
  </tr>
</table>

---

## Getting started

**Requirements:** Node.js 22.12 or later, pnpm 12.15 or later (the exact pnpm release is pinned in `package.json`).

```bash
git clone https://github.com/chessviewer-org/chess-viewer.git
cd chess-viewer
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

```bash
pnpm build      # production build → dist/
pnpm validate   # typecheck, lint, format check, tests
```

### Docker

```bash
# Production
docker compose up --build -d web       # http://localhost:3000

# Development with HMR
docker compose --profile dev up --build dev   # http://localhost:5173
```

---

## What it does

- **Board editor** — drag pieces onto any square or pick one and click, with adjustable touch sensitivity and undo across drops; flip the board, toggle coordinates and border frame; full keyboard editing for screen-reader users
- **FEN input** — paste any FEN string with real-time validation; batch input supports up to 10 positions at once
- **Fairy chess** — a dedicated page (`/fairy-chess`) with neutral and rotated symbols, 163 named Popeye walks, stipulations, a library of 182 conditions, and Popeye `.inp` import/export
- **Export** — PNG, JPEG, or SVG at four quality presets (300–1200 DPI) and board sizes from 4 to 8 cm; batch export downloads a ZIP; DPI metadata is embedded in the file
- **LaTeX Studio** — a dedicated page (`/latex`) that turns up to 100 positions into `skak`, `chessboard` or `chess-problem-diagrams` markup, with author, source, award, stipulation, piece count, solutions, highlights and arrows; copy the code or download a `.tex` that compiles with pdfLaTeX, with the exact install command shown
- **Board customisation** — 20 piece sets, 20 preset themes including a black-and-white print theme, book-style hatched dark squares, custom colour picker, up to 48 saved presets
- **Position history** — saved locally with favourites, pinning, freshness indicators, and full-text search
- **Database search** — look up positions on Lichess and ChessDB, or open them in PDB and YACPDB
- **Optional account** — sign in to sync your history and settings across devices via Supabase; data is encrypted at rest and owner-scoped by row-level security

---

## Documentation

Technical documentation lives in [`docs/`](docs/README.md): architecture, design decisions, the fairy chess and LaTeX references, the export pipeline, accessibility and performance audits.

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for the full guide. The short version:

```bash
git checkout -b fix/your-fix
pnpm validate
git commit -m "fix: brief description"
git push origin fix/your-fix
# open a pull request against master
```

Every PR must reference an open issue (`Closes #N`) and pass CI before it can be merged.

---

## Security and privacy

Board rendering and export run entirely client-side — positions never leave your device. There are no ads or tracking cookies; visits are counted in aggregate with cookieless Cloudflare Web Analytics.

Optional cloud sync stores data in Supabase with row-level security: only the authenticated user can read or write their own rows.

To report a vulnerability, see [SECURITY.md](SECURITY.md).

---

## Tech stack

Preact 11, TypeScript 7, Vite 8.3 (Rolldown/Oxc), Tailwind CSS 4.3, wouter, fflate. Public routes are prerendered at build time with Puppeteer and hosted on Cloudflare Pages. TypeScript 6’s API package is used only by ESLint, following Microsoft’s recommended setup for TypeScript 7. No active service worker.

Supabase is used for auth and cloud sync via a custom hand-written client (`src/auth/core/Supabase.ts`) — the `@supabase/supabase-js` SDK is not installed. Icons are Lucide SVG paths embedded directly in `src/assets/icons/` (ISC License) — `lucide-react` is not installed. Page transition animations are CSS-based — `framer-motion` is not installed.

---

## License

[AGPL-3.0](LICENSE). &copy; 2026 Khatai Huseynzada.
