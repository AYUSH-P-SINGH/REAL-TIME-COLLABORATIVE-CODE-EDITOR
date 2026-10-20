const crypto = require('crypto');

/**
 * Optimistic Concurrency Control (OCC) & ETag Utility
 * Guarantees serializable consistency for control-plane metadata updates
 * (project renames, file moves, permission alterations) preventing lost updates.
 */

/**
 * Generates an HTTP entity tag (ETag) from a document's ID, version, and updated timestamp.
 * Format: W/"<hex-hash>" (Weak ETag)
 * @param {Object} doc Mongoose document or plain object
 * @returns {string} ETag string
 */
const generateETag = (doc) => {
  if (!doc) return 'W/"0-empty"';
  const id = doc._id || doc.id || 'unknown';
  const version = doc.version !== undefined ? doc.version : (doc.__v !== undefined ? doc.__v : 0);
  const updatedAt = doc.updatedAt ? new Date(doc.updatedAt).getTime() : 0;

  const rawString = `${id}:${version}:${updatedAt}`;
  const hash = crypto.createHash('md5').update(rawString).digest('hex').substring(0, 16);
  return `W/"${hash}"`;
};

/**
 * Validates the If-Match header against the current resource ETag.
 * Throws 412 Precondition Failed if there is a conflict.
 * @param {Object} req Express request
 * @param {string} currentETag Authoritative current ETag
 */
const checkPreconditions = (req, currentETag) => {
  const ifMatch = req.headers['if-match'];
  if (!ifMatch) return true; // If-Match omitted, proceed normally

  const cleanIfMatch = ifMatch.replace(/^W\//, '').replace(/"/g, '').trim();
  const cleanCurrentETag = currentETag.replace(/^W\//, '').replace(/"/g, '').trim();

  if (cleanIfMatch !== '*' && cleanIfMatch !== cleanCurrentETag) {
    const error = new Error('Precondition Failed: Resource has been modified concurrently. Please refresh and retry.');
    error.statusCode = 412;
    error.code = 'PRECONDITION_FAILED';
    error.details = {
      expectedETag: currentETag,
      providedETag: ifMatch
    };
    throw error;
  }

  return true;
};

/**
 * Validates If-None-Match header for GET requests.
 * @param {Object} req Express request
 * @param {string} currentETag Authoritative current ETag
 * @returns {boolean} True if matching (304 Not Modified candidate)
 */
const isNotModified = (req, currentETag) => {
  const ifNoneMatch = req.headers['if-none-match'];
  if (!ifNoneMatch) return false;

  const cleanIfNoneMatch = ifNoneMatch.replace(/^W\//, '').replace(/"/g, '').trim();
  const cleanCurrentETag = currentETag.replace(/^W\//, '').replace(/"/g, '').trim();

  return cleanIfNoneMatch === '*' || cleanIfNoneMatch === cleanCurrentETag;
};

module.exports = {
  generateETag,
  checkPreconditions,
  isNotModified
};
