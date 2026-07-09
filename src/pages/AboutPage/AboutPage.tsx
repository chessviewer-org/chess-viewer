import { useLocation } from 'wouter';
import { memo, useCallback, useEffect, useRef } from 'react';
import { useEscapeKey, useSearchParams } from '@hooks';

import {
  Code2,
  Heart,
  HeartHandshake,
  HelpCircle,
  History,
  Info,
  Mail,
  Shield
} from '@/assets/icons';

import {
  type PageTabGroup,
  PageSidebarLayout,
  PageTabs
} from '@/components/layout';
import { getRouteSeo, ORGANIZATION_SCHEMA, WEBSITE_SCHEMA } from '@constants';
import { pageScrollToY } from '@utils';

import { Seo } from '@ui';
import {
  AboutMainSection,
  ChangelogSection,
  ContactSection,
  ContributeSection,
  DonateSection,
  FaqSection,
  PrivacySection,
  ThanksSection
} from './components';

// Constants
const groups: readonly PageTabGroup[] = [
  {
    label: 'Project',
    items: [
      { id: 'about', label: 'About ChessViewer', icon: Info },
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

const AboutPage = memo(function AboutPage() {
  const [, navigate] = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedTab = searchParams.get('tab');
  const activeTab =
    requestedTab && VALID_TAB_IDS.has(requestedTab)
      ? requestedTab
      : DEFAULT_TAB;

  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (requestedTab && !VALID_TAB_IDS.has(requestedTab)) {
      setSearchParams({ tab: DEFAULT_TAB }, { replace: true });
    }
  }, [requestedTab, setSearchParams]);

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
      <Seo
        {...getRouteSeo('/about')}
        schema={[WEBSITE_SCHEMA, ORGANIZATION_SCHEMA]}
      />
      <h1 className="sr-only">About ChessViewer</h1>
      <PageSidebarLayout
        contentRef={contentRef}
        contentLabel="About content"
        sidebar={
          <PageTabs
            groups={groups}
            activeId={activeTab}
            onSelect={handleSelect}
            ariaLabel="About sections"
          />
        }
      >
        {activeTab === 'about' && <AboutMainSection />}
        {activeTab === 'changelog' && <ChangelogSection />}
        {activeTab === 'faq' && <FaqSection />}
        {activeTab === 'contact' && <ContactSection />}
        {activeTab === 'privacy' && <PrivacySection />}
        {activeTab === 'contribute' && <ContributeSection />}
        {activeTab === 'donate' && <DonateSection />}
        {activeTab === 'thanks' && <ThanksSection />}
      </PageSidebarLayout>
    </div>
  );
});

AboutPage.displayName = 'AboutPage';
export default AboutPage;
