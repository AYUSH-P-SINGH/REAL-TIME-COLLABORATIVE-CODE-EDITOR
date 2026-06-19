import React, { useEffect, useState } from 'react';
import API from '../../services/api';
import FileNode from './FileNode';
import { Plus, FolderPlus, FileCode } from 'lucide-react';

const FileExplorer = ({ projectId, onFileSelect }) => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showInput, setShowInput] = useState(null); // 'file' | 'directory' | null
  const [newItemName, setNewItemName] = useState('');

  const fetchFiles = async () => {
    try {
      const res = await API.get(`/files?projectId=${projectId}`);
      if (res.data.success) {
        setFiles(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load project files:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) fetchFiles();
  }, [projectId]);

  // Construct a nested tree hierarchy from list of flat files
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
          // If parent is not loaded/found, render as root
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
        path: newItemName, // Simplify for flat structure tree paths
        type: showInput,
        content: showInput === 'file' ? `// Happy Coding in ${newItemName}!\n` : undefined,
      });

      if (res.data.success) {
        fetchFiles();
        setNewItemName('');
        setShowInput(null);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error creating workspace item');
    }
  };

  const handleDeleteItem = async (node) => {
    if (!confirm(`Are you sure you want to delete ${node.name}?`)) return;

    try {
      const res = await API.delete(`/files/${node._id}`);
      if (res.data.success) {
        fetchFiles();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error deleting workspace item');
    }
  };

  const tree = buildTree(files);

  return (
    <div className="glass-panel" style={{
      padding: '16px',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      backgroundColor: '#0a0e17'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid #1a2233',
        paddingBottom: '10px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FileCode size={16} color="#22d3ee" />
          <span style={{ fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase', color: '#fff' }}>
            Files Explorer
          </span>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            onClick={() => setShowInput('file')}
            style={{ background: 'none', border: 'none', color: '#8f9cae', cursor: 'pointer' }}
            title="Create File"
          >
            <Plus size={16} />
          </button>
          <button 
            onClick={() => setShowInput('directory')}
            style={{ background: 'none', border: 'none', color: '#8f9cae', cursor: 'pointer' }}
            title="Create Folder"
          >
            <FolderPlus size={16} />
          </button>
        </div>
      </div>

      {showInput && (
        <form onSubmit={handleCreateItem} style={{ display: 'flex', gap: '6px' }}>
          <input
            type="text"
            placeholder={showInput === 'file' ? 'filename.js' : 'folder_name'}
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            style={{
              flex: 1,
              background: '#151b26',
              border: '1px solid #1c2638',
              borderRadius: '4px',
              padding: '4px 8px',
              fontSize: '0.8rem',
              color: '#fff',
              outline: 'none'
            }}
            autoFocus
          />
          <button 
            type="submit"
            style={{
              background: '#22d3ee',
              color: '#000',
              border: 'none',
              borderRadius: '4px',
              padding: '2px 8px',
              fontSize: '0.75rem',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Add
          </button>
        </form>
      )}

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {loading ? (
          <span style={{ fontSize: '0.8rem', color: '#8f9cae' }}>Loading files...</span>
        ) : tree.length === 0 ? (
          <span style={{ fontSize: '0.8rem', color: '#8f9cae' }}>No workspace files.</span>
        ) : (
          tree.map(node => (
            <FileNode 
              key={node._id} 
              node={node} 
              onSelect={(n) => {
                const ext = n.name.split('.').pop();
                let lang = 'javascript';
                if (ext === 'py') lang = 'python';
                else if (ext === 'html') lang = 'html';
                else if (ext === 'css') lang = 'css';
                else if (ext === 'json') lang = 'json';
                
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
