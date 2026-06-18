import React from 'react';

import {
  DEFAULT_DESCRIPTION,
  DEFAULT_OG_IMAGE,
  SITE_NAME,
  SITE_URL,
  TITLE_SEPARATOR
} from '@constants';

interface SeoProps {
  /**
   * The name of the current page. If omitted, the title is just 'ChessVision';
   * otherwise it becomes '{name} • ChessVision'.
   */
  name?: string | undefined;
  /** Unique meta description for this page. Falls back to the site default. */
  description?: string | undefined;
  /**
   * Path-only canonical (e.g. '/about'). Combined with the canonical origin to
   * emit `<link rel="canonical">` and `og:url`. Omit for pages that should not
   * advertise a canonical (e.g. the 404 page).
   */
  path?: string | undefined;
  /** Override the social-preview image (absolute URL). Defaults to the site OG image. */
  image?: string | undefined;
  /** When true, emit `robots: noindex, nofollow` for private/transient pages. */
  noindex?: boolean | undefined;
  /**
   * Optional URL parameters (e.g., '?fen=...') to append to the canonical URL.
   * This is useful for making specific board states shareable and indexable.
   */
  dynamicParams?: string | undefined;
  /** JSON-LD structured data for rich snippets. */
  schema?: Record<string, unknown> | Record<string, unknown>[] | undefined;
}

/**
 * Manages all per-page SEO and social-sharing metadata.
 * Uses native React 19 document metadata support (hoisted to head).
 * The static fallbacks in `index.html` cover non-JS social crawlers; the
 * prerender step bakes these tags into each route's HTML at build time.
 */
export const Seo: React.FC<SeoProps> = ({
  name,
  description,
  path,
  image,
  noindex,
  dynamicParams,
  schema
}) => {
  const title = name ? `${name}${TITLE_SEPARATOR}${SITE_NAME}` : SITE_NAME;
  const desc = description ?? DEFAULT_DESCRIPTION;
  const ogImage = image ?? DEFAULT_OG_IMAGE;
  // Home canonicalises to the origin with a trailing slash so it matches the
  // static index.html fallback and the sitemap (one canonical form, no split
  // ranking signal).
  const canonical =
    path !== undefined
      ? `${SITE_URL}${path === '/' ? '/' : path}${dynamicParams || ''}`
      : undefined;

  // Securely stringify JSON-LD. Replaces `<` to prevent </script> XSS breakouts.
  // We use dangerouslySetInnerHTML to prevent React from encoding quotes to &quot;
  // inside the script body, which would invalidate the JSON-LD.
  const jsonLd = schema
    ? JSON.stringify(schema).replace(/</g, '\\u003c')
    : undefined;

  return (
    <>
      <title>{title}</title>
      <meta name="description" content={desc} />
      <meta
        name="robots"
        content={noindex ? 'noindex, nofollow' : 'index, follow'}
      />
      {canonical !== undefined && <link rel="canonical" href={canonical} />}

      {/* Open Graph */}
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={desc} />
      <meta property="og:image" content={ogImage} />
      {canonical !== undefined && (
        <meta property="og:url" content={canonical} />
      )}

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={desc} />
      <meta name="twitter:image" content={ogImage} />

      {/* Structured Data */}
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLd }}
        />
      )}
    </>
  );
};
