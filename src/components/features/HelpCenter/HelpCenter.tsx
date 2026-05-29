import { memo, useMemo, useState } from 'react';

import { AnimatePresence, motion } from 'framer-motion';
import { HelpCircle, Search, X } from 'lucide-react';

import {
  CONTENT,
  searchHelp,
  type SectionId,
  SECTIONS,
  TAB_CONFIG} from './helpContent';

/** Props for the `HelpCenterDrawer` overlay. */
export interface HelpCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

const HelpCenterDrawer = memo(function HelpCenterDrawer({
  isOpen,
  onClose
}: HelpCenterProps) {
  const [activeSection, setActiveSection] = useState<SectionId>(SECTIONS.FEATURES);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredContent = useMemo(
    () => (searchQuery.trim() ? searchHelp(searchQuery) : null),
    [searchQuery]
  );

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
              {filteredContent.map((result) => (
                <div
                  key={result.sectionId + '-' + result.title}
                  className="p-4 bg-surface-elevated border border-border rounded-xl cursor-pointer hover:border-accent/50 transition-colors"
                  onClick={() => {
                    setActiveSection(result.sectionId);
                    setSearchQuery('');
                  }}
                >
                  <h4 className="font-bold text-text-primary mb-1">{result.title}</h4>
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
          <h3 className="text-2xl font-bold text-text-primary mb-3">{content.title}</h3>
        </div>

        <div className="space-y-4">
          {content.sections.map((section) => (
            <div
              key={section.title}
              className="p-5 bg-surface-elevated border border-border/50 rounded-2xl"
            >
              <h4 className="text-lg font-bold text-text-primary mb-2">
                {section.title}
              </h4>
              <p className="text-text-secondary leading-relaxed">{section.content}</p>
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
            className="fixed inset-0 z-80 bg-bg/95 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-full max-w-xl bg-surface border-l border-border z-90 shadow-2xl flex flex-col"
          >
            <div className="p-4 sm:p-6 border-b border-border">
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
                  className="w-full pl-10 pr-4 py-2.5 bg-surface-hover border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 transition-colors duration-200"
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
                      className={`w-full flex flex-col items-center py-3 px-1 gap-1 transition-colors duration-200 group relative ${isActive ? 'text-accent' : 'text-text-muted hover:text-text-primary'}`}
                    >
                      <Icon
                        className={`w-5 h-5 sm:w-6 sm:h-6 transition-transform group-hover:scale-110 ${isActive ? 'scale-110' : ''}`}
                      />
                      <span className="text-[10px] sm:text-xs font-bold uppercase tracking-tight text-center px-1">
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
