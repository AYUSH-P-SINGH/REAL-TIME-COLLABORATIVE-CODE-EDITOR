import React, { useState } from 'react';
import { useAuth } from '../context/authcontext';
import API from '../services/api';
import { useToast } from '../context/ToastContext';
import { Code2, Users, ShieldCheck, Terminal, ArrowRight, Eye, EyeOff, Lock, Mail, User, Sparkles } from 'lucide-react';

const Landing = () => {
  const { loginSession } = useAuth();
  const { addToast } = useToast();
  const [isRegister, setIsRegister] = useState(false);
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const cleanEmail = email.toLowerCase().trim();
    const cleanPassword = password.trim();
    const cleanName = name.trim();

    if (isRegister && cleanName.length < 2) {
      setError('Please enter your full name (at least 2 characters).');
      return;
    }
    if (!cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setError('Please provide a valid email address.');
      return;
    }
    if (cleanPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);

    try {
      const endpoint = isRegister ? '/auth/register' : '/auth/login';
      const payload = isRegister 
        ? { name: cleanName, email: cleanEmail, password: cleanPassword } 
        : { email: cleanEmail, password: cleanPassword };

      const res = await API.post(endpoint, payload);
      if (res.data.success) {
        const { user, token } = res.data.data;
        addToast(isRegister ? 'Account created successfully! Welcome to CodeSync.' : `Welcome back, ${user.name}!`, 'success');
        loginSession(user, token);
      }
    } catch (err) {
      const errMsg = err.response?.data?.error?.message || err.response?.data?.message || 'Authentication failed. Please verify credentials.';
      setError(errMsg);
      addToast(errMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setError('');
    setDemoLoading(true);

    try {
      const res = await API.post('/auth/demo');
      if (res.data.success) {
        const { user, token } = res.data.data;
        addToast(`Logged in with Demo Developer account!`, 'success');
        loginSession(user, token);
      }
    } catch (err) {
      try {
        const demoRes = await API.post('/auth/login', {
          email: 'demo@codesync.io',
          password: 'demopass123'
        });
        if (demoRes.data.success) {
          const { user, token } = demoRes.data.data;
          loginSession(user, token);
        }
      } catch (subErr) {
        setError('Demo login unavailable. Please create an account or sign in.');
        addToast('Please enter credentials or register.', 'info');
      }
    } finally {
      setDemoLoading(false);
    }
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
      {/* Ambient background glow elements */}
      <div className="mesh-glow" style={{ width: '500px', height: '500px', backgroundColor: 'hsl(var(--accent-cyan))', top: '-15%', left: '-10%' }} />
      <div className="mesh-glow" style={{ width: '500px', height: '500px', backgroundColor: 'hsl(var(--accent-purple))', bottom: '-15%', right: '-10%' }} />

      <div style={{
        maxWidth: '1200px',
        width: '100%',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
        gap: '48px',
        alignItems: 'center',
        zIndex: 1
      }}>
        {/* Left Column: Product Information */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: 'hsl(var(--accent-cyan) / 0.1)',
            border: '1px solid hsl(var(--accent-cyan) / 0.3)',
            borderRadius: '9999px',
            padding: '6px 14px',
            color: 'hsl(var(--accent-cyan))',
            fontSize: '0.8rem',
            fontWeight: '600',
            width: 'fit-content'
          }}>
            <Sparkles size={14} />
            <span>DEVELOPER COLLABORATION PLATFORM</span>
          </div>

          <h1 style={{
            fontSize: 'clamp(2.2rem, 4vw, 3.4rem)',
            fontWeight: '800',
            lineHeight: '1.15',
            letterSpacing: '-0.02em',
            color: '#fff'
          }}>
            Real-Time Collaborative <br />
            <span className="gradient-text">Code Editor.</span>
          </h1>

          <p style={{
            fontSize: '1.05rem',
            color: 'hsl(var(--text-secondary))',
            lineHeight: '1.65',
            maxWidth: '540px'
          }}>
            Code together, in real time. CodeSync lets multiple developers work on the same project, edit files simultaneously, and see collaborators&apos; presence and cursor activity in real time.
          </p>

          {/* Feature Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '16px',
            marginTop: '12px'
          }}>
            <div className="glass-panel" style={{ padding: '16px', borderRadius: '12px', border: '1px solid hsl(var(--border-subtle))' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <Terminal size={18} color="hsl(var(--accent-cyan))" />
                <h4 style={{ fontSize: '0.95rem', fontWeight: '700', color: '#fff' }}>Real-Time Collaboration</h4>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'hsl(var(--text-muted))', lineHeight: '1.4' }}>
                Synchronize code changes between connected collaborators using WebSockets.
              </p>
            </div>

            <div className="glass-panel" style={{ padding: '16px', borderRadius: '12px', border: '1px solid hsl(var(--border-subtle))' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <Users size={18} color="hsl(var(--accent-purple))" />
                <h4 style={{ fontSize: '0.95rem', fontWeight: '700', color: '#fff' }}>Live Presence</h4>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'hsl(var(--text-muted))', lineHeight: '1.4' }}>
                See collaborators, cursor positions, and workspace activity in real time.
              </p>
            </div>

            <div className="glass-panel" style={{ padding: '16px', borderRadius: '12px', border: '1px solid hsl(var(--border-subtle))' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <Code2 size={18} color="hsl(var(--accent-emerald))" />
                <h4 style={{ fontSize: '0.95rem', fontWeight: '700', color: '#fff' }}>Monaco Editor</h4>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'hsl(var(--text-muted))', lineHeight: '1.4' }}>
                Powerful code editing with syntax highlighting, themes, and developer-focused features.
              </p>
            </div>

            <div className="glass-panel" style={{ padding: '16px', borderRadius: '12px', border: '1px solid hsl(var(--border-subtle))' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <ShieldCheck size={18} color="hsl(var(--accent-pink))" />
                <h4 style={{ fontSize: '0.95rem', fontWeight: '700', color: '#fff' }}>Secure Authentication</h4>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'hsl(var(--text-muted))', lineHeight: '1.4' }}>
                JWT-based authentication with protected project and workspace access.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Authentication Card */}
        <div style={{ width: '100%', maxWidth: '440px', margin: '0 auto' }}>
          <div className="glass-panel" style={{
            padding: '36px 32px',
            borderRadius: '20px',
            border: '1px solid hsl(var(--border-glow))',
            boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
            position: 'relative'
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, hsl(var(--accent-cyan)), hsl(var(--accent-purple)))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
              boxShadow: 'var(--glow-cyan)'
            }}>
              <Code2 size={24} color="#000" />
            </div>

            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: '700',
              textAlign: 'center',
              marginBottom: '6px',
              color: '#fff'
            }}>
              {isRegister ? 'Create an account' : 'Welcome back'}
            </h2>
            <p style={{
              fontSize: '0.85rem',
              color: 'hsl(var(--text-muted))',
              textAlign: 'center',
              marginBottom: '24px'
            }}>
              {isRegister ? 'Start collaborating on shared code repositories' : 'Sign in to access your projects and workspaces'}
            </p>

            {/* Sign In vs Register Toggle */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              backgroundColor: 'hsl(var(--bg-deep))',
              padding: '4px',
              borderRadius: '10px',
              marginBottom: '24px',
              border: '1px solid hsl(var(--border-subtle))'
            }}>
              <button
                type="button"
                onClick={() => { setIsRegister(false); setError(''); }}
                style={{
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  backgroundColor: !isRegister ? 'hsl(var(--bg-card))' : 'transparent',
                  color: !isRegister ? '#fff' : 'hsl(var(--text-muted))',
                  boxShadow: !isRegister ? '0 2px 8px rgba(0,0,0,0.3)' : 'none'
                }}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => { setIsRegister(true); setError(''); }}
                style={{
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  backgroundColor: isRegister ? 'hsl(var(--bg-card))' : 'transparent',
                  color: isRegister ? '#fff' : 'hsl(var(--text-muted))',
                  boxShadow: isRegister ? '0 2px 8px rgba(0,0,0,0.3)' : 'none'
                }}
              >
                Register
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div style={{
                backgroundColor: 'hsl(340 82% 52% / 0.15)',
                border: '1px solid hsl(340 82% 52% / 0.4)',
                borderRadius: '8px',
                padding: '10px 14px',
                color: '#f87171',
                fontSize: '0.82rem',
                marginBottom: '18px',
                textAlign: 'center',
                lineHeight: '1.4'
              }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {isRegister && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '500', color: 'hsl(var(--text-secondary))', marginBottom: '6px' }}>
                    Full Name
                  </label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <User size={16} color="hsl(var(--text-muted))" style={{ position: 'absolute', left: '12px' }} />
                    <input
                      type="text"
                      placeholder="Jane Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      style={{
                        width: '100%',
                        padding: '10px 12px 10px 38px',
                        backgroundColor: 'hsl(var(--bg-deep))',
                        border: '1px solid hsl(var(--border-subtle))',
                        borderRadius: '8px',
                        color: '#fff',
                        fontSize: '0.9rem',
                        outline: 'none'
                      }}
                    />
                  </div>
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '500', color: 'hsl(var(--text-secondary))', marginBottom: '6px' }}>
                  Email Address
                </label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <Mail size={16} color="hsl(var(--text-muted))" style={{ position: 'absolute', left: '12px' }} />
                  <input
                    type="email"
                    placeholder="developer@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '10px 12px 10px 38px',
                      backgroundColor: 'hsl(var(--bg-deep))',
                      border: '1px solid hsl(var(--border-subtle))',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '0.9rem',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '500', color: 'hsl(var(--text-secondary))', marginBottom: '6px' }}>
                  Password
                </label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <Lock size={16} color="hsl(var(--text-muted))" style={{ position: 'absolute', left: '12px' }} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '10px 38px 10px 38px',
                      backgroundColor: 'hsl(var(--bg-deep))',
                      border: '1px solid hsl(var(--border-subtle))',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '0.9rem',
                      outline: 'none'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      background: 'none',
                      border: 'none',
                      color: 'hsl(var(--text-muted))',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  marginTop: '8px',
                  padding: '12px',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'linear-gradient(135deg, hsl(var(--accent-cyan)), hsl(var(--accent-purple)))',
                  color: '#000',
                  fontWeight: '700',
                  fontSize: '0.95rem',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'opacity 0.2s ease',
                  opacity: loading ? 0.7 : 1
                }}
              >
                <span>{loading ? 'Processing...' : (isRegister ? 'Create Account' : 'Sign In to Workspace')}</span>
                <ArrowRight size={16} />
              </button>
            </form>

            {/* Try Demo Account */}
            <div style={{ marginTop: '20px', textAlign: 'center' }}>
              <button
                type="button"
                onClick={handleDemoLogin}
                disabled={demoLoading}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'hsl(var(--accent-cyan))',
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  cursor: demoLoading ? 'not-allowed' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  transition: 'background-color 0.2s ease'
                }}
              >
                <span>⚡ {demoLoading ? 'Logging into Demo...' : 'Try Demo Account'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Landing;
