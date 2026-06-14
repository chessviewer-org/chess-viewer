import { History } from 'lucide-react';

import { REPO_CHANGELOG_URL, REPO_URL } from '../aboutConstants';
import { Lead, SectionHeading } from '../parts';

/** A dated changelog entry, written in plain language. */
interface ChangelogEntry {
  date: string;
  title: string;
  items: string[];
}

const REPO_COMMITS_URL = `${REPO_URL}/commits`;

/**
 * Human-readable changelog. Entries are grouped by date/theme and faithfully
 * summarise what actually shipped, taken from the project's real git history
 * (`git log`), rather than echoing raw commit subjects. Newest first.
 *
 * Version note: this codebase is the v6 line, in active development on the
 * `develop` branch (package version 6.0.0), building on the earlier v2–v3.5
 * releases from late 2025 / early 2026.
 */
const ENTRIES: ChangelogEntry[] = [
  {
    date: 'June 2026',
    title:
      'Editor command bar, export studio, PWA, and accessibility (v6 line)',
    items: [
      'Added a command bar to the board editor for copy, share, open, and download, plus a built-in chess-database search panel and improved keyboard controls.',
      'Reworked the export studio, control panel, and history panels for a clearer layout, including an inline export-settings panel that mirrors the clipboard-history view.',
      'Added keyboard navigation and ARIA support across components — including the custom select menus and dialogs — and a screen-reader description of the current board position.',
      'Added the navbar to every page and retired the per-page back/save header so navigation is consistent throughout the app.',
      'Refactored Settings into Account, Security, and Data Management sections, and added MFA/2FA flows with backup codes and a stricter security lock for signed-in accounts.',
      'Installed ChessVision as a Progressive Web App: a registered service worker with caching rules, so it can be added to your home screen and load faster on repeat visits.',
      'Optimised history persistence and the worker-based raster export, and fixed memory leaks for more stable long editing and export sessions.'
    ]
  },
  {
    date: 'June 2026',
    title: 'FEN history redesign, performance, and stability',
    items: [
      'Redesigned the FEN history page with favorites and de-duplication, a react-window virtualized grid, and infinite scroll via IntersectionObserver to keep large histories smooth.',
      'Bounded the active history list length and hoisted piece-image loading to parents to cut re-renders on the board and history grid.',
      'Detached react-dnd connectors on unmount for the draggable piece, droppable square, and trash zone to prevent listener and node-reference leaks.',
      'Made repeated high-resolution exports more robust: release canvases on failure, register the worker cancel handle so cancelling stops the raster worker, and honour pause/cancel between batch items.',
      'Hardened the security flow to fail closed, guarding the unlock path against auth/RPC failures so it stays locked unless the server confirms the session.'
    ]
  },
  {
    date: 'May–June 2026',
    title: 'Position database search and cloud sync',
    items: [
      'Added position lookup against online chess databases — the Lichess opening explorer plus the PDB (Problemdatenbank) and YACPDB problem databases — proxied through a Supabase edge function (to work around browser CORS) with results cached in Postgres.',
      'Added a dedicated database-search panel and a manual-search hook on the frontend, with per-provider result rows.',
      'Added optional end-to-end-encrypted cloud sync that keeps your local data as the source of truth, with budget-aware truncation so an oversized value never blocks the sync.',
      'Added undo/redo history, keyboard shortcuts, and board sharing to the interactive board editor.',
      'Added a shared profile context with a supporter badge and a donate link in the navbar.'
    ]
  },
  {
    date: 'May 2026',
    title: 'v6 foundations: architecture, branding, and tooling',
    items: [
      'Set the application version to 6.0.0 and reorganised the codebase: path aliases, a 5-tier import order enforced by simple-import-sort, and repo-wide Prettier formatting.',
      'Renamed the feature panels directory and trimmed unused code — legacy color-picker, theme-customization, and experimental scanning paths were removed.',
      'Migrated branding and repository links to the chessvision.org domain and the chessvision-org GitHub organization, and updated the deployment configuration.',
      'Overhauled CI workflows and added a PR labeler, tightened lint-staged, pinned the Node version, and aligned the Node/pnpm engines.',
      'Tuned the export quality presets and resolution tiers for clearer print output.'
    ]
  },
  {
    date: 'Late 2025 – early 2026',
    title: 'Earlier releases (v2–v3.5)',
    items: [
      'Built the high-resolution export system with PNG, JPEG, and SVG output, ultra-quality canvas rendering, and DPI handling.',
      'Added the custom piece sets and reorganised the chess constants and folder structure (v3.0–v3.5).',
      'Improved FEN parsing and error handling, coordinate calculations, and board-size handling.',
      'Initial public versions: the interactive board editor, FEN input, the flip-board button, and image export.'
    ]
  }
];

/**
 * Changelog section: a plain-language summary of notable changes drawn from the
 * real git history. The full commit list lives on GitHub.
 */
export default function ChangelogSection() {
  return (
    <div className="space-y-8 animate-pageEnter">
      <div className="space-y-3">
        <SectionHeading icon={History} title="Changelog" />
        <Lead>
          A plain-language summary of what has actually changed in ChessVision,
          newest first, drawn from the project&apos;s git history. For the full
          detail, read the{' '}
          <a
            href={REPO_CHANGELOG_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-accent hover:underline"
          >
            changelog
          </a>{' '}
          or browse every{' '}
          <a
            href={REPO_COMMITS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-accent hover:underline"
          >
            commit on GitHub
          </a>
          .
        </Lead>
      </div>

      <ol className="space-y-6">
        {ENTRIES.map((entry) => (
          <li
            key={`${entry.date}-${entry.title}`}
            className="rounded-2xl border border-border bg-surface-elevated p-6"
          >
            <div className="mb-3 flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-accent/10 px-3 py-1 text-sm font-bold uppercase tracking-wider text-accent">
                {entry.date}
              </span>
              <h3 className="text-lg font-bold text-text-primary">
                {entry.title}
              </h3>
            </div>
            <ul className="list-disc space-y-2 pl-5 text-base leading-relaxed text-text-secondary">
              {entry.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </li>
        ))}
      </ol>
    </div>
  );
}
