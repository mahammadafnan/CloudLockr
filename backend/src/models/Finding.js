const mongoose = require('mongoose');

const FindingSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Finding title is required'],
    trim: true,
  },
  description: {
    type: String,
    required: [true, 'Finding description is required'],
  },
  severity: {
    type: String,
    required: [true, 'Finding severity is required'],
    enum: ['Critical', 'High', 'Medium', 'Low', 'Informational'],
  },
  resourceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resource',
    required: [true, 'Reference resource object ID is required'],
  },
  resourceArn: {
    type: String,
    required: [true, 'Reference resource ARN is required'],
  },
  recommendation: {
    type: String,
    required: [true, 'Fix recommendation is required'],
  },
  complianceMapping: {
    cisAWS: { type: String, default: 'N/A' },
    awsBestPractices: { type: String, default: 'N/A' },
    nist: { type: String, default: 'N/A' },
  },
  docLink: {
    type: String,
    default: 'https://docs.aws.amazon.com/',
  },
  status: {
    type: String,
    enum: ['Active', 'Resolved', 'Suppressed'],
    default: 'Active',
  },
  firstDetectedAt: {
    type: Date,
    default: Date.now,
  },
  lastDetectedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Finding', FindingSchema);
