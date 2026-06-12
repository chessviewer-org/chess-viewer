import { useState } from 'react';

import { AnimatePresence, motion } from 'framer-motion';
import {
  BookOpen,
  ChevronDown,
  FileText,
  HelpCircle,
  Info,
  Mail,
  Settings as SettingsIcon,
  Shield
} from 'lucide-react';

const SUPPORT_EMAIL = 'contact@chessvision.org';

/** A titled block of prose, used across the About sections. */
interface InfoBlock {
  title: string;
  content: string;
}

/** Top-level About sections, each rendered as a card group. */
const SECTIONS: Array<{
  id: string;
  label: string;
  title: string;
  icon: typeof Info;
  blocks: InfoBlock[];
}> = [
  {
    id: 'features',
    label: 'Features',
    title: 'Features Overview',
    icon: BookOpen,
    blocks: [
      {
        title: 'Interactive Board Editor',
        content:
          'Drag and drop pieces to create any chess position. Place pieces from the palette, move them between squares, or remove them effortlessly. The editor is heavily memoized for smooth, lag-free interaction.'
      },
      {
        title: 'FEN Input & Validation',
        content:
          'Paste any valid Forsyth-Edwards Notation (FEN) string to instantly load a position. The input features real-time validation, clear error feedback, and history so your work stays safe.'
      },
      {
        title: 'High-Resolution Export',
        content:
          'Export diagrams in ultra-high resolution up to 32x quality — suitable for print and professional publishing. Supports PNG, JPEG, and SVG with customizable DPI and physical dimensions.'
      }
    ]
  },
  {
    id: 'about',
    label: 'About',
    title: 'About ChessVision',
    icon: Info,
    blocks: [
      {
        title: 'Project Goals',
        content:
          'ChessVision is a free, open-source tool for chess authors, teachers, and enthusiasts to create high-quality chess diagrams for digital and print media. Built with React 19, Vite, and Tailwind CSS.'
      },
      {
        title: 'Local-First & Private',
        content:
          'Privacy comes first. Board rendering and image processing happen entirely in your browser using canvas and web workers. Your positions never leave your device, and optional cloud sync is end-to-end encrypted.'
      }
    ]
  },
  {
    id: 'support',
    label: 'Support',
    title: 'Support & Feedback',
    icon: HelpCircle,
    blocks: [
      {
        title: 'How to get help',
        content: `For any inquiries, technical assistance, or account help, reach out to our support team at ${SUPPORT_EMAIL}. We typically respond within 24-48 hours.`
      },
      {
        title: 'Reporting bugs',
        content:
          'Found an issue? Report it on our GitHub repository or via the feedback option in settings. Include your FEN string and browser version for faster troubleshooting.'
      }
    ]
  },
  {
    id: 'privacy',
    label: 'Privacy',
    title: 'Privacy Policy',
    icon: Shield,
    blocks: [
      {
        title: 'Data collection',
        content:
          'We do not collect personal data. State is managed locally via browser storage. If you enable cloud sync, your data is end-to-end encrypted before it is stored.'
      },
      {
        title: 'Cookies',
        content:
          'We use only the minimal functional storage required for theme and system settings. No tracking or third-party advertising cookies are used.'
      }
    ]
  },
  {
    id: 'terms',
    label: 'Terms of Use',
    title: 'Terms of Use',
    icon: SettingsIcon,
    blocks: [
      {
        title: 'Usage license',
        content:
          'ChessVision is provided for personal and professional use. Images generated with the tool can be used freely in books, articles, and websites, provided they are not used to misrepresent chess positions.'
      },
      {
        title: 'Liability',
        content:
          'ChessVision is provided "as is" without warranty of any kind. We are not liable for any data loss or issues resulting from use of the export features.'
      }
    ]
  }
];

const FAQ_ITEMS: Array<{ q: string; a: string }> = [
  {
    q: 'Why is my export taking so long?',
    a: 'High-resolution exports (16x-32x) require significant browser memory and CPU. If your browser freezes, try a lower quality preset or use a modern browser like Chrome or Edge.'
  },
  {
    q: 'Can I use my own piece sets?',
    a: 'ChessVision ships with several high-quality built-in piece sets. Custom piece-set support is on the roadmap.'
  },
  {
    q: 'Is my data private?',
    a: 'Yes. All board rendering and export happen locally in your browser. Optional cloud sync is end-to-end encrypted, and there is no tracking.'
  },
  {
    q: 'Can I use the diagrams commercially?',
    a: 'Yes. Generated diagrams can be used freely for any purpose, including commercial use.'
  }
];

/** Standalone About page: project overview, features, support, privacy, terms, and FAQ. */
function AboutPage() {
  return (
    <div className="w-full pt-16 sm:pt-20 lg:pt-24 3xl:pt-32 pb-8 sm:pb-12 px-[2%] sm:px-[3%] lg:px-[4%]">
      <div className="w-[95%] max-w-600 mx-auto space-y-6 lg:space-y-10 transition-all duration-500 ease-in-out">
        <header className="text-center mb-10 animate-fadeIn">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent text-sm font-semibold mb-5">
            <Info className="w-5 h-5" />
            About ChessVision
          </div>
          <h1 className="text-display font-display font-bold text-text-primary mb-4">
            About
          </h1>
          <p className="text-text-secondary text-fluid-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
            A free, open-source, privacy-first tool for creating high-quality
            chess diagrams.
          </p>
        </header>

        {SECTIONS.map((section) => {
          const Icon = section.icon;
          return (
            <section
              key={section.id}
              aria-labelledby={`about-${section.id}`}
              className="glass-card p-6 sm:p-8 rounded-2xl shadow-lg animate-fadeIn"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                  <Icon className="w-6 h-6 text-text-secondary" />
                </div>
                <h2
                  id={`about-${section.id}`}
                  className="text-xl font-display font-bold text-text-primary"
                >
                  {section.title}
                </h2>
              </div>

              <div className="space-y-4">
                {section.blocks.map((block) => (
                  <div
                    key={block.title}
                    className="p-5 bg-surface-elevated border border-border/50 rounded-2xl"
                  >
                    <h3 className="text-base font-bold text-text-primary mb-2">
                      {block.title}
                    </h3>
                    <p className="text-text-secondary leading-relaxed text-sm">
                      {block.content}
                    </p>
                  </div>
                ))}
              </div>

              {section.id === 'support' && (
                <a
                  href={`mailto:${SUPPORT_EMAIL}`}
                  className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-accent hover:underline"
                >
                  <Mail className="w-4 h-4" />
                  {SUPPORT_EMAIL}
                </a>
              )}
            </section>
          );
        })}

        <section
          aria-labelledby="about-faq"
          className="glass-card p-6 sm:p-8 rounded-2xl shadow-lg animate-fadeIn"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
              <FileText className="w-6 h-6 text-text-secondary" />
            </div>
            <h2
              id="about-faq"
              className="text-xl font-display font-bold text-text-primary"
            >
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-3">
            {FAQ_ITEMS.map((item) => (
              <FAQItem key={item.q} q={item.q} a={item.a} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

/** Props for a collapsible FAQ accordion item. */
interface FAQItemProps {
  q: string;
  a: string;
}

function FAQItem({ q, a }: FAQItemProps) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border border-border hover:border-border rounded-xl transition-colors duration-200">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-5 py-4 flex items-center justify-between text-left transition-colors duration-200"
        aria-expanded={isOpen}
      >
        <span className="font-semibold text-text-primary pr-4">{q}</span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-5 h-5 text-text-muted shrink-0" />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-4 text-text-secondary leading-relaxed text-sm">
              {a}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default AboutPage;
