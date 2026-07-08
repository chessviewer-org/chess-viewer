import { ArrowLeft, Crown, Home } from '@/assets/icons';
import { Link } from 'wouter';

import { Seo } from '@shared/ui';

function NotFoundPage() {
  return (
    <div className="w-full flex flex-col flex-1 items-center justify-center px-4 py-12 sm:py-16 bg-bg">
      <Seo name="Page Not Found" noindex />
      <div className="text-center max-w-lg animate-fadeIn">
        <div className="relative mb-8">
          <div className="w-24 h-24 rounded-2xl bg-linear-to-br from-accent/20 to-accent/10 flex items-center justify-center mx-auto">
            <Crown
              className="w-12 h-12 text-text-secondary"
              aria-hidden="true"
            />
          </div>
        </div>

        <span className="text-7xl sm:text-8xl lg:text-9xl font-display font-bold bg-linear-to-r from-accent via-text-primary to-accent bg-clip-text text-transparent block mb-6">
          404
        </span>

        <h1 className="text-h1 font-display font-bold text-text-primary mb-4">
          Page Not Found
        </h1>
        <p className="text-text-secondary text-fluid-base sm:text-lg mb-10 leading-relaxed">
          The page you are looking for does not exist or has been moved.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-linear-to-r from-accent to-accent-hover text-bg rounded-xl font-bold shadow-lg hover:shadow-xl transition-shadow duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
          >
            <Home className="w-5 h-5" aria-hidden="true" />
            Go Home
          </Link>
          <button
            type="button"
            onClick={() => window.history.back()}
            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-surface-elevated text-text-primary rounded-xl font-bold hover:bg-surface-hover transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <ArrowLeft className="w-5 h-5" aria-hidden="true" />
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
}
export default NotFoundPage;
