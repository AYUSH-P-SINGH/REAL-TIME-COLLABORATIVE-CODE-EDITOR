import { useEffect, useState, useRef } from 'react';
import { useSocket } from '../context/SocketContext';
import { getHashColor } from '../utils/helpers';

export const usePresence = (fileId, editorRef, monacoRef) => {
  const { socket } = useSocket();
  const [peers, setPeers] = useState({});
  const decorationsRef = useRef([]);

  useEffect(() => {
    if (!socket || !editorRef.current || !monacoRef.current) return;

    const editor = editorRef.current;

    // Listen to remote cursor moves
    socket.on('cursor:move', ({ userId, userName, cursor }) => {
      if (userId === socket.id) return; // Don't track own cursor
      setPeers(prev => ({
        ...prev,
        [userId]: {
          userName,
          cursor,
          color: getHashColor(userName)
        }
      }));
    });

    socket.on('presence:update', ({ userId, action, _userName }) => {
      if (action === 'leave') {
        setPeers(prev => {
          const clone = { ...prev };
          delete clone[userId];
          return clone;
        });
      }
    });

    // Listen to local cursor movement events in Monaco and stream coordinate values
    const disposable = editor.onDidChangeCursorPosition(e => {
      socket.emit('cursor:move', {
        fileId,
        cursor: {
          line: e.position.lineNumber,
          ch: e.position.column
        }
      });
    });

    return () => {
      socket.off('cursor:move');
      socket.off('presence:update');
      disposable.dispose();
      
      // Clean up decorations on unmount
      if (editor && decorationsRef.current.length > 0) {
        try {
          editor.deltaDecorations(decorationsRef.current, []);
        } catch (e) {
          // Editor might be disposed already
        }
      }
    };
  }, [fileId, socket, editorRef, monacoRef]);

  // Apply decorations whenever peers change
  useEffect(() => {
    if (!editorRef.current || !monacoRef.current) return;

    const editor = editorRef.current;
    const monaco = monacoRef.current;

    // Inject dynamic CSS style tag for peer cursor colors & name tags
    const styleId = 'peer-cursor-styles';
    let styleTag = document.getElementById(styleId);
    if (!styleTag) {
      styleTag = document.createElement('style');
      styleTag.id = styleId;
      document.head.appendChild(styleTag);
    }
    styleTag.innerHTML = Object.entries(peers)
      .map(([userId, peer]) => `
        .peer-cursor-${userId} {
          border-left: 2px solid ${peer.color} !important;
          position: relative;
        }
        .peer-cursor-${userId}::after {
          content: "${peer.userName}";
          position: absolute;
          top: -18px;
          left: 0;
          background-color: ${peer.color};
          color: #000;
          font-size: 10px;
          font-weight: 600;
          padding: 0 4px;
          border-radius: 3px;
          white-space: nowrap;
          opacity: 0.8;
          pointer-events: none;
          z-index: 1000;
        }
      `)
      .join('\n');

    // Create Monaco decorations for cursors
    const newDecorations = Object.entries(peers)
      .filter(([_, peer]) => peer.cursor && peer.cursor.line && peer.cursor.ch)
      .map(([userId, peer]) => ({
        range: new monaco.Range(
          peer.cursor.line,
          peer.cursor.ch,
          peer.cursor.line,
          peer.cursor.ch
        ),
        options: {
          className: `peer-cursor-${userId}`,
          hoverMessage: { value: peer.userName }
        }
      }));

    try {
      decorationsRef.current = editor.deltaDecorations(decorationsRef.current, newDecorations);
    } catch (e) {
      // Editor might be disposed or in invalid state
    }
  }, [peers, editorRef, monacoRef]);

  return { peers };
};
