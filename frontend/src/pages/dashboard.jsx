import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import Navbar from '../components/navigation/navbar';
import GlassCard from '../components/Shared/GlassCard';
import NeonButton from '../components/Shared/NeonButton';
import { Folder, Plus, Users, Calendar } from 'lucide-react';
import { useToast } from '../context/ToastContext';

const Dashboard = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const fetchProjects = async () => {
    try {
      const res = await API.get('/projects');
      if (res.data.success) {
        setProjects(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load projects:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      const res = await API.post('/projects', { name, description });
      if (res.data.success) {
        addToast('Project created successfully!', 'success');
        setShowModal(false);
        setName('');
        setDescription('');
        fetchProjects();
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to create project', 'error');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#060913',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <Navbar />

      <main style={{ flex: 1, padding: '40px 24px', maxWidth: '1200px', width: '100%', margin: '0 auto' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '32px'
        }}>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#fff', marginBottom: '6px' }}>
              My Projects
            </h2>
            <p style={{ fontSize: '0.85rem', color: '#8f9cae' }}>
              Manage and collaborate on your code workspaces
            </p>
          </div>

          <button 
            onClick={() => setShowModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'linear-gradient(135deg, #22d3ee, #a855f7)',
              color: '#000',
              fontWeight: '600',
              padding: '10px 18px',
              border: 'none',
              borderRadius: '8px',
              fontSize: '0.9rem',
              cursor: 'pointer',
              boxShadow: '0 0 15px rgba(34, 211, 238, 0.2)'
            }}
          >
            <Plus size={16} />
            New Project
          </button>
        </div>

        {loading ? (
          <div style={{ color: '#22d3ee', fontSize: '0.95rem' }}>Loading workspaces...</div>
        ) : projects.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '80px 40px',
            backgroundColor: '#0a0d14',
            borderRadius: '12px',
            border: '1px solid #1a2233'
          }}>
            <Folder size={48} color="#8f9cae" style={{ marginBottom: '16px', opacity: 0.5 }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#fff', marginBottom: '8px' }}>
              No projects yet
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#8f9cae', marginBottom: '24px', maxWidth: '300px', margin: '0 auto 24px' }}>
              Create a new workspace and share with colleagues to start real-time coding
            </p>
            <NeonButton onClick={() => setShowModal(true)}>
              Get Started
            </NeonButton>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '20px'
          }}>
            {projects.map(proj => (
              <GlassCard 
                key={proj._id}
                onClick={() => navigate(`/workspace/${proj._id}`)}
                style={{
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                  transition: 'transform 0.2s, border-color 0.2s'
                }}
                className="glass-panel-hover"
              >
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#fff', marginBottom: '6px' }}>
                    {proj.name}
                  </h3>
                  <p style={{
                    fontSize: '0.85rem',
                    color: '#8f9cae',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    height: '36px'
                  }}>
                    {proj.description || 'No description provided.'}
                  </p>
                </div>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderTop: '1px solid #1c2638',
                  paddingTop: '12px',
                  marginTop: 'auto',
                  fontSize: '0.75rem',
                  color: '#8f9cae'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Users size={12} />
                    <span>{proj.members?.length || 1} Collaborators</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Calendar size={12} />
                    <span>{new Date(proj.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        )}
      </main>

      {showModal && (
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
          <GlassCard style={{ width: '100%', maxWidth: '440px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#fff' }}>
              Create New Project
            </h3>
            
            <form onSubmit={handleCreateProject} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.8rem', color: '#8f9cae', fontWeight: '500' }}>Project Name</label>
                <input
                  type="text"
                  placeholder="e.g. My Website"
                  className="input-field"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.8rem', color: '#8f9cae', fontWeight: '500' }}>Description (Optional)</label>
                <textarea
                  placeholder="Describe your workspace"
                  className="input-field"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  style={{ minHeight: '80px', resize: 'vertical', fontFamily: 'var(--font-sans)' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)}
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
                <NeonButton type="submit" style={{ flex: 1 }}>
                  Create
                </NeonButton>
              </div>
            </form>
          </GlassCard>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
export { Dashboard };
