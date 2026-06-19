import React, { useRef, useState } from 'react';
import MonacoEditor from '@monaco-editor/react';
import { useDocSync } from '../../hooks/useDocSync';
import EditorHeader from './EditorHeader';

const CodeEditor = ({ fileId, fileName, fileLanguage }) => {
  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const [editorTheme, setEditorTheme] = useState('vs-dark');

  const { handleLocalChange } = useDocSync(fileId, editorRef, monacoRef);

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

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
        setEditorTheme={setEditorTheme} 
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
