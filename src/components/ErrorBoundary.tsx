import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTab?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
    this.setState({ errorInfo });
  }

  public handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.fallbackTab) {
      this.props.fallbackTab();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[400px] flex items-center justify-center p-6 bg-[#1C100B] text-stone-100 rounded-2xl border border-amber-900/50 m-4">
          <div className="max-w-lg w-full text-center space-y-4 p-6 rounded-2xl bg-stone-900/90 border border-amber-500/40 shadow-2xl">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shadow-lg">
              <AlertTriangle size={28} />
            </div>

            <div>
              <h2 className="text-xl font-bold text-white font-['Space_Grotesk']">
                Component Display Recovered
              </h2>
              <p className="text-xs text-stone-300 mt-1">
                A rendering condition was detected in this operational module. The platform safety boundary safely intercepted it.
              </p>
            </div>

            {this.state.error && (
              <div className="p-3 rounded-xl bg-stone-950 border border-stone-800 text-left font-mono text-[11px] text-amber-300/90 overflow-x-auto max-h-32">
                {this.state.error.toString()}
              </div>
            )}

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={this.handleReset}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-stone-950 font-bold text-xs shadow-md transition-all"
              >
                <RotateCcw size={14} />
                <span>Retry Operational Module</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
