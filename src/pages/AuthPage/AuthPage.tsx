import { motion } from 'framer-motion';
import { LogIn, UserPlus } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';

interface AuthSidebarLink {
  to: string;
  label: string;
  icon: typeof LogIn;
}

const SIDEBAR_LINKS: AuthSidebarLink[] = [
  { to: '/auth/sign-in', label: 'Sign In', icon: LogIn },
  { to: '/auth/sign-up', label: 'Sign Up', icon: UserPlus }
];

interface AuthPageProps {
  children: ReactNode;
}

/**
 * Shared shell for the dedicated auth routes. Renders a left navigation rail
 * (Sign In / Sign Up + Back to Home) and a vertically centered content column
 * for the active form. The global app `<Navbar>` already sits above this via the
 * app shell, so this layout only owns the sidebar + content split.
 */
export function AuthPage({ children }: AuthPageProps) {
  const { pathname } = useLocation();

  const sidebarLinkClass = (to: string) => {
    const isActive = pathname === to;
    return [
      'flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm transition-colors',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
      isActive
        ? 'bg-accent/10 text-accent font-semibold'
        : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'
    ].join(' ');
  };

  return (
    <div className="page-container flex min-h-full flex-col bg-bg md:h-full md:max-h-full md:flex-row md:overflow-hidden">
      <aside className="shrink-0 border-b border-border/40 bg-bg px-4 py-5 md:w-55 md:border-b-0 md:border-r md:px-5 md:py-8">
        <nav
          aria-label="Authentication"
          className="flex flex-col gap-1 md:gap-1.5"
        >
          {SIDEBAR_LINKS.map(({ to, label, icon: Icon }) => (
            <Link key={to} to={to} className={sidebarLinkClass(to)}>
              <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{label}</span>
            </Link>
          ))}
        </nav>
      </aside>

      <main className="flex flex-1 items-center justify-center px-4 py-10 md:overflow-y-auto md:px-6">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-sm"
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
}
