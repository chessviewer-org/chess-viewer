import React from 'react';

import { Home, RefreshCw } from 'lucide-react';

import { Logo } from '@/components/layout/Logo';

import { logger } from '@utils';

/** Props for the `ErrorFallback` component. */
interface ErrorFallbackProps {
  error: Error | null;
  resetErrorBoundary: () => void;
}

/**
 * Full-page fallback UI displayed when `ErrorBoundary` catches an unhandled
 * render error. Professional, brand-led apology screen — logo lockup, a clear
 * apology, and recovery actions. No raw error details are exposed to the user.
 */
function ErrorFallback({ resetErrorBoundary }: ErrorFallbackProps) {
  return (
    <div
      role="alert"
      aria-live="assertive"
      className="min-h-dvh w-full flex flex-col items-center justify-center px-6 py-16 bg-bg text-text-primary"
    >
      <div className="w-full max-w-md text-center animate-fadeIn">
        {/* Brand lockup: the real accent-themed logo + wordmark. */}
        <div className="inline-flex items-center gap-2.5 mb-12">
          <Logo className="w-9 h-9 object-contain" />
          <span className="text-xl font-display font-bold text-text-primary tracking-tight">
            ChessVision
          </span>
        </div>

        <h1 className="text-h2 font-display font-bold text-text-primary mb-3">
          We&rsquo;re sorry — something went wrong
        </h1>
        <p className="text-text-secondary text-fluid-base leading-relaxed mb-10">
          An unexpected error stopped this page from loading. Our team has been
          notified. Please try again, or return home — your work is safe.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            type="button"
            onClick={resetErrorBoundary}
            className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-accent hover:bg-accent-hover text-bg rounded-xl font-bold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            aria-label="Try again to recover from error"
          >
            <RefreshCw className="w-5 h-5" aria-hidden="true" />
            Try Again
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
