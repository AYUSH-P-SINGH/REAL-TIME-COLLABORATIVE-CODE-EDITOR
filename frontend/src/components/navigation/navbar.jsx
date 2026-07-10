import React from 'react';
import { useAuth } from '../../context/authcontext';
import { useSocket } from '../../context/SocketContext';
import { LogOut, Wifi, WifiOff } from 'lucide-react';

const Navbar = ({ children }) => {
  const { user, logoutSession } = useAuth();
  const { isConnected } = useSocket();

  return (
    <nav style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '16px 24px',
      backgroundColor: '#0a0d14',
      borderBottom: '1px solid #1a2233',
      height: '64px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <h1 style={{
          fontSize: '1.25rem',
          fontWeight: '700',
          background: 'linear-gradient(135deg, #22d3ee, #a855f7)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          letterSpacing: '0.5px'
        }}>
          CodeSync
        </h1>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 8px',
          borderRadius: '12px',
          backgroundColor: isConnected ? 'rgba(34, 211, 238, 0.1)' : 'rgba(244, 63, 94, 0.1)',
          fontSize: '0.75rem',
          color: isConnected ? '#22d3ee' : '#f43f5e',
          fontWeight: '600'
        }}>
          {isConnected ? <Wifi size={12} /> : <WifiOff size={12} />}
          {isConnected ? 'LIVE' : 'DISCONNECTED'}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
        {children}
        
        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img 
              src={user.avatarUrl} 
              alt={user.name} 
              style={{ width: '32px', height: '32px', borderRadius: '50%', border: '1.5px solid #22d3ee' }}
            />
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#fff' }}>{user.name}</span>
              <span style={{ fontSize: '0.75rem', color: '#8f9cae' }}>{user.email}</span>
            </div>
            <button 
              onClick={logoutSession}
              style={{
                background: 'none',
                border: 'none',
                color: '#8f9cae',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '6px',
                borderRadius: '6px',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)'; e.currentTarget.style.color = '#fff'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#8f9cae'; }}
            >
              <LogOut size={16} />
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
export { Navbar };
