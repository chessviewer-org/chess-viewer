import { useLayoutEffect } from 'react';

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

type HeadAttribute = [name: string, value: string];

function setHeadElement(
  tag: 'meta' | 'link',
  [keyName, keyValue]: HeadAttribute,
  value: HeadAttribute | null
) {
  const existing = document.head.querySelector(
    `${tag}[${keyName}="${keyValue}"]`
  );
  if (!value) {
    existing?.remove();
    return;
  }
  const element =
    existing ?? document.head.appendChild(document.createElement(tag));
  element.setAttribute(keyName, keyValue);
  element.setAttribute(...value);
}

function setSchemas(serialized: string[]) {
  document.head
    .querySelectorAll('script[type="application/ld+json"]')
    .forEach((node) => node.remove());
  for (const json of serialized) {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = json;
    document.head.appendChild(script);
  }
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
  const title = name ? `${SITE_NAME}${TITLE_SEPARATOR}${name}` : SITE_NAME;
  const desc = description ?? DEFAULT_DESCRIPTION;
  const ogImage = image ?? DEFAULT_OG_IMAGE;
  const robots = noindex ? 'noindex, nofollow' : 'index, follow';
  const canonical =
    path !== undefined
      ? `${SITE_URL}${path === '/' ? '/' : path}${dynamicParams || ''}`
      : undefined;
  const schemas = (schema ? (Array.isArray(schema) ? schema : [schema]) : [])
    .map((entry) => JSON.stringify(entry).replace(/</g, '\\u003c'))
    .join('\n');

  useLayoutEffect(() => {
    document.title = title;
    const meta: [string, string, string | undefined][] = [
      ['name', 'description', desc],
      ['name', 'robots', robots],
      ['property', 'og:type', 'website'],
      ['property', 'og:site_name', SITE_NAME],
      ['property', 'og:title', title],
      ['property', 'og:description', desc],
      ['property', 'og:image', ogImage],
      ['property', 'og:url', canonical],
      ['name', 'twitter:card', 'summary_large_image'],
      ['name', 'twitter:title', title],
      ['name', 'twitter:description', desc],
      ['name', 'twitter:image', ogImage]
    ];
    for (const [keyName, keyValue, content] of meta)
      setHeadElement(
        'meta',
        [keyName, keyValue],
        content === undefined ? null : ['content', content]
      );
    setHeadElement(
      'link',
      ['rel', 'canonical'],
      canonical === undefined ? null : ['href', canonical]
    );
    setSchemas(schemas ? schemas.split('\n') : []);
  }, [title, desc, robots, ogImage, canonical, schemas]);

  return null;
};
