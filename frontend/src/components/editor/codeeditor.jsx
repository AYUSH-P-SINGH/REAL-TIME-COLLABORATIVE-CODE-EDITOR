import React, { useRef, useState, useEffect } from 'react';
import MonacoEditor from '@monaco-editor/react';
import { useDocSync } from '../../hooks/useDocSync';
import { usePresence } from '../../hooks/usepresence';
import { useSocket } from '../../context/SocketContext';
import EditorHeader from './EditorHeader';

const CodeEditor = ({ fileId, fileName, fileLanguage }) => {
  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const [editorTheme, setEditorTheme] = useState('vs-dark');
  const { socket } = useSocket();

  const { handleLocalChange } = useDocSync(fileId, editorRef, monacoRef);
  usePresence(fileId, editorRef, monacoRef);

  useEffect(() => {
    if (!socket) return;

    const handleThemeSync = ({ theme }) => {
      setEditorTheme(theme);
    };

    socket.on('workspace:theme', handleThemeSync);

    return () => {
      socket.off('workspace:theme', handleThemeSync);
    };
  }, [socket]);

  const handleThemeChange = (newTheme) => {
    setEditorTheme(newTheme);
    if (socket) {
      socket.emit('workspace:theme', { fileId, theme: newTheme });
    }
  };

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Define Cyberpunk Theme
    monaco.editor.defineTheme('cyberpunk', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: 'ff0055', fontStyle: 'italic' },
        { token: 'keyword', foreground: '00ffcc', fontStyle: 'bold' },
        { token: 'string', foreground: 'ff9f00' }
      ],
      colors: {
        'editor.background': '#0a0d1a',
        'editor.foreground': '#00ffcc',
        'editorLineNumber.foreground': '#ff0055',
        'editorLineNumber.activeForeground': '#00ffcc',
        'editor.lineHighlightBackground': '#141930',
        'editor.selectionBackground': '#ff005540'
      }
    });

    // Define Synthwave Theme
    monaco.editor.defineTheme('synthwave', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '848bb3', fontStyle: 'italic' },
        { token: 'keyword', foreground: 'ff7edb', fontStyle: 'bold' },
        { token: 'string', foreground: 'fede5d' },
        { token: 'number', foreground: 'f97e72' }
      ],
      colors: {
        'editor.background': '#241230',
        'editor.foreground': '#fede5d',
        'editorLineNumber.foreground': '#ff7edb',
        'editorLineNumber.activeForeground': '#fede5d',
        'editor.lineHighlightBackground': '#341a45',
        'editor.selectionBackground': '#ff7edb40'
      }
    });

    // Customize Monaco coding space options
    editor.updateOptions({
      fontSize: 14,
      fontFamily: 'var(--font-mono)',
      cursorBlinking: 'smooth',
      smoothScrolling: true,
      cursorSmoothCaretAnimation: 'on',
      padding: { top: 16, bottom: 16 },
      minimap: { enabled: true, side: 'right' },
      roundedSelection: true,
      lineHeight: 22,
    });
  };

  return (
    <div className="glass-panel" style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      width: '100%',
      overflow: 'hidden'
    }}>
      <EditorHeader
        fileName={fileName}
        fileLanguage={fileLanguage}
        editorTheme={editorTheme}
        setEditorTheme={handleThemeChange}
      />
      <div style={{ flex: 1, width: '100%', position: 'relative' }}>
        <MonacoEditor
          height="100%"
          language={fileLanguage}
          theme={editorTheme}
          loading={
            <div style={{
              color: '#22d3ee',
              padding: '24px',
              fontSize: '0.95rem',
              fontWeight: '500',
              fontFamily: 'var(--font-sans)'
            }}>
              Loading Collaborative Monaco Instance...
            </div>
          }
          editorDidMount={handleEditorDidMount}
          onChange={(value, event) => handleLocalChange(value, event)}
        />
      </div>
    </div>
  );
};

export default CodeEditor;
export { CodeEditor };
