import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../services/api';
import Navbar from '../components/navigation/navbar';
import FileExplorer from '../components/FileTree/FileExplorer';
import CodeEditor from '../components/editor/codeeditor';
import AvatarGroup from '../components/Shared/AvatarGroup';
import { ArrowLeft, UserPlus, Activity, Menu, X, Command, Code2, Plus, HelpCircle } from 'lucide-react';
import GlassCard from '../components/Shared/GlassCard';
import { useSocket } from '../context/SocketContext';
import { useToast } from '../context/ToastContext';

const Workspace = () => {
  const { projectId } = useParams();
  const [project, setProject] = useState(null);
  
  // Tab System State: list of open files
  const [openFiles, setOpenFiles] = useState([]);
  const [activeFileId, setActiveFileId] = useState(null);

  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  
  const navigate = useNavigate();
  const { socket } = useSocket();
  const { addToast } = useToast();
  
  const [activityLog, setActivityLog] = useState([]);
  const [showActivityLog, setShowActivityLog] = useState(true);

  // Mobile Drawers state
  const [mobileExplorerOpen, setMobileExplorerOpen] = useState(false);
  const [mobileActivityOpen, setMobileActivityOpen] = useState(false);

  useEffect(() => {
    if (!socket) return;

    const handlePresenceUpdate = ({ userName, action }) => {
      const time = new Date().toLocaleTimeString();
      setActivityLog(prev => [
        {
          id: Date.now() + Math.random(),
          text: `${userName} has ${action === 'join' ? 'entered' : 'left'} the workspace.`,
          time,
          type: 'presence'
        },
        ...prev.slice(0, 49)
      ]);
    };

    const handleCodeEdit = ({ senderId, change }) => {
      if (change && change.patch) {
        const time = new Date().toLocaleTimeString();
        setActivityLog(prev => {
          const lastLog = prev[0];
          if (lastLog && lastLog.type === 'edit' && lastLog.senderId === senderId) {
            return prev;
          }
          return [
            {
              id: Date.now() + Math.random(),
              text: `Collaborator modified codebase.`,
              time,
              type: 'edit',
              senderId
            },
            ...prev.slice(0, 49)
          ];
        });
      }
    };

    const handleThemeSync = ({ theme }) => {
      const time = new Date().toLocaleTimeString();
      setActivityLog(prev => [
        {
          id: Date.now() + Math.random(),
          text: `Workspace editor theme updated to: ${theme}`,
          time,
          type: 'theme'
        },
        ...prev.slice(0, 49)
      ]);
    };

    socket.on('presence:update', handlePresenceUpdate);
    socket.on('code:edit', handleCodeEdit);
    socket.on('workspace:theme', handleThemeSync);

    return () => {
      socket.off('presence:update', handlePresenceUpdate);
      socket.off('code:edit', handleCodeEdit);
      socket.off('workspace:theme', handleThemeSync);
    };
  }, [socket]);

  const fetchProjectDetails = useCallback(async () => {
    try {
      const res = await API.get(`/projects/${projectId}`);
      if (res.data.success) {
        setProject(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load project details:', err);
      navigate('/dashboard');
    }
  }, [projectId, navigate]);

  useEffect(() => {
    if (projectId) {
      fetchProjectDetails();
    }
  }, [projectId, fetchProjectDetails]);

  // Open file handler (tab management)
  const handleSelectFile = (file) => {
    if (!openFiles.find(f => f.id === file.id)) {
      setOpenFiles(prev => [...prev, file]);
    }
    setActiveFileId(file.id);
    setMobileExplorerOpen(false);
  };

  const handleCloseTab = (e, fileId) => {
    e.stopPropagation();
    const filtered = openFiles.filter(f => f.id !== fileId);
    setOpenFiles(filtered);
    if (activeFileId === fileId) {
      if (filtered.length > 0) {
        setActiveFileId(filtered[filtered.length - 1].id);
      } else {
        setActiveFileId(null);
      }
    }
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    try {
      const res = await API.post(`/projects/${projectId}/invite`, { email: inviteEmail });
      if (res.data.success) {
        addToast('Collaborator invited successfully!', 'success');
        setInviteEmail('');
        setShowInviteModal(false);
        fetchProjectDetails();
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to invite collaborator', 'error');
    }
  };

  const activeFile = openFiles.find(f => f.id === activeFileId);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      backgroundColor: 'hsl(var(--bg-deep))',
      overflow: 'hidden'
    }}>
      {/* Navbar Header */}
      <Navbar>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {project && (
            <AvatarGroup 
              users={project.members.map(m => ({ id: m.user._id, name: m.user.name }))} 
            />
          )}
          
          <button
            onClick={() => setShowInviteModal(true)}
            className="btn-secondary"
            style={{ padding: '6px 12px', fontSize: '0.8rem' }}
          >
            <UserPlus size={14} color="hsl(var(--accent-cyan))" />
            <span className="hide-mobile">Invite</span>
          </button>

          <button
            onClick={() => setShowShortcutsModal(true)}
            className="btn-ghost hide-mobile"
            title="Keyboard Shortcuts"
            style={{ padding: '6px' }}
          >
            <HelpCircle size={16} />
          </button>

          <button
            onClick={() => setShowActivityLog(prev => !prev)}
            className="btn-secondary hide-mobile"
            style={{
              padding: '6px 12px',
              fontSize: '0.8rem',
              borderColor: showActivityLog ? 'hsl(var(--accent-cyan))' : 'hsl(var(--border-subtle))',
              color: showActivityLog ? 'hsl(var(--accent-cyan))' : 'hsl(var(--text-secondary))'
            }}
          >
            <Activity size={14} />
            Activity
          </button>
        </div>
      </Navbar>

      {/* Mobile Actions Bar */}
      <div className="hide-desktop" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 16px',
        backgroundColor: 'hsl(var(--bg-surface))',
        borderBottom: '1px solid hsl(var(--border-subtle))'
      }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => navigate('/dashboard')}
            className="btn-ghost"
            style={{ padding: '4px 8px', fontSize: '0.8rem' }}
          >
            <ArrowLeft size={14} />
          </button>

          <button
            onClick={() => { setMobileExplorerOpen(true); setMobileActivityOpen(false); }}
            className="badge badge-cyan"
            style={{ cursor: 'pointer' }}
          >
            <Menu size={12} />
            Files Explorer
          </button>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setShowShortcutsModal(true)}
            className="btn-ghost"
            style={{ padding: '4px' }}
          >
            <Command size={14} />
          </button>

          <button
            onClick={() => { setMobileActivityOpen(true); setMobileExplorerOpen(false); }}
            className="badge badge-purple"
            style={{ cursor: 'pointer' }}
          >
            <Activity size={12} />
            Activity ({activityLog.length})
          </button>
        </div>
      </div>

      {/* Main Workspace Workspace Layout */}
      <div style={{
        display: 'flex',
        flex: 1,
        padding: '10px',
        gap: '10px',
        overflow: 'hidden',
        position: 'relative'
      }}>
        
        {/* Mobile Backdrop Overlay */}
        {(mobileExplorerOpen || mobileActivityOpen) && (
          <div 
            className="drawer-backdrop" 
            onClick={() => { setMobileExplorerOpen(false); setMobileActivityOpen(false); }} 
          />
        )}

        {/* File Explorer Sidebar (Desktop Panel & Mobile Drawer) */}
        <div 
          className={`glass-panel ${mobileExplorerOpen ? 'mobile-drawer mobile-drawer-left' : 'show-desktop'}`}
          style={{
            width: '260px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            height: '100%',
            flexShrink: 0
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px 0 12px' }}>
            <button
              onClick={() => navigate('/dashboard')}
              className="btn-ghost hide-mobile"
              style={{ padding: '4px 8px', fontSize: '0.8rem', width: '100%', justifyContent: 'flex-start' }}
            >
              <ArrowLeft size={14} /> Back to Dashboard
            </button>

            {mobileExplorerOpen && (
              <button onClick={() => setMobileExplorerOpen(false)} className="btn-ghost" style={{ padding: '4px' }}>
                <X size={16} />
              </button>
            )}
          </div>

          <div style={{ flex: 1, height: '100%', overflow: 'hidden' }}>
            <FileExplorer 
              projectId={projectId} 
              activeFileId={activeFileId}
              onFileSelect={handleSelectFile} 
            />
          </div>
        </div>

        {/* Center Monaco Editor Pane */}
        <div style={{ flex: 1, height: '100%', minWidth: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
          
          {/* Open Tabs Bar */}
          {openFiles.length > 0 && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              overflowX: 'auto',
              backgroundColor: 'hsl(var(--bg-surface))',
              borderRadius: '8px 8px 0 0',
              padding: '4px 6px 0 6px',
              border: '1px solid hsl(var(--border-subtle))',
              borderBottom: 'none'
            }}>
              {openFiles.map(file => {
                const isTabActive = file.id === activeFileId;
                return (
                  <div
                    key={file.id}
                    onClick={() => setActiveFileId(file.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '6px 12px',
                      borderRadius: '6px 6px 0 0',
                      cursor: 'pointer',
                      fontSize: '0.8rem',
                      fontWeight: isTabActive ? '600' : '400',
                      backgroundColor: isTabActive ? 'hsl(var(--bg-deep))' : 'transparent',
                      color: isTabActive ? '#fff' : 'hsl(var(--text-muted))',
                      borderTop: isTabActive ? '2px solid hsl(var(--accent-cyan))' : '2px solid transparent',
                      borderLeft: isTabActive ? '1px solid hsl(var(--border-subtle))' : '1px solid transparent',
                      borderRight: isTabActive ? '1px solid hsl(var(--border-subtle))' : '1px solid transparent',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    <Code2 size={13} color={isTabActive ? 'hsl(var(--accent-cyan))' : 'hsl(var(--text-muted))'} />
                    <span>{file.name}</span>
                    <button
                      onClick={(e) => handleCloseTab(e, file.id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'hsl(var(--text-muted))',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        borderRadius: '4px',
                        padding: '2px'
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = 'hsl(var(--accent-pink))'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = 'hsl(var(--text-muted))'; }}
                    >
                      <X size={12} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Active File Editor or Empty Welcome Workspace */}
          {activeFile ? (
            <CodeEditor 
              key={activeFile.id}
              fileId={activeFile.id} 
              fileName={activeFile.name} 
              fileLanguage={activeFile.language} 
            />
          ) : (
            <div className="glass-panel" style={{
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              gap: '16px',
              color: 'hsl(var(--text-secondary))',
              textAlign: 'center',
              padding: '24px'
            }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '16px',
                backgroundColor: 'hsl(var(--accent-cyan) / 0.1)',
                color: 'hsl(var(--accent-cyan))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Code2 size={32} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: '#fff', marginBottom: '6px' }}>
                  No Active Workspace File
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'hsl(var(--text-muted))', maxWidth: '360px' }}>
                  Select or create a file from the explorer sidebar to open Monaco editor and start collaborative editing.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Right Activity Panel (Desktop Slide & Mobile Drawer) */}
        <div className={`glass-panel ${mobileActivityOpen ? 'mobile-drawer mobile-drawer-right' : ''}`} style={{
          width: showActivityLog || mobileActivityOpen ? '280px' : '0px',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          flexShrink: 0,
          opacity: showActivityLog || mobileActivityOpen ? 1 : 0
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 16px',
            borderBottom: '1px solid hsl(var(--border-subtle))',
            backgroundColor: 'hsl(var(--bg-surface))'
          }}>
            <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#fff' }}>Workspace Activity</span>
            <button 
              onClick={() => { setShowActivityLog(false); setMobileActivityOpen(false); }}
              className="btn-ghost"
              style={{ padding: '4px' }}
            >
              <X size={14} />
            </button>
          </div>

          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            {activityLog.length === 0 ? (
              <div style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))', textAlign: 'center', marginTop: '20px' }}>
                No activity logged in session yet.
              </div>
            ) : (
              activityLog.map((log) => (
                <div key={log.id} style={{
                  padding: '8px 10px',
                  backgroundColor: 'hsl(var(--bg-surface))',
                  border: '1px solid hsl(var(--border-subtle))',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  color: 'hsl(var(--text-secondary))',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  animation: 'slideIn 0.2s ease-out'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#fff', fontWeight: '600' }}>
                      {log.type === 'presence' ? '👥 Presence' : log.type === 'edit' ? '📝 Edit' : '⚙️ System'}
                    </span>
                    <span style={{ fontSize: '0.65rem', color: 'hsl(var(--text-muted))' }}>{log.time}</span>
                  </div>
                  <span>{log.text}</span>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <GlassCard style={{ width: '100%', maxWidth: '420px', display: 'flex', flexDirection: 'column', gap: '16px', padding: '24px' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#fff' }}>
              Invite Developer Collaborator
            </h3>
            
            <form onSubmit={handleInvite} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.8rem', color: 'hsl(var(--text-secondary))' }}>Email Address</label>
                <input
                  type="email"
                  placeholder="collaborator@example.com"
                  className="input-field"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button 
                  type="button" 
                  onClick={() => setShowInviteModal(false)}
                  className="btn-secondary"
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="neon-btn"
                  style={{ flex: 1 }}
                >
                  Send Invite
                </button>
              </div>
            </form>
          </GlassCard>
        </div>
      )}

      {/* Keyboard Shortcuts Modal */}
      {showShortcutsModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <GlassCard style={{ width: '100%', maxWidth: '420px', display: 'flex', flexDirection: 'column', gap: '16px', padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: '#fff' }}>
                Keyboard Shortcuts
              </h3>
              <button onClick={() => setShowShortcutsModal(false)} className="btn-ghost" style={{ padding: '4px' }}>
                <X size={16} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'hsl(var(--text-secondary))' }}>
                <span>Save Document</span>
                <kbd style={{ background: 'hsl(var(--bg-surface))', padding: '2px 8px', borderRadius: '4px', border: '1px solid hsl(var(--border-subtle))', color: '#fff' }}>Ctrl + S</kbd>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'hsl(var(--text-secondary))' }}>
                <span>Command Palette</span>
                <kbd style={{ background: 'hsl(var(--bg-surface))', padding: '2px 8px', borderRadius: '4px', border: '1px solid hsl(var(--border-subtle))', color: '#fff' }}>Ctrl + Shift + P</kbd>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'hsl(var(--text-secondary))' }}>
                <span>Theme Switcher</span>
                <kbd style={{ background: 'hsl(var(--bg-surface))', padding: '2px 8px', borderRadius: '4px', border: '1px solid hsl(var(--border-subtle))', color: '#fff' }}>Alt + T</kbd>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'hsl(var(--text-secondary))' }}>
                <span>Find in Document</span>
                <kbd style={{ background: 'hsl(var(--bg-surface))', padding: '2px 8px', borderRadius: '4px', border: '1px solid hsl(var(--border-subtle))', color: '#fff' }}>Ctrl + F</kbd>
              </div>
            </div>
          </GlassCard>
        </div>
      )}

    </div>
  );
};

export default Workspace;
export { Workspace };
