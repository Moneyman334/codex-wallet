import { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Error Boundary caught an error:", error, errorInfo);
    
    this.setState({
      error,
      errorInfo
    });

    try {
      const errorLog = {
        timestamp: new Date().toISOString(),
        error: error.toString(),
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        userAgent: navigator.userAgent,
        url: window.location.href,
        mode: import.meta.env.PROD ? 'production' : 'development',
      };
      
      const errorHistory = JSON.parse(localStorage.getItem('error_history') || '[]');
      errorHistory.push(errorLog);
      if (errorHistory.length > 20) errorHistory.shift();
      localStorage.setItem('error_history', JSON.stringify(errorHistory));
      localStorage.setItem('last_error', JSON.stringify(errorLog));
    } catch (e) {
      console.error('Failed to log error to localStorage:', e);
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
    
    // Reload the page to fully reset
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-purple-500/5 to-pink-500/5">
          <Card className="max-w-2xl w-full shadow-2xl border-destructive/50">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-destructive/10 rounded-lg">
                  <AlertTriangle className="h-8 w-8 text-destructive" />
                </div>
                <div>
                  <CardTitle className="text-2xl">Something went wrong</CardTitle>
                  <CardDescription className="mt-1">
                    The application encountered an unexpected error
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {this.state.error && (
                <div className="p-4 bg-destructive/5 rounded-lg border border-destructive/20">
                  <p className="font-mono text-sm text-destructive font-semibold mb-2">
                    {this.state.error.toString()}
                  </p>
                  {!import.meta.env.PROD && this.state.errorInfo && (
                    <details className="mt-3">
                      <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
                        Show technical details
                      </summary>
                      <pre className="mt-2 p-3 bg-background rounded text-xs overflow-auto max-h-60">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </details>
                  )}
                </div>
              )}
              
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={this.handleReset}
                  className="flex-1"
                  size="lg"
                  data-testid="button-reset-app"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Reload Application
                </Button>
                <Button
                  onClick={() => window.location.href = '/'}
                  variant="outline"
                  className="flex-1"
                  size="lg"
                  data-testid="button-go-home"
                >
                  Go to Homepage
                </Button>
              </div>

              <p className="text-xs text-muted-foreground text-center">
                If the problem persists, try clearing your browser cache or contact support
              </p>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
