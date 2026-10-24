# Performance audit — 23 October 2026

## Measurements

Production JS totals include the application entry and every static dependency of
the selected page from Vite's manifest. Dynamic imports that have not been opened
are excluded. Gzip is computed separately per emitted file. These are payload
measurements, not a Lighthouse score or a guarantee about every device/network.

| Measurement                                  |                   Before |                         After |
| -------------------------------------------- | -----------------------: | ----------------------------: |
| Standard home JS                             |            597,875 bytes |                 316,162 bytes |
| Standard home JS, gzip                       |            191,468 bytes |                 114,592 bytes |
| Fairy symbol/letter cache populated on entry |               207 images | 72 symbols; letters on demand |
| Concurrent consumers of one piece source     |   separate Image objects |  one shared image and promise |
| Concurrent cloud reads for one user/key      |        separate requests |         one in-flight request |
| Initial profile reads                        | duplicate initialization |  one INITIAL_SESSION listener |

The JS reduction is 47.1% raw and 40.2% gzip.
The baseline excludes the retired PWA registration/Workbox code, making this a
comparison of page code rather than including additional savings from removing it.

Type-checking the same updated tree three times with each compiler gave median
wall times of **0.585s with TypeScript 7** and **4.770s with the TypeScript 6 API
compiler**. Peak child-process RSS was 307,208 KiB versus 559,168 KiB. These are
local development measurements, not browser runtime timings.

## Changes

- Each route has one cached dynamic import. Initial hydration waits for its page;
  client navigation keeps the current page until destination JS/CSS are ready.
  An obsolete pending navigation cannot override a newer destination. Suspense
  handles unvisited history entries; the existing error boundary can retry a
  failed import.
- Imports target their implementation modules instead of shared barrels, removing
  unnecessary dependency edges and cycles. Export renderers and the full changelog
  load when used. Vite uses its native Rolldown code-splitting and Oxc minification.
- Piece images share a source-keyed in-flight/completed cache. It remains bounded
  at 216 decoded images. Failures can retry; cancelling one consumer does not
  cancel another consumer's image. A selected named walk loads its three palette
  colours, while history only prepares letters for visible cards.
- Authentication uses its immediate INITIAL_SESSION callback instead of starting
  a second initializer. Token refresh has one in-flight request and ignores a late
  response after sign-out/session replacement. Profile results cannot overwrite
  a newer user/profile request. Auth context values and actions are memoized.
- Cloud reads coalesce only while in flight and are keyed by user and storage key.
  Settled results are removed, preserving fresh reads on later visits. Writes and
  deletes invalidate matching pending-read joins.
- Unchanged local settings do not schedule writes. Persistence and drag cleanup
  happen before a new page mounts, accounting for Preact 11's deferred passive
  cleanup. Pending drag history is saved when leaving the editor instead of
  retaining a minute-long timer on an unmounted component.
- Selecting a LaTeX diagram does not regenerate document markup. Swipe coordinates
  use a ref instead of rendering twice for each gesture.
- No active service worker or Workbox precache remains. `public/sw.js` retires
  legacy workers; `public/init.js` unregisters old registrations once, without
  reloading an active editor or racing cache deletions in the page.
- The shell and navbar retain their viewport width when a menu locks scrolling,
  including browsers with a visible scrollbar.

## Toolchain

Preact 11.0.2, Vite 8.3.5, Tailwind 4.3.3, wouter 3.13.0, pnpm 12.15.0,
Puppeteer 25.16.0, PostCSS 8.5.31, and the other compatible direct tools were
updated. pnpm settings now live in `pnpm-workspace.yaml`; clean frozen-lockfile
installation passes its supply-chain checks. The recently published Preact
11.0.2 release has an exact version exception to the default release-age policy.

TypeScript 7.0.2 supplies `tsc`. ESLint imports the separate TypeScript 6 API
package through Microsoft's recommended aliases; it is not shipped to browsers.
ESLint 9.39.5 and `@eslint/js` 9.39.5 remain on the supported peer range of
`eslint-plugin-react` 7.37.5. ESLint 10 is not forced past that peer requirement.

Sources: [Preact 11 migration](https://preactjs.com/guide/v11/upgrade-guide/),
[Microsoft's TypeScript 7 toolchain setup](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/),
[typescript-eslint supported versions](https://typescript-eslint.io/users/dependency-versions/),
[pnpm configuration](https://pnpm.io/settings).

## Verification

- Type checking, lint, formatting, and the complete test suite pass. Added tests
  cover page-import sharing/retry, image sharing/failure/cancellation, user-isolated
  request coalescing/freshness, and refresh races including sign-out.
- Production build and all 11 prerendered routes pass using the Chrome version
  matching the updated Puppeteer.
- Browser checks cover route navigation, restored fairy positions, named/neutral
  letters and their three palette colours, real image export, and mobile menus.
- Cloud request/auth invariants are tested with controlled clients. A real signed-in
  Supabase/RLS integration was not exercised without test-account credentials.

Reproduce with `pnpm install --frozen-lockfile`, `pnpm validate`, and `pnpm build`.
The production dependency graph is emitted at `dist/.vite/manifest.json`.
