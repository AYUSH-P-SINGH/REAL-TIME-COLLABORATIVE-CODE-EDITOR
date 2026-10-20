import React, { useState } from 'react';
import { Terminal, X, Play, Clock, CheckCircle2, AlertCircle, Copy, Check } from 'lucide-react';

const ExecutionTerminal = ({ isOpen, onClose, isRunning, result, onRunCode, language }) => {
  const [stdin] = useState('');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    const text = result ? `${result.stdout || ''}\n${result.stderr || ''}` : '';
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getStatusBadge = () => {
    if (isRunning) {
      return (
        <span className="badge badge-cyan" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <div className="pulse-indicator" style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22d3ee' }} />
          Executing in Sandbox...
        </span>
      );
    }
    if (!result) return null;

    if (result.status === 'success') {
      return (
        <span className="badge badge-emerald" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <CheckCircle2 size={12} /> Exit 0 (Success)
        </span>
      );
    }
    if (result.status === 'timeout') {
      return (
        <span className="badge badge-amber" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Clock size={12} /> Execution Timeout
        </span>
      );
    }
    return (
      <span className="badge badge-rose" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <AlertCircle size={12} /> Exit {result.exitCode ?? 1} (Error)
      </span>
    );
  };

  return (
    <div style={{
      height: '240px',
      backgroundColor: '#0a0d14',
      borderTop: '1px solid hsl(var(--border-subtle))',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: 'var(--font-mono)',
      zIndex: 20
    }}>
      {/* Terminal Title Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '6px 14px',
        backgroundColor: '#0e131f',
        borderBottom: '1px solid rgba(255, 255, 255, 0.07)',
        fontSize: '0.75rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Terminal size={14} color="hsl(var(--accent-cyan))" />
          <span style={{ fontWeight: '600', color: '#e2e8f0' }}>Sandboxed Output</span>
          {getStatusBadge()}
          {result && (
            <span style={{ color: 'hsl(var(--text-muted))', fontSize: '0.7rem' }}>
              ⚡ {result.executionTimeMs}ms
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => onRunCode(stdin)}
            disabled={isRunning}
            className="badge badge-cyan"
            style={{
              cursor: isRunning ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 10px'
            }}
          >
            <Play size={11} /> Re-run
          </button>

          <button
            onClick={handleCopy}
            className="badge"
            title="Copy Output"
            style={{
              cursor: 'pointer',
              background: 'rgba(255,255,255,0.06)',
              color: '#94a3b8',
              padding: '4px 8px'
            }}
          >
            {copied ? <Check size={12} color="#34d399" /> : <Copy size={12} />}
          </button>

          <button
            onClick={onClose}
            className="badge"
            title="Close Terminal"
            style={{
              cursor: 'pointer',
              background: 'rgba(255,255,255,0.06)',
              color: '#94a3b8',
              padding: '4px 8px'
            }}
          >
            <X size={12} />
          </button>
        </div>
      </div>

      {/* Terminal Output Content */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '12px 16px',
        fontSize: '0.8rem',
        lineHeight: '1.5',
        backgroundColor: '#07090e'
      }}>
        {isRunning && (
          <div style={{ color: 'hsl(var(--accent-cyan))', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>⏳ Spawning isolated sandbox subprocess for {language}...</span>
          </div>
        )}

        {!isRunning && !result && (
          <div style={{ color: 'hsl(var(--text-muted))' }}>
            Click &quot;Run Code&quot; above to execute this file in an isolated sandbox.
          </div>
        )}

        {!isRunning && result && (
          <div>
            {result.stdout && (
              <pre style={{ margin: 0, color: '#f8fafc', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {result.stdout}
              </pre>
            )}

            {result.stderr && (
              <pre style={{
                margin: result.stdout ? '8px 0 0 0' : 0,
                color: '#f87171',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word'
              }}>
                {result.stderr}
              </pre>
            )}

            {!result.stdout && !result.stderr && (
              <span style={{ color: 'hsl(var(--text-muted))', fontStyle: 'italic' }}>
                [Process completed with exit code {result.exitCode} with empty output]
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ExecutionTerminal;
