import {
  type ComponentType,
  memo,
  useCallback,
  useEffect,
  useRef
} from 'react';
import { useLocation } from 'wouter';

import {
  BookOpen,
  Code2,
  Download,
  History,
  Layers,
  MousePointer,
  Settings,
  Sparkles,
  Zap
} from '@/assets/icons';
import { PageSidebarLayout } from '@/components/layout/Sidebar/PageSidebarLayout';
import {
  type PageTabGroup,
  PageTabs
} from '@/components/layout/Sidebar/PageTabs';
import { getRouteSeo } from '@constants';
import { useEscapeKey } from '@/shared/hooks/useKeyboard';
import { useSearchParams } from '@/shared/hooks/useSearchParams';
import { Seo } from '@/shared/ui/Seo';

import BatchSection from './components/BatchSection';
import EditorSection from './components/EditorSection';
import ExportSection from './components/ExportSection';
import FairyChessSection from './components/FairyChessSection';
import HistorySection from './components/HistorySection';
import LatexSection from './components/LatexSection';
import OverviewSection from './components/OverviewSection';
import SettingsSection from './components/SettingsSection';
import ShortcutsSection from './components/ShortcutsSection';

const GROUPS: readonly PageTabGroup[] = [
  {
    label: 'Getting started',
    items: [
      { id: 'overview', label: 'Overview', icon: BookOpen },
      { id: 'editor', label: 'Standard editor', icon: MousePointer },
      { id: 'export', label: 'Export images', icon: Download },
      { id: 'batch', label: 'Batch export', icon: Layers }
    ]
  },
  {
    label: 'Studios',
    items: [
      { id: 'fairy-chess', label: 'Fairy chess', icon: Sparkles },
      { id: 'latex', label: 'LaTeX Studio', icon: Code2 }
    ]
  },
  {
    label: 'Your data',
    items: [
      { id: 'history', label: 'History and favourites', icon: History },
      { id: 'settings', label: 'Settings and account', icon: Settings },
      { id: 'shortcuts', label: 'Keyboard shortcuts', icon: Zap }
    ]
  }
];

const SECTIONS = new Map<string, ComponentType>([
  ['overview', OverviewSection],
  ['editor', EditorSection],
  ['export', ExportSection],
  ['batch', BatchSection],
  ['fairy-chess', FairyChessSection],
  ['latex', LatexSection],
  ['history', HistorySection],
  ['settings', SettingsSection],
  ['shortcuts', ShortcutsSection]
]);

const DEFAULT_TAB = 'overview';

const DocsPage = memo(function DocsPage() {
  const [, navigate] = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedTab = searchParams.get('tab');
  const activeTab =
    requestedTab && SECTIONS.has(requestedTab) ? requestedTab : DEFAULT_TAB;
  const Section = SECTIONS.get(activeTab) ?? OverviewSection;

  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (requestedTab && !SECTIONS.has(requestedTab)) {
      setSearchParams({ tab: DEFAULT_TAB }, { replace: true });
    }
  }, [requestedTab, setSearchParams]);

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
      <Seo {...getRouteSeo('/docs')} />
      <h1 className="sr-only">ChessViewer documentation</h1>
      <PageSidebarLayout
        contentRef={contentRef}
        contentLabel="Documentation"
        sidebar={
          <PageTabs
            groups={GROUPS}
            activeId={activeTab}
            onSelect={handleSelect}
            ariaLabel="Documentation sections"
          />
        }
      >
        <Section />
      </PageSidebarLayout>
    </div>
  );
});

DocsPage.displayName = 'DocsPage';
export default DocsPage;
