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
import { useEscapeKey, useSearchParams } from '@hooks';

import {
  type PageTabGroup,
  PageSidebarLayout,
  PageTabs
} from '@/components/layout';
import { useAuth } from '@/auth';
import { pageScrollToY } from '@utils';

import { Seo } from '@ui';
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
      pageScrollToY(0);
    },
    [setSearchParams]
  );

  return (
    <div className="min-h-full bg-bg md:h-full md:max-h-full">
      <Seo name="Settings" noindex />
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
          <div className="space-y-4 stagger-children">
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
