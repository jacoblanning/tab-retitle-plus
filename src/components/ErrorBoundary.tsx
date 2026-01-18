import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    // Reload the page to reset the extension
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-card border border-border rounded-lg p-6 shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="h-8 w-8 text-destructive" />
              <h1 className="text-xl font-semibold text-foreground">Something went wrong</h1>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Tab ReTitle+ encountered an unexpected error. This has been logged to the console.
            </p>
            {this.state.error && (
              <div className="bg-muted border border-border rounded-md p-3 mb-4">
                <code className="text-xs text-foreground font-mono break-all">
                  {this.state.error.message}
                </code>
              </div>
            )}
            <div className="flex gap-2">
              <button
                onClick={this.handleReset}
                className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors font-medium"
              >
                Reload Extension
              </button>
              <button
                onClick={() => chrome.runtime.openOptionsPage()}
                className="px-4 py-2 bg-muted text-foreground rounded-md hover:bg-muted/80 transition-colors font-medium border border-border"
              >
                Settings
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
