import React, { useState } from 'react';
import { useAuth } from '../context/authcontext';
import API from '../services/api';
import GlassCard from '../components/Shared/GlassCard';
import NeonButton from '../components/Shared/NeonButton';
import { useToast } from '../context/ToastContext';

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
        addToast(isRegister ? 'Account created successfully!' : `Welcome back, ${user.name}!`, 'success');
        loginSession(user, token);
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Authentication failed';
      setError(errMsg);
      addToast(errMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      width: '100vw',
      background: 'radial-gradient(circle at center, #0e1629 0%, #060913 100%)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Decorative premium background lights */}
      <div className="mesh-glow" style={{ width: '400px', height: '400px', backgroundColor: 'hsl(var(--accent-cyan))', top: '-10%', left: '-10%' }} />
      <div className="mesh-glow" style={{ width: '400px', height: '400px', backgroundColor: 'hsl(var(--accent-purple))', bottom: '-10%', right: '-10%' }} />

      <GlassCard className="neon-glow" style={{ width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '24px', zIndex: 1, position: 'relative' }}>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{
            fontSize: '1.75rem',
            fontWeight: '700',
            background: 'linear-gradient(135deg, #22d3ee, #a855f7)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '8px'
          }}>
            {isRegister ? 'Create Account' : 'Welcome Back'}
          </h2>
          <p style={{ fontSize: '0.85rem', color: '#8f9cae' }}>
            {isRegister ? 'Join the real-time editing workspace' : 'Log in to access your projects'}
          </p>
        </div>

        {error && (
          <div style={{
            backgroundColor: 'rgba(244, 63, 94, 0.1)',
            border: '1px solid rgba(244, 63, 94, 0.2)',
            color: '#f43f5e',
            padding: '10px',
            borderRadius: '6px',
            fontSize: '0.8rem',
            textAlign: 'center'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {isRegister && (
            <input
              type="text"
              placeholder="Full Name"
              className="input-field"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          )}
          <input
            type="email"
            placeholder="Email Address"
            className="input-field"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            className="input-field"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          
          <NeonButton type="submit" disabled={loading}>
            {loading ? 'Processing...' : isRegister ? 'Register' : 'Log In'}
          </NeonButton>
        </form>

        <div style={{ textAlign: 'center', fontSize: '0.85rem', color: '#8f9cae' }}>
          <span>{isRegister ? 'Already have an account? ' : "Don't have an account? "}</span>
          <button 
            onClick={() => { setIsRegister(!isRegister); setError(''); }}
            style={{
              background: 'none',
              border: 'none',
              color: '#22d3ee',
              cursor: 'pointer',
              fontWeight: '600',
              textDecoration: 'underline'
            }}
          >
            {isRegister ? 'Log In' : 'Register'}
          </button>
        </div>
      </GlassCard>
    </div>
  );
};

export default Landing;
export { Landing };
