import React, { useState } from 'react';
import { Folder, File, ChevronRight, ChevronDown, Trash2 } from 'lucide-react';

const FileNode = ({ node, onSelect, onDelete }) => {
  const [isOpen, setIsOpen] = useState(false);

  const isDir = node.type === 'directory';

  const handleClick = (e) => {
    e.stopPropagation();
    if (isDir) {
      setIsOpen(!isOpen);
    } else {
      onSelect(node);
    }
  };

  return (
    <div style={{ marginLeft: '12px' }}>
      <div 
        onClick={handleClick}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '6px 8px',
          borderRadius: '6px',
          cursor: 'pointer',
          transition: 'background-color 0.2s',
          fontSize: '0.85rem',
          color: isDir ? '#c084fc' : '#cbd5e1'
        }}
        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {isDir ? (
            isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />
          ) : (
            <div style={{ width: '14px' }} />
          )}
          {isDir ? <Folder size={14} /> : <File size={14} />}
          <span>{node.name}</span>
        </div>
        
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(node);
          }}
          style={{
            background: 'none',
            border: 'none',
            color: '#8f9cae',
            cursor: 'pointer',
            padding: '2px',
            transition: 'color 0.2s, transform 0.2s'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = '#f43f5e'; e.currentTarget.style.transform = 'scale(1.1)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = '#8f9cae'; e.currentTarget.style.transform = 'scale(1.0)'; }}
        >
          <Trash2 size={12} />
        </button>
      </div>

      {isDir && isOpen && node.children && (
        <div style={{ borderLeft: '1px solid #1c2638', marginLeft: '6px' }}>
          {node.children.map(child => (
            <FileNode key={child._id} node={child} onSelect={onSelect} onDelete={onDelete} />
          ))}
        </div>
      )}
    </div>
  );
};

export default FileNode;
export { FileNode };
