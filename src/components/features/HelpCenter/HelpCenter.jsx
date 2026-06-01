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
        content: `Drag and drop pieces to create any chess position. Click and drag pieces from the piece palette on the left to place them on the board. Move pieces already on the board by dragging them to a new square. Remove pieces by dragging them off the board or to the trash area.`
      },
      {
        title: 'FEN Notation Support',
        content: `Full support for Forsyth-Edwards Notation (FEN). Paste any valid FEN string to instantly load that position on the board. Copy the current position as FEN to share or save. The FEN input field provides real-time validation and error feedback.`
      },
      {
        title: 'Export Options',
        content: `Export your chess diagrams in multiple formats: PNG for high-quality images with transparency support, JPEG for smaller file sizes, and SVG for scalable vector graphics (coming soon). Configure export resolution, board size, and quality settings.`
      },
      {
        title: 'Batch Export',
        content: `Export multiple positions at once. Add positions to your batch list using the Add button, then navigate to the Advanced FEN page to export all positions simultaneously in your chosen format. Perfect for creating study materials or position databases.`
      },
      {
        title: 'Favorites System',
        content: `Save frequently used positions as favorites. Click the heart icon to add the current position to your favorites. Access your saved positions from the FEN History page. Organize and manage your position library.`
      },
      {
        title: 'Customization Options',
        content: `Customize every aspect of your chess diagrams: Choose from multiple piece styles (CBurnett, Merida, Alpha, etc.), customize square colors with the color picker, toggle coordinate display, adjust board orientation, and configure export quality settings.`
      },
      {
        title: 'Theme System',
        content: `Switch between light and dark themes, or create your own custom theme. Adjust colors, contrast, and visual elements to match your preferences or brand requirements. Themes are automatically saved to your browser.`
      },
      {
        title: 'Board Controls',
        content: `Flip the board to view from black's perspective. Reset to the starting position with one click. Copy positions to clipboard as images or FEN notation. All controls are keyboard accessible.`
      },
      {
        title: 'History Tracking',
        content: `Automatic history of all positions you create. Browse through previously created diagrams. Filter history by date or FEN notation. Export your entire history for backup purposes.`
      },
      {
        title: 'Responsive Design',
        content: `Fully responsive interface works on desktop, tablet, and mobile devices. Touch-friendly controls for mobile users. Optimized performance across all screen sizes.`
      }
    ]
  },
  [SECTIONS.ABOUT]: {
    title: 'About ChessVision',
    sections: [
      {
        title: 'Our Mission',
        content: `ChessVision is a professional tool designed for chess players, coaches, authors, and enthusiasts who need to create high-quality chess diagrams quickly and easily. Our mission is to provide the most intuitive and powerful chess diagram creation tool available, completely free and open-source.`
      },
      {
        title: 'Technology',
        content: `Built with modern web technologies including React, Vite, and Tailwind CSS. Uses HTML5 Canvas for high-quality rendering and export. Optimized for performance with efficient state management and lazy loading. Progressive Web App (PWA) support for offline functionality.`
      },
      {
        title: 'Open Source',
        content: `This project is open-source and available on GitHub. We welcome contributions, bug reports, and feature requests from the community. Released under a non-commercial open-source license to ensure it remains free for everyone.`
      },
      {
        title: 'Version Information',
        content: `Current Version: v2.0.0. Last Updated: February 2026. Regular updates with new features, improvements, and bug fixes. View the full changelog in our documentation.`
      }
    ]
  },
  [SECTIONS.SUPPORT]: {
    title: 'Support & Contact',
    sections: [
      {
        title: 'Getting Help',
        content: `If you encounter any issues or have questions about using ChessVision, we're here to help. Check the FAQ section first for quick answers to common questions.`
      },
      {
        title: 'Contact Information',
        content: `Email: contact@chessvision.org - For support requests, bug reports, and feature suggestions. We typically respond within 24-48 hours.`
      },
      {
        title: 'Bug Reports',
        content: `Found a bug? Please report it on our GitHub Issues page or email us with details including: what you were trying to do, what happened instead, your browser and operating system, and any error messages you received.`
      },
      {
        title: 'Feature Requests',
        content: `Have an idea for a new feature? We'd love to hear from you! Submit feature requests through GitHub or email us. Please describe the feature, explain why it would be useful, and provide any relevant examples.`
      },
      {
        title: 'GitHub Repository',
        content: `View source code, contribute, and stay updated: github.com/BilgeGates/chess-vision - Star the repository to show your support and watch for updates.`
      }
    ]
  },
  [SECTIONS.FAQ]: {
    title: 'Frequently Asked Questions',
    sections: [
      {
        title: 'What browsers are supported?',
        content: `ChessVision works on all modern browsers including Google Chrome, Mozilla Firefox, Safari, Microsoft Edge, and Opera. We recommend using the latest version of your browser for the best experience.`
      },
      {
        title: 'Is my data saved?',
        content: `Yes, all your positions, favorites, and settings are automatically saved in your browser's local storage. Your data stays on your device and is never sent to any server. Clearing your browser data will remove saved positions.`
      },
      {
        title: 'Can I use this offline?',
        content: `Yes! ChessVision is a Progressive Web App (PWA). Once loaded, basic functionality works offline. Install it to your device for a native app-like experience.`
      },
      {
        title: 'What is FEN notation?',
        content: `FEN (Forsyth-Edwards Notation) is a standard notation for describing chess positions. It's a compact text format that represents the entire board state. Learn more in our FEN documentation.`
      },
      {
        title: 'How do I export high-resolution images?',
        content: `Adjust the export quality setting in the Control Panel. Higher quality values (up to 16x) produce larger, sharper images. For print quality, we recommend using 8x or higher.`
      },
      {
        title: 'Can I use exported images commercially?',
        content: `Yes, images you create and export are your own content. You can use them for any purpose including commercial projects. The piece artwork is licensed appropriately for such use.`
      },
      {
        title: 'How do I contribute to the project?',
        content: `We welcome contributions! Check our GitHub repository for contribution guidelines. You can submit bug reports, feature requests, code contributions, documentation improvements, or translations.`
      },
      {
        title: 'Is there a mobile app?',
        content: `The web app is fully responsive and works great on mobile devices. You can also install it as a PWA on your phone for an app-like experience. No separate native app is needed.`
      }
    ]
  },
  [SECTIONS.PRIVACY]: {
    title: 'Privacy Policy',
    sections: [
      {
        title: 'Data Collection',
        content: `ChessVision does not collect, store, or transmit any personal data to external servers. All data processing happens locally in your browser.`
      },
      {
        title: 'Local Storage',
        content: `We use your browser's local storage to save your positions, favorites, preferences, and settings. This data never leaves your device and can be cleared at any time through your browser settings.`
      },
      {
        title: 'Cookies',
        content: `This application does not use cookies. We rely solely on local storage for saving your preferences and data.`
      },
      {
        title: 'Analytics',
        content: `We do not use any analytics or tracking services. Your usage of this application is completely private.`
      },
      {
        title: 'Third-Party Services',
        content: `This application does not integrate with any third-party services that could access or collect your data.`
      }
    ]
  },
  [SECTIONS.TERMS]: {
    title: 'Terms of Use',
    sections: [
      {
        title: 'License',
        content: `ChessVision is released under a non-commercial open-source license. You are free to use, modify, and distribute the software for non-commercial purposes.`
      },
      {
        title: 'Acceptable Use',
        content: `This tool is provided for creating chess diagrams and educational purposes. You may use it to create diagrams for books, articles, websites, teaching materials, and personal projects.`
      },
      {
        title: 'Content Ownership',
        content: `You retain full ownership of all chess diagrams and positions you create using this tool. We claim no rights to your content.`
      },
      {
        title: 'Warranty Disclaimer',
        content: `This software is provided "as is" without warranty of any kind, express or implied. We make no guarantees about its functionality, reliability, or suitability for any particular purpose.`
      },
      {
        title: 'Liability Limitation',
        content: `In no event shall the developers be liable for any damages arising from the use or inability to use this software.`
      },
      {
        title: 'Modifications',
        content: `We reserve the right to modify these terms at any time. Continued use of the application constitutes acceptance of updated terms.`
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
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
            onClick={onClose}
            aria-hidden="true"
          />

          <motion.div
            initial={{ x: '104%', opacity: 0.94 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '104%', opacity: 0.94 }}
            transition={drawerTransition}
            className="fixed inset-y-0 right-0 z-[70] w-full md:w-[50%] lg:w-[55%] xl:w-[45%] sm:min-w-[320px] max-w-[90vw] sm:max-w-[900px] bg-bg border-l border-border shadow-2xl flex flex-col"
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
