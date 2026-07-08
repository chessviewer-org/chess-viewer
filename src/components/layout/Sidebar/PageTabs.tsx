import { memo, useCallback, useRef, useState } from 'react';

import { ChevronDown, ChevronRight, type LucideIcon } from '@/assets/icons';
import styles from './styles/page-tabs.module.scss';

interface PageTab {
  id: string;
  label: string;
  icon: LucideIcon;
}

export interface PageTabGroup {
  id?: string;
  label?: string;
  icon?: LucideIcon;
  isCollapsible?: boolean;
  items: readonly PageTab[];
}

interface PageTabsProps {
  groups: readonly PageTabGroup[];
  activeId: string;
  onSelect: (id: string) => void;
  ariaLabel?: string;
}

const PageTabs = memo(function PageTabs({
  groups,
  activeId,
  onSelect,
  ariaLabel = 'Sections'
}: PageTabsProps) {
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(
    () => {
      const initialState: Record<string, boolean> = {};
      groups.forEach((g, idx) => {
        if (g.isCollapsible) {
          const id = g.id || `group-${idx}`;
          const hasActive = g.items.some((t) => t.id === activeId);
          initialState[id] = hasActive;
        }
      });
      return initialState;
    }
  );
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
    <nav aria-label={ariaLabel} className={styles['tabsNav']}>
      <div
        role="tablist"
        aria-label={ariaLabel}
        aria-orientation="vertical"
        className={styles['tabsList']}
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
                  ? styles['groupContainer']
                  : styles['groupContainerFirst']
              }
            >
              {group.label && isCollapsible ? (
                <button
                  type="button"
                  onClick={() =>
                    setExpandedGroups((p) => ({ ...p, [groupId]: !p[groupId] }))
                  }
                  className={`group ${styles['groupToggleBtn']} ${
                    hasActiveItem && !isExpanded
                      ? styles['groupToggleActive']
                      : styles['groupToggleInactive']
                  }`}
                >
                  <div className={styles['groupToggleLabel']}>
                    {GroupIcon && (
                      <GroupIcon
                        className={styles['groupIcon']}
                        aria-hidden="true"
                      />
                    )}
                    {group.label}
                  </div>
                  {isExpanded ? (
                    <ChevronDown
                      className={styles['groupChevron']}
                      aria-hidden="true"
                    />
                  ) : (
                    <ChevronRight
                      className={styles['groupChevron']}
                      aria-hidden="true"
                    />
                  )}
                </button>
              ) : group.label ? (
                <span aria-hidden="true" className={styles['groupHeading']}>
                  {group.label}
                </span>
              ) : null}

              {isExpanded && (
                <div
                  className={
                    isCollapsible
                      ? styles['groupItemsCollapsible']
                      : styles['groupItems']
                  }
                >
                  {group.items.map(({ id, label, icon: Icon }) => {
                    const isActive = id === activeId;
                    const indentCls = isCollapsible
                      ? styles['tabBtnCollapsible']
                      : styles['tabBtnNormal'];
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
                        className={`group ${styles['tabBtn']} ${indentCls} ${
                          isActive
                            ? styles['tabBtnActive']
                            : styles['tabBtnInactive']
                        }`}
                      >
                        <span
                          aria-hidden="true"
                          className={`${styles['tabIndicator']} ${isActive ? styles['tabIndicatorActive'] : styles['tabIndicatorInactive']}`}
                        />
                        <Icon
                          className={styles['tabIcon']}
                          aria-hidden="true"
                        />
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
