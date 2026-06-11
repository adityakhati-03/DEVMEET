import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

interface Props {
  children?: ReactNode;
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
    console.error('Uncaught error in React component tree:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/dashboard';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#080a0f', color: 'white', padding: '24px', textAlign: 'center' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '32px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
            <AlertTriangle style={{ color: '#f87171', width: '32px', height: '32px' }} />
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '12px' }}>Something went wrong</h1>
          <p style={{ color: '#78716c', fontSize: '15px', maxWidth: '400px', marginBottom: '32px', lineHeight: 1.5 }}>
            A critical error occurred while rendering this page. This could be due to a temporary network issue or a disconnected service.
          </p>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button 
              onClick={this.handleReload}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '8px', background: '#34d399', color: '#080a0f', border: 'none', fontWeight: 700, cursor: 'pointer' }}
            >
              <RefreshCcw size={16} /> Try Again
            </button>
            <button 
              onClick={this.handleGoHome}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '8px', background: 'var(--dm-surface)', color: 'white', border: '1px solid var(--dm-border)', fontWeight: 700, cursor: 'pointer' }}
            >
              Go to Dashboard
            </button>
          </div>
          
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <div style={{ marginTop: '48px', padding: '16px', background: 'rgba(255,0,0,0.1)', border: '1px solid rgba(255,0,0,0.2)', borderRadius: '8px', textAlign: 'left', maxWidth: '800px', overflowX: 'auto' }}>
              <p style={{ color: '#f87171', fontFamily: 'monospace', margin: 0, fontSize: '13px' }}>
                {this.state.error.toString()}
              </p>
            </div>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
