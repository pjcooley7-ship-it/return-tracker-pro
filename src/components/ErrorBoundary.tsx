import { Component } from 'react';
import type { ReactNode, ErrorInfo } from 'react';
import { logger } from '@/lib/logger';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    logger.fatal(error.message, {
      source: 'ErrorBoundary',
      stack: error.stack ?? undefined,
      metadata: { componentStack: info.componentStack ?? undefined },
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-muted">
          <div className="mx-auto max-w-md text-center p-8">
            <h1 className="mb-4 text-2xl font-bold">Something went wrong</h1>
            <p className="mb-6 text-muted-foreground">
              An unexpected error occurred. Please try refreshing the page.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="rounded-md bg-primary px-6 py-2 text-primary-foreground hover:bg-primary/90"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
