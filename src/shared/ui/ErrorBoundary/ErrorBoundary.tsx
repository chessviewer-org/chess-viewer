import React from 'react';

import { Home, Mail, RefreshCw } from 'lucide-react';

import { Logo } from '@/components/layout';

import { logger } from '@utils';

/** Props for the `ErrorFallback` component. */
interface ErrorFallbackProps {
  error: Error | null;
  resetErrorBoundary: () => void;
}

/** Support address users can reach to report an unrecoverable error. */
const SUPPORT_EMAIL = 'contact@chessvision.org';

/**
 * Full-page fallback UI displayed when `ErrorBoundary` catches an unhandled
 * render error. Professional, brand-led status screen — logo lockup, a precise
 * statement of the failure, recovery actions, and a way to report the error.
 * No raw error details are exposed to the user.
 */
function ErrorFallback({ error, resetErrorBoundary }: ErrorFallbackProps) {
  const reportSubject = encodeURIComponent('ChessVision — Error report');
  const reportBody = encodeURIComponent(
    [
      'Please describe what you were doing when the error occurred:',
      '',
      '',
      '— — — — — — — — — —',
      'Technical details (do not edit):',
      `Reference: ${error?.name ?? 'UnknownError'}`,
      `Page: ${typeof window !== 'undefined' ? window.location.href : 'unknown'}`
    ].join('\n')
  );
  const reportHref = `mailto:${SUPPORT_EMAIL}?subject=${reportSubject}&body=${reportBody}`;

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="min-h-dvh w-full flex flex-col items-center justify-center px-6 py-16 bg-bg text-text-primary"
    >
      <div className="w-full max-w-md text-center animate-fadeIn">
        {/* Brand lockup: the real accent-themed logo + wordmark. */}
        <div className="inline-flex items-center justify-center gap-3 mb-12">
          <Logo className="w-12 h-12 object-contain" />
          <span className="text-2xl font-display font-bold text-text-primary tracking-tight">
            ChessVision
          </span>
        </div>

        <h1 className="text-h2 font-display font-bold text-text-primary text-center mb-3">
          We&rsquo;re sorry &mdash; something went wrong
        </h1>
        <p className="text-text-secondary text-fluid-base leading-relaxed text-center mx-auto max-w-sm mb-10">
          An unexpected error prevented this page from loading. We apologise for
          the inconvenience. Your saved work is safe &mdash; reload the page to
          continue, or return to the home page.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            type="button"
            onClick={resetErrorBoundary}
            className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-accent hover:bg-accent-hover text-bg rounded-xl font-bold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            aria-label="Reload to recover from error"
          >
            <RefreshCw className="w-5 h-5" aria-hidden="true" />
            Reload
          </button>

          <a
            href="/"
            className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-surface-elevated text-text-primary rounded-xl font-bold hover:bg-surface-hover transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            aria-label="Return to home page"
          >
            <Home className="w-5 h-5" aria-hidden="true" />
            Go Home
          </a>
        </div>

        {/* Reporting channel: opens a pre-filled mail draft to support. */}
        <p className="mt-10 text-sm text-text-secondary text-center">
          If the problem persists, report it to{' '}
          <a
            href={reportHref}
            className="inline-flex items-center gap-1 font-semibold text-accent hover:text-accent-hover underline-offset-4 hover:underline transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-sm"
          >
            <Mail className="w-4 h-4" aria-hidden="true" />
            {SUPPORT_EMAIL}
          </a>
        </p>
      </div>
    </div>
  );
}
/** Props for the `ErrorBoundary` class component. */
interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  FallbackComponent?: React.ComponentType<{
    error: Error | null;
    resetErrorBoundary: () => void;
  }>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * React class-based error boundary.
 *
 * Catches unhandled render errors in the subtree and renders a fallback UI.
 * Supports custom `FallbackComponent`, a static `fallback` node, or defaults
 * to `ErrorFallback`.
 */
class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error: error
    };
  }

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logger.error('ErrorBoundary caught an error:', error, errorInfo);
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  resetErrorBoundary = () => {
    this.setState({
      hasError: false,
      error: null
    });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  override render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      if (this.props.FallbackComponent) {
        const FallbackComponent = this.props.FallbackComponent;
        return (
          <FallbackComponent
            error={this.state.error}
            resetErrorBoundary={this.resetErrorBoundary}
          />
        );
      }
      return (
        <ErrorFallback
          error={this.state.error}
          resetErrorBoundary={this.resetErrorBoundary}
        />
      );
    }
    return this.props.children;
  }
}
export { ErrorBoundary };
