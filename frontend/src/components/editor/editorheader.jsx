import React from 'react';
import { Share2, Monitor, Code } from 'lucide-react';

const EditorHeader = ({ fileName, fileLanguage, editorTheme, setEditorTheme }) => {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '12px 18px',
      backgroundColor: '#0f131c',
      borderBottom: '1px solid #1c2638',
      height: '50px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Code size={16} color="#22d3ee" />
        <span style={{ fontSize: '0.875rem', fontWeight: '600', color: '#fff' }}>
          {fileName}
        </span>
        <span style={{
          fontSize: '0.7rem',
          backgroundColor: '#1b2333',
          color: '#8f9cae',
          padding: '2px 6px',
          borderRadius: '4px',
          textTransform: 'uppercase',
          fontWeight: '500'
        }}>
          {fileLanguage}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Monitor size={14} color="#8f9cae" />
          <select 
            value={editorTheme}
            onChange={(e) => setEditorTheme(e.target.value)}
            style={{
              background: '#151b26',
              border: '1px solid #1c2638',
              color: '#8f9cae',
              fontSize: '0.75rem',
              padding: '4px 8px',
              borderRadius: '6px',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="vs-dark">Dark</option>
            <option value="light">Light</option>
          </select>
        </div>

        <button
          onClick={() => {
            navigator.clipboard.writeText(window.location.href);
            alert('Workspace sharing link copied to clipboard!');
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(34, 211, 238, 0.1)',
            border: '1px solid rgba(34, 211, 238, 0.2)',
            color: '#22d3ee',
            padding: '4px 10px',
            borderRadius: '6px',
            fontSize: '0.75rem',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'background-color 0.2s'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(34, 211, 238, 0.2)' }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(34, 211, 238, 0.1)' }}
        >
          <Share2 size={12} />
          Share Room
        </button>
      </div>
    </div>
  );
};

export default EditorHeader;
export { EditorHeader };
