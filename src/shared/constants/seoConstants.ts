/**
 * Centralised SEO metadata. Single source of truth for the canonical origin,
 * social-preview defaults, and per-route descriptions so the `<Seo>` component
 * and the static `index.html` fallbacks never drift apart.
 *
 * Keep descriptions ~150–160 chars (Google's snippet budget) and unique per
 * route — duplicate descriptions are an SEO regression.
 */

/** Canonical production origin. No trailing slash. */
export const SITE_URL = 'https://chessvision.org';

/** Site / brand name used in titles and Open Graph `og:site_name`. */
export const SITE_NAME = 'ChessVision';

/** Default social-preview image (1200×630), self-hosted to satisfy CSP `img-src 'self'`. */
export const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.png`;

/** Title separator (e.g. 'About • ChessVision'). */
export const TITLE_SEPARATOR = ' • ';

/** Default site-wide description (home / fallback). */
export const DEFAULT_DESCRIPTION =
  'ChessVision is a free, open-source, privacy-first chess diagram editor with ultra-high-quality PNG, JPEG, and SVG export. No tracking, no sign-up required.';

/**
 * Metadata describing a single page for the `<Seo>` component.
 */
export interface SeoMeta {
  /** Page name shown in the tab title as `{name} • ChessVision`. Omit for home. */
  name?: string;
  /** Unique meta description for this page. Falls back to {@link DEFAULT_DESCRIPTION}. */
  description?: string;
  /** Path-only canonical (e.g. '/about'). Combined with {@link SITE_URL}. */
  path?: string;
  /** Override the social-preview image. Defaults to {@link DEFAULT_OG_IMAGE}. */
  image?: string;
  /** When true, emit `robots: noindex, nofollow` (private pages like settings). */
  noindex?: boolean;
  /** JSON-LD structured data for rich snippets. */
  schema?: Record<string, unknown> | Record<string, unknown>[];
}

/**
 * Base Organization schema for JSON-LD.
 */
export const ORGANIZATION_SCHEMA = {
  '@type': 'Organization',
  '@id': `${SITE_URL}/#organization`,
  name: SITE_NAME,
  url: `${SITE_URL}/`,
  logo: `${SITE_URL}/logo512.png`,
  sameAs: ['https://github.com/chessvision-org/chess-vision']
};

/**
 * Base WebSite schema for JSON-LD.
 */
export const WEBSITE_SCHEMA = {
  '@type': 'WebSite',
  '@id': `${SITE_URL}/#website`,
  url: `${SITE_URL}/`,
  name: SITE_NAME,
  description: DEFAULT_DESCRIPTION,
  publisher: { '@id': `${SITE_URL}/#organization` },
  inLanguage: 'en'
};

/**
 * Base SoftwareApplication schema for the main tools.
 */
export const SOFTWARE_APP_SCHEMA = {
  '@type': 'SoftwareApplication',
  name: SITE_NAME,
  url: `${SITE_URL}/`,
  applicationCategory: 'MultimediaApplication',
  operatingSystem: 'Web',
  description:
    'Interactive chess board editor, FEN tooling, and ultra-high-quality PNG, JPEG, and SVG diagram export. Open-source, privacy-first, with end-to-end encrypted cloud sync.',
  isAccessibleForFree: true,
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD'
  },
  publisher: { '@id': `${SITE_URL}/#organization` }
};

/**
 * Per-route SEO copy, keyed by route path. Consumed by the page components and
 * mirrored by the prerender + sitemap config. `/settings` is intentionally
 * `noindex` (private, user-specific) and excluded from the sitemap.
 */
export const ROUTE_SEO: Record<string, SeoMeta> = {
  '/': {
    path: '/',
    description: DEFAULT_DESCRIPTION
  },
  '/advanced-fen': {
    name: 'Advanced Studio',
    path: '/advanced-fen',
    description:
      'Batch-generate and export chess diagrams from multiple FEN positions at once. High-resolution PNG, JPEG, and SVG output, bundled to ZIP — free and private.'
  },
  '/download': {
    name: 'Download',
    path: '/download',
    description:
      'Download your chess diagrams as ultra-high-quality PNG, JPEG, or SVG images. Print-ready DPI, transparent backgrounds, and batch ZIP export — completely free.'
  },
  '/about': {
    name: 'About',
    path: '/about',
    description:
      'Learn about ChessVision — an open-source, forever-free, privacy-first chess diagram tool. No tracking, end-to-end encrypted sync, and community-driven.'
  },
  '/fen-history': {
    name: 'History',
    path: '/fen-history',
    description:
      'Browse, search, and reuse your saved FEN positions. Your chess diagram history, stored privately on your device with optional end-to-end encrypted cloud sync.'
  },
  '/settings': {
    name: 'Settings',
    path: '/settings',
    description: 'Configure your ChessVision preferences, theme, and account.',
    noindex: true
  }
};

/**
 * Returns the SEO metadata for a known route, falling back to the home/default
 * entry for unknown paths. Always returns a definite {@link SeoMeta} so callers
 * can spread it without tripping `noUncheckedIndexedAccess`.
 */
export const getRouteSeo = (path: string): SeoMeta =>
  ROUTE_SEO[path] ?? { path, description: DEFAULT_DESCRIPTION };

/**
 * Routes that should be prerendered to static HTML at build time and listed in
 * the sitemap. Excludes `/settings` (private/noindex) and the 404 catch-all.
 */
export const INDEXABLE_ROUTES = [
  '/',
  '/advanced-fen',
  '/about',
  '/fen-history'
] as const;
