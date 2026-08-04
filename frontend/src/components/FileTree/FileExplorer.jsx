import React, { useEffect, useState, useCallback } from 'react';
import API from '../../services/api';
import FileNode from './FileNode';
import { Plus, FolderPlus, FileCode, Search, RefreshCw } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

const FileExplorer = ({ projectId, activeFileId, onFileSelect }) => {
  const { addToast } = useToast();
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterQuery, setFilterQuery] = useState('');
  const [showInput, setShowInput] = useState(null); // 'file' | 'directory' | null
  const [newItemName, setNewItemName] = useState('');

  const fetchFiles = useCallback(async () => {
    try {
      setLoading(true);
      const res = await API.get(`/files?projectId=${projectId}`);
      if (res.data.success) {
        setFiles(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load project files:', err);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    if (projectId) fetchFiles();
  }, [projectId, fetchFiles]);

  const buildTree = (flatFiles) => {
    const map = {};
    const roots = [];
    
    flatFiles.forEach(file => {
      map[file.path] = { ...file, children: [] };
    });

    flatFiles.forEach(file => {
      const mapped = map[file.path];
      const parts = file.path.split('/');
      
      if (parts.length === 1) {
        roots.push(mapped);
      } else {
        const parentPath = parts.slice(0, -1).join('/');
        const parent = map[parentPath];
        if (parent) {
          parent.children.push(mapped);
        } else {
          roots.push(mapped);
        }
      }
    });

    return roots;
  };

  const handleCreateItem = async (e) => {
    e.preventDefault();
    if (!newItemName.trim()) return;

    try {
      const res = await API.post('/files', {
        project: projectId,
        name: newItemName,
        path: newItemName,
        type: showInput,
        content: showInput === 'file' ? `// Happy Coding in ${newItemName}!\n` : undefined,
      });

      if (res.data.success) {
        addToast(`${showInput === 'file' ? 'File' : 'Folder'} created successfully!`, 'success');
        fetchFiles();
        setNewItemName('');
        setShowInput(null);
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Error creating workspace item', 'error');
    }
  };

  const handleDeleteItem = async (node) => {
    if (!confirm(`Are you sure you want to delete "${node.name}"?`)) return;

    try {
      const res = await API.delete(`/files/${node._id}`);
      if (res.data.success) {
        addToast('Item deleted successfully!', 'success');
        fetchFiles();
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Error deleting workspace item', 'error');
    }
  };

  const filteredFiles = filterQuery
    ? files.filter(f => f.name.toLowerCase().includes(filterQuery.toLowerCase()))
    : files;

  const tree = buildTree(filteredFiles);

  return (
    <div className="glass-panel" style={{
      padding: '14px',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      backgroundColor: 'hsl(var(--bg-surface))',
      border: '1px solid hsl(var(--border-subtle))'
    }}>
      {/* Explorer Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid hsl(var(--border-subtle))',
        paddingBottom: '10px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FileCode size={16} color="hsl(var(--accent-cyan))" />
          <span style={{ fontSize: '0.8rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#fff' }}>
            Explorer
          </span>
        </div>

        <div style={{ display: 'flex', gap: '6px' }}>
          <button 
            onClick={() => setShowInput(showInput === 'file' ? null : 'file')}
            className="btn-ghost"
            style={{ padding: '4px', color: showInput === 'file' ? 'hsl(var(--accent-cyan))' : 'hsl(var(--text-muted))' }}
            title="New File"
          >
            <Plus size={16} />
          </button>
          <button 
            onClick={() => setShowInput(showInput === 'directory' ? null : 'directory')}
            className="btn-ghost"
            style={{ padding: '4px', color: showInput === 'directory' ? 'hsl(var(--accent-purple))' : 'hsl(var(--text-muted))' }}
            title="New Folder"
          >
            <FolderPlus size={16} />
          </button>
          <button
            onClick={fetchFiles}
            className="btn-ghost"
            style={{ padding: '4px', color: 'hsl(var(--text-muted))' }}
            title="Refresh Files"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Quick Search inside Explorer */}
      <div style={{ position: 'relative' }}>
        <Search size={14} color="hsl(var(--text-muted))" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
        <input
          type="text"
          placeholder="Filter files..."
          value={filterQuery}
          onChange={(e) => setFilterQuery(e.target.value)}
          style={{
            width: '100%',
            background: 'hsl(var(--bg-deep))',
            border: '1px solid hsl(var(--border-subtle))',
            borderRadius: '6px',
            padding: '6px 10px 6px 30px',
            fontSize: '0.785rem',
            color: '#fff',
            outline: 'none'
          }}
        />
      </div>

      {/* Inline Creation Input Form */}
      {showInput && (
        <form onSubmit={handleCreateItem} style={{ display: 'flex', gap: '6px' }}>
          <input
            type="text"
            placeholder={showInput === 'file' ? 'index.js' : 'src'}
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            style={{
              flex: 1,
              background: 'hsl(var(--bg-deep))',
              border: '1px solid hsl(var(--accent-cyan))',
              borderRadius: '6px',
              padding: '6px 10px',
              fontSize: '0.8rem',
              color: '#fff',
              outline: 'none'
            }}
            autoFocus
          />
          <button 
            type="submit"
            className="neon-btn"
            style={{ padding: '4px 10px', fontSize: '0.75rem' }}
          >
            Add
          </button>
        </form>
      )}

      {/* Files Tree */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {loading ? (
          <span style={{ fontSize: '0.8rem', color: 'hsl(var(--accent-cyan))', padding: '8px' }}>Loading files...</span>
        ) : tree.length === 0 ? (
          <div style={{ fontSize: '0.8rem', color: 'hsl(var(--text-muted))', padding: '12px', textAlign: 'center' }}>
            {filterQuery ? 'No files match search query.' : 'No files in workspace yet.'}
          </div>
        ) : (
          tree.map(node => (
            <FileNode 
              key={node._id} 
              node={node} 
              activeFileId={activeFileId}
              onSelect={(n) => {
                const ext = n.name.split('.').pop()?.toLowerCase();
                let lang = 'javascript';
                if (ext === 'py') lang = 'python';
                else if (ext === 'html') lang = 'html';
                else if (ext === 'css') lang = 'css';
                else if (ext === 'json') lang = 'json';
                else if (ext === 'md') lang = 'markdown';
                else if (ext === 'typescript' || ext === 'ts' || ext === 'tsx') lang = 'typescript';
                
                onFileSelect({ id: n._id, name: n.name, language: lang });
              }}
              onDelete={handleDeleteItem}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default FileExplorer;
export { FileExplorer };
