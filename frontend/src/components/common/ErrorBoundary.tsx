import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('AGRI SHIELD Uncaught React Exception:', error, errorInfo);
  }

  public handleReset = () => {
    this.setState({ hasError: false, error: undefined });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-satellite-950 text-slate-100 flex items-center justify-center p-6">
          <div className="max-w-md w-full p-8 rounded-2xl bg-slate-900 border border-rose-500/30 text-center space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 mx-auto flex items-center justify-center">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-bold text-white">System Component Exception</h2>
              <p className="text-sm text-slate-400">
                An unexpected interface render failure occurred. The error has been isolated.
              </p>
            </div>

            {this.state.error && (
              <div className="p-3 bg-slate-950 rounded-lg text-left text-xs font-mono text-rose-300 overflow-x-auto max-h-32 border border-slate-800">
                {this.state.error.message}
              </div>
            )}

            <button
              onClick={this.handleReset}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium transition"
            >
              <RefreshCw className="w-4 h-4" />
              Reload System Interface
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export const ErrorDisplay: React.FC<{ message: string; onRetry?: () => void }> = ({
  message,
  onRetry,
}) => {
  return (
    <div className="p-6 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 space-y-3">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <AlertTriangle className="w-5 h-5 text-rose-400" />
        <span>Subsystem Error</span>
      </div>
      <p className="text-xs text-slate-300">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-xs font-medium text-rose-400 hover:text-rose-300 underline"
        >
          Retry request
        </button>
      )}
    </div>
  );
};
