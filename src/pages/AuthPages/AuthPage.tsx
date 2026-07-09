import { LogIn, UserPlus } from '@/assets/icons';
import { useRef, type ReactNode } from 'react';
import { useLocation } from 'wouter';

import {
  PageSidebarLayout,
  PageTabs,
  type PageTabGroup
} from '@/components/layout';

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
    <div className="min-h-full bg-bg lg:h-full lg:max-h-full">
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
