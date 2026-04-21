import React, { ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    const { hasError, error } = this.state;
    const { children } = this.props;

    if (hasError) {
      let message = "Something went wrong. Please try again later.";
      
      try {
        if (error?.message) {
          const firestoreError = JSON.parse(error.message);
          if (firestoreError.error && firestoreError.error.includes('insufficient permissions')) {
            message = "You don't have permission to perform this action.";
          }
        }
      } catch (e) {
        // Not a JSON error message, use default
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-brand-paper p-4">
          <div className="bg-white p-8 rounded-[40px] shadow-2xl border border-brand-ink/5 max-w-md w-full text-center">
            <h2 className="text-2xl font-serif text-brand-ink mb-4">Application Error</h2>
            <p className="text-brand-ink/60 font-light mb-8">{message}</p>
            <button
              onClick={() => window.location.reload()}
              className="btn-premium btn-gold w-full"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return children;
  }
}

export default ErrorBoundary;
