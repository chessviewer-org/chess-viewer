import { memo, useCallback, useEffect, useState } from 'react';

import { Code2, Database, ShieldCheck, User } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { ToolPageHeader } from '@/components/layout';
import { TwoFactorSetup } from '@/features/auth/components/TwoFactorSetup';
import { DataManagement, DeveloperOptions } from '@/pages/settings';

import { Button } from '@shared/ui';

const pageTabs = [
  {
    id: 'profile',
    label: 'Account Profile',
    shortLabel: 'Profile',
    icon: User
  },
  {
    id: 'security',
    label: 'Security & Privacy',
    shortLabel: 'Security',
    icon: ShieldCheck
  },
  {
    id: 'data',
    label: 'Data Management',
    shortLabel: 'Data',
    icon: Database
  },
  {
    id: 'developer',
    label: 'Developer Options',
    shortLabel: 'Developer',
    icon: Code2
  }
];

const VALID_TAB_IDS = new Set(pageTabs.map((t) => t.id));
const DEFAULT_TAB = 'profile';

/** Full-page settings shell with tab-based navigation for profile, security, export, and data sections. */
const SettingsPage = memo(function SettingsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedTab = searchParams.get('tab');
  const initialTab =
    requestedTab && VALID_TAB_IDS.has(requestedTab)
      ? requestedTab
      : DEFAULT_TAB;

  const [activeTab, setActiveTab] = useState(initialTab);

  // Redirect a retired tab key (e.g. ?tab=theme, ?tab=export) to the default
  // tab so old bookmarks land on a valid page instead of an empty content area.
  useEffect(() => {
    if (requestedTab && !VALID_TAB_IDS.has(requestedTab)) {
      setSearchParams({ tab: DEFAULT_TAB }, { replace: true });
    }
  }, [requestedTab, setSearchParams]);

  const handleBack = useCallback(() => navigate(-1), [navigate]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleBack();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleBack]);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    setSearchParams({ tab: tabId });
  };

  return (
    <div className="h-full max-h-full flex flex-col bg-bg overflow-hidden">
      <ToolPageHeader
        title="Account Preferences"
        onBack={handleBack}
        showSave={false}
      />

      <div className="shrink-0 bg-surface-elevated border-b border-border animate-fadeIn scrollbar-hide">
        <div className="px-3 sm:px-6 overflow-x-auto">
          <div className="flex gap-0 min-w-max sm:min-w-0">
            {pageTabs.map(({ id, icon: Icon, label, shortLabel }) => (
              <button
                key={id}
                onClick={() => handleTabChange(id)}
                className={`px-3 sm:px-5 py-3.5 sm:py-4 flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-semibold transition-colors duration-200 border-b-2 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-inset ${
                  activeTab === id
                    ? 'text-accent border-accent bg-accent/5'
                    : 'text-text-secondary hover:text-text-primary border-transparent hover:bg-surface-hover'
                }`}
              >
                <Icon
                  className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform duration-200 ${activeTab === id ? 'scale-110' : ''}`}
                />
                <span className="sm:hidden">{shortLabel}</span>
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <main className="flex-1 overflow-y-auto min-h-0">
        <div className="h-full max-w-4xl mx-auto px-4 sm:px-6 md:px-8 py-6 sm:py-10">
          {activeTab === 'profile' && (
            <div className="space-y-8 animate-pageEnter">
              <section>
                <h3 className="text-xl font-bold text-text-primary font-display flex items-center gap-2 mb-4">
                  <User className="w-5 h-5 text-accent" />
                  Profile Information
                </h3>
                <div className="bg-surface-elevated border border-border rounded-2xl p-6 space-y-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                      Email Address
                    </label>
                    <p className="text-text-primary font-medium">
                      Logged in with your Supabase account.
                    </p>
                  </div>
                  <p className="text-sm text-text-secondary italic">
                    Profile editing is coming soon in v6.1.0
                  </p>
                </div>
              </section>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-10 animate-pageEnter">
              <section>
                <h3 className="text-xl font-bold text-text-primary font-display flex items-center gap-2 mb-4">
                  <ShieldCheck className="w-5 h-5 text-accent" />
                  Security Settings
                </h3>
                <div className="bg-surface-elevated border border-border rounded-2xl overflow-hidden">
                  <div className="p-6 border-b border-border/50">
                    <TwoFactorSetup />
                  </div>
                  <div className="p-6 bg-surface/30">
                    <h4 className="text-sm font-bold text-text-primary mb-2">
                      Password Management
                    </h4>
                    <p className="text-xs text-text-secondary mb-4">
                      You can request a password reset email if you wish to
                      change your login credentials.
                    </p>
                    <Button size="sm" variant="outline" className="text-xs">
                      Request Password Reset
                    </Button>
                  </div>
                </div>
              </section>
            </div>
          )}

          {activeTab === 'data' && (
            <div className="space-y-8 animate-pageEnter">
              <section>
                <h3 className="text-xl font-bold text-text-primary font-display flex items-center gap-2 mb-4">
                  <Database className="w-5 h-5 text-accent" />
                  Data & Privacy
                </h3>
                <DataManagement />
              </section>

              <section className="pt-8 border-t border-error/20">
                <div className="bg-error/5 border border-error/20 rounded-2xl p-6">
                  <h4 className="text-lg font-bold text-error mb-2">
                    Danger Zone
                  </h4>
                  <p className="text-sm text-text-secondary mb-4">
                    Permanently delete your account and all associated cloud
                    data. This action cannot be undone.
                  </p>
                  <button className="px-6 py-2.5 bg-error text-white rounded-xl font-bold text-sm hover:bg-error/90 transition-all">
                    Delete Account Forever
                  </button>
                </div>
              </section>
            </div>
          )}

          {activeTab === 'developer' && (
            <div className="space-y-8 animate-pageEnter">
              <section>
                <h3 className="text-xl font-bold text-text-primary font-display flex items-center gap-2 mb-4">
                  <Code2 className="w-5 h-5 text-accent" />
                  Developer Options
                </h3>
                <DeveloperOptions />
              </section>
            </div>
          )}
        </div>
      </main>
    </div>
  );
});

SettingsPage.displayName = 'SettingsPage';
export default SettingsPage;
