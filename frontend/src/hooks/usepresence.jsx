import { useEffect, useState, useRef } from 'react';
import { useSocket } from '../context/SocketContext';
import { getHashColor, throttle } from '../utils/helpers';

export const usePresence = (fileId, editorRef, monacoRef) => {
  const { socket } = useSocket();
  const [peers, setPeers] = useState({});
  const decorationsRef = useRef([]);

  useEffect(() => {
    if (!socket || !editorRef.current || !monacoRef.current) return;

    const editor = editorRef.current;

    // Listen to remote cursor moves
    const handleCursorMove = ({ userId, userName, cursor }) => {
      if (userId === socket.id) return;
      setPeers(prev => ({
        ...prev,
        [userId]: {
          userName: userName || 'Anonymous',
          cursor,
          color: getHashColor(userName || userId)
        }
      }));
    };

    const handlePresenceUpdate = ({ userId, action }) => {
      if (action === 'leave') {
        setPeers(prev => {
          const clone = { ...prev };
          delete clone[userId];
          return clone;
        });
      }
    };

    socket.on('cursor:move', handleCursorMove);
    socket.on('presence:update', handlePresenceUpdate);

    // Throttled cursor emission (~30 updates/sec) to optimize bandwidth and frame rate
    const emitCursorMove = throttle((pos) => {
      socket.emit('cursor:move', {
        fileId,
        cursor: {
          line: pos.lineNumber,
          ch: pos.column
        }
      });
    }, 33);

    // Listen to local cursor movement events in Monaco
    const disposable = editor.onDidChangeCursorPosition(e => {
      emitCursorMove(e.position);
    });

    return () => {
      socket.off('cursor:move', handleCursorMove);
      socket.off('presence:update', handlePresenceUpdate);
      if (disposable && typeof disposable.dispose === 'function') {
        disposable.dispose();
      }

      // Clean up decorations on unmount
      if (editor && decorationsRef.current.length > 0) {
        try {
          editor.deltaDecorations(decorationsRef.current, []);
        } catch (e) {
          // Editor might be disposed
        }
        decorationsRef.current = [];
      }

      // Clean up cursor style tag
      const styleTag = document.getElementById('peer-cursor-styles');
      if (styleTag) {
        styleTag.remove();
      }
    };
  }, [fileId, socket, editorRef, monacoRef]);

  // Apply decorations whenever peers change
  useEffect(() => {
    if (!editorRef.current || !monacoRef.current) return;

    const editor = editorRef.current;
    const monaco = monacoRef.current;

    const styleId = 'peer-cursor-styles';
    let styleTag = document.getElementById(styleId);

    const peerEntries = Object.entries(peers);
    if (peerEntries.length === 0) {
      if (styleTag) styleTag.remove();
      if (decorationsRef.current.length > 0) {
        try {
          decorationsRef.current = editor.deltaDecorations(decorationsRef.current, []);
        } catch (e) {
          // Ignore
        }
      }
      return;
    }

    if (!styleTag) {
      styleTag = document.createElement('style');
      styleTag.id = styleId;
      document.head.appendChild(styleTag);
    }

    styleTag.innerHTML = peerEntries
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

    const newDecorations = peerEntries
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
      // Ignore
    }
  }, [peers, editorRef, monacoRef]);

  return { peers };
};
