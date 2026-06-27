const diff = require('diff-match-patch');
const dmp = new diff.diff_match_patch();

/**
 * Applies a diff-match-patch patch string to baseText.
 * Returns the updated text and a success boolean indicating if all patches applied.
 */
const applyPatch = (baseText, patchText) => {
  try {
    const patches = dmp.patch_fromText(patchText);
    const [newText, results] = dmp.patch_apply(patches, baseText);
    const success = results.every(res => res === true);
    return { newText, success };
  } catch (err) {
    return { newText: baseText, success: false };
  }
};

/**
 * Compares oldText and newText and generates a diff-match-patch patch string.
 */
const createPatch = (oldText, newText) => {
  try {
    const patches = dmp.patch_make(oldText, newText);
    return dmp.patch_toText(patches);
  } catch (err) {
    return '';
  }
};

module.exports = { applyPatch, createPatch };
