import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  Accessibility,
  Database,
  LayoutGrid,
  Palette,
  ShieldCheck,
  User
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { type PageTabGroup, PageTabs } from '@/components/layout';
import { useAuth } from '@/features/auth';

import { Seo } from '@shared/ui';
import {
  AccessibilitySection,
  AccountSection,
  AppearanceSection,
  BoardSection,
  DataManagement,
  SecuritySection
} from './sections';

/** Full-page settings shell. A centered tab strip under the navbar selects the
 *  active section; the active section is mirrored to `?tab=`. */
const SettingsPage = memo(function SettingsPage() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const groups: PageTabGroup[] = useMemo(
    () => [
      {
        label: 'Profile',
        items: [
          { id: 'profile', label: 'Account', icon: User },
          { id: 'appearance', label: 'Appearance', icon: Palette },
          { id: 'board', label: 'Board Style', icon: LayoutGrid },
          { id: 'accessibility', label: 'Accessibility', icon: Accessibility }
        ]
      },
      ...(isAuthenticated
        ? [
            {
              label: 'Access',
              items: [
                { id: 'security', label: 'Security', icon: ShieldCheck },
                { id: 'data', label: 'Data Management', icon: Database }
              ]
            }
          ]
        : [
            {
              label: 'Access',
              items: [{ id: 'data', label: 'Data Management', icon: Database }]
            }
          ])
    ],
    [isAuthenticated]
  );

  const validTabIds = useMemo(
    () => new Set(groups.flatMap((g) => g.items).map((s) => s.id)),
    [groups]
  );
  const defaultTab = 'profile';

  const requestedTab = searchParams.get('tab');
  const initialTab =
    requestedTab && validTabIds.has(requestedTab) ? requestedTab : defaultTab;

  const [activeTab, setActiveTab] = useState(initialTab);
  const contentRef = useRef<HTMLDivElement>(null);

  // Redirect a retired tab key (e.g. ?tab=developer, ?tab=export) to the default
  // tab so old bookmarks land on a valid section instead of an empty area.
  useEffect(() => {
    if (requestedTab && !validTabIds.has(requestedTab)) {
      setSearchParams({ tab: defaultTab }, { replace: true });
    }
  }, [requestedTab, validTabIds, setSearchParams]);

  const handleBack = useCallback(() => navigate('/'), [navigate]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleBack();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleBack]);

  const handleSelect = useCallback(
    (tabId: string) => {
      setActiveTab(tabId);
      setSearchParams({ tab: tabId });
      // Each section starts at its top, not wherever the previous one was left.
      contentRef.current?.scrollTo({ top: 0 });
    },
    [setSearchParams]
  );

  const activeTabLabel = groups
    .flatMap((g) => g.items)
    .find((item) => item.id === activeTab)?.label;

  return (
    <div className="min-h-full bg-bg md:h-full md:max-h-full">
      <Seo name={activeTabLabel} noindex />
      {/* Two-column split pane, constrained to the navbar's width so the page
          reads as one column under the bar (GitHub-settings pattern). At lg+
          the shell locks the outer page, the row fills the visible height and
          ONLY the right content column scrolls — the rail and the separator
          stay put. Below lg the window scrolls and the rail falls back to
          `sticky`, offset past the fixed navbar. */}
      <div className="page-container flex flex-col gap-6 py-6 sm:py-8 md:h-full md:min-h-0 md:flex-row md:gap-8 lg:gap-10">
        <div className="shrink-0 mb-6 md:mb-0 md:w-52 lg:w-56">
          <div className="md:sticky md:top-8">
            <PageTabs
              groups={groups}
              activeId={activeTab}
              onSelect={handleSelect}
              ariaLabel="Settings sections"
            />
          </div>
        </div>

        {/* Separator as its own flex child (not a border on the rail): at lg+
            it spans the row's padded content box, so it starts below the navbar
            and stops above the bottom instead of running edge to edge. */}
        <div
          aria-hidden="true"
          className="hidden md:block w-px shrink-0 self-stretch bg-border"
        />

        {/* Scroll region, NOT a landmark: the app shell already owns the single
            `<main id="main-content">`. A second `<main>` is an ARIA landmark
            violation (1.3.1). `role="region"` + label keeps it navigable. */}
        <div
          ref={contentRef}
          data-page-scroll
          role="region"
          aria-label="Settings"
          className="min-w-0 flex-1 md:min-h-0 md:overflow-y-auto lg:overflow-y-auto pb-5"
        >
          {activeTab === 'profile' && <AccountSection />}
          {activeTab === 'appearance' && <AppearanceSection />}
          {activeTab === 'board' && <BoardSection />}
          {activeTab === 'accessibility' && <AccessibilitySection />}
          {activeTab === 'security' && <SecuritySection />}
          {activeTab === 'data' && (
            <div className="space-y-4 animate-pageEnter">
              <h2 className="flex items-center gap-2 border-b border-border pb-3 font-display text-2xl font-bold text-text-primary">
                <Database
                  className="h-6 w-6 text-text-secondary"
                  aria-hidden="true"
                />
                Data Management
              </h2>
              <DataManagement />
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

SettingsPage.displayName = 'SettingsPage';
export default SettingsPage;
