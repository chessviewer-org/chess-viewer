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
import { useEscapeKey } from '@/shared/hooks/useKeyboard';
import { useSearchParams } from '@/shared/hooks/useSearchParams';

import {
  type PageTabGroup,
  PageTabs
} from '@/components/layout/Sidebar/PageTabs';
import { PageSidebarLayout } from '@/components/layout/Sidebar/PageSidebarLayout';
import { useAuth } from '@/auth/core/useAuth';
import { getRouteSeo } from '@constants';

import { Seo } from '@/shared/ui/Seo';
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
  const { isAuthenticated, isLoading: authLoading } = useAuth();
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
    if (!authLoading && requestedTab && !validTabIds.has(requestedTab)) {
      setSearchParams({ tab: defaultTab }, { replace: true });
    }
  }, [authLoading, requestedTab, validTabIds, setSearchParams]);

  const handleBack = useCallback(() => navigate('/'), [navigate]);
  useEscapeKey(handleBack);

  const handleSelect = useCallback(
    (tabId: string) => {
      setSearchParams({ tab: tabId });
      window.scrollTo(0, 0);
    },
    [setSearchParams]
  );

  return (
    <div className="flex-1 bg-bg">
      <Seo {...getRouteSeo('/settings')} />
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
