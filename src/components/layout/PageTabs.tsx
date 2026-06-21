import { memo, useCallback, useRef } from 'react';

import type { LucideIcon } from 'lucide-react';

/** A single navigable tab within a group. */
interface PageTab {
  id: string;
  label: string;
  icon: LucideIcon;
}

/** A labelled, visually-separated group of tabs (GitHub-style sections). */
export interface PageTabGroup {
  /** Optional group label rendered as a subtle heading above the items. */
  label?: string;
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
    <nav aria-label={ariaLabel}>
      {/* Always a vertical, stacked rail (GitHub-settings pattern): full width
          on phones, a fixed-width sticky left column on tablet + desktop. */}
      <div
        role="tablist"
        aria-label={ariaLabel}
        aria-orientation="vertical"
        className="flex flex-col gap-0.5"
      >
        {groups.map((group, groupIndex) => (
          <div
            key={group.label ?? `group-${groupIndex}`}
            className={groupIndex > 0 ? 'mt-3 border-t border-border pt-3' : ''}
          >
            {group.label && (
              <span
                aria-hidden="true"
                className="block px-3 pb-1.5 text-xs font-bold uppercase tracking-wider text-text-muted"
              >
                {group.label}
              </span>
            )}

            {group.items.map(({ id, label, icon: Icon }) => {
              const isActive = id === activeId;
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
                  className={`group relative flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-inset ${
                    isActive
                      ? 'bg-accent/10 text-accent'
                      : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary'
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`absolute inset-y-1.5 left-0 w-0.5 rounded-full transition-colors ${
                      isActive ? 'bg-accent' : 'bg-transparent'
                    }`}
                  />
                  <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                  {label}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </nav>
  );
});

PageTabs.displayName = 'PageTabs';
export default PageTabs;
