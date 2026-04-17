import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ErrorBoundary } from '../ErrorBoundary';

/**
 * Child component that throws synchronously during render.
 * Used to drive ErrorBoundary into the error state via real React lifecycle
 * (getDerivedStateFromError + componentDidCatch), not mocks.
 */
function Exploder({ message }: { message: string }): JSX.Element {
  throw new Error(message);
}

describe('ErrorBoundary', () => {
  // React logs caught errors to console.error; silence the noise in tests.
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('renders children when no error is thrown', () => {
    render(
      <ErrorBoundary>
        <div>healthy child</div>
      </ErrorBoundary>
    );

    expect(screen.getByText('healthy child')).toBeInTheDocument();
  });

  it('renders the fallback UI with a Reload button when a child throws', () => {
    render(
      <ErrorBoundary>
        <Exploder message="kaboom" />
      </ErrorBoundary>
    );

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reload/i })).toBeInTheDocument();
  });

  it('shows the dev stack banner when import.meta.env.DEV is true', () => {
    // Vitest runs with import.meta.env.DEV === true by default.
    render(
      <ErrorBoundary>
        <Exploder message="dev-visible-message" />
      </ErrorBoundary>
    );

    const banner = screen.getByTestId('error-boundary-dev-banner');
    expect(banner).toBeInTheDocument();
    expect(banner.textContent).toContain('dev-visible-message');
  });

  it('renders a custom fallback when provided', () => {
    render(
      <ErrorBoundary fallback={<div>custom fallback</div>}>
        <Exploder message="ignored" />
      </ErrorBoundary>
    );

    expect(screen.getByText('custom fallback')).toBeInTheDocument();
  });
});
