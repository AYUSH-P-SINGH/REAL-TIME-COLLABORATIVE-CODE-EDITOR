import React from 'react';
import { Share2, Monitor, Code, Copy, Check } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

const EditorHeader = ({ fileName, fileLanguage, editorTheme, setEditorTheme }) => {
  const { addToast } = useToast();
  const [copied, setCopied] = React.useState(false);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    addToast('Workspace session URL copied to clipboard!', 'success');
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 16px',
      backgroundColor: 'hsl(var(--bg-surface))',
      borderBottom: '1px solid hsl(var(--border-subtle))',
      height: '46px',
      gap: '12px',
      flexWrap: 'wrap'
    }}>
      {/* File Tag */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
        <Code size={16} color="hsl(var(--accent-cyan))" />
        <span style={{
          fontSize: '0.85rem',
          fontWeight: '700',
          color: '#fff',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}>
          {fileName}
        </span>
        <span className="badge badge-purple" style={{ textTransform: 'uppercase', fontSize: '0.65rem' }}>
          {fileLanguage}
        </span>
      </div>

      {/* Action Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {/* Theme Picker */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Monitor size={14} color="hsl(var(--text-muted))" className="hide-mobile" />
          <select 
            value={editorTheme}
            onChange={(e) => setEditorTheme(e.target.value)}
            style={{
              background: 'hsl(var(--bg-deep))',
              border: '1px solid hsl(var(--border-subtle))',
              color: 'hsl(var(--text-secondary))',
              fontSize: '0.75rem',
              padding: '4px 8px',
              borderRadius: '6px',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="vs-dark">Dark Theme</option>
            <option value="light">Light Theme</option>
            <option value="cyberpunk">⚡ Cyberpunk</option>
            <option value="synthwave">🌌 Synthwave</option>
          </select>
        </div>

        {/* Share Button */}
        <button
          onClick={handleCopyLink}
          className="badge badge-cyan"
          style={{ cursor: 'pointer', padding: '6px 12px' }}
        >
          <Share2 size={12} />
          <span className="hide-mobile">Share Room</span>
        </button>
      </div>
    </div>
  );
};

export default EditorHeader;
export { EditorHeader };
