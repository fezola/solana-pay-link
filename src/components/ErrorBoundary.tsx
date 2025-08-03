import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Trash2 } from 'lucide-react';
import { clearAllMerchantData } from '@/lib/merchant-auth';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  handleReload = () => {
    window.location.reload();
  };

  handleClearData = () => {
    try {
      clearAllMerchantData();
      // Also clear invoice data
      localStorage.removeItem('klyr_invoices');
      this.handleReload();
    } catch (error) {
      console.error('Error clearing data:', error);
      this.handleReload();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <Card className="w-full max-w-md shadow-card">
            <CardHeader className="text-center">
              <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <CardTitle className="text-xl">Something went wrong</CardTitle>
              <CardDescription>
                An unexpected error occurred. Please try refreshing the page.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {this.state.error && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <p className="text-sm font-medium text-destructive mb-1">Error:</p>
                  <p className="text-sm text-destructive/80">{this.state.error.message}</p>
                </div>
              )}

              <div className="space-y-3">
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={this.handleReset}
                    className="flex-1"
                  >
                    Try Again
                  </Button>
                  <Button
                    variant="solana"
                    onClick={this.handleReload}
                    className="flex-1"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Reload Page
                  </Button>
                </div>

                <Button
                  variant="destructive"
                  onClick={this.handleClearData}
                  className="w-full"
                  size="sm"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear All Data & Reload
                </Button>
              </div>

              <details className="mt-4">
                <summary className="text-sm text-muted-foreground cursor-pointer hover:text-foreground">
                  Technical Details
                </summary>
                <div className="mt-2 p-3 bg-muted rounded-lg">
                  <pre className="text-xs text-muted-foreground whitespace-pre-wrap break-words">
                    {this.state.error?.stack}
                  </pre>
                  {this.state.errorInfo && (
                    <pre className="text-xs text-muted-foreground whitespace-pre-wrap break-words mt-2">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  )}
                </div>
              </details>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
