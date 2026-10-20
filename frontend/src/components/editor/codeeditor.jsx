import React, { useRef, useState, useEffect } from 'react';
import MonacoEditor from '@monaco-editor/react';
import axios from 'axios';
import { useDocSync } from '../../hooks/useDocSync';
import { usePresence } from '../../hooks/usepresence';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/authcontext';
import { useToast } from '../../context/ToastContext';
import EditorHeader from './editorheader';
import ExecutionTerminal from './ExecutionTerminal';

const CodeEditor = ({ fileId, fileName, fileLanguage }) => {
  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const [editorTheme, setEditorTheme] = useState('vs-dark');
  const [cursorPos, setCursorPos] = useState({ line: 1, column: 1 });
  const { socket } = useSocket();
  const { token } = useAuth();
  const { addToast } = useToast();

  // Sandboxed Code Execution State
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);
  const [isRunningCode, setIsRunningCode] = useState(false);
  const [executionResult, setExecutionResult] = useState(null);

  // Yjs CRDT Synchronization & Presence Hooks
  const { handleLocalChange, syncStatus } = useDocSync(fileId, editorRef, monacoRef);
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

  // Determine normalized execution language
  const getExecutionLanguage = () => {
    const lang = (fileLanguage || '').toLowerCase();
    const name = (fileName || '').toLowerCase();

    if (lang === 'python' || name.endsWith('.py')) return 'python';
    if (lang === 'shell' || lang === 'bash' || name.endsWith('.sh')) return 'bash';
    return 'javascript';
  };

  // Run Code in Sandbox
  const handleRunCode = async (customStdin = '') => {
    if (!editorRef.current) return;
    const code = editorRef.current.getValue();
    if (!code || !code.trim()) {
      addToast('Cannot execute an empty document.', 'error');
      return;
    }

    const language = getExecutionLanguage();
    setIsRunningCode(true);
    setIsTerminalOpen(true);
    setExecutionResult(null);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const response = await axios.post(
        `${apiUrl}/execute/run`,
        {
          language,
          code,
          stdin: customStdin,
          timeoutMs: 4000
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data && response.data.success) {
        setExecutionResult(response.data.data);
      } else {
        throw new Error(response.data?.message || 'Execution failed');
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Execution failed';
      setExecutionResult({
        stdout: '',
        stderr: `Execution error: ${errorMsg}`,
        exitCode: 1,
        executionTimeMs: 0,
        status: 'error'
      });
      addToast(`Execution error: ${errorMsg}`, 'error');
    } finally {
      setIsRunningCode(false);
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
        onRunCode={() => handleRunCode('')}
        isRunningCode={isRunningCode}
        syncStatus={syncStatus}
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
              Initialising Monaco & Yjs CRDT Engine...
            </div>
          }
          onMount={handleEditorDidMount}
          onChange={(value, event) => handleLocalChange(value, event)}
        />
      </div>

      {/* Sandboxed Execution Drawer */}
      <ExecutionTerminal
        isOpen={isTerminalOpen}
        onClose={() => setIsTerminalOpen(false)}
        isRunning={isRunningCode}
        result={executionResult}
        onRunCode={handleRunCode}
        language={getExecutionLanguage()}
      />

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
        <span>UTF-8 &nbsp;|&nbsp; {fileLanguage?.toUpperCase()} &nbsp;|&nbsp; Yjs Binary CRDT</span>
        <span>Ln {cursorPos.line}, Col {cursorPos.column}</span>
      </div>
    </div>
  );
};

export default CodeEditor;
export { CodeEditor };
