import React, { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
          <div className="bg-red-950/20 border border-red-900/50 p-8 rounded-lg max-w-lg w-full shadow-2xl">
            <h2 className="text-2xl font-serif text-red-500 mb-4">Something went wrong loading this page.</h2>
            <p className="text-zinc-400 mb-6 text-sm">
              The darkness was too thick to see through. An unexpected error occurred.
            </p>
            {this.state.error && (
              <pre className="bg-black/50 text-red-400 p-4 rounded text-xs text-left overflow-auto mb-6 max-h-32">
                {this.state.error.message}
              </pre>
            )}
            <Button 
              onClick={() => window.location.href = '/'}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Return Home
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
