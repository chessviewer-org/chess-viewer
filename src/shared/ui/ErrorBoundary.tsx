import React from 'react';

import { Home, Mail, RefreshCw, Check, Copy } from '@/assets/icons';

import { Logo } from '@/shared/ui';

import { logger } from '@/shared/utils';

interface ErrorFallbackProps {
  error: Error | null;
  resetErrorBoundary: () => void;
}

const SUPPORT_EMAIL = 'contact@chessvision.org';

function ErrorFallback({ resetErrorBoundary }: ErrorFallbackProps) {
  const [copied, setCopied] = React.useState(false);

  const handleCopyEmail = () => {
    void navigator.clipboard.writeText(SUPPORT_EMAIL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="min-h-dvh w-full flex flex-col items-center justify-center px-6 py-16 bg-bg text-text-primary"
    >
      <div className="w-full max-w-md text-center animate-fadeIn">
        <div className="inline-flex items-center justify-center gap-3 mb-12">
          <Logo className="w-12 h-12 object-contain" />
          <span className="text-2xl font-display font-bold text-text-primary tracking-tight">
            ChessViewer
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

        <div className="mt-10 flex flex-wrap items-center justify-center gap-2.5">
          <p className="text-sm text-text-secondary">
            If the problem persists, report it to
          </p>
          <div className="inline-flex items-center gap-1">
            <span className="inline-flex items-center gap-1 font-semibold text-accent bg-accent/10 px-2 py-1 rounded-md">
              <Mail className="w-4 h-4" aria-hidden="true" />
              <span>{SUPPORT_EMAIL}</span>
            </span>
            <button
              onClick={handleCopyEmail}
              className="p-1.5 rounded-md bg-surface hover:bg-surface-hover text-text-secondary hover:text-text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              aria-label="Copy email address"
              title="Copy email address"
            >
              {copied ? (
                <Check className="w-4 h-4 text-green-500" aria-hidden="true" />
              ) : (
                <Copy className="w-4 h-4" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

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
