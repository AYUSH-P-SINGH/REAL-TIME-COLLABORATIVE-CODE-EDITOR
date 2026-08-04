import React, { useState } from 'react';
import { useAuth } from '../context/authcontext';
import API from '../services/api';
import GlassCard from '../components/Shared/GlassCard';
import NeonButton from '../components/Shared/NeonButton';
import { useToast } from '../context/ToastContext';
import { Code2, Zap, Users, ShieldCheck, Terminal, ArrowRight, UserCheck } from 'lucide-react';

const Landing = () => {
  const { loginSession } = useAuth();
  const { addToast } = useToast();
  const [isRegister, setIsRegister] = useState(false);
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const endpoint = isRegister ? '/auth/register' : '/auth/login';
      const payload = isRegister ? { name, email, password } : { email, password };

      const res = await API.post(endpoint, payload);
      if (res.data.success) {
        const { user, token } = res.data.data;
        addToast(isRegister ? 'Account created successfully! Welcome aboard.' : `Welcome back, ${user.name}!`, 'success');
        loginSession(user, token);
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Authentication failed. Please verify credentials.';
      setError(errMsg);
      addToast(errMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setEmail('demo@codesync.io');
    setPassword('demopass123');
    if (isRegister) setIsRegister(false);
  };

  return (
    <div style={{
      minHeight: '100vh',
      width: '100vw',
      backgroundColor: 'hsl(var(--bg-deep))',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflowX: 'hidden',
      padding: '40px 20px'
    }}>
      {/* Decorative background ambient glows */}
      <div className="mesh-glow" style={{ width: '500px', height: '500px', backgroundColor: 'hsl(var(--accent-cyan))', top: '-15%', left: '-10%' }} />
      <div className="mesh-glow" style={{ width: '500px', height: '500px', backgroundColor: 'hsl(var(--accent-purple))', bottom: '-15%', right: '-10%' }} />

      <div style={{
        maxWidth: '1100px',
        width: '100%',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '48px',
        alignItems: 'center',
        zIndex: 1,
        position: 'relative'
      }}>
        
        {/* Left Side: Product Showcase & Brand Headline */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <span className="badge badge-cyan">
              <Zap size={12} />
              PRODUCTION-READY MULTIPLAYER EDITOR
            </span>
          </div>

          <h1 style={{
            fontSize: 'clamp(2.2rem, 5vw, 3.5rem)',
            fontWeight: '800',
            lineHeight: 1.15,
            letterSpacing: '-0.02em',
            color: '#fff'
          }}>
            Real-Time Code Collaboration <br />
            <span style={{
              background: 'linear-gradient(135deg, hsl(var(--accent-cyan)), hsl(var(--accent-purple)), hsl(var(--accent-pink)))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              Without Boundaries.
            </span>
          </h1>

          <p style={{ fontSize: '1.05rem', color: 'hsl(var(--text-secondary))', lineHeight: 1.6, maxWidth: '520px' }}>
            Engineered for modern software teams. Edit code simultaneously with zero latency, live cursor synchronization, granular workspace management, and Monaco syntax highlighting.
          </p>

          {/* Features Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '16px',
            marginTop: '12px'
          }}>
            <div style={{
              padding: '16px',
              backgroundColor: 'hsl(var(--bg-surface) / 0.6)',
              border: '1px solid hsl(var(--border-subtle))',
              borderRadius: '10px',
              display: 'flex',
              gap: '12px',
              alignItems: 'flex-start'
            }}>
              <Zap size={20} color="hsl(var(--accent-cyan))" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <h4 style={{ fontSize: '0.9rem', fontWeight: '700', color: '#fff', marginBottom: '4px' }}>Multiplayer Sync</h4>
                <p style={{ fontSize: '0.8rem', color: 'hsl(var(--text-muted))', lineHeight: 1.4 }}>Instant delta synchronization powered by WebSockets.</p>
              </div>
            </div>

            <div style={{
              padding: '16px',
              backgroundColor: 'hsl(var(--bg-surface) / 0.6)',
              border: '1px solid hsl(var(--border-subtle))',
              borderRadius: '10px',
              display: 'flex',
              gap: '12px',
              alignItems: 'flex-start'
            }}>
              <Users size={20} color="hsl(var(--accent-purple))" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <h4 style={{ fontSize: '0.9rem', fontWeight: '700', color: '#fff', marginBottom: '4px' }}>Live Presence</h4>
                <p style={{ fontSize: '0.8rem', color: 'hsl(var(--text-muted))', lineHeight: 1.4 }}>See peer selection cursors and active workspace activity live.</p>
              </div>
            </div>

            <div style={{
              padding: '16px',
              backgroundColor: 'hsl(var(--bg-surface) / 0.6)',
              border: '1px solid hsl(var(--border-subtle))',
              borderRadius: '10px',
              display: 'flex',
              gap: '12px',
              alignItems: 'flex-start'
            }}>
              <Terminal size={20} color="hsl(var(--accent-emerald))" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <h4 style={{ fontSize: '0.9rem', fontWeight: '700', color: '#fff', marginBottom: '4px' }}>Monaco Engine</h4>
                <p style={{ fontSize: '0.8rem', color: 'hsl(var(--text-muted))', lineHeight: 1.4 }}>VS Code core editor with themes, keybindings & autocompletion.</p>
              </div>
            </div>

            <div style={{
              padding: '16px',
              backgroundColor: 'hsl(var(--bg-surface) / 0.6)',
              border: '1px solid hsl(var(--border-subtle))',
              borderRadius: '10px',
              display: 'flex',
              gap: '12px',
              alignItems: 'flex-start'
            }}>
              <ShieldCheck size={20} color="hsl(var(--accent-pink))" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <h4 style={{ fontSize: '0.9rem', fontWeight: '700', color: '#fff', marginBottom: '4px' }}>Secure Spaces</h4>
                <p style={{ fontSize: '0.8rem', color: 'hsl(var(--text-muted))', lineHeight: 1.4 }}>Encrypted auth tokens & permission-scoped project trees.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Authentication Form Card */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <GlassCard style={{
            width: '100%',
            maxWidth: '420px',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
            padding: '32px 28px',
            border: '1px solid hsl(var(--border-glow))',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)'
          }}>
            {/* Header Brand */}
            <div style={{ textAlign: 'center' }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, hsl(var(--accent-cyan)), hsl(var(--accent-purple)))',
                marginBottom: '12px',
                color: '#000'
              }}>
                <Code2 size={24} />
              </div>
              <h2 style={{
                fontSize: '1.6rem',
                fontWeight: '700',
                color: '#fff',
                marginBottom: '6px'
              }}>
                {isRegister ? 'Create your Account' : 'Welcome back'}
              </h2>
              <p style={{ fontSize: '0.85rem', color: 'hsl(var(--text-muted))' }}>
                {isRegister ? 'Sign up to start collaborating on live workspaces' : 'Enter your credentials to access your workspaces'}
              </p>
            </div>

            {/* Auth Tab Switcher */}
            <div style={{
              display: 'flex',
              backgroundColor: 'hsl(var(--bg-surface))',
              padding: '4px',
              borderRadius: '8px',
              border: '1px solid hsl(var(--border-subtle))'
            }}>
              <button
                type="button"
                onClick={() => { setIsRegister(false); setError(''); }}
                style={{
                  flex: 1,
                  padding: '8px',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  backgroundColor: !isRegister ? 'hsl(var(--bg-card))' : 'transparent',
                  color: !isRegister ? '#fff' : 'hsl(var(--text-muted))',
                  boxShadow: !isRegister ? '0 2px 8px rgba(0,0,0,0.4)' : 'none',
                  transition: 'all 0.2s ease'
                }}
              >
                Log In
              </button>
              <button
                type="button"
                onClick={() => { setIsRegister(true); setError(''); }}
                style={{
                  flex: 1,
                  padding: '8px',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  backgroundColor: isRegister ? 'hsl(var(--bg-card))' : 'transparent',
                  color: isRegister ? '#fff' : 'hsl(var(--text-muted))',
                  boxShadow: isRegister ? '0 2px 8px rgba(0,0,0,0.4)' : 'none',
                  transition: 'all 0.2s ease'
                }}
              >
                Register
              </button>
            </div>

            {error && (
              <div style={{
                backgroundColor: 'hsl(var(--accent-pink) / 0.1)',
                border: '1px solid hsl(var(--accent-pink) / 0.3)',
                color: 'hsl(var(--accent-pink))',
                padding: '10px 14px',
                borderRadius: '8px',
                fontSize: '0.825rem',
                textAlign: 'center',
                fontWeight: '500'
              }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {isRegister && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.8rem', color: 'hsl(var(--text-secondary))', fontWeight: '500' }}>Full Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Alex Morgan"
                    className="input-field"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.8rem', color: 'hsl(var(--text-secondary))', fontWeight: '500' }}>Email Address</label>
                <input
                  type="email"
                  placeholder="developer@example.com"
                  className="input-field"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.8rem', color: 'hsl(var(--text-secondary))', fontWeight: '500' }}>Password</label>
                <input
                  type="password"
                  placeholder="••••••••••••"
                  className="input-field"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              
              <NeonButton type="submit" disabled={loading} style={{ width: '100%', marginTop: '4px' }}>
                {loading ? 'Authenticating...' : isRegister ? 'Create Free Account' : 'Sign In to Workspace'}
                {!loading && <ArrowRight size={16} />}
              </NeonButton>

              <button
                type="button"
                onClick={handleDemoLogin}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'hsl(var(--text-muted))',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  marginTop: '4px',
                  textDecoration: 'underline'
                }}
              >
                <UserCheck size={14} /> Fill Demo Credentials
              </button>
            </form>
          </GlassCard>
        </div>

      </div>
    </div>
  );
};

export default Landing;
export { Landing };
