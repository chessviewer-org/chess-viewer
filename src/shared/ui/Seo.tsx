import React from 'react';

import {
  DEFAULT_DESCRIPTION,
  DEFAULT_OG_IMAGE,
  SITE_NAME,
  SITE_URL,
  TITLE_SEPARATOR
} from '@constants';

interface SeoProps {
  name?: string | undefined;
  description?: string | undefined;
  path?: string | undefined;
  image?: string | undefined;
  noindex?: boolean | undefined;
  dynamicParams?: string | undefined;
  schema?: Record<string, unknown> | Record<string, unknown>[] | undefined;
}

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
  const canonical =
    path !== undefined
      ? `${SITE_URL}${path === '/' ? '/' : path}${dynamicParams || ''}`
      : undefined;

  const schemas = schema ? (Array.isArray(schema) ? schema : [schema]) : [];

  const serialize = (obj: Record<string, unknown>) =>
    JSON.stringify(obj).replace(/</g, '\\u003c');

  return (
    <>
      <title>{title}</title>
      <meta name="description" content={desc} />
      <meta
        name="robots"
        content={noindex ? 'noindex, nofollow' : 'index, follow'}
      />
      {canonical !== undefined && <link rel="canonical" href={canonical} />}

      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={desc} />
      <meta property="og:image" content={ogImage} />
      {canonical !== undefined && (
        <meta property="og:url" content={canonical} />
      )}

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={desc} />
      <meta name="twitter:image" content={ogImage} />

      {schemas.map((s) => {
        const key = (s['@id'] ?? s['@type'] ?? JSON.stringify(s)) as string;
        return (
          <script
            key={key}
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: serialize(s) }}
          />
        );
      })}
    </>
  );
};
