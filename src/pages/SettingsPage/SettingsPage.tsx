import { useLocation } from 'wouter';
import { memo, useCallback, useEffect, useMemo, useRef } from 'react';

import {
  Accessibility,
  Database,
  LayoutGrid,
  Palette,
  ShieldCheck,
  User
} from '@/assets/icons';
import { useEscapeKey, useSearchParams } from '@/shared/hooks';

import {
  type PageTabGroup,
  PageSidebarLayout,
  PageTabs
} from '@/components/layout';
import { useAuth } from '@/auth';

import { Seo } from '@shared/ui';
import {
  AccessibilitySection,
  AccountSection,
  AppearanceSection,
  BoardSection,
  DataManagement,
  SecuritySection
} from './components';

const getSettingsGroups = (isAuthenticated: boolean): PageTabGroup[] => [
  {
    label: 'Profile',
    items: [
      { id: 'profile', label: 'Account', icon: User },
      { id: 'appearance', label: 'Appearance', icon: Palette },
      { id: 'board', label: 'Board Style', icon: LayoutGrid },
      { id: 'accessibility', label: 'Accessibility', icon: Accessibility }
    ]
  },
  {
    label: 'Access',
    items: isAuthenticated
      ? [
          { id: 'security', label: 'Security', icon: ShieldCheck },
          { id: 'data', label: 'Data Management', icon: Database }
        ]
      : [{ id: 'data', label: 'Data Management', icon: Database }]
  }
];

const getValidTabIds = (groups: PageTabGroup[]) =>
  new Set(groups.flatMap((g) => g.items).map((s) => s.id));

const SettingsPage = memo(function SettingsPage() {
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  const groups = useMemo(
    () => getSettingsGroups(isAuthenticated),
    [isAuthenticated]
  );
  const validTabIds = useMemo(() => getValidTabIds(groups), [groups]);
  const defaultTab = 'profile';

  const requestedTab = searchParams.get('tab');
  const activeTab =
    requestedTab && validTabIds.has(requestedTab) ? requestedTab : defaultTab;
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (requestedTab && !validTabIds.has(requestedTab)) {
      setSearchParams({ tab: defaultTab }, { replace: true });
    }
  }, [requestedTab, validTabIds, setSearchParams]);

  const handleBack = useCallback(() => navigate('/'), [navigate]);
  useEscapeKey(handleBack);

  const handleSelect = useCallback(
    (tabId: string) => {
      setSearchParams({ tab: tabId });
      contentRef.current?.scrollTo({ top: 0 });
    },
    [setSearchParams]
  );

  const activeTabLabel = groups
    .flatMap((g) => g.items)
    .find((item) => item.id === activeTab)?.label;

  return (
    <div className="min-h-full bg-bg lg:h-full lg:max-h-full">
      <Seo name={activeTabLabel} noindex />
      <PageSidebarLayout
        contentRef={contentRef}
        contentLabel="Settings"
        sidebar={
          <PageTabs
            groups={groups}
            activeId={activeTab}
            onSelect={handleSelect}
            ariaLabel="Settings sections"
          />
        }
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
      </PageSidebarLayout>
    </div>
  );
});

SettingsPage.displayName = 'SettingsPage';
export default SettingsPage;
