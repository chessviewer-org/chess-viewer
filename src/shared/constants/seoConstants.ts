export const SITE_URL = 'https://chessvision.org';

export const SITE_NAME = 'ChessViewer';

export const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.png`;

export const TITLE_SEPARATOR = ' • ';

export const DEFAULT_DESCRIPTION =
  'Free chess diagram generator — convert FEN to PNG, JPEG, or SVG in seconds. Professional-quality chess diagrams for books, articles, and social media. No sign-up required.';

// Types
export interface SeoMeta {
  name?: string;
  description?: string;
  path?: string;
  image?: string;
  noindex?: boolean;
  schema?: Record<string, unknown> | Record<string, unknown>[];
}

export const ORGANIZATION_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  '@id': `${SITE_URL}/#organization`,
  name: 'ChessViewer',
  alternateName: 'chessvision.org',
  url: `${SITE_URL}/`,
  logo: {
    '@type': 'ImageObject',
    url: `${SITE_URL}/logo512.png`,
    width: 512,
    height: 512
  },
  sameAs: [
    'https://github.com/chessviewer-org/chess-viewer',
    'https://chessvision.org'
  ]
};

export const WEBSITE_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': `${SITE_URL}/#website`,
  url: `${SITE_URL}/`,
  name: 'ChessViewer • Chess Diagram Generator',
  description: DEFAULT_DESCRIPTION,
  publisher: { '@id': `${SITE_URL}/#organization` },
  inLanguage: 'en',
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: `${SITE_URL}/?fen={search_term_string}`
    },
    'query-input': 'required name=search_term_string'
  }
};

export const SOFTWARE_APP_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  '@id': `${SITE_URL}/#app`,
  name: 'ChessViewer',
  alternateName: [
    'Chess Diagram Generator',
    'FEN to Image Converter',
    'Chess Diagram Maker'
  ],
  url: `${SITE_URL}/`,
  applicationCategory: 'MultimediaApplication',
  applicationSubCategory: 'Chess Tool',
  operatingSystem: 'Web, Chrome, Firefox, Safari, Edge',
  browserRequirements: 'Requires a modern web browser with JavaScript enabled',
  description:
    'Professional chess diagram generator — convert FEN notation to high-resolution PNG, JPEG, or SVG images. Interactive board editor, batch export, and print-ready output. Free, open-source, no sign-up required.',
  featureList: [
    'FEN to PNG converter',
    'FEN to SVG converter',
    'Chess diagram generator',
    'Interactive board editor',
    'Batch FEN export',
    'Print-ready DPI output',
    'Custom board colors and piece styles',
    'Privacy-first, no tracking'
  ],
  screenshot: `${SITE_URL}/og-image.png`,
  isAccessibleForFree: true,
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
    availability: 'https://schema.org/InStock'
  },
  publisher: { '@id': `${SITE_URL}/#organization` }
};

export const HOME_FAQ_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'How do I convert FEN to PNG?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Paste your FEN string into ChessViewer, customize the board style and size, then click Export to download a high-resolution PNG. No sign-up required — completely free at chessvision.org.'
      }
    },
    {
      '@type': 'Question',
      name: 'What is the best free chess diagram generator?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'ChessViewer (chessvision.org) is a free, open-source chess diagram generator that exports print-ready PNG, JPEG, and SVG diagrams from FEN notation. It supports custom board colors, piece styles, coordinate labels, and batch export — with no tracking or sign-up required.'
      }
    },
    {
      '@type': 'Question',
      name: 'How do I make a chess diagram from a FEN string?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Enter your FEN string in the input field on ChessViewer. The board will render instantly. You can then adjust colors, piece style, board size, and coordinates before exporting as PNG, JPEG, or SVG.'
      }
    },
    {
      '@type': 'Question',
      name: 'Can I export chess diagrams in SVG format?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. ChessViewer exports chess diagrams as scalable SVG vectors — perfect for web use, print at any resolution, and embedding in documents. PNG and JPEG export with custom DPI are also supported.'
      }
    },
    {
      '@type': 'Question',
      name: 'Is ChessViewer free to use?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes, ChessViewer is forever free and open-source. All features — including high-resolution export, batch processing, and cloud sync — are free with no paywalls. Visit chessvision.org to get started.'
      }
    }
  ]
};

export const EXPORT_HOWTO_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'HowTo',
  '@id': `${SITE_URL}/export#howto`,
  name: 'How to Export a Chess Diagram',
  description:
    'Convert a FEN position to a high-resolution PNG, JPEG, or SVG chess diagram using ChessViewer.',
  step: [
    {
      '@type': 'HowToStep',
      name: 'Enter FEN',
      text: 'Paste your FEN string into the board editor on chessvision.org.'
    },
    {
      '@type': 'HowToStep',
      name: 'Customize',
      text: 'Choose your board theme, piece set, coordinates, and physical board size.'
    },
    {
      '@type': 'HowToStep',
      name: 'Select format',
      text: 'Pick PNG, JPEG, or SVG and set the quality preset (300–1200 DPI).'
    },
    {
      '@type': 'HowToStep',
      name: 'Download',
      text: 'Click Export to download your print-ready chess diagram instantly — no watermarks, no sign-up.'
    }
  ]
};

export const EXPORT_BREADCRUMB_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  '@id': `${SITE_URL}/export#breadcrumb`,
  itemListElement: [
    {
      '@type': 'ListItem',
      position: 1,
      name: 'ChessViewer',
      item: `${SITE_URL}/`
    },
    {
      '@type': 'ListItem',
      position: 2,
      name: 'Export',
      item: `${SITE_URL}/export`
    }
  ]
};

export const ADVANCED_FEN_BREADCRUMB_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  '@id': `${SITE_URL}/advanced-fen#breadcrumb`,
  itemListElement: [
    {
      '@type': 'ListItem',
      position: 1,
      name: 'ChessViewer',
      item: `${SITE_URL}/`
    },
    {
      '@type': 'ListItem',
      position: 2,
      name: 'Batch FEN Export',
      item: `${SITE_URL}/advanced-fen`
    }
  ]
};

const ROUTE_SEO: Record<string, SeoMeta> = {
  '/': {
    name: 'Free Chess Diagram Generator',
    path: '/',
    description: DEFAULT_DESCRIPTION
  },
  '/advanced-fen': {
    name: 'Batch Export',
    path: '/advanced-fen',
    description:
      'Batch-convert multiple FEN positions to chess diagrams at once. Export high-resolution PNG, JPEG, and SVG files bundled as a ZIP. The fastest way to generate dozens of chess diagrams — free.'
  },
  '/export': {
    name: 'Export',
    path: '/export',
    description:
      'Export your chess diagram as a print-ready PNG, JPEG, or SVG. Choose DPI, board size, transparent background, and download instantly — no watermarks, completely free.'
  },
  '/about': {
    name: 'About',
    path: '/about',
    description:
      'ChessViewer is a free, open-source chess diagram generator at chessvision.org. No tracking, no paywalls — professional FEN-to-image export for players, coaches, and authors.'
  },
  '/fen-history': {
    name: 'FEN History',
    path: '/fen-history',
    description:
      'Browse and reuse your saved FEN positions. Your chess diagram history is stored privately on your device with optional cloud sync — search, filter, and re-export any position.'
  },
  '/settings': {
    name: 'Settings',
    path: '/settings',
    description: 'Configure your ChessViewer preferences, theme, and account.',
    noindex: true
  },
  '/auth/sign-in': {
    name: 'Sign In',
    path: '/auth/sign-in',
    description:
      'Sign in to your ChessViewer account to sync boards and settings across all your devices.',
    noindex: true
  },
  '/auth/sign-up': {
    name: 'Create Account',
    path: '/auth/sign-up',
    description:
      'Create a free ChessViewer account to save and sync your chess diagrams across devices.',
    noindex: true
  },
  '/auth/forgot-password': {
    name: 'Reset Password',
    path: '/auth/forgot-password',
    description: 'Reset your ChessViewer account password.',
    noindex: true
  },
  '/auth/mfa': {
    name: 'Two-Factor Auth',
    path: '/auth/mfa',
    description:
      'Complete two-factor authentication to access your ChessViewer account.',
    noindex: true
  }
};

// Service
export const getRouteSeo = (path: string): SeoMeta =>
  ROUTE_SEO[path] ?? { path, description: DEFAULT_DESCRIPTION };
