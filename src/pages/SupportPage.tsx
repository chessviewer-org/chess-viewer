import { useState } from 'react';

import { AnimatePresence, motion } from 'framer-motion';
import {
  BookOpen,
  ChevronDown,
  ExternalLink,
  HelpCircle,
  MessageSquare
} from 'lucide-react';

/** Help and FAQ page with links to GitHub issues and documentation. */
function SupportPage() {
  return (
    <div className="w-full pt-16 sm:pt-20 lg:pt-24 3xl:pt-32 pb-8 sm:pb-12 px-[2%] sm:px-[3%] lg:px-[4%]">
      <div className="w-[95%] max-w-600 mx-auto transition-all duration-500 ease-in-out">
        <div className="text-center mb-10 animate-fadeIn">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-info/10 text-info text-sm font-semibold mb-5">
            <HelpCircle className="w-5 h-5" />
            Help Center
          </div>
          <h1 className="text-4xl sm:text-5xl font-display font-bold text-text-primary mb-4">
            Support & Help
          </h1>
          <p className="text-text-secondary text-lg max-w-2xl mx-auto">
            Get help and find answers
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10 animate-fadeIn">
          <SupportCard
            icon={<HelpCircle className="w-6 h-6" />}
            title="GitHub Issues"
            desc="Report bugs or features"
            link="https://github.com/BilgeGates/chess-vision/issues"
            linkText="Open Issue"
          />
          <SupportCard
            icon={<MessageSquare className="w-6 h-6" />}
            title="Discussions"
            desc="Ask questions"
            link="https://github.com/BilgeGates/chess-vision/discussions"
            linkText="Join Discussion"
            primary
          />
          <SupportCard
            icon={<BookOpen className="w-6 h-6" />}
            title="Documentation"
            desc="Read guides"
            link="https://github.com/BilgeGates/chess-vision/tree/master/docs"
            linkText="View Docs"
          />
        </div>

        <div className="glass-card p-6 sm:p-8 rounded-2xl shadow-lg animate-fadeIn">
          <h2 className="text-xl font-display font-bold text-text-primary mb-6">
            Frequently Asked Questions
          </h2>
          <div className="space-y-3">
            <FAQItem
              q="What export formats are supported?"
              a="PNG (transparent background) and JPEG (white background). You can also copy to clipboard."
            />
            <FAQItem
              q="What is the maximum export quality?"
              a="Up to 32x quality (12,800×12,800 pixels). Higher settings produce larger, detailed images for print."
            />
            <FAQItem
              q="How do I enter a chess position?"
              a="Use standard FEN notation. The starting position is entered by default."
            />
            <FAQItem
              q="Is my data private?"
              a="Yes! All processing happens locally in your browser. No data is sent to any server."
            />
            <FAQItem
              q="Can I use the diagrams commercially?"
              a="Yes, generated diagrams can be used freely for any purpose including commercial use."
            />
            <FAQItem
              q="How do I customize board colors?"
              a="Use the theme selector in the control panel to choose presets or create custom colors."
            />
          </div>
        </div>
      </div>
    </div>
  );
}
/** Props for an external support channel card. */
interface SupportCardProps {
  icon: React.ReactNode;
  title: string;
  desc: string;
  link: string;
  linkText: string;
  primary?: boolean;
}

function SupportCard({
  icon,
  title,
  desc,
  link,
  linkText,
  primary = false
}: SupportCardProps) {
  return (
    <div
      className={`glass-card p-5 rounded-xl shadow-md transition-shadow duration-200 hover:shadow-lg ${primary ? 'border-2 border-accent' : 'border border-border'}`}
    >
      <div
        className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${primary ? 'bg-accent/10 text-accent' : 'bg-surface-elevated text-text-primary'}`}
      >
        {icon}
      </div>
      <h3 className="text-base font-display font-bold text-text-primary mb-2">
        {title}
      </h3>
      <p className="text-text-muted text-sm mb-4 leading-relaxed">{desc}</p>
      <a
        href={link}
        target="_blank"
        rel="noopener noreferrer"
        className={`inline-flex items-center gap-2 text-sm font-semibold transition-colors duration-200 ${primary ? 'text-accent' : 'text-text-secondary hover:text-accent'}`}
      >
        {linkText}
        <ExternalLink className="w-4 h-4" />
      </a>
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
    <div className="border border-border hover:border-accent/50 rounded-xl transition-colors duration-200">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-5 py-4 flex items-center justify-between text-left transition-colors duration-200"
        aria-expanded={isOpen}
      >
        <span className="font-semibold text-text-primary pr-4">{q}</span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-5 h-5 text-accent shrink-0" />
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
export default SupportPage;
