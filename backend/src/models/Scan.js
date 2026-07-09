const mongoose = require('mongoose');

const ScanSchema = new mongoose.Schema({
  accountId: {
    type: String,
    required: [true, 'Target account ID is required'],
  },
  status: {
    type: String,
    enum: ['In-Progress', 'Completed', 'Failed'],
    default: 'In-Progress',
  },
  resourcesScanned: {
    type: Number,
    default: 0,
  },
  findingsFound: {
    critical: { type: Number, default: 0 },
    high: { type: Number, default: 0 },
    medium: { type: Number, default: 0 },
    low: { type: Number, default: 0 },
    informational: { type: Number, default: 0 },
  },
  totalFindings: {
    type: Number,
    default: 0,
  },
  securityScore: {
    type: Number,
    default: 100,
  },
  startedAt: {
    type: Date,
    default: Date.now,
  },
  completedAt: {
    type: Date,
  },
  error: {
    type: String,
  },
});

module.exports = mongoose.model('Scan', ScanSchema);
