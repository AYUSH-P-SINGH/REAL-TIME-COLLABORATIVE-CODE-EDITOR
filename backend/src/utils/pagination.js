/**
 * Cursor Pagination Utility
 * High-performance cursor pagination using MongoDB ObjectIds or timestamps
 * instead of slow skip/limit offset pagination.
 */

const encodeCursor = (id) => {
  if (!id) return null;
  return Buffer.from(String(id)).toString('base64url');
};

const decodeCursor = (cursor) => {
  if (!cursor) return null;
  try {
    return Buffer.from(cursor, 'base64url').toString('utf8');
  } catch (e) {
    return null;
  }
};

/**
 * Paginates an array or executes a mongoose cursor query
 * @param {Array|mongoose.Query} target
 * @param {Object} options
 * @param {string} [options.cursor] Base64 encoded ID cursor
 * @param {number} [options.limit=20] Number of items per page
 * @param {string} [options.idField='_id'] Field used as pagination cursor
 * @returns {Object} { items, nextCursor, hasMore, limit }
 */
const paginateArray = (items, { cursor, limit = 20, idField = '_id' }) => {
  const parsedLimit = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
  const decodedId = decodeCursor(cursor);

  let startIndex = 0;
  if (decodedId) {
    const foundIndex = items.findIndex(item => String(item[idField] || item.id) === decodedId);
    if (foundIndex !== -1) {
      startIndex = foundIndex + 1;
    }
  }

  const pageItems = items.slice(startIndex, startIndex + parsedLimit);
  const hasMore = startIndex + parsedLimit < items.length;
  const lastItem = pageItems[pageItems.length - 1];
  const nextCursor = hasMore && lastItem ? encodeCursor(lastItem[idField] || lastItem.id) : null;

  return {
    items: pageItems,
    nextCursor,
    hasMore,
    limit: parsedLimit,
    total: items.length
  };
};

module.exports = {
  encodeCursor,
  decodeCursor,
  paginateArray
};
