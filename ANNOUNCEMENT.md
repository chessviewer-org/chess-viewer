# v6.0.0 Release

v6.0.0 is a major release that introduces optional user accounts with owner-scoped cloud sync, TypeScript 6 across the entire codebase, and a redesigned theme customization system.

---

## What's New in v6.0.0

### Authentication and Cloud Sync

- Optional email/password sign-in with TOTP-based multi-factor authentication
- Owner-scoped cloud sync via Supabase — Row-Level Security ensures each user can only access their own data
- Automatic migration of localStorage data on first sign-in
- 90-day re-verification gate for privileged operations
- Security lock screen with fail-closed behavior

### TypeScript 6 Migration

- Full strict-mode TypeScript 6 across all source files (`noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noImplicitAny`)
- Canonical type definitions in `src/shared/types/` accessible via `@app-types` alias
- Zero `any`, `@ts-ignore`, or non-null assertions in the codebase

### Theme Customization

- Up to 48 total theme presets (default + user-created)
- Dedicated preset management: create, rename, delete, reorder
- Protected default themes (cannot be deleted)
- Custom color mixer with independent light/dark square controls

### Export System

- Unified dimension calculation across all quality tiers (8×, 16×, 24×, 32×)
- Max export: 30,208 × 30,208 px at 9,600 DPI (32× Social, 8 cm board)
- SVG export in Advanced FEN flow
- Web Worker-based rasterization for exports above 4,000 px

### FEN History

- Freshness states: Fresh / Aging / Stale with timestamps
- Archive system: move positions from active history to archive and back
- Search and filter by FEN string

---

This project remains free and open-source under the AGPL-3.0 license.
