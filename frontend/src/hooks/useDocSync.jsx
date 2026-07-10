import { useEffect, useRef } from 'react';
import { useSocket } from '../context/SocketContext';
import { debounce, getHashColor } from '../utils/helpers';
import diff_match_patch from 'diff-match-patch';

export const useDocSync = (fileId, editorRef, monacoRef) => {
  const { socket } = useSocket();
  const isApplyingRemoteChange = useRef(false);
  const lastSyncedContentRef = useRef('');

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

    // 1. Initial full content sync from server (with Connection State Recovery logic)
    socket.on('code:sync', ({ content }) => {
      const editor = editorRef.current;
      const model = editor.getModel();
      
      if (model) {
        const currentVal = model.getValue();
        // If we have offline changes since last sync, merge them instead of overwriting
        if (lastSyncedContentRef.current && currentVal !== lastSyncedContentRef.current && currentVal !== content) {
          const dmp = new diff_match_patch();
          // Diff between last sync copy and our current offline copy
          const offlinePatches = dmp.patch_make(lastSyncedContentRef.current, currentVal);
          // Apply our offline changes onto the new server copy
          const [mergedVal] = dmp.patch_apply(offlinePatches, content);
          
          isApplyingRemoteChange.current = true;
          editor.setValue(mergedVal);
          lastSyncedContentRef.current = mergedVal;
          isApplyingRemoteChange.current = false;
          
          // Stream the merged results back to the server so everyone is synchronized
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
    });

    // 2. Incoming keystroke edit delta operations
    socket.on('code:edit', ({ change, senderId }) => {
      const editor = editorRef.current;
      const model = editor.getModel();
      
      if (model && change && !isApplyingRemoteChange.current) {
        // Skip updating full content broadcasts
        if (change.fullContent !== undefined) return;

        // If it's a patch from a merged sync, apply it
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

        // Apply instant micro delta change locally (keystroke delta)
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
          // Keep synced tracking matching the editor content
          lastSyncedContentRef.current = model.getValue();

          // Highlight recently modified text regions for user clarity
          if (change.startLine && change.startColumn) {
            const highlightId = `peer-highlight-${senderId}`;
            
            // Inject dynamic style tag for this peer if not exists
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

            // Set decoration
            const decs = editor.deltaDecorations([], [{
              range: highlightRange,
              options: {
                className: highlightId,
                isWholeLine: false
              }
            }]);

            // Clean up highlighted region after 2.5 seconds
            setTimeout(() => {
              try {
                editor.deltaDecorations(decs, []);
              } catch (e) {
                // Editor might be unmounted
              }
            }, 2500);
          }
        } catch (e) {
          // Fallback to full value if pushEditOperations fails
        }
        
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

    // Stream instant coordinate updates to other users
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

    // Queue differential patch sync to keep Redis copy matching active text
    debouncedPatchSync(fileId, value);
  };

  return { handleLocalChange };
};
