import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../services/api';
import Navbar from '../components/navigation/navbar';
import FileExplorer from '../components/FileTree/FileExplorer';
import CodeEditor from '../components/editor/codeeditor';
import AvatarGroup from '../components/Shared/AvatarGroup';
import { ArrowLeft, UserPlus, Activity } from 'lucide-react';
import GlassCard from '../components/Shared/GlassCard';
import { useSocket } from '../context/SocketContext';
import { useToast } from '../context/ToastContext';

const Workspace = () => {
  const { projectId } = useParams();
  const [project, setProject] = useState(null);
  const [activeFile, setActiveFile] = useState(null);
  
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  
  const navigate = useNavigate();
  const { socket } = useSocket();
  const { addToast } = useToast();
  const [activityLog, setActivityLog] = useState([]);
  const [showActivityLog, setShowActivityLog] = useState(true);

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
          // Throttle identical edit activity logs
          if (lastLog && lastLog.type === 'edit' && lastLog.senderId === senderId) {
            return prev;
          }
          return [
            {
              id: Date.now() + Math.random(),
              text: `Collaborator updated document changes.`,
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
          text: `Workspace theme changed to: ${theme}`,
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

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    try {
      const res = await API.post(`/projects/${projectId}/invite`, { email: inviteEmail });
      if (res.data.success) {
        addToast('Collaborator added successfully!', 'success');
        setInviteEmail('');
        setShowInviteModal(false);
        fetchProjectDetails();
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to add collaborator', 'error');
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      backgroundColor: '#060913',
      overflow: 'hidden'
    }}>
      <Navbar>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {project && (
            <AvatarGroup 
              users={project.members.map(m => ({ id: m.user._id, name: m.user.name }))} 
            />
          )}
          
          <button
            onClick={() => setShowInviteModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: '#1a2233',
              border: '1px solid #2d3b55',
              color: '#fff',
              fontSize: '0.8rem',
              padding: '6px 12px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '600',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#25314a' }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#1a2233' }}
          >
            <UserPlus size={14} />
            Invite
          </button>

          <button
            onClick={() => setShowActivityLog(prev => !prev)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: showActivityLog ? 'rgba(34, 211, 238, 0.15)' : '#1a2233',
              border: showActivityLog ? '1px solid #22d3ee' : '1px solid #2d3b55',
              color: showActivityLog ? '#22d3ee' : '#fff',
              fontSize: '0.8rem',
              padding: '6px 12px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '600',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = showActivityLog ? 'rgba(34, 211, 238, 0.25)' : '#25314a' }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = showActivityLog ? 'rgba(34, 211, 238, 0.15)' : '#1a2233' }}
          >
            <Activity size={14} />
            Activity Log
          </button>
        </div>
      </Navbar>

      <div style={{
        display: 'flex',
        flex: 1,
        padding: '12px',
        gap: '12px',
        overflow: 'hidden'
      }}>
        {/* Left pane: Explorer and Back triggers */}
        <div style={{
          width: '260px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          height: '100%',
          flexShrink: 0
        }}>
          <button
            onClick={() => navigate('/dashboard')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: '#0a0e17',
              border: '1px solid #1a2233',
              borderRadius: '8px',
              color: '#8f9cae',
              fontSize: '0.8rem',
              padding: '8px 12px',
              cursor: 'pointer',
              width: '100%',
              fontWeight: '600',
              textAlign: 'left'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#22d3ee'; e.currentTarget.style.color = '#fff'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#1a2233'; e.currentTarget.style.color = '#8f9cae'; }}
          >
            <ArrowLeft size={14} />
            Back to Dashboard
          </button>

          <div style={{ flex: 1 }}>
            <FileExplorer 
              projectId={projectId} 
              onFileSelect={(file) => setActiveFile(file)} 
            />
          </div>
        </div>

        {/* Right pane: Monaco workspace */}
        <div style={{ flex: 1, height: '100%', minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          {activeFile ? (
            <CodeEditor 
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
              gap: '12px',
              color: '#8f9cae'
            }}>
              <span style={{ fontSize: '1rem', fontWeight: '600', color: '#fff' }}>No Active File</span>
              <span style={{ fontSize: '0.85rem' }}>Select a file from the explorer sidebar to begin coding</span>
            </div>
          )}
        </div>

        {/* Activity Log Side-Panel */}
        <div className="glass-panel" style={{
          width: showActivityLog ? '280px' : '0px',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          flexShrink: 0,
          borderLeft: showActivityLog ? '1px solid #2d3b55' : 'none',
          opacity: showActivityLog ? 1 : 0
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 16px',
            borderBottom: '1px solid #1c2638',
            backgroundColor: '#0f131c'
          }}>
            <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#fff' }}>Activity Log</span>
            <button 
              onClick={() => setShowActivityLog(false)}
              style={{
                background: 'none',
                border: 'none',
                color: '#8f9cae',
                cursor: 'pointer',
                fontSize: '0.75rem'
              }}
            >
              Close
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
              <div style={{ fontSize: '0.75rem', color: '#526685', textAlign: 'center', marginTop: '16px' }}>
                No workspace activities recorded yet.
              </div>
            ) : (
              activityLog.map((log) => (
                <div key={log.id} style={{
                  padding: '8px 10px',
                  backgroundColor: '#0a0d16',
                  border: '1px solid #172033',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  color: '#b2c0d2',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  animation: 'slideIn 0.2s ease-out'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#fff', fontWeight: '600' }}>
                      {log.type === 'presence' ? '👥 Presence' : log.type === 'edit' ? '📝 Edit' : '⚙️ System'}
                    </span>
                    <span style={{ fontSize: '0.65rem', color: '#526685' }}>{log.time}</span>
                  </div>
                  <span>{log.text}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

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
          zIndex: 1000
        }}>
          <GlassCard style={{ width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#fff' }}>
              Add Developer Collaborator
            </h3>
            
            <form onSubmit={handleInvite} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.8rem', color: '#8f9cae' }}>Email Address</label>
                <input
                  type="email"
                  placeholder="collaborator@example.com"
                  className="input-field"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button 
                  type="button" 
                  onClick={() => setShowInviteModal(false)}
                  style={{
                    flex: 1,
                    background: '#1a2233',
                    border: '1px solid #2d3b55',
                    borderRadius: '8px',
                    color: '#fff',
                    fontWeight: '600',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    padding: '10px'
                  }}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  style={{
                    flex: 1,
                    background: 'linear-gradient(135deg, #22d3ee, #a855f7)',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#000',
                    fontWeight: '600',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    padding: '10px'
                  }}
                >
                  Invite
                </button>
              </div>
            </form>
          </GlassCard>
        </div>
      )}
    </div>
  );
};

export default Workspace;
export { Workspace };
