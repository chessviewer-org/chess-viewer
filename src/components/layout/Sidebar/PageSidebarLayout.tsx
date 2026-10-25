import { memo, type ReactNode, type Ref, useLayoutEffect } from 'react';

import { NAVBAR_PINNED_CLASS } from '@/components/layout/Navbar/hooks/useNavbarVisibility';
import styles from './styles/page-sidebar-layout.module.scss';

interface PageSidebarLayoutProps {
  sidebar: ReactNode;
  children: ReactNode;
  contentRef: Ref<HTMLDivElement>;
  contentLabel: string;
}

const PageSidebarLayout = memo(function PageSidebarLayout({
  sidebar,
  children,
  contentRef,
  contentLabel
}: PageSidebarLayoutProps) {
  useLayoutEffect(() => {
    const { classList } = document.documentElement;
    classList.add(NAVBAR_PINNED_CLASS);
    return () => classList.remove(NAVBAR_PINNED_CLASS);
  }, []);

  return (
    <div className={`page-container ${styles['layout']}`}>
      <div className={styles['aside']}>{sidebar}</div>
      <div
        ref={contentRef}
        role="region"
        aria-label={contentLabel}
        className={styles['content']}
      >
        {children}
      </div>
    </div>
  );
});

PageSidebarLayout.displayName = 'PageSidebarLayout';

export { PageSidebarLayout };
