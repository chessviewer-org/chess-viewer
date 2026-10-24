import { memo, type ReactNode, type Ref } from 'react';

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
