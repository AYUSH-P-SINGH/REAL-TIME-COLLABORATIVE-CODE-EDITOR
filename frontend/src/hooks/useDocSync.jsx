import { useEffect, useRef } from 'react';
import { useSocket } from '../context/SocketContext';
import { debounce, getHashColor } from '../utils/helpers';
import diff_match_patch from 'diff-match-patch';

export const useDocSync = (fileId, editorRef, monacoRef) => {
  const { socket } = useSocket();
  const isApplyingRemoteChange = useRef(false);
  const lastSyncedContentRef = useRef('');
  const timeoutRefs = useRef(new Set());

  // Debounce saving the differential patch to the server to minimize network overhead
  const debouncedPatchSync = useRef(
    debounce((id, content) => {
      if (socket) {
        const dmp = new diff_match_patch();
        const patches = dmp.patch_make(lastSyncedContentRef.current, content);
        const patchText = dmp.patch_toText(patches);

        if (patchText) {
          socket.emit('code:edit', {
            fileId: id,
            change: { patch: patchText }
          });
          lastSyncedContentRef.current = content;
        }
      }
    }, 1000)
  ).current;

  useEffect(() => {
    if (!socket || !editorRef.current || !monacoRef.current) return;

    // Join the room for the active file
    socket.emit('room:join', { fileId });

    // 1. Initial full content sync from server
    const currentTimers = timeoutRefs.current;

    const handleCodeSync = ({ content }) => {
      const editor = editorRef.current;
      if (!editor) return;
      const model = editor.getModel();
      
      if (model) {
        const currentVal = model.getValue();
        // If we have offline changes since last sync, merge them instead of overwriting
        if (lastSyncedContentRef.current && currentVal !== lastSyncedContentRef.current && currentVal !== content) {
          const dmp = new diff_match_patch();
          const offlinePatches = dmp.patch_make(lastSyncedContentRef.current, currentVal);
          const [mergedVal] = dmp.patch_apply(offlinePatches, content);
          
          isApplyingRemoteChange.current = true;
          editor.setValue(mergedVal);
          lastSyncedContentRef.current = mergedVal;
          isApplyingRemoteChange.current = false;
          
          const syncPatches = dmp.patch_make(content, mergedVal);
          const syncPatchText = dmp.patch_toText(syncPatches);
          if (syncPatchText) {
            socket.emit('code:edit', {
              fileId,
              change: { patch: syncPatchText }
            });
          }
        } else if (currentVal !== content) {
          isApplyingRemoteChange.current = true;
          editor.setValue(content);
          lastSyncedContentRef.current = content;
          isApplyingRemoteChange.current = false;
        } else {
          lastSyncedContentRef.current = content;
        }
      }
    };

    // 2. Incoming keystroke edit delta operations
    const handleCodeEdit = ({ change, senderId }) => {
      const editor = editorRef.current;
      if (!editor) return;
      const model = editor.getModel();
      
      if (model && change && !isApplyingRemoteChange.current) {
        if (change.fullContent !== undefined) return;

        if (change.patch) {
          isApplyingRemoteChange.current = true;
          const currentVal = model.getValue();
          const dmp = new diff_match_patch();
          const patches = dmp.patch_fromText(change.patch);
          const [newVal, results] = dmp.patch_apply(patches, currentVal);
          
          if (results.every(res => res === true) && newVal !== currentVal) {
            editor.setValue(newVal);
            lastSyncedContentRef.current = newVal;
          }
          isApplyingRemoteChange.current = false;
          return;
        }

        isApplyingRemoteChange.current = true;
        
        try {
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
          lastSyncedContentRef.current = model.getValue();

          // Highlight recently modified text regions for user clarity
          if (change.startLine && change.startColumn) {
            const highlightId = `peer-highlight-${senderId}`;
            
            let styleTag = document.getElementById(highlightId);
            if (!styleTag) {
              styleTag = document.createElement('style');
              styleTag.id = highlightId;
              document.head.appendChild(styleTag);
              const peerColor = getHashColor(senderId || 'unknown');
              styleTag.innerHTML = `
                .${highlightId} {
                  background-color: ${peerColor}30 !important;
                  border-bottom: 1px dashed ${peerColor}80;
                  transition: background-color 1.5s ease-out;
                }
              `;
            }

            const highlightRange = new monacoRef.current.Range(
              change.startLine,
              change.startColumn,
              change.endLine,
              change.endColumn || (change.startColumn + (change.text?.length || 1))
            );

            const decs = editor.deltaDecorations([], [{
              range: highlightRange,
              options: {
                className: highlightId,
                isWholeLine: false
              }
            }]);

            const t = setTimeout(() => {
              timeoutRefs.current.delete(t);
              try {
                editor.deltaDecorations(decs, []);
              } catch (e) {
                // Ignore
              }
            }, 2500);
            timeoutRefs.current.add(t);
          }
        } catch (e) {
          // Ignore
        }
        
        isApplyingRemoteChange.current = false;
      }
    };

    socket.on('code:sync', handleCodeSync);
    socket.on('code:edit', handleCodeEdit);

    return () => {
      socket.off('code:sync', handleCodeSync);
      socket.off('code:edit', handleCodeEdit);
      socket.emit('room:leave', { fileId });

      // Clear all active timeouts
      currentTimers.forEach(t => clearTimeout(t));
      currentTimers.clear();
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

    debouncedPatchSync(fileId, value);
  };

  return { handleLocalChange };
};

