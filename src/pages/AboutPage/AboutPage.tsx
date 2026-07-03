import { memo, useCallback, useEffect, useRef, useState } from 'react';

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
import { getRouteSeo, ORGANIZATION_SCHEMA, WEBSITE_SCHEMA } from '@constants';

import { Seo } from '@shared/ui';
import {
  AboutMainSection,
  ChangelogSection,
  ContactSection,
  ContributeSection,
  DonateSection,
  FaqSection,
  PrivacySection,
  ThanksSection
} from './sections';

const groups: readonly PageTabGroup[] = [
  {
    label: 'Project',
    items: [
      { id: 'about', label: 'About ChessVision', icon: Info },
      { id: 'changelog', label: 'Changelog', icon: History },
      { id: 'privacy', label: 'Privacy', icon: Shield }
    ]
  },
  {
    label: 'Help',
    items: [
      { id: 'faq', label: 'FAQ', icon: HelpCircle },
      { id: 'contact', label: 'Contact', icon: Mail }
    ]
  },
  {
    label: 'Community',
    items: [
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
  const contentRef = useRef<HTMLDivElement>(null);

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
      // Each section starts at its top, not wherever the previous one was left.
      contentRef.current?.scrollTo({ top: 0 });
    },
    [setSearchParams]
  );

  return (
    <div className="min-h-full bg-bg md:h-full md:max-h-full">
      <Seo
        {...getRouteSeo('/about')}
        schema={[WEBSITE_SCHEMA, ORGANIZATION_SCHEMA]}
      />
      <h1 className="sr-only">About ChessVision</h1>
      {/* Two-column split pane, constrained to the navbar's width so the page
          reads as one column under the bar (GitHub-settings pattern, mirroring
          the Settings page layout). At lg+ the shell locks the outer page, the
          row fills the visible height and ONLY the right content column
          scrolls — the rail and the separator stay put. Below lg the window
          scrolls and the rail falls back to `sticky`, offset past the fixed
          navbar. */}
      <div className="page-container flex flex-col gap-6 py-6 sm:py-10 md:h-full md:min-h-0 md:flex-row md:gap-8 lg:gap-10">
        <div className="shrink-0 mb-6 md:mb-0 md:w-52 lg:w-56">
          <div className="md:sticky md:top-[calc(var(--navbar-height)+2.5rem)]">
            <PageTabs
              groups={groups}
              activeId={activeTab}
              onSelect={handleSelect}
              ariaLabel="About sections"
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
          aria-label="About content"
          className="min-w-0 flex-1 md:min-h-0 md:overflow-y-auto lg:overflow-y-auto pb-8 sm:pb-12"
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
