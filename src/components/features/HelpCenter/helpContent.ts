import { ElementType } from 'react';

import {
  BookOpen,
  FileText,
  HelpCircle,
  Info,
  Settings as SettingsIcon,
  Shield
} from 'lucide-react';

export const SECTIONS = {
  FEATURES: 'features',
  ABOUT: 'about',
  SUPPORT: 'support',
  PRIVACY: 'privacy',
  TERMS: 'terms',
  FAQ: 'faq'
} as const;

export type SectionId = (typeof SECTIONS)[keyof typeof SECTIONS];

export const TAB_CONFIG: Array<{ id: SectionId; label: string; icon: ElementType }> = [
  { id: SECTIONS.FEATURES, label: 'Features', icon: BookOpen },
  { id: SECTIONS.ABOUT, label: 'About', icon: Info },
  { id: SECTIONS.SUPPORT, label: 'Support', icon: HelpCircle },
  { id: SECTIONS.FAQ, label: 'FAQ', icon: FileText },
  { id: SECTIONS.PRIVACY, label: 'Privacy', icon: Shield },
  { id: SECTIONS.TERMS, label: 'Terms of Use', icon: SettingsIcon }
];

export const CONTENT: Record<
  SectionId,
  { title: string; sections: Array<{ title: string; content: string }> }
> = {
  [SECTIONS.FEATURES]: {
    title: 'Features Overview',
    sections: [
      {
        title: 'Interactive Board Editor',
        content: `Drag and drop pieces to create any chess position. Click and drag pieces from the piece palette to place them on the board, move existing pieces to new squares, or remove them effortlessly. The editor is optimized with strict React Hooks rules and heavy memoization for smooth performance.`
      },
      {
        title: 'FEN Input & Validation',
        content: `Seamlessly paste any valid Forsyth-Edwards Notation (FEN) string to instantly load a position. The FEN input field features real-time validation, error feedback, and history state management ensuring your data remains secure and stable.`
      },
      {
        title: 'High-Resolution Export',
        content: `Export your chess diagrams in ultra-high resolution up to 32x quality (suitable for print and professional publishing). Supports PNG, JPEG, and SVG formats with customizable DPI settings and physical dimensions in centimeters.`
      }
    ]
  },
  [SECTIONS.ABOUT]: {
    title: 'About ChessVision',
    sections: [
      {
        title: 'Project Goals',
        content: `ChessVision is a dedicated tool for chess authors, teachers, and enthusiasts to create high-quality chess diagrams for digital and print media. Built with modern web technologies including React 19, Vite, and Tailwind CSS.`
      },
      {
        title: 'Local-First Architecture',
        content: `We prioritize your privacy and performance. All board rendering and image processing happen directly in your browser using canvas and web worker technology. No chess data is ever sent to our servers.`
      }
    ]
  },
  [SECTIONS.SUPPORT]: {
    title: 'Support & Feedback',
    sections: [
      {
        title: 'How to get help',
        content: `For any inquiries, technical assistance, or account help, please reach out to our official support team at: chessvision@protonmail.com. We typically respond within 24-48 hours.`
      },
      {
        title: 'Reporting Bugs',
        content: `Found an issue? You can report bugs directly on our GitHub repository or via the feedback form in the settings menu. Please include your FEN string and browser version for faster troubleshooting.`
      }
    ]
  },
  [SECTIONS.PRIVACY]: {
    title: 'Privacy Policy',
    sections: [
      {
        title: 'Data Collection',
        content: `We do not collect any personal data. All state management is handled locally via browser localStorage. If you use cloud sync features, data is stored securely in our Supabase instance.`
      },
      {
        title: 'Cookies',
        content: `We use minimal functional cookies required for system performance and theme settings. No tracking or third-party advertising cookies are used.`
      }
    ]
  },
  [SECTIONS.TERMS]: {
    title: 'Terms of Use',
    sections: [
      {
        title: 'Usage License',
        content: `ChessVision is provided for personal and professional use. Images generated using our tool can be used freely in books, articles, and websites, provided they are not used to misrepresent chess positions.`
      },
      {
        title: 'Liability',
        content: `ChessVision is provided "as is" without warranty of any kind. We are not liable for any data loss or issues resulting from the use of our image export features.`
      }
    ]
  },
  [SECTIONS.FAQ]: {
    title: 'Frequently Asked Questions',
    sections: [
      {
        title: 'Why is my export taking so long?',
        content: `High-resolution exports (16x-32x) require significant browser memory and CPU power. If your browser freezes, try a lower quality preset or use a modern browser like Chrome or Edge.`
      },
      {
        title: 'Can I use my own piece sets?',
        content: `Currently, we support 6 built-in high-quality piece sets. Custom piece set support is on our development roadmap for late 2026.`
      }
    ]
  }
};

export interface SearchResult {
  sectionId: SectionId;
  title: string;
  content: string;
}

export function searchHelp(query: string): SearchResult[] {
  const q = query.toLowerCase();
  const results: SearchResult[] = [];
  (Object.keys(CONTENT) as SectionId[]).forEach((sectionId) => {
    const section = CONTENT[sectionId];
    section.sections.forEach((s) => {
      if (
        s.title.toLowerCase().includes(q) ||
        s.content.toLowerCase().includes(q)
      ) {
        results.push({ sectionId, title: s.title, content: s.content });
      }
    });
  });
  return results;
}
