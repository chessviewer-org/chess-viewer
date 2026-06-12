import { memo } from 'react';

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { type LucideIcon, PanelLeftClose, PanelLeftOpen } from 'lucide-react';

/** A single navigable settings section. */
export interface SettingsSection {
  id: string;
  label: string;
  icon: LucideIcon;
}

interface SettingsSidebarProps {
  sections: readonly SettingsSection[];
  activeId: string;
  onSelect: (id: string) => void;
  collapsed: boolean;
  onToggleCollapsed: () => void;
}

const EXPANDED_WIDTH = 232;
const COLLAPSED_WIDTH = 64;

/**
 * Collapsible left navigation rail for the settings page. Expanded it shows
 * icon + label; collapsed it shows an icon-only rail. The width animates
 * left↔right via framer-motion and degrades to an instant snap under
 * `prefers-reduced-motion`.
 */
const SettingsSidebar = memo(function SettingsSidebar({
  sections,
  activeId,
  onSelect,
  collapsed,
  onToggleCollapsed
}: SettingsSidebarProps) {
  const reduceMotion = useReducedMotion();
  const width = collapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH;

  return (
    <motion.nav
      aria-label="Settings sections"
      initial={false}
      animate={{ width }}
      transition={
        reduceMotion
          ? { duration: 0 }
          : { duration: 0.25, ease: [0.4, 0, 0.2, 1] }
      }
      className="shrink-0 bg-surface-elevated border-r border-border flex flex-col lg:overflow-hidden"
    >
      <div
        className={`flex items-center px-2 py-3 ${collapsed ? 'justify-center' : 'justify-end'}`}
      >
        <button
          type="button"
          onClick={onToggleCollapsed}
          aria-label={
            collapsed ? 'Expand settings menu' : 'Collapse settings menu'
          }
          aria-expanded={!collapsed}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-text-secondary transition-colors hover:bg-surface-hover hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          {collapsed ? (
            <PanelLeftOpen className="h-5 w-5" />
          ) : (
            <PanelLeftClose className="h-5 w-5" />
          )}
        </button>
      </div>

      <ul className="flex flex-col gap-1 px-2 pb-3">
        {sections.map(({ id, label, icon: Icon }) => {
          const isActive = id === activeId;
          return (
            <li key={id}>
              <button
                type="button"
                onClick={() => onSelect(id)}
                aria-current={isActive ? 'page' : undefined}
                title={collapsed ? label : undefined}
                className={`flex w-full items-center rounded-xl py-2.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                  collapsed ? 'justify-center px-0' : 'gap-3 px-3'
                } ${
                  isActive
                    ? 'bg-accent/10 text-accent'
                    : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary'
                }`}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <AnimatePresence initial={false}>
                  {!collapsed && (
                    <motion.span
                      initial={reduceMotion ? false : { opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={reduceMotion ? { opacity: 0 } : { opacity: 0 }}
                      transition={{ duration: reduceMotion ? 0 : 0.15 }}
                      className="truncate whitespace-nowrap"
                    >
                      {label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
            </li>
          );
        })}
      </ul>
    </motion.nav>
  );
});

SettingsSidebar.displayName = 'SettingsSidebar';
export default SettingsSidebar;
