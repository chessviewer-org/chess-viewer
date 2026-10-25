import { memo, useRef, useLayoutEffect, useState, useEffect } from 'react';

import { Link, useLocation, useSearch } from 'wouter';

import { Heart } from '@/assets/icons';

import { Logo } from '@/shared/ui/Logo';
import { useScrollLock } from '@/shared/hooks/useDOM';
import { useNavbarVisibility } from './hooks/useNavbarVisibility';
import { useNavbarState } from './hooks/useNavbarState';
import { NavbarAccountMenu } from './NavbarMenu';
import styles from './styles/navbar.module.scss';
const SECTIONS = [
  ['/', 'Standard'],
  ['/fairy-chess', 'Fairy chess'],
  ['/latex', 'LaTeX'],
  ['/docs', 'Docs']
] as const;

interface NavbarProps {
  rightSlot?: React.ReactNode;
}

function Navbar({ rightSlot }: NavbarProps) {
  const {
    isAuthenticated,
    isAccountOpen,
    setIsAccountOpen,
    accountRef,
    handleLogoClick,
    handleSignOut
  } = useNavbarState();
  const [location] = useLocation();
  const search = useSearch();
  const isCurrent = (href: string) =>
    href === '/about?tab=donate'
      ? location === '/about' &&
        new URLSearchParams(search).get('tab') === 'donate'
      : location === href;
  const [sectionsOpen, setSectionsOpen] = useState(false);
  const sectionToggle = useRef<HTMLButtonElement>(null);
  const sectionsRef = useRef<HTMLDivElement>(null);
  const donateRef = useRef<HTMLAnchorElement>(null);
  useScrollLock(sectionsOpen);
  useEffect(() => {
    const media = window.matchMedia('(min-width: 800px)');
    const close = () => setSectionsOpen(false);
    media.addEventListener('change', close);
    return () => media.removeEventListener('change', close);
  }, []);
  useLayoutEffect(() => {
    setSectionsOpen(false);
  }, [location]);
  useEffect(() => {
    if (!sectionsOpen) return;
    sectionsRef.current?.querySelector<HTMLAnchorElement>('a')?.focus();
    const keyboard = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSectionsOpen(false);
        sectionToggle.current?.focus();
      }
      if (event.key === 'Tab') {
        const links = [
          ...Array.from(
            sectionsRef.current?.querySelectorAll<HTMLAnchorElement>('a') ?? []
          ),
          ...(donateRef.current ? [donateRef.current] : [])
        ];
        const items = sectionToggle.current
          ? [sectionToggle.current, ...links]
          : links;
        const current = items.indexOf(
          document.activeElement as HTMLAnchorElement | HTMLButtonElement
        );
        event.preventDefault();
        items[
          (current + (event.shiftKey ? -1 : 1) + items.length) % items.length
        ]?.focus();
      }
    };
    window.addEventListener('keydown', keyboard);
    return () => window.removeEventListener('keydown', keyboard);
  }, [sectionsOpen]);
  const innerRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const element = innerRef.current;
    if (!element) return;
    const measure = () =>
      document.documentElement.style.setProperty(
        '--navbar-height',
        `${element.getBoundingClientRect().height}px`
      );
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  const navRef = useRef<HTMLElement>(null);
  useNavbarVisibility(isAccountOpen || sectionsOpen, navRef);

  return (
    <>
      <nav
        ref={navRef}
        aria-label="Main navigation"
        data-menu-open={isAccountOpen || sectionsOpen}
        className={`vt-nav ${styles['nav']}`}
      >
        <div ref={innerRef} className={styles['navInner']}>
          <div className={`page-container ${styles['navContent']}`}>
            <div className={styles['navContainer']}>
              <button
                ref={sectionToggle}
                type="button"
                className={styles['sectionsToggle']}
                aria-label="Main sections"
                aria-expanded={sectionsOpen}
                aria-controls="main-sections-panel"
                onClick={() => {
                  setSectionsOpen((value) => !value);
                  setIsAccountOpen(false);
                }}
              >
                <span
                  className={styles['hamburger']}
                  data-open={sectionsOpen}
                  aria-hidden="true"
                >
                  <span />
                  <span />
                  <span />
                </span>
              </button>
              <button
                type="button"
                onClick={handleLogoClick}
                aria-label="ChessViewer home"
                className={styles['logoBtn']}
              >
                <div className={styles['logoInner']}>
                  <Logo className={styles['logoImg'] ?? ''} />
                  <div className={styles['logoTextWrapper']}>
                    <span className={styles['logoText']}>ChessViewer</span>
                  </div>
                </div>
              </button>

              <div className={styles['sectionLinks']}>
                {SECTIONS.map(([href, label]) => (
                  <Link
                    key={href}
                    href={href!}
                    aria-current={isCurrent(href) ? 'page' : undefined}
                    className={styles['sectionLink']}
                    onClick={() => setIsAccountOpen(false)}
                  >
                    {label}
                  </Link>
                ))}
              </div>
              <Link
                ref={donateRef}
                href="/about?tab=donate"
                aria-current={
                  isCurrent('/about?tab=donate') ? 'page' : undefined
                }
                className={`${styles['sectionLink']} ${styles['donateLink']}`}
                onClick={() => {
                  setSectionsOpen(false);
                  setIsAccountOpen(false);
                }}
              >
                <span className="inline-flex items-center gap-1.5">
                  <Heart className={styles['donateIcon']} aria-hidden="true" />
                  Donate
                </span>
              </Link>

              <div className={styles['navActions']}>
                {rightSlot}
                <NavbarAccountMenu
                  isAuthenticated={isAuthenticated}
                  isOpen={isAccountOpen}
                  onOpenChange={(open) => {
                    if (open) setSectionsOpen(false);
                    setIsAccountOpen(open);
                  }}
                  accountRef={accountRef}
                  handleSignOut={handleSignOut}
                />
              </div>
            </div>
          </div>
        </div>
      </nav>
      <div
        className={styles['sectionsBackdrop']}
        data-open={sectionsOpen || isAccountOpen}
        aria-hidden="true"
        onClick={() => {
          setSectionsOpen(false);
          setIsAccountOpen(false);
        }}
      />
      <div
        id="main-sections-panel"
        ref={sectionsRef}
        className={styles['sectionsPanel']}
        data-open={sectionsOpen}
        inert={!sectionsOpen}
        aria-hidden={!sectionsOpen}
      >
        {SECTIONS.map(([href, label]) => (
          <Link
            key={href}
            href={href!}
            aria-current={isCurrent(href) ? 'page' : undefined}
            onClick={() => {
              setSectionsOpen(false);
              sectionToggle.current?.focus();
            }}
          >
            {label}
          </Link>
        ))}
      </div>
    </>
  );
}

const MemoizedNavbar = memo(Navbar);

export { MemoizedNavbar as Navbar };
