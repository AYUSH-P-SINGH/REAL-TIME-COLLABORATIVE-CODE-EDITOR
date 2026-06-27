import { useEffect, useRef } from 'react';
import { useSocket } from '../context/SocketContext';
import { debounce } from '../utils/helpers';

export const useDocSync = (fileId, editorRef, monacoRef) => {
  const { socket } = useSocket();
  const isApplyingRemoteChange = useRef(false);

  // Debounce saving the full content snapshot to the server cache to minimize network overhead
  const debouncedFullSync = useRef(
    debounce((id, content) => {
      if (socket) {
        socket.emit('code:edit', {
          fileId: id,
          change: { fullContent: content }
        });
      }
    }, 1500)
  ).current;

  useEffect(() => {
    if (!socket || !editorRef.current || !monacoRef.current) return;

    // Join the room for the active file
    socket.emit('room:join', { fileId });

    // 1. Initial full content sync from server
    socket.on('code:sync', ({ content }) => {
      const editor = editorRef.current;
      const model = editor.getModel();
      
      if (model && model.getValue() !== content) {
        isApplyingRemoteChange.current = true;
        editor.setValue(content);
        isApplyingRemoteChange.current = false;
      }
    });

    // 2. Incoming keystroke edit delta operations
    socket.on('code:edit', ({ change }) => {
      const editor = editorRef.current;
      const model = editor.getModel();
      
      if (model && change && !isApplyingRemoteChange.current) {
        // Skip updating full content broadcasts, we only process micro delta changes locally
        if (change.fullContent !== undefined) return;

        isApplyingRemoteChange.current = true;
        
        // Push micro delta update onto Monaco buffer stack
        model.pushEditOperations(
          editor.getSelections(),
          [{
            range: new monacoRef.current.Range(
              change.startLine,
              change.startColumn,
              change.endLine,
              change.endColumn
            ),
            text: change.text,
            forceMoveMarkers: true
          }],
          () => null
        );
        
        isApplyingRemoteChange.current = false;
      }
    });

    return () => {
      socket.off('code:sync');
      socket.off('code:edit');
      socket.emit('room:leave', { fileId });
    };
  }, [fileId, socket, editorRef, monacoRef]);

  // Invoked on local Monaco keyup/input modifications
  const handleLocalChange = (value, event) => {
    if (isApplyingRemoteChange.current || !socket || !event || !event.changes) return;

    event.changes.forEach(change => {
      socket.emit('code:edit', {
        fileId,
        change: {
          text: change.text,
          startLine: change.range.startLineNumber,
          startColumn: change.range.startColumn,
          endLine: change.range.endLineNumber,
          endColumn: change.range.endColumn
        }
      });
    });

    // Queue full content sync to keep Redis copy matching active text
    debouncedFullSync(fileId, value);
  };

  return { handleLocalChange };
};
