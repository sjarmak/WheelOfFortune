import { Component, ReactNode, ErrorInfo } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

/**
 * Root-level React ErrorBoundary.
 *
 * Catches hydration/render failures so the app does not produce a white
 * screen. In development builds (`import.meta.env.DEV`) the caught error's
 * message and stack trace are displayed to aid debugging; in production
 * builds a minimal fallback with a Reload button is shown instead.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Surface the error for developers while still rendering a fallback UI.
    // eslint-disable-next-line no-console
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReload = (): void => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  render(): ReactNode {
    if (!this.state.hasError) {
      return this.props.children;
    }

    if (this.props.fallback !== undefined) {
      return this.props.fallback;
    }

    const isDev = Boolean(import.meta.env?.DEV);
    const error = this.state.error;

    return (
      <div
        role="alert"
        style={{
          width: '100%',
          minHeight: '100vh',
          background: '#1a1a2e',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          boxSizing: 'border-box',
        }}
      >
        <div style={{ textAlign: 'center', maxWidth: 720, width: '100%' }}>
          <h1 style={{ marginBottom: 12 }}>Something went wrong</h1>
          <p style={{ marginBottom: 16 }}>
            The app hit an unexpected error. Try reloading to recover.
          </p>
          <button
            type="button"
            onClick={this.handleReload}
            style={{
              padding: '10px 20px',
              background: '#2563eb',
              color: 'white',
              border: 'none',
              borderRadius: 6,
              fontWeight: 'bold',
              cursor: 'pointer',
            }}
          >
            Reload
          </button>
          {isDev && error && (
            <div style={{ marginTop: 24, textAlign: 'left' }}>
              <div
                data-testid="error-boundary-dev-banner"
                style={{
                  background: '#b91c1c',
                  color: 'white',
                  padding: '8px 12px',
                  borderRadius: 4,
                  fontWeight: 'bold',
                  marginBottom: 8,
                }}
              >
                DEV: {error.message}
              </div>
              <pre
                style={{
                  background: '#0f3460',
                  padding: 10,
                  borderRadius: 5,
                  overflow: 'auto',
                  maxHeight: 300,
                  fontSize: 12,
                  whiteSpace: 'pre-wrap',
                }}
              >
                {error.stack}
              </pre>
            </div>
          )}
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
