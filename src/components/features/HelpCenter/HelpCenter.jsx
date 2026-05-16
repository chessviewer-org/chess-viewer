import { memo, useMemo, useState } from 'react';
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

const SECTIONS = {
  FEATURES: 'features',
  ABOUT: 'about',
  SUPPORT: 'support',
  PRIVACY: 'privacy',
  TERMS: 'terms',
  FAQ: 'faq'
};
const TAB_CONFIG = [
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
const CONTENT = {
  [SECTIONS.FEATURES]: {
    title: 'Features Overview',
    sections: [
      {
        title: 'Interactive Board Editor',
        content: `Drag and drop pieces to create any chess position. Click and drag pieces from the piece palette to place them on the board, move existing pieces to new squares, or remove them effortlessly. The editor is optimized with strict React Hooks rules and heavy memoization for smooth performance.`
      },
      {
        title: 'Advanced FEN Parser',
        content: `Seamlessly paste any valid Forsyth-Edwards Notation (FEN) string to instantly load a position. The FEN input field features real-time validation, error feedback, and history state management ensuring your data remains secure and stable.`
      },
      {
        title: 'Ultra-High-Res Export Pipeline',
        content: `Export chess diagrams using a highly optimized HTML5 Canvas and SVG engine. Support for PNG, JPEG, and SVG formats with DPI-accurate print mode and fixed social media mode. Enjoy ultra-high-resolution scaling up to 32x quality.`
      },
      {
        title: 'Batch Position Management',
        content: `Add multiple positions to a batch list and navigate to the Advanced FEN Input page to orchestrate batch exports. Perfect for authors and coaches creating study materials or position databases.`
      },
      {
        title: 'Tailwind CSS Customization',
        content: `Style your board using our fully themeable CSS variables engine built on Tailwind CSS. Choose from various piece styles, customize dark and light squares natively, toggle coordinates, and switch between modern light and dark modes.`
      },
      {
        title: 'Account Security & Sync',
        content: `Protected by robust authentication powered by Supabase, including Two-Factor Authentication (MFA) capabilities to keep your profile secure while storing UI states safely in local storage.`
      }
    ]
  },
  [SECTIONS.ABOUT]: {
    title: 'About ChessVision',
    sections: [
      {
        title: 'Our Mission',
        content: `ChessVision is a Full-Stack SaaS chess diagram generator designed for chess players, coaches, authors, and enthusiasts. Our mission is to provide the most intuitive, high-performance tool for rendering canvas boards and exporting ultra-high-res images.`
      },
      {
        title: 'Technology Stack',
        content: `Built with React 19, Vite, and Tailwind CSS. The platform leverages heavy memoization and context-based state management to guarantee zero-warning ESLint production builds and blazing-fast client rendering.`
      },
      {
        title: 'Official Platform',
        content: `You can securely access the latest official version of ChessVision directly via our domain: chess-vision-site.vercel.app`
      },
      {
        title: 'Open Source',
        content: `ChessVision is developed as an open-source project following Conventional Commits. We welcome community contributions. View the official repository at: github.com/BilgeGates/chess-vision`
      }
    ]
  },
  [SECTIONS.SUPPORT]: {
    title: 'Support & Contact',
    sections: [
      {
        title: 'Official Support',
        content: `For any inquiries, technical assistance, or account help, please reach out to our official support team at: chessvision@protonmail.com. We typically respond within 24-48 hours.`
      },
      {
        title: 'Bug Reports',
        content: `If you encounter unexpected behavior, please report the bug on our official GitHub Issues page (github.com/BilgeGates/chess-vision). Include details such as your browser version and steps to reproduce the issue.`
      },
      {
        title: 'Feature Requests',
        content: `We are continuously improving ChessVision. Share your ideas and feature requests by emailing our support team or opening a discussion on our official repository.`
      }
    ]
  },
  [SECTIONS.FAQ]: {
    title: 'Frequently Asked Questions',
    sections: [
      {
        title: 'Is there an official domain?',
        content: `Yes, always ensure you are using the official platform at: chess-vision-site.vercel.app for the most secure and up-to-date experience.`
      },
      {
        title: 'Where is my data saved?',
        content: `Your history, FEN batches, recent colors, and theme settings are safely persisted in your browser's local storage (e.g., chess-theme, themeSettings, fen-history). Account authentication uses Supabase.`
      },
      {
        title: 'What browsers are supported?',
        content: `ChessVision is fully responsive and supports all modern browsers. Note that extreme export scaling (24x/32x) may occasionally exceed hardware-accelerated canvas limits on Safari.`
      },
      {
        title: 'Can I export diagrams in batch?',
        content: `Yes. Navigate to the Advanced FEN Input page to process, render, and export multiple FEN positions simultaneously.`
      }
    ]
  },
  [SECTIONS.PRIVACY]: {
    title: 'Privacy Policy',
    sections: [
      {
        title: 'Data Collection & Storage',
        content: `Authentication is handled securely via Supabase. Operational states such as your board preferences, FEN history, and color choices are saved locally in your browser's local storage using safe JSON parsing.`
      },
      {
        title: 'Security',
        content: `We employ strict Content Security Policy (CSP) guidelines, removal of inline scripts, and FEN length enforcements (MAX_FEN_LENGTH) to ensure a hardened and secure environment.`
      },
      {
        title: 'Cookies & Analytics',
        content: `ChessVision operates without intrusive third-party trackers or unnecessary analytics. Local storage is strictly utilized for core app functionality.`
      }
    ]
  },
  [SECTIONS.TERMS]: {
    title: 'Terms of Use',
    sections: [
      {
        title: 'Acceptable Use',
        content: `ChessVision is provided for rendering chess diagrams for educational, authoring, and personal use. By using our platform (chess-vision-site.vercel.app), you agree to these terms.`
      },
      {
        title: 'Content Ownership',
        content: `You retain full ownership of all chess diagrams, images, and FEN positions you create and export using ChessVision.`
      },
      {
        title: 'Disclaimer',
        content: `The platform is provided "as is". While we strive for absolute accuracy (like DPI-accurate print modes), we do not guarantee uninterrupted access or functionality on unsupported legacy devices.`
      }
    ]
  }
};
/**
 * @param {Object} props
 * @returns {JSX.Element}
 */
const HelpCenterDrawer = memo(function HelpCenterDrawer({ isOpen, onClose }) {
  const [activeSection, setActiveSection] = useState(SECTIONS.FEATURES);
  const [searchQuery, setSearchQuery] = useState('');
  const filteredContent = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const query = searchQuery.toLowerCase();
    const results = [];
    Object.entries(CONTENT).forEach(([sectionId, section]) => {
      section.sections.forEach((item) => {
        const titleMatch = item.title.toLowerCase().includes(query);
        const contentMatch = item.content.toLowerCase().includes(query);
        if (titleMatch || contentMatch) {
          results.push({
            sectionId,
            sectionTitle: section.title,
            ...item
          });
        }
      });
    });
    return results;
  }, [searchQuery]);

  const overlayTransition = {
    duration: 0.34,
    ease: [0.22, 1, 0.36, 1]
  };
  const drawerTransition = {
    duration: 0.42,
    ease: [0.22, 1, 0.36, 1]
  };

  const contentTransition = {
    duration: 0.38,
    ease: [0.22, 1, 0.36, 1]
  };

  const contentKey = searchQuery.trim()
    ? `search-${searchQuery}`
    : `section-${activeSection}`;

  const renderContent = () => {
    if (searchQuery.trim() && filteredContent) {
      return (
        <div className="space-y-4">
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-text-primary mb-2">
              Search Results
            </h3>
            <p className="text-sm text-text-secondary">
              Found {filteredContent.length} result
              {filteredContent.length !== 1 ? 's' : ''} for "{searchQuery}"
            </p>
          </div>

          {filteredContent.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-text-secondary">
                No results found. Try different keywords.
              </p>
            </div>
          ) : (
            filteredContent.map((item) => (
              <div
                key={`${item.sectionId}-${item.title}`}
                className="bg-surface rounded-lg p-5 border border-border"
              >
                <div className="text-xs text-accent font-medium mb-1">
                  {item.sectionTitle}
                </div>
                <h4 className="font-semibold text-text-primary mb-2">
                  {item.title}
                </h4>
                <p className="text-sm text-text-secondary leading-relaxed">
                  {item.content}
                </p>
              </div>
            ))
          )}
        </div>
      );
    }
    const content = CONTENT[activeSection];
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-2xl font-bold text-text-primary mb-3">
            {content.title}
          </h3>
        </div>

        <div className="space-y-4">
          {content.sections.map((section) => (
            <div
              key={section.title}
              className="bg-surface rounded-lg p-5 border border-border hover:border-accent/50 transition-colors"
            >
              <h4 className="font-semibold text-text-primary mb-3 text-lg">
                {section.title}
              </h4>
              <p className="text-sm text-text-secondary leading-relaxed">
                {section.content}
              </p>
            </div>
          ))}
        </div>
      </div>
    );
  };
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={overlayTransition}
            className="fixed inset-0 bg-bg/95 z-60"
            onClick={onClose}
            aria-hidden="true"
          />

          <motion.div
            initial={{ x: '104%', opacity: 0.94 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '104%', opacity: 0.94 }}
            transition={drawerTransition}
            className="fixed inset-y-0 right-0 z-70 w-full md:w-[50%] lg:w-[55%] xl:w-[45%] sm:min-w-[320px] max-w-[90vw] sm:max-w-[900px] bg-bg border-l border-border shadow-2xl flex flex-col"
          >
            <div className="px-6 py-4 border-b border-border bg-surface">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-display font-bold text-text-primary">
                  Help Center
                </h2>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-surface-hover transition-colors"
                  aria-label="Close help center"
                >
                  <X className="w-5 h-5 text-text-secondary" />
                </button>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search help articles..."
                  className="w-full pl-10 pr-4 py-2.5 bg-bg border border-border rounded-lg text-sm text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div className="border-b border-border bg-surface-elevated overflow-x-auto">
              <div className="flex gap-1 px-4 min-w-max">
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
                      className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all border-b-2 ${isActive ? 'text-accent border-accent' : 'text-text-secondary border-transparent hover:text-text-primary hover:bg-surface-hover'}`}
                      aria-label={tab.label}
                      title={tab.label}
                    >
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      <span className={isActive ? 'inline' : 'hidden'}>
                        {tab.label}
                      </span>
                    </button>
                  );
                })}
              </div>
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
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
});
HelpCenterDrawer.displayName = 'HelpCenterDrawer';
export default HelpCenterDrawer;
