import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import Navbar from '../components/navigation/navbar';
import GlassCard from '../components/Shared/GlassCard';
import NeonButton from '../components/Shared/NeonButton';
import { Folder, Plus, Users, Calendar, Search, SlidersHorizontal, ArrowUpRight, Code, Sparkles } from 'lucide-react';
import { useToast } from '../context/ToastContext';

const Dashboard = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest'); // 'newest' | 'oldest' | 'name'
  
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
        addToast('Project workspace created successfully!', 'success');
        setShowModal(false);
        setName('');
        setDescription('');
        fetchProjects();
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to create project', 'error');
    }
  };

  // Filter & Sort Projects
  const filteredProjects = projects
    .filter(proj => 
      proj.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (proj.description && proj.description.toLowerCase().includes(searchQuery.toLowerCase()))
    )
    .sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.createdAt) - new Date(a.createdAt);
      if (sortBy === 'oldest') return new Date(a.createdAt) - new Date(b.createdAt);
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      return 0;
    });

  const totalCollaborators = projects.reduce((sum, p) => sum + (p.members?.length || 1), 0);

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: 'hsl(var(--bg-deep))',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <Navbar />

      <main style={{ flex: 1, padding: '32px 20px', maxWidth: '1200px', width: '100%', margin: '0 auto' }}>
        
        {/* Header Hero Stats Banner */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
          marginBottom: '32px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <h2 style={{ fontSize: '1.75rem', fontWeight: '800', color: '#fff' }}>
                  Project Workspaces
                </h2>
                <span className="badge badge-cyan">{projects.length} Total</span>
              </div>
              <p style={{ fontSize: '0.9rem', color: 'hsl(var(--text-secondary))' }}>
                Manage, edit, and collaborate on your codebases in real-time
              </p>
            </div>

            <button 
              onClick={() => setShowModal(true)}
              className="neon-btn"
            >
              <Plus size={18} />
              New Workspace
            </button>
          </div>

          {/* Quick Metrics Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '16px'
          }}>
            <div className="glass-panel" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{
                padding: '10px',
                borderRadius: '10px',
                backgroundColor: 'hsl(var(--accent-cyan) / 0.15)',
                color: 'hsl(var(--accent-cyan))'
              }}>
                <Code size={22} />
              </div>
              <div>
                <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#fff' }}>{projects.length}</div>
                <div style={{ fontSize: '0.8rem', color: 'hsl(var(--text-muted))' }}>Active Workspaces</div>
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{
                padding: '10px',
                borderRadius: '10px',
                backgroundColor: 'hsl(var(--accent-purple) / 0.15)',
                color: 'hsl(var(--accent-purple))'
              }}>
                <Users size={22} />
              </div>
              <div>
                <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#fff' }}>{totalCollaborators}</div>
                <div style={{ fontSize: '0.8rem', color: 'hsl(var(--text-muted))' }}>Total Team Members</div>
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{
                padding: '10px',
                borderRadius: '10px',
                backgroundColor: 'hsl(var(--accent-emerald) / 0.15)',
                color: 'hsl(var(--accent-emerald))'
              }}>
                <Sparkles size={22} />
              </div>
              <div>
                <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#fff' }}>WebSocket</div>
                <div style={{ fontSize: '0.8rem', color: 'hsl(var(--text-muted))' }}>Live Collaboration</div>
              </div>
            </div>
          </div>
        </div>

        {/* Filter and Search Controls */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          marginBottom: '24px',
          flexWrap: 'wrap'
        }}>
          <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
            <Search size={16} color="hsl(var(--text-muted))" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Search workspaces by name or keyword..."
              className="input-field"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '40px' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <SlidersHorizontal size={14} color="hsl(var(--text-muted))" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{
                background: 'hsl(var(--bg-surface))',
                border: '1px solid hsl(var(--border-subtle))',
                color: 'hsl(var(--text-primary))',
                padding: '10px 14px',
                borderRadius: '8px',
                fontSize: '0.85rem',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="newest">Sort: Newest First</option>
              <option value="oldest">Sort: Oldest First</option>
              <option value="name">Sort: Name (A-Z)</option>
            </select>
          </div>
        </div>

        {/* Grid View */}
        {loading ? (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '60px',
            color: 'hsl(var(--accent-cyan))',
            fontSize: '0.95rem'
          }}>
            Loading your workspaces...
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="glass-panel" style={{
            textAlign: 'center',
            padding: '60px 24px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '16px'
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: 'hsl(var(--bg-surface))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'hsl(var(--text-muted))'
            }}>
              <Folder size={32} />
            </div>
            
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: '#fff', marginBottom: '4px' }}>
                {searchQuery ? 'No matching projects found' : 'No workspaces created yet'}
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'hsl(var(--text-muted))', maxWidth: '380px' }}>
                {searchQuery ? 'Try clearing your search filters to view all projects.' : 'Create your first collaborative code workspace to invite peers and build together.'}
              </p>
            </div>

            {!searchQuery && (
              <NeonButton onClick={() => setShowModal(true)} style={{ marginTop: '8px' }}>
                <Plus size={16} /> Create Workspace
              </NeonButton>
            )}
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '20px'
          }}>
            {filteredProjects.map(proj => (
              <GlassCard 
                key={proj._id}
                onClick={() => navigate(`/workspace/${proj._id}`)}
                className="glass-panel-hover"
                style={{
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                  position: 'relative',
                  padding: '24px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                  <h3 style={{
                    fontSize: '1.15rem',
                    fontWeight: '700',
                    color: '#fff',
                    lineHeight: 1.3
                  }}>
                    {proj.name}
                  </h3>

                  <div style={{
                    color: 'hsl(var(--accent-cyan))',
                    padding: '4px',
                    borderRadius: '6px',
                    backgroundColor: 'hsl(var(--accent-cyan) / 0.1)'
                  }}>
                    <ArrowUpRight size={16} />
                  </div>
                </div>

                <p style={{
                  fontSize: '0.85rem',
                  color: 'hsl(var(--text-secondary))',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  lineHeight: 1.5,
                  minHeight: '2.55rem'
                }}>
                  {proj.description || 'No description provided for this codebase.'}
                </p>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderTop: '1px solid hsl(var(--border-subtle))',
                  paddingTop: '14px',
                  marginTop: 'auto',
                  fontSize: '0.775rem',
                  color: 'hsl(var(--text-muted))'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Users size={14} color="hsl(var(--accent-cyan))" />
                    <span>{proj.members?.length || 1} Member{proj.members?.length > 1 ? 's' : ''}</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Calendar size={14} />
                    <span>{new Date(proj.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        )}
      </main>

      {/* New Project Modal */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <GlassCard style={{
            width: '100%',
            maxWidth: '460px',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            padding: '28px'
          }}>
            <h3 style={{ fontSize: '1.35rem', fontWeight: '700', color: '#fff' }}>
              Create New Code Workspace
            </h3>
            
            <form onSubmit={handleCreateProject} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.8rem', color: 'hsl(var(--text-secondary))', fontWeight: '500' }}>Workspace Name</label>
                <input
                  type="text"
                  placeholder="e.g. Nextjs Dashboard App"
                  className="input-field"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.8rem', color: 'hsl(var(--text-secondary))', fontWeight: '500' }}>Description (Optional)</label>
                <textarea
                  placeholder="Describe your workspace project..."
                  className="input-field"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  style={{ minHeight: '90px', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)}
                  className="btn-secondary"
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  Cancel
                </button>
                <NeonButton type="submit" style={{ flex: 1 }}>
                  Create Workspace
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
