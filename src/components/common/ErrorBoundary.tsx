'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// ============================================================================
// TYPES
// ============================================================================

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showDetails?: boolean;
  resetKeys?: unknown[];
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showErrorDetails: boolean;
}

// ============================================================================
// ERROR BOUNDARY COMPONENT
// ============================================================================

/**
 * Error Boundary component that catches JavaScript errors in child components
 *
 * @example
 * ```tsx
 * <ErrorBoundary
 *   onError={(error) => logToService(error)}
 *   fallback={<CustomErrorUI />}
 * >
 *   <YourComponent />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showErrorDetails: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });

    // Log error to external service
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps): void {
    // Reset error state when resetKeys change
    if (
      this.state.hasError &&
      this.props.resetKeys &&
      prevProps.resetKeys &&
      !this.arraysEqual(prevProps.resetKeys, this.props.resetKeys)
    ) {
      this.resetError();
    }
  }

  private arraysEqual(a: unknown[], b: unknown[]): boolean {
    if (a.length !== b.length) return false;
    return a.every((val, idx) => val === b[idx]);
  }

  resetError = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      showErrorDetails: false,
    });
  };

  toggleErrorDetails = (): void => {
    this.setState((prev) => ({ showErrorDetails: !prev.showErrorDetails }));
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <DefaultErrorFallback
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          showDetails={this.props.showDetails}
          showErrorDetails={this.state.showErrorDetails}
          onReset={this.resetError}
          onToggleDetails={this.toggleErrorDetails}
        />
      );
    }

    return this.props.children;
  }
}

// ============================================================================
// DEFAULT ERROR FALLBACK UI
// ============================================================================

interface DefaultErrorFallbackProps {
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDetails?: boolean;
  showErrorDetails: boolean;
  onReset: () => void;
  onToggleDetails: () => void;
}

function DefaultErrorFallback({
  error,
  errorInfo,
  showDetails = false,
  showErrorDetails,
  onReset,
  onToggleDetails,
}: DefaultErrorFallbackProps) {
  const handleGoHome = () => {
    window.location.href = '/';
  };

  const handleReload = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-[400px] flex items-center justify-center p-6">
      <Card className="w-full max-w-lg border-red-200 dark:border-red-900">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <CardTitle className="text-xl text-red-700 dark:text-red-400">
            Something went wrong
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <p className="text-center text-stone-600 dark:text-stone-400">
            We encountered an unexpected error. Please try refreshing the page or
            return to the home page.
          </p>

          {/* Error message preview */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 text-sm">
              <p className="text-red-800 dark:text-red-300 font-mono break-all">
                {error.message || 'Unknown error'}
              </p>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-3 justify-center pt-2">
            <Button
              variant="outline"
              onClick={handleGoHome}
              className="gap-2"
            >
              <Home className="w-4 h-4" />
              Go Home
            </Button>
            <Button
              onClick={handleReload}
              className="gap-2 bg-[#0a1628] hover:bg-[#0a1628]/90"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </Button>
          </div>

          <div className="text-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={onReset}
              className="text-stone-500 hover:text-stone-700"
            >
              Try Again
            </Button>
          </div>

          {/* Expandable error details (dev mode) */}
          {showDetails && (error || errorInfo) && (
            <div className="border-t pt-4 mt-4">
              <button
                onClick={onToggleDetails}
                className="flex items-center gap-2 text-sm text-stone-500 hover:text-stone-700 w-full justify-center"
              >
                {showErrorDetails ? (
                  <>
                    <ChevronUp className="w-4 h-4" />
                    Hide Details
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4" />
                    Show Details
                  </>
                )}
              </button>

              {showErrorDetails && (
                <div className="mt-4 space-y-3">
                  {error?.stack && (
                    <div>
                      <h4 className="text-xs font-medium text-stone-500 mb-1">
                        Stack Trace
                      </h4>
                      <pre className="text-xs bg-stone-100 dark:bg-stone-800 p-3 rounded-lg overflow-auto max-h-48 text-stone-700 dark:text-stone-300">
                        {error.stack}
                      </pre>
                    </div>
                  )}

                  {errorInfo?.componentStack && (
                    <div>
                      <h4 className="text-xs font-medium text-stone-500 mb-1">
                        Component Stack
                      </h4>
                      <pre className="text-xs bg-stone-100 dark:bg-stone-800 p-3 rounded-lg overflow-auto max-h-48 text-stone-700 dark:text-stone-300">
                        {errorInfo.componentStack}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================================
// HIGHER-ORDER COMPONENT
// ============================================================================

/**
 * HOC to wrap a component with an error boundary
 *
 * @example
 * ```tsx
 * const SafeComponent = withErrorBoundary(DangerousComponent, {
 *   onError: (error) => logError(error),
 * });
 * ```
 */
export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
): React.FC<P> {
  const WithErrorBoundary: React.FC<P> = (props) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <WrappedComponent {...props} />
    </ErrorBoundary>
  );

  WithErrorBoundary.displayName = `withErrorBoundary(${
    WrappedComponent.displayName || WrappedComponent.name || 'Component'
  })`;

  return WithErrorBoundary;
}

// ============================================================================
// HOOK FOR FUNCTIONAL ERROR HANDLING
// ============================================================================

/**
 * Custom hook for triggering errors in functional components
 * Use this to throw errors that will be caught by ErrorBoundary
 */
export function useErrorHandler(): (error: Error) => void {
  const [, setError] = React.useState<Error | null>(null);

  return React.useCallback((error: Error) => {
    setError(() => {
      throw error;
    });
  }, []);
}

// ============================================================================
// EXPORTS
// ============================================================================

export default ErrorBoundary;
