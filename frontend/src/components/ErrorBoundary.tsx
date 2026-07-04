import { Component, type ReactNode } from 'react';

interface Props { children: ReactNode }
interface State { error: Error | null }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#39ff14', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: 'monospace', textAlign: 'center' }}>
          <h1 style={{ fontSize: 24, marginBottom: 16 }}>FUNHOUSE GLITCHED</h1>
          <p style={{ opacity: 0.7, marginBottom: 24, maxWidth: 400 }}>
            Cached data broke the app. Tap below to reset — you won&apos;t lose household data.
          </p>
          <button
            onClick={() => {
              localStorage.clear();
              caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k)))).finally(() => window.location.reload());
            }}
            style={{ background: '#39ff14', color: '#0a0a0a', border: 'none', padding: '12px 24px', borderRadius: 8, fontWeight: 'bold', cursor: 'pointer' }}
          >
            RESET & RELOAD
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
