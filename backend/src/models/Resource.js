const mongoose = require('mongoose');

const ResourceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Resource name is required'],
    trim: true,
  },
  service: {
    type: String,
    required: [true, 'Cloud service type is required'],
    // Multi-cloud service type string (AWS, GCP, Azure)
  },
  type: {
    type: String,
    required: [true, 'Specific resource type is required'],
  },
  cloudProvider: {
    type: String,
    default: 'AWS',
  },
  accountId: {
    type: String,
    required: [true, 'Target Cloud Account ID is required'],
  },
  region: {
    type: String,
    default: 'us-east-1',
  },
  arn: {
    type: String,
    required: [true, 'Resource ARN is required'],
    unique: true,
  },
  status: {
    type: String,
    default: 'active',
  },
  tags: {
    type: Map,
    of: String,
    default: {},
  },
  creationDate: {
    type: Date,
  },
  lastScannedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Resource', ResourceSchema);
