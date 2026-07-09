import { memo, type ReactNode, type Ref } from 'react';

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
    <div className="page-container flex flex-col gap-6 py-6 sm:py-8 md:h-[calc(100vh-var(--navbar-height))] md:min-h-0 md:flex-row md:gap-8 lg:gap-10">
      <div className="shrink-0 mb-6 md:mb-0 md:w-52 lg:w-56">
        <div className="md:sticky md:top-8">{sidebar}</div>
      </div>

      <div
        aria-hidden="true"
        className="hidden md:block w-px shrink-0 self-stretch bg-border"
      />

      <div
        ref={contentRef}
        data-page-scroll
        role="region"
        aria-label={contentLabel}
        className="min-w-0 flex-1 md:min-h-0 md:overflow-y-auto lg:overflow-y-auto pb-5"
      >
        {children}
      </div>
    </div>
  );
});

PageSidebarLayout.displayName = 'PageSidebarLayout';

export { PageSidebarLayout };
