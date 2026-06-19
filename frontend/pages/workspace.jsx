import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../services/api';
import Navbar from '../components/Navigation/Navbar';
import FileExplorer from '../components/FileTree/FileExplorer';
import CodeEditor from '../components/Editor/CodeEditor';
import AvatarGroup from '../components/Shared/AvatarGroup';
import { ArrowLeft, UserPlus } from 'lucide-react';
import GlassCard from '../components/Shared/GlassCard';

const Workspace = () => {
  const { projectId } = useParams();
  const [project, setProject] = useState(null);
  const [activeFile, setActiveFile] = useState(null);
  
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  
  const navigate = useNavigate();

  const fetchProjectDetails = async () => {
    try {
      const res = await API.get(`/projects/${projectId}`);
      if (res.data.success) {
        setProject(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load project details:', err);
      navigate('/dashboard');
    }
  };

  useEffect(() => {
    if (projectId) {
      fetchProjectDetails();
    }
  }, [projectId]);

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    try {
      const res = await API.post(`/projects/${projectId}/invite`, { email: inviteEmail });
      if (res.data.success) {
        alert('Collaborator added successfully!');
        setInviteEmail('');
        setShowInviteModal(false);
        fetchProjectDetails();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add collaborator');
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
        <div style={{ flex: 1, height: '100%', minWidth: 0 }}>
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
