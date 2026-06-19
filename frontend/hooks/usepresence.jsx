import { useEffect, useState } from 'react';
import { useSocket } from '../context/SocketContext';
import { getHashColor } from '../utils/helpers';

export const usePresence = (fileId, editorRef) => {
  const { socket } = useSocket();
  const [peers, setPeers] = useState({});

  useEffect(() => {
    if (!socket || !editorRef.current) return;

    socket.on('cursor:move', ({ userId, userName, cursor }) => {
      setPeers(prev => ({
        ...prev,
        [userId]: {
          userName,
          cursor,
          color: getHashColor(userName)
        }
      }));
    });

    socket.on('presence:update', ({ userId, action, userName }) => {
      if (action === 'leave') {
        setPeers(prev => {
          const clone = { ...prev };
          delete clone[userId];
          return clone;
        });
      }
    });

    const editor = editorRef.current;
    
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
    };
  }, [fileId, socket, editorRef]);

  return { peers };
};
