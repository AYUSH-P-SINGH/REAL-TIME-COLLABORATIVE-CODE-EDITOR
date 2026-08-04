import React, { useState } from 'react';
import { Folder, FolderOpen, FileCode, FileText, Code2, FileJson, ChevronRight, ChevronDown, Trash2 } from 'lucide-react';

const getFileIcon = (fileName) => {
  const ext = fileName.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'js':
    case 'jsx':
    case 'ts':
    case 'tsx':
      return <FileCode size={14} color="hsl(var(--accent-cyan))" />;
    case 'py':
      return <Code2 size={14} color="hsl(var(--accent-amber))" />;
    case 'json':
      return <FileJson size={14} color="hsl(var(--accent-purple))" />;
    case 'css':
    case 'html':
      return <FileCode size={14} color="hsl(var(--accent-pink))" />;
    case 'md':
    case 'txt':
    default:
      return <FileText size={14} color="hsl(var(--text-muted))" />;
  }
};

const FileNode = ({ node, activeFileId, onSelect, onDelete }) => {
  const [isOpen, setIsOpen] = useState(true);

  const isDir = node.type === 'directory';
  const isActive = node._id === activeFileId;

  const handleClick = (e) => {
    e.stopPropagation();
    if (isDir) {
      setIsOpen(!isOpen);
    } else {
      onSelect(node);
    }
  };

  return (
    <div style={{ marginLeft: '8px' }}>
      <div 
        onClick={handleClick}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '6px 8px',
          borderRadius: '6px',
          cursor: 'pointer',
          transition: 'all 0.15s ease',
          fontSize: '0.85rem',
          backgroundColor: isActive ? 'hsl(var(--accent-cyan) / 0.15)' : 'transparent',
          border: isActive ? '1px solid hsl(var(--accent-cyan) / 0.3)' : '1px solid transparent',
          color: isActive ? '#fff' : isDir ? 'hsl(var(--accent-purple))' : 'hsl(var(--text-secondary))'
        }}
        onMouseEnter={(e) => { 
          if (!isActive) e.currentTarget.style.backgroundColor = 'hsl(var(--bg-surface))'; 
        }}
        onMouseLeave={(e) => { 
          if (!isActive) e.currentTarget.style.backgroundColor = 'transparent'; 
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }}>
          {isDir ? (
            isOpen ? <ChevronDown size={14} color="hsl(var(--text-muted))" /> : <ChevronRight size={14} color="hsl(var(--text-muted))" />
          ) : (
            <div style={{ width: '14px' }} />
          )}
          {isDir ? (
            isOpen ? <FolderOpen size={14} color="hsl(var(--accent-purple))" /> : <Folder size={14} color="hsl(var(--accent-purple))" />
          ) : (
            getFileIcon(node.name)
          )}
          <span style={{
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            fontWeight: isActive ? '600' : '400'
          }}>
            {node.name}
          </span>
        </div>
        
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(node);
          }}
          title="Delete Item"
          style={{
            background: 'none',
            border: 'none',
            color: 'hsl(var(--text-muted))',
            cursor: 'pointer',
            padding: '2px 4px',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            opacity: 0.7,
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = 'hsl(var(--accent-pink))'; e.currentTarget.style.opacity = '1'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = 'hsl(var(--text-muted))'; e.currentTarget.style.opacity = '0.7'; }}
        >
          <Trash2 size={12} />
        </button>
      </div>

      {isDir && isOpen && node.children && (
        <div style={{ borderLeft: '1px solid hsl(var(--border-subtle))', marginLeft: '6px', paddingTop: '2px' }}>
          {node.children.map(child => (
            <FileNode 
              key={child._id} 
              node={child} 
              activeFileId={activeFileId}
              onSelect={onSelect} 
              onDelete={onDelete} 
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default FileNode;
export { FileNode };
