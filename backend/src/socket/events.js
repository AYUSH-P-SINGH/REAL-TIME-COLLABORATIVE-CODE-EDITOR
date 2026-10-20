module.exports = {
  CONNECTION: 'connection',
  DISCONNECT: 'disconnect',
  ERROR: 'error',

  ROOM_JOIN: 'room:join',
  ROOM_LEAVE: 'room:leave',

  // Yjs CRDT Binary Protocol Events
  DOC_SYNC: 'doc:sync',
  DOC_UPDATE: 'doc:update',

  // Versioned V1 Protocol Unified Envelope
  V1_ENVELOPE: 'v1:msg',

  // Awareness & Presence Events
  CURSOR_MOVE: 'cursor:move',
  PRESENCE_UPDATE: 'presence:update',

  // Code Execution Live Streaming Events
  EXECUTION_COMPLETED: 'execution:completed',
  EXECUTION_OUTPUT: 'execution:output',

  // Legacy diff events for backward-compatibility
  CODE_EDIT: 'code:edit',
  CODE_SYNC: 'code:sync',
  WORKSPACE_THEME: 'workspace:theme',
};
