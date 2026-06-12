import { memo, useCallback, useEffect, useState } from 'react';

import { Database, Mail, ShieldCheck, User } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { ToolPageHeader } from '@/components/layout';
import {
  AccountSection,
  DataManagement,
  SecuritySection,
  type SettingsSection,
  SettingsSidebar
} from '@/pages/settings';

const sections: readonly SettingsSection[] = [
  { id: 'profile', label: 'Account', icon: User },
  { id: 'security', label: 'Security', icon: ShieldCheck },
  { id: 'data', label: 'Data Management', icon: Database }
];

const VALID_TAB_IDS = new Set(sections.map((s) => s.id));
const DEFAULT_TAB = 'profile';

/** Full-page settings shell with a collapsible left sidebar for the account,
 *  security, and data sections. The active section is mirrored to `?tab=`. */
const SettingsPage = memo(function SettingsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedTab = searchParams.get('tab');
  const initialTab =
    requestedTab && VALID_TAB_IDS.has(requestedTab)
      ? requestedTab
      : DEFAULT_TAB;

  const [activeTab, setActiveTab] = useState(initialTab);
  // Start collapsed on narrow viewports so the icon rail doesn't crowd the
  // content; users can still expand it. SSR-safe via the typeof guard.
  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    () => typeof window !== 'undefined' && window.innerWidth < 640
  );

  // Redirect a retired tab key (e.g. ?tab=developer, ?tab=export) to the default
  // tab so old bookmarks land on a valid section instead of an empty area.
  useEffect(() => {
    if (requestedTab && !VALID_TAB_IDS.has(requestedTab)) {
      setSearchParams({ tab: DEFAULT_TAB }, { replace: true });
    }
  }, [requestedTab, setSearchParams]);

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

  const toggleSidebar = useCallback(
    () => setSidebarCollapsed((prev) => !prev),
    []
  );

  return (
    <div className="flex min-h-dvh flex-col bg-bg lg:h-full lg:max-h-full lg:overflow-hidden">
      <ToolPageHeader title="Settings" onBack={handleBack} showSave={false} />

      <div className="flex min-h-0 flex-1">
        <SettingsSidebar
          sections={sections}
          activeId={activeTab}
          onSelect={handleSelect}
          collapsed={sidebarCollapsed}
          onToggleCollapsed={toggleSidebar}
        />

        <main className="min-h-0 flex-1 overflow-visible lg:overflow-y-auto">
          <div className="w-full max-w-5xl px-4 py-6 sm:px-8 sm:py-10 lg:px-10">
            {activeTab === 'profile' && <AccountSection />}

            {activeTab === 'security' && <SecuritySection />}

            {activeTab === 'data' && (
              <div className="space-y-8 animate-pageEnter">
                <h2 className="flex items-center gap-2 font-display text-xl font-bold text-text-primary">
                  <Database
                    className="h-5 w-5 text-text-secondary"
                    aria-hidden="true"
                  />
                  Data Management
                </h2>
                <DataManagement />

                <section className="rounded-2xl border border-error/20 bg-error/5 p-6">
                  <h3 className="mb-2 text-lg font-bold text-error">
                    Danger Zone
                  </h3>
                  <p className="mb-4 text-sm text-text-secondary">
                    Permanent account deletion isn&apos;t self-service yet. To
                    erase your account and all associated cloud data, email us
                    and we&apos;ll remove it. This cannot be undone.
                  </p>
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      disabled
                      aria-disabled="true"
                      title="Account deletion is handled by support — see the link"
                      className="cursor-not-allowed rounded-xl border border-error/30 bg-error/10 px-6 py-2.5 text-sm font-bold text-error/70"
                    >
                      Delete Account Forever
                    </button>
                    <a
                      href="mailto:contact@chessvision.org?subject=Account%20deletion%20request"
                      className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-text-primary transition-colors hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
                    >
                      <Mail className="h-4 w-4" aria-hidden="true" />
                      Contact support to delete
                    </a>
                  </div>
                </section>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
});

SettingsPage.displayName = 'SettingsPage';
export default SettingsPage;
