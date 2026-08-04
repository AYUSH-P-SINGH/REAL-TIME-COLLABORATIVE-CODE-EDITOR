import React, { useState } from 'react';
import { useAuth } from '../../context/authcontext';
import { useSocket } from '../../context/SocketContext';
import { LogOut, Wifi, WifiOff, Code2, Menu, X, User } from 'lucide-react';

const Navbar = ({ children }) => {
  const { user, logoutSession } = useAuth();
  const { isConnected } = useSocket();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="glass-header" style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 24px',
      height: '64px',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      width: '100%'
    }}>
      {/* Brand & Connection Badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '34px',
            height: '34px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, hsl(var(--accent-cyan)), hsl(var(--accent-purple)))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#000',
            fontWeight: 'bold'
          }}>
            <Code2 size={20} />
          </div>
          <h1 style={{
            fontSize: '1.25rem',
            fontWeight: '800',
            background: 'linear-gradient(135deg, hsl(var(--accent-cyan)), #fff)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '-0.02em'
          }}>
            CodeSync
          </h1>
        </div>

        <div className="badge badge-cyan hide-mobile" style={{ fontSize: '0.7rem' }}>
          {isConnected ? <Wifi size={12} /> : <WifiOff size={12} />}
          <span>{isConnected ? 'LIVE SYNC' : 'DISCONNECTED'}</span>
        </div>
      </div>

      {/* Desktop Navigation & Actions */}
      <div className="show-desktop" style={{ alignItems: 'center', gap: '20px' }}>
        {children}
        
        {user && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '4px 6px 4px 12px',
            borderRadius: '30px',
            backgroundColor: 'hsl(var(--bg-surface))',
            border: '1px solid hsl(var(--border-subtle))'
          }}>
            {user.avatarUrl ? (
              <img 
                src={user.avatarUrl} 
                alt={user.name} 
                style={{ width: '28px', height: '28px', borderRadius: '50%', border: '1.5px solid hsl(var(--accent-cyan))' }}
              />
            ) : (
              <div style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                backgroundColor: 'hsl(var(--accent-purple) / 0.2)',
                color: 'hsl(var(--accent-purple))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <User size={14} />
              </div>
            )}
            
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.825rem', fontWeight: '600', color: '#fff', lineHeight: 1.2 }}>{user.name}</span>
              <span style={{ fontSize: '0.7rem', color: 'hsl(var(--text-muted))', lineHeight: 1.2 }}>{user.email}</span>
            </div>

            <button 
              onClick={logoutSession}
              title="Sign Out"
              className="btn-ghost"
              style={{ padding: '6px', color: 'hsl(var(--text-muted))' }}
            >
              <LogOut size={16} />
            </button>
          </div>
        )}
      </div>

      {/* Mobile Toggle Button */}
      <div className="hide-desktop" style={{ alignItems: 'center', gap: '12px' }}>
        <div className="badge badge-cyan" style={{ fontSize: '0.65rem' }}>
          {isConnected ? <Wifi size={10} /> : <WifiOff size={10} />}
          <span>{isConnected ? 'LIVE' : 'OFFLINE'}</span>
        </div>

        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="btn-ghost"
          style={{ padding: '8px', color: '#fff' }}
        >
          {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="hide-desktop" style={{
          position: 'absolute',
          top: '64px',
          left: 0,
          right: 0,
          backgroundColor: 'hsl(var(--bg-surface))',
          borderBottom: '1px solid hsl(var(--border-subtle))',
          padding: '16px 20px',
          flexDirection: 'column',
          gap: '16px',
          boxShadow: '0 12px 30px rgba(0,0,0,0.6)',
          zIndex: 99
        }}>
          {children && <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>{children}</div>}

          {user && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingTop: children ? '12px' : '0',
              borderTop: children ? '1px solid hsl(var(--border-subtle))' : 'none'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.name} style={{ width: '32px', height: '32px', borderRadius: '50%' }} />
                ) : (
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'hsl(var(--accent-purple) / 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <User size={16} />
                  </div>
                )}
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: '600', color: '#fff' }}>{user.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))' }}>{user.email}</div>
                </div>
              </div>

              <button
                onClick={logoutSession}
                className="btn-secondary"
                style={{ padding: '6px 12px', fontSize: '0.8rem' }}
              >
                <LogOut size={14} /> Log Out
              </button>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
export { Navbar };
