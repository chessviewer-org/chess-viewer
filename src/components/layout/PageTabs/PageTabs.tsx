import { memo, useCallback, useRef, useState } from 'react';

import { ChevronDown, ChevronRight, type LucideIcon } from 'lucide-react';

/** A single navigable tab within a group. */
interface PageTab {
  id: string;
  label: string;
  icon: LucideIcon;
}

/** A labelled, visually-separated group of tabs (GitHub-style sections). */
export interface PageTabGroup {
  /** Optional unique identifier for collapsible groups */
  id?: string;
  /** Optional group label rendered as a subtle heading above the items. If collapsible, it renders as a button. */
  label?: string;
  /** Optional icon for the group label, especially useful if collapsible */
  icon?: LucideIcon;
  /** Whether the group can be collapsed/expanded */
  isCollapsible?: boolean;
  items: readonly PageTab[];
}

interface PageTabsProps {
  groups: readonly PageTabGroup[];
  activeId: string;
  onSelect: (id: string) => void;
  /** Accessible label for the navigation list. */
  ariaLabel?: string;
}

/**
 * Shared vertical, sticky, non-collapsible section navigation — the left column
 * of the Settings + About two-column layout (GitHub-settings pattern). The
 * items stack top-to-bottom; the rail stays fixed in place while the content
 * column on the right scrolls. It never collapses.
 *
 * Accessibility: a single `role="tablist"` (`aria-orientation="vertical"`) with
 * roving `tabIndex` and full arrow-key navigation (Up/Down wrap, Home/End jump)
 * across the FLATTENED tab order, so the visual grouping never fragments
 * keyboard traversal. The active tab carries an accent indicator bar and
 * `aria-selected`.
 *
 * Grouping: `groups` is an ordered list of `{ label?, items[] }`. A group with
 * a `label` renders a subtle section heading above its items; a single
 * unlabelled group (e.g. About) renders flat with no headings.
 */
const PageTabs = memo(function PageTabs({
  groups,
  activeId,
  onSelect,
  ariaLabel = 'Sections'
}: PageTabsProps) {
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(
    () => {
      // By default expand any collapsible group that contains the active tab
      const initialState: Record<string, boolean> = {};
      groups.forEach((g, idx) => {
        if (g.isCollapsible) {
          const id = g.id || `group-${idx}`;
          const hasActive = g.items.some((t) => t.id === activeId);
          initialState[id] = hasActive; // Expand if active, otherwise collapsed
        }
      });
      return initialState;
    }
  );
  // Flatten the grouped tabs into a single ordered list so roving focus and
  // arrow navigation cross group boundaries seamlessly.
  const flatTabs = groups.flatMap((g) => g.items);
  const tabRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

  const focusTab = useCallback((id: string) => {
    const el = tabRefs.current.get(id);
    if (el) {
      el.focus();
      el.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    }
  }, []);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent, currentId: string) => {
      const index = flatTabs.findIndex((t) => t.id === currentId);
      if (index < 0) return;
      let nextIndex: number | null = null;

      switch (event.key) {
        case 'ArrowDown':
          nextIndex = (index + 1) % flatTabs.length;
          break;
        case 'ArrowUp':
          nextIndex = (index - 1 + flatTabs.length) % flatTabs.length;
          break;
        case 'Home':
          nextIndex = 0;
          break;
        case 'End':
          nextIndex = flatTabs.length - 1;
          break;
        default:
          return;
      }

      event.preventDefault();
      const next = flatTabs[nextIndex];
      if (next) {
        onSelect(next.id);
        focusTab(next.id);
      }
    },
    [flatTabs, onSelect, focusTab]
  );

  return (
    <nav aria-label={ariaLabel} className="mb-6 md:mb-0 w-full">
      <div
        role="tablist"
        aria-label={ariaLabel}
        aria-orientation="vertical"
        className="flex flex-col gap-0.5 w-full"
      >
        {groups.map((group, groupIndex) => {
          const groupId = group.id || `group-${groupIndex}`;
          const isCollapsible = !!group.isCollapsible;
          const isExpanded = isCollapsible ? !!expandedGroups[groupId] : true;
          const GroupIcon = group.icon;
          const hasActiveItem = group.items.some((t) => t.id === activeId);

          return (
            <div
              key={groupId}
              className={
                groupIndex > 0
                  ? 'mt-3 border-t border-border pt-3 w-full'
                  : 'w-full'
              }
            >
              {/* Group label: hidden on mobile horizontal, shown on tablet+ */}
              {group.label && isCollapsible ? (
                <button
                  type="button"
                  onClick={() =>
                    setExpandedGroups((p) => ({ ...p, [groupId]: !p[groupId] }))
                  }
                  className={`group relative flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-inset ${
                    hasActiveItem && !isExpanded
                      ? 'text-accent'
                      : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {GroupIcon && (
                      <GroupIcon
                        className="h-4 w-4 shrink-0"
                        aria-hidden="true"
                      />
                    )}
                    {group.label}
                  </div>
                  {isExpanded ? (
                    <ChevronDown
                      className="h-4 w-4 text-text-muted shrink-0"
                      aria-hidden="true"
                    />
                  ) : (
                    <ChevronRight
                      className="h-4 w-4 text-text-muted shrink-0"
                      aria-hidden="true"
                    />
                  )}
                </button>
              ) : group.label ? (
                <span
                  aria-hidden="true"
                  className="block px-3 pb-1.5 text-xs font-bold uppercase tracking-wider text-text-muted"
                >
                  {group.label}
                </span>
              ) : null}

              {/* Always show items if expanded */}
              {isExpanded && (
                <div
                  className={
                    isCollapsible
                      ? 'mt-1 flex flex-col gap-0.5 w-full'
                      : 'flex flex-col gap-0.5 w-full'
                  }
                >
                  {group.items.map(({ id, label, icon: Icon }) => {
                    const isActive = id === activeId;
                    const indentCls = isCollapsible
                      ? 'w-full pl-8'
                      : 'w-full pl-3';
                    return (
                      <button
                        key={id}
                        ref={(el) => {
                          if (el) tabRefs.current.set(id, el);
                          else tabRefs.current.delete(id);
                        }}
                        type="button"
                        role="tab"
                        aria-selected={isActive}
                        tabIndex={isActive ? 0 : -1}
                        onClick={() => onSelect(id)}
                        onKeyDown={(e) => handleKeyDown(e, id)}
                        className={`group relative flex shrink-0 items-center gap-2 rounded-lg py-2 pr-3 text-left text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-inset ${indentCls} ${
                          isActive
                            ? 'bg-accent/10 text-accent'
                            : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary'
                        }`}
                      >
                        {/* Active indicator: left bar */}
                        <span
                          aria-hidden="true"
                          className={`absolute inset-y-1.5 left-0 w-0.5 rounded-full transition-colors ${isActive ? 'bg-accent' : 'bg-transparent'}`}
                        />
                        <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                        {label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </nav>
  );
});

PageTabs.displayName = 'PageTabs';
export default PageTabs;
