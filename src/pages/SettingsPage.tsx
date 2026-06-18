import { memo, useCallback, useEffect, useMemo, useState } from 'react';

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
import { useAuth } from '@/features/auth/hooks/useAuth';
import {
  AccessibilitySection,
  AccountSection,
  AppearanceSection,
  BoardSection,
  DataManagement,
  SecuritySection
} from '@/pages/settings';

import { Seo } from '@shared/ui';

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
    },
    [setSearchParams]
  );

  const activeTabLabel = groups
    .flatMap((g) => g.items)
    .find((item) => item.id === activeTab)?.label;

  return (
    <div
      data-page-scroll
      className="min-h-full bg-bg lg:h-full lg:max-h-full lg:overflow-y-auto"
    >
      <Seo name={activeTabLabel} noindex />
      {/* Two-column shell, constrained to the navbar's width so the page reads
          as one column under the bar: a sticky left section rail (always
          visible, never collapses) and a scrolling content column on the right
          (GitHub-settings pattern). */}
      <div className="page-container flex flex-col gap-6 py-6 sm:py-8 lg:flex-row lg:gap-10">
        <div className="shrink-0 lg:w-56">
          <PageTabs
            groups={groups}
            activeId={activeTab}
            onSelect={handleSelect}
            ariaLabel="Settings sections"
          />
        </div>

        {/* Scroll region, NOT a landmark: the app shell already owns the single
            `<main id="main-content">`. A second `<main>` is an ARIA landmark
            violation (1.3.1). `role="region"` + label keeps it navigable. */}
        <div role="region" aria-label="Settings" className="min-w-0 flex-1">
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
