import { memo, useCallback, useEffect, useState } from 'react';

import {
  Code2,
  Heart,
  HeartHandshake,
  HelpCircle,
  History,
  Info,
  Mail,
  Shield
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { type PageTabGroup, PageTabs } from '@/components/layout';
import {
  AboutMainSection,
  ChangelogSection,
  ContactSection,
  ContributeSection,
  DonateSection,
  FaqSection,
  PrivacySection,
  ThanksSection
} from '@/pages/about';

// Single flat group: About renders with no group separators.
const groups: readonly PageTabGroup[] = [
  {
    items: [
      { id: 'about', label: 'About ChessVision', icon: Info },
      { id: 'changelog', label: 'Changelog', icon: History },
      { id: 'faq', label: 'FAQ', icon: HelpCircle },
      { id: 'contact', label: 'Contact', icon: Mail },
      { id: 'privacy', label: 'Privacy', icon: Shield },
      { id: 'contribute', label: 'Contribute', icon: Code2 },
      { id: 'donate', label: 'Donate', icon: Heart },
      { id: 'thanks', label: 'Thanks', icon: HeartHandshake }
    ]
  }
];

const VALID_TAB_IDS = new Set(groups.flatMap((g) => g.items).map((s) => s.id));
const DEFAULT_TAB = 'about';

/**
 * Full-page About shell. A centered tab strip under the navbar selects the
 * active category; the active category is mirrored to `?tab=` and the content
 * area below swaps based on the selection. Mirrors the Settings page layout.
 */
const AboutPage = memo(function AboutPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedTab = searchParams.get('tab');
  const initialTab =
    requestedTab && VALID_TAB_IDS.has(requestedTab)
      ? requestedTab
      : DEFAULT_TAB;

  const [activeTab, setActiveTab] = useState(initialTab);

  // Redirect an unknown tab key to the default so old/bad links land on a valid
  // section instead of an empty area.
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

  return (
    <div
      data-page-scroll
      className="min-h-full bg-bg lg:h-full lg:max-h-full lg:overflow-y-auto"
    >
      {/* Two-column shell, constrained to the navbar's width so the page reads
          as one column under the bar: a sticky left category rail (always
          visible, never collapses) and a scrolling content column on the right
          (GitHub-settings pattern), mirroring the Settings page layout. */}
      <div className="mx-auto flex w-[94%] max-w-600 flex-col gap-6 py-6 sm:w-[88%] sm:py-10 lg:flex-row lg:gap-10">
        <div className="shrink-0 lg:w-56">
          <PageTabs
            groups={groups}
            activeId={activeTab}
            onSelect={handleSelect}
            ariaLabel="About sections"
          />
        </div>

        {/* Scroll region, NOT a landmark: the app shell already owns the single
            `<main id="main-content">`. A second `<main>` is an ARIA landmark
            violation (1.3.1). `role="region"` + label keeps it navigable. */}
        <div
          role="region"
          aria-label="About content"
          className="min-w-0 flex-1"
        >
          {activeTab === 'about' && <AboutMainSection />}
          {activeTab === 'changelog' && <ChangelogSection />}
          {activeTab === 'faq' && <FaqSection />}
          {activeTab === 'contact' && <ContactSection />}
          {activeTab === 'privacy' && <PrivacySection />}
          {activeTab === 'contribute' && <ContributeSection />}
          {activeTab === 'donate' && <DonateSection />}
          {activeTab === 'thanks' && <ThanksSection />}
        </div>
      </div>
    </div>
  );
});

AboutPage.displayName = 'AboutPage';
export default AboutPage;
