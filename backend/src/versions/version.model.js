const mongoose = require('mongoose');

const versionSchema = new mongoose.Schema({
  file: { type: mongoose.Schema.Types.ObjectId, ref: 'File', required: true },
  versionNumber: { type: Number, required: true },
  content: { type: String, required: true }, // The full content snapshot
  modifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

versionSchema.index({ file: 1, versionNumber: 1 }, { unique: true });

module.exports = mongoose.model('Version', versionSchema);
