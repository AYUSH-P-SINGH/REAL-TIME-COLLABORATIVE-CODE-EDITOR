import React from 'react';
import GlassCard from './GlassCard';
import NeonButton from './NeonButton';
import { AlertTriangle, RefreshCw } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Unhandled Application Error:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          height: '100vh',
          width: '100vw',
          backgroundColor: 'hsl(var(--bg-deep))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px'
        }}>
          <GlassCard style={{
            maxWidth: '460px',
            width: '100%',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '20px',
            padding: '32px 24px'
          }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: 'hsl(var(--accent-pink) / 0.15)',
              color: 'hsl(var(--accent-pink))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <AlertTriangle size={28} />
            </div>

            <div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: '700', color: '#fff', marginBottom: '8px' }}>
                Something went wrong
              </h2>
              <p style={{ fontSize: '0.85rem', color: 'hsl(var(--text-muted))', lineHeight: 1.5 }}>
                An unexpected UI rendering exception occurred. You can reload the application workspace or return to safety.
              </p>
            </div>

            {this.state.error?.message && (
              <div style={{
                backgroundColor: 'hsl(var(--bg-surface))',
                border: '1px solid hsl(var(--border-subtle))',
                borderRadius: '6px',
                padding: '10px 14px',
                fontSize: '0.75rem',
                color: 'hsl(var(--accent-pink))',
                fontFamily: 'var(--font-mono)',
                width: '100%',
                textAlign: 'left',
                overflowX: 'auto'
              }}>
                {this.state.error.message}
              </div>
            )}

            <NeonButton onClick={this.handleReload} style={{ width: '100%', marginTop: '8px' }}>
              <RefreshCw size={16} /> Reload Workspace Application
            </NeonButton>
          </GlassCard>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
export { ErrorBoundary };
