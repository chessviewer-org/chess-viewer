# ChessVision — Gemini Agent Instructions (v6.0.0)

## 1. Project Identity

ChessVision is a **Full-Stack SaaS React 19 + Vite chess diagram generator**.

- Parses FEN notation → renders HTML5 Canvas board → exports ultra-high-resolution images (up to ~30,000 px)
- **Backend:** Supabase (PostgreSQL + Auth + RLS + Storage)
- **Auth:** Email/password + TOTP 2FA with backup codes (server-side verified)
- **State:** React Hooks + Contexts + Supabase real-time sync + IndexedDB (local persistence)
- **Styling:** Tailwind CSS 4 + CSS variable design token system
- **Build:** Vite 8, TypeScript 6 (strict, `allowJs: false`), ESLint 9, Prettier 3
- **Deploy:** Vercel (with strict CSP headers) + Docker multi-stage build available

---

## 2. Workspace Map

Navigate directly to target files. Never blindly scan the project.

```
src/
├── app-types/              # Shared TypeScript interfaces (chess.ts, forms.ts, events.ts)
├── components/
│   ├── board/              # Canvas board UI (ChessBoard/, MiniPreview/)
│   ├── features/           # Domain panels (Export, FEN, History, Theme, Help, Auth)
│   ├── interactions/       # Drag-and-drop editor (InteractiveBoard/, DroppableSquare/)
│   ├── layout/             # App shell (Navbar/, AppShell/)
│   └── ui/                 # Primitives (Button, Slider, Tabs, Modal)
├── constants/              # chess.ts, themes.ts, dnd.ts
├── contexts/               # ThemeSettingsContext.tsx, FENBatchContext.tsx
├── features/
│   └── auth/               # Auth feature slice
│       ├── components/     # SignIn, SignUp, TwoFactorSetup, SecurityLockModal
│       ├── hooks/          # useSecurityCheck.ts, useSupabaseSync.ts
│       └── services/       # supabaseClient.ts (typed with Database generic)
├── hooks/                  # Shared custom hooks
├── pages/
│   ├── HomePage/           # Single-board playground
│   ├── AdvancedFENInputPage/ # Batch export studio
│   └── settings/           # Account, security, data management
├── routes/                 # Router.tsx (lazy-loaded pages, Suspense boundaries)
├── shared/
│   ├── hooks/              # useFENHistory.ts, useLocalStorage.ts, useTheme.ts
│   └── utils/              # canvasRenderer.ts, canvasExporter.ts, svgExporter.ts,
│                           # fenParser.ts, fenParser.test.ts, coordinateCalculations.ts,
│                           # advancedExport.ts, archiveManager.ts, historyUtils.ts,
│                           # pieceImageCache.ts, smartNaming.ts, contrastValidator.ts,
│                           # safeJSONParse.ts, logger.ts, errorHandler.ts
└── supabase/
    └── schema.sql          # Canonical DB schema with RLS policies
```

**Key files by task:**

| Task                     | Go to                                                    |
| ------------------------ | -------------------------------------------------------- |
| FEN parsing / validation | `src/shared/utils/fenParser.ts`                          |
| Canvas render (preview)  | `src/components/board/ChessBoard/useBoardCanvas.ts`      |
| Canvas render (export)   | `src/shared/utils/canvasRenderer.ts`                     |
| Export orchestration     | `src/shared/utils/canvasExporter.ts`                     |
| SVG export               | `src/shared/utils/svgExporter.ts`                        |
| Batch export             | `src/shared/utils/advancedExport.ts`                     |
| FEN history state        | `src/shared/hooks/useFENHistory.ts`                      |
| Local persistence        | `src/shared/hooks/useLocalStorage.ts` (IndexedDB-backed) |
| Auth + 2FA               | `src/features/auth/`                                     |
| Security lock            | `src/features/auth/hooks/useSecurityCheck.ts`            |
| Supabase client          | `src/features/auth/services/supabaseClient.ts`           |
| Theme tokens             | `src/index.css` (CSS variables)                          |
| Print sizing math        | `src/shared/utils/coordinateCalculations.ts`             |
| Smart batch naming       | `src/shared/utils/smartNaming.ts`                        |
| Contrast validation      | `src/shared/utils/contrastValidator.ts`                  |
| DB schema                | `supabase/schema.sql`                                    |
| Architecture decisions   | `docs/TECH_DECISIONS.md`                                 |

---

## 3. Stack & Constraints

### TypeScript

- Strict mode: `strict`, `noImplicitAny`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`
- `allowJs: false` — all source files are `.ts` / `.tsx`
- No `any`, no `@ts-ignore`, no `as unknown as` casts — use proper type guards
- Supabase client must use the generated `Database` generic: `createClient<Database>(...)`

### State & Persistence

- **IndexedDB** (via `idb`) for all large local data: FEN history, batch lists, position settings
- **localStorage** only for small, primitive values: active theme name, UI preferences
- **localStorage keys in use:** `chess-theme` (UI mode string only), `themeSettings`, `recentColors`
- **Supabase** for cloud sync: `fen_batches`, `profiles`, `user_security`, `user_data` tables
- Never store large arrays or objects in localStorage

### Security Rules (Non-negotiable)

- Security lock must **fail-closed**: lock on any query error, missing row, or loading timeout
- Gate all app content while `isLoading` is true in `useSecurityCheck`
- Backup codes: generated server-side, hashed (bcrypt), stored in `user_security.backup_codes`, burned on use
- CSP `connect-src` must explicitly list: Supabase project URL, `lichess1.org` (piece assets)
- Never expose raw backup codes post-setup; show once, then hash-only
- RLS policies are the last line of defence — keep client-side scoping consistent with them

### Export Pipeline

- Export quality indices 1–32 map to DPI tiers (300–1200 DPI)
- Quality 24x / 32x may exceed Safari canvas size limits — check `canvasExporter.ts` for preflight guard
- Canvas disposal is mandatory after every export: `canvas.width = 0; canvas.height = 0`
- Heavy raster work must run in a Web Worker (`workerRasterExport.ts`); fallback to main thread only with explicit user warning
- SVG export must reach full parity with PNG/JPEG on the Home page (not just Advanced FEN)

### Drag-and-Drop

- Board interaction uses **event delegation** on the parent canvas wrapper — no per-square listeners
- DnD backend is device-adaptive: `MouseBackend` for pointer devices, `TouchBackend` for touch (no blanket `delayTouchStart`)
- `BoardSquare` is memoized with a custom comparator — do not break this

### Code Style

- `pnpm` only — never `npm` or `yarn`
- ESLint: zero warnings in CI; no `console.*` in production paths — use `logger.ts`
- React Hooks: exhaustive deps required; no stale closures
- Conventional Commits enforced by commitlint + Husky
- Tailwind CSS only for styling; respect CSS variable design tokens — no hardcoded color utilities in feature screens
- No native `alert()` / `confirm()` / `prompt()` — use themed modal components

### Testing

- Test runner: Node built-in (`node:test`)
- Test file location: `src/shared/utils/fenParser.test.ts`
- Test script in `package.json` must point to correct path
- CI must fail on broken test paths — never ship with a dead test command
- Currently only FEN parser is tested; do not regress existing tests

---

## 4. Architecture Patterns

### Feature-Sliced Design (FSD)

Target layer order: `app/` → `pages/` → `widgets/` → `features/` → `entities/` → `shared/`

- `features/auth/` is the canonical example: `model/`, `api/`, `ui/` sub-slices
- Export pipeline lives in `features/export/` + `shared/lib/canvas/`
- `useAdvancedFEN.ts` must stay split into focused hooks: naming, playback, export orchestration, persistence

### Canvas Architecture

- **On-screen (preview):** `useBoardCanvas.ts` — double-buffered, DPR-aware, `renderScale = Math.max(3, Math.ceil(dpr * 2))`
- **Off-screen (export):** `canvasRenderer.ts` — DPI-accurate, physical cm sizing, disposed after use
- **Worker (raster):** `workerRasterExport.ts` — SVG→PNG/JPEG via `OffscreenCanvas.convertToBlob()`
- Full board redraws are acceptable for state changes; partial dirty-region tracking is not implemented

### Print Sizing Math

```
pixels = round((cm / 2.54) * DPI)
totalCanvas = boardPixels + 2 * borderSize + 2 * frameThickness
borderSize = round(max(18, boardPixels * 0.05))   // when coords enabled
frameThickness = round(max(1, boardPixels * 0.005)) // when frame enabled
```

### 3-Stage Agentic Workflow

Before any code change, internally process through all three:

1. **[FE Designer]** — UI/UX impact, responsive behaviour, Tailwind token compliance
2. **[Code Optimizer]** — Performance, correct `useMemo`/`useCallback` usage, re-render cost
3. **[QA Engineer]** — Edge cases, FEN parser regression, export pipeline integrity, security invariants

---

## 5. Known Limitations (Do Not Regress)

- Canvas board is **not screen-reader accessible** — do not claim WCAG compliance
- Export quality 24x/32x may hit **Safari canvas memory limits** — preflight guard must remain
- Piece SVGs are loaded from `lichess1.org` CDN — CSP must allow this origin
- `localStorage` quota handling uses deterministic eviction — do not revert to arbitrary key deletion
- Accessibility is partial — contrast validation exists for custom themes but full WCAG is out of scope

---

## 6. Resource Conservation

- **Never** use `find`, `grep`, or `cat` to explore the workspace blindly — use the Workspace Map above
- **Always** ask for permission before modifying more than one file
- Read `docs/TECH_DECISIONS.md` before touching: FEN parser, canvas exporter, history state
- Output only the modified code — no explanations unless asked
- Prefer surgical edits over full-file rewrites
