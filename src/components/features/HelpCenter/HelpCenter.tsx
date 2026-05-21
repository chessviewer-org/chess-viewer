import { ElementType, memo, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

import {
  BookOpen,
  FileText,
  HelpCircle,
  Info,
  Search,
  Settings as SettingsIcon,
  Shield,
  X
} from 'lucide-react';

export interface HelpCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SearchResult {
  sectionId: SectionId;
  title: string;
  content: string;
}

const SECTIONS = {
  FEATURES: 'features',
  ABOUT: 'about',
  SUPPORT: 'support',
  PRIVACY: 'privacy',
  TERMS: 'terms',
  FAQ: 'faq'
} as const;

type SectionId = typeof SECTIONS[keyof typeof SECTIONS];

const TAB_CONFIG: Array<{ id: SectionId; label: string; icon: ElementType }> = [
  {
    id: SECTIONS.FEATURES,
    label: 'Features',
    icon: BookOpen
  },
  {
    id: SECTIONS.ABOUT,
    label: 'About',
    icon: Info
  },
  {
    id: SECTIONS.SUPPORT,
    label: 'Support',
    icon: HelpCircle
  },
  {
    id: SECTIONS.FAQ,
    label: 'FAQ',
    icon: FileText
  },
  {
    id: SECTIONS.PRIVACY,
    label: 'Privacy',
    icon: Shield
  },
  {
    id: SECTIONS.TERMS,
    label: 'Terms of Use',
    icon: SettingsIcon
  }
];

const CONTENT: Record<SectionId, { title: string; sections: Array<{ title: string; content: string }> }> = {
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

const HelpCenterDrawer = memo(function HelpCenterDrawer({
  isOpen,
  onClose
}: HelpCenterProps) {
  const [activeSection, setActiveSection] = useState<SectionId>(SECTIONS.FEATURES);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredContent = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const query = searchQuery.toLowerCase();
    const results: SearchResult[] = [];

    (Object.keys(CONTENT) as SectionId[]).forEach((sectionId) => {
      const section = CONTENT[sectionId];
      section.sections.forEach((s) => {
        if (
          s.title.toLowerCase().includes(query) ||
          s.content.toLowerCase().includes(query)
        ) {
          results.push({
            sectionId,
            title: s.title,
            content: s.content
          });
        }
      });
    });
    return results;
  }, [searchQuery]);

  const renderContent = () => {
    if (filteredContent) {
      return (
        <div className="space-y-6">
          <h3 className="text-sm font-bold uppercase tracking-wider text-text-muted px-1">
            Search Results for "{searchQuery}"
          </h3>
          {filteredContent.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-text-secondary">No results found.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredContent.map((result, idx) => (
                <div
                  key={idx}
                  className="p-4 bg-surface-elevated border border-border rounded-xl cursor-pointer hover:border-accent/50 transition-colors"
                  onClick={() => {
                    setActiveSection(result.sectionId);
                    setSearchQuery('');
                  }}
                >
                  <h4 className="font-bold text-text-primary mb-1">
                    {result.title}
                  </h4>
                  <p className="text-sm text-text-secondary line-clamp-2">
                    {result.content}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    const content = CONTENT[activeSection];
    if (!content) return null;

    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-2xl font-bold text-text-primary mb-3">
            {content.title}
          </h3>
        </div>

        <div className="space-y-4">
          {content.sections.map((section, idx) => (
            <div
              key={idx}
              className="p-5 bg-surface-elevated border border-border/50 rounded-2xl"
            >
              <h4 className="text-lg font-bold text-text-primary mb-2">
                {section.title}
              </h4>
              <p className="text-text-secondary leading-relaxed">
                {section.content}
              </p>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const contentKey = searchQuery ? 'search' : activeSection;
  const contentTransition = { type: 'spring', duration: 0.4, bounce: 0 } as const;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] bg-bg/95 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-full max-w-xl bg-surface border-l border-border z-[90] shadow-2xl flex flex-col"
          >
            <div className="p-6 border-b border-border">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
                  <HelpCircle className="w-6 h-6 text-accent" />
                  Help Center
                </h2>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-surface-hover rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input
                  type="text"
                  placeholder="Search for features, terms, etc..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-surface-hover border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all"
                />
              </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
              <div className="w-16 sm:w-20 border-r border-border bg-surface-elevated/30 flex flex-col py-4 gap-2 overflow-y-auto shrink-0 no-scrollbar">
                {TAB_CONFIG.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeSection === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setActiveSection(tab.id);
                        setSearchQuery('');
                      }}
                      className={`
                        w-full flex flex-col items-center py-3 px-1 gap-1 transition-all group relative
                        ${isActive ? 'text-accent' : 'text-text-muted hover:text-text-primary'}
                      `}
                    >
                      <Icon
                        className={`w-5 h-5 sm:w-6 sm:h-6 transition-transform group-hover:scale-110 ${isActive ? 'scale-110' : ''}`}
                      />
                      <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-tight text-center px-1">
                        {tab.label}
                      </span>
                      {isActive && (
                        <motion.div
                          layoutId="active-tab"
                          className="absolute left-0 top-0 bottom-0 w-0.5 bg-accent"
                        />
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={contentKey}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={contentTransition}
                  >
                    {renderContent()}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
});

HelpCenterDrawer.displayName = 'HelpCenterDrawer';
export default HelpCenterDrawer;
