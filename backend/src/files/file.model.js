const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
  name: { type: String, required: true },
  path: { type: String, required: true }, // e.g., "src/index.js" or "src/components"
  type: { type: String, enum: ['file', 'directory'], required: true },
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  content: { type: String, default: '' },
  version: { type: Number, default: 0 },
}, { timestamps: true });

// A path must be unique within a single project
fileSchema.index({ project: 1, path: 1 }, { unique: true });

module.exports = mongoose.model('File', fileSchema);
