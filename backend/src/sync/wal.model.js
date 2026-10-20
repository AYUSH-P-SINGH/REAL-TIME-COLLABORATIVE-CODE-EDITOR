const mongoose = require('mongoose');

const walEntrySchema = new mongoose.Schema({
  file: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'File',
    required: true,
    index: true
  },
  seq: {
    type: Number,
    required: true
  },
  update: {
    type: Buffer,
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
});

walEntrySchema.index({ file: 1, seq: 1 }, { unique: true });

module.exports = mongoose.model('WalEntry', walEntrySchema);
