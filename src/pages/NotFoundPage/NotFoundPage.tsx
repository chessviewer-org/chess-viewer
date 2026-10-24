import { ArrowLeft, Home } from '@/assets/icons';
import { Link, useLocation } from 'wouter';

import { Logo } from '@/shared/ui/Logo';
import { Seo } from '@/shared/ui/Seo';
import styles from './styles/not-found.module.scss';

const LINKS = [
  ['/', 'Standard editor'],
  ['/fairy-chess', 'Fairy chess'],
  ['/latex', 'LaTeX'],
  ['/about', 'About']
] as const;

function NotFoundPage() {
  const [location] = useLocation();
  const canGoBack = window.history.length > 1;

  return (
    <div className={styles['page']}>
      <Seo name="Page Not Found" noindex />
      <div className={styles['card']}>
        <Logo className={styles['logo'] ?? ''} />
        <p className={styles['code']}>Error 404</p>
        <h1 className={styles['title']}>Page not found</h1>
        <p className={styles['lead']}>
          The page you are looking for does not exist or has been moved.
        </p>
        <code className={styles['path']} title={location}>
          {location}
        </code>

        <div className={styles['actions']}>
          <Link href="/" className={`${styles['button']} ${styles['primary']}`}>
            <Home aria-hidden="true" />
            Back to the editor
          </Link>
          {canGoBack && (
            <button
              type="button"
              onClick={() => window.history.back()}
              className={`${styles['button']} ${styles['secondary']}`}
            >
              <ArrowLeft aria-hidden="true" />
              Go back
            </button>
          )}
        </div>

        <nav aria-label="Popular pages" className={styles['links']}>
          <span className={styles['linksLabel']}>Popular pages</span>
          {LINKS.map(([href, label]) => (
            <Link key={href} href={href}>
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
export default NotFoundPage;
