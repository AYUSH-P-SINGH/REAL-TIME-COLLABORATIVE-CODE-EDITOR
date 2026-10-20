const Y = require('yjs');

/**
 * Core Yjs CRDT Engine
 * Provides pure CRDT document manipulation, binary serialization,
 * state vector diffing, and convergence guarantees.
 */

/**
 * Creates an empty Yjs document with a text type bound to 'content'.
 * @param {string} [initialText='']
 * @returns {Y.Doc}
 */
const createDoc = (initialText = '') => {
  const doc = new Y.Doc();
  if (initialText) {
    const yText = doc.getText('content');
    yText.insert(0, initialText);
  }
  return doc;
};

/**
 * Initializes a Yjs document from a binary snapshot (Uint8Array or Buffer).
 * @param {Uint8Array|Buffer} stateBuffer
 * @returns {Y.Doc}
 */
const initDocFromState = (stateBuffer) => {
  const doc = new Y.Doc();
  if (stateBuffer && stateBuffer.length > 0) {
    const uint8 = stateBuffer instanceof Uint8Array ? stateBuffer : new Uint8Array(stateBuffer);
    Y.applyUpdate(doc, uint8);
  }
  return doc;
};

/**
 * Applies a binary update to a Yjs document.
 * @param {Y.Doc} doc
 * @param {Uint8Array|Buffer} update
 * @returns {boolean} True if successfully applied
 */
const applyUpdate = (doc, update) => {
  try {
    const uint8 = update instanceof Uint8Array ? update : new Uint8Array(update);
    Y.applyUpdate(doc, uint8);
    return true;
  } catch (err) {
    return false;
  }
};

/**
 * Encodes the entire Yjs document into a binary update (Uint8Array).
 * @param {Y.Doc} doc
 * @returns {Uint8Array}
 */
const encodeState = (doc) => {
  return Y.encodeStateAsUpdate(doc);
};

/**
 * Encodes the document's state vector for differential synchronization.
 * @param {Y.Doc} doc
 * @returns {Uint8Array}
 */
const encodeStateVector = (doc) => {
  return Y.encodeStateVector(doc);
};

/**
 * Computes missing updates for a remote client given its state vector.
 * @param {Y.Doc} doc
 * @param {Uint8Array|Buffer} targetStateVector
 * @returns {Uint8Array}
 */
const diffState = (doc, targetStateVector) => {
  const uint8Vector = targetStateVector instanceof Uint8Array ? targetStateVector : new Uint8Array(targetStateVector);
  return Y.encodeStateAsUpdate(doc, uint8Vector);
};

/**
 * Retrieves the raw text content of the document.
 * @param {Y.Doc} doc
 * @returns {string}
 */
const getText = (doc) => {
  return doc.getText('content').toString();
};

/**
 * Sets or replaces the entire text content (used for imports or initial seeding).
 * @param {Y.Doc} doc
 * @param {string} newText
 */
const setText = (doc, newText) => {
  const yText = doc.getText('content');
  doc.transact(() => {
    yText.delete(0, yText.length);
    if (newText) {
      yText.insert(0, newText);
    }
  });
};

module.exports = {
  Y,
  createDoc,
  initDocFromState,
  applyUpdate,
  encodeState,
  encodeStateVector,
  diffState,
  getText,
  setText
};
