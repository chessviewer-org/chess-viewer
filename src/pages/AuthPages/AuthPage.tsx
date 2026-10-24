import { LogIn, UserPlus } from '@/assets/icons';
import { useRef, type ReactNode } from 'react';
import { useLocation } from 'wouter';

import { getRouteSeo } from '@constants';
import { PageSidebarLayout } from '@/components/layout/Sidebar/PageSidebarLayout';
import {
  PageTabs,
  type PageTabGroup
} from '@/components/layout/Sidebar/PageTabs';
import { Seo } from '@/shared/ui/Seo';

// Constants
const GROUPS: PageTabGroup[] = [
  {
    items: [
      { id: 'sign-in', label: 'Sign In', icon: LogIn },
      { id: 'sign-up', label: 'Sign Up', icon: UserPlus }
    ]
  }
];

// Types
interface AuthPageProps {
  children: ReactNode;
}

export function AuthPage({ children }: AuthPageProps) {
  const [pathname, navigate] = useLocation();
  const contentRef = useRef<HTMLDivElement>(null);

  let activeId = '';
  if (
    pathname.includes('sign-in') ||
    pathname.includes('mfa') ||
    pathname.includes('forgot-password')
  )
    activeId = 'sign-in';
  else if (pathname.includes('sign-up')) activeId = 'sign-up';

  return (
    <div className="flex-1 bg-bg">
      <Seo {...getRouteSeo(pathname)} />
      <PageSidebarLayout
        contentRef={contentRef}
        contentLabel="Authentication"
        sidebar={
          <PageTabs
            groups={GROUPS}
            activeId={activeId}
            onSelect={(id) => navigate(`/auth/${id}`)}
            ariaLabel="Authentication sections"
          />
        }
      >
        <div className="flex w-full h-full items-center justify-center p-4">
          <div className="w-full max-w-sm">{children}</div>
        </div>
      </PageSidebarLayout>
    </div>
  );
}
