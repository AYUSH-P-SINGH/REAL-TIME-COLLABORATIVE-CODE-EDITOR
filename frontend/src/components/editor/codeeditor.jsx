import React, { useRef, useState, useEffect } from 'react';
import MonacoEditor from '@monaco-editor/react';
import { useDocSync } from '../../hooks/useDocSync';
import { usePresence } from '../../hooks/usepresence';
import { useSocket } from '../../context/SocketContext';
import EditorHeader from './editorheader';

const CodeEditor = ({ fileId, fileName, fileLanguage }) => {
  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const [editorTheme, setEditorTheme] = useState('vs-dark');
  const [cursorPos, setCursorPos] = useState({ line: 1, column: 1 });
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

    // Cyberpunk Theme Definition
    monaco.editor.defineTheme('cyberpunk', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: 'ff0055', fontStyle: 'italic' },
        { token: 'keyword', foreground: '00ffcc', fontStyle: 'bold' },
        { token: 'string', foreground: 'ff9f00' }
      ],
      colors: {
        'editor.background': '#070a14',
        'editor.foreground': '#00ffcc',
        'editorLineNumber.foreground': '#ff0055',
        'editorLineNumber.activeForeground': '#00ffcc',
        'editor.lineHighlightBackground': '#11162b',
        'editor.selectionBackground': '#ff005540'
      }
    });

    // Synthwave Theme Definition
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
        'editor.background': '#1a0b26',
        'editor.foreground': '#fede5d',
        'editorLineNumber.foreground': '#ff7edb',
        'editorLineNumber.activeForeground': '#fede5d',
        'editor.lineHighlightBackground': '#2a123d',
        'editor.selectionBackground': '#ff7edb40'
      }
    });

    // Configure options
    editor.updateOptions({
      fontSize: 14,
      fontFamily: 'var(--font-mono)',
      cursorBlinking: 'smooth',
      smoothScrolling: true,
      cursorSmoothCaretAnimation: 'on',
      padding: { top: 12, bottom: 12 },
      minimap: { enabled: false },
      roundedSelection: true,
      lineHeight: 22,
      automaticLayout: true,
      wordWrap: 'on'
    });

    // Cursor position tracking
    editor.onDidChangeCursorPosition((e) => {
      setCursorPos({
        line: e.position.lineNumber,
        column: e.position.column
      });
    });
  };

  return (
    <div className="glass-panel" style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      width: '100%',
      overflow: 'hidden',
      border: '1px solid hsl(var(--border-subtle))'
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
              color: 'hsl(var(--accent-cyan))',
              padding: '24px',
              fontSize: '0.9rem',
              fontWeight: '500',
              fontFamily: 'var(--font-sans)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              Initialising Monaco Engine...
            </div>
          }
          editorDidMount={handleEditorDidMount}
          onChange={(value, event) => handleLocalChange(value, event)}
        />
      </div>

      {/* Footer Status Bar */}
      <div style={{
        height: '24px',
        backgroundColor: 'hsl(var(--bg-surface))',
        borderTop: '1px solid hsl(var(--border-subtle))',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        fontSize: '0.7rem',
        color: 'hsl(var(--text-muted))'
      }}>
        <span>UTF-8 &nbsp;|&nbsp; {fileLanguage?.toUpperCase()}</span>
        <span>Ln {cursorPos.line}, Col {cursorPos.column}</span>
      </div>
    </div>
  );
};

export default CodeEditor;
export { CodeEditor };
