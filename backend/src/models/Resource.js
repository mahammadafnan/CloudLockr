const mongoose = require('mongoose');

const ResourceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Resource name is required'],
    trim: true,
  },
  service: {
    type: String,
    required: [true, 'Cloud service type is required (e.g., S3, EC2, IAM)'],
    enum: ['EC2', 'S3', 'IAM', 'Security Groups', 'CloudTrail', 'VPC', 'EBS', 'RDS'],
  },
  type: {
    type: String,
    required: [true, 'Specific resource type is required (e.g., Instance, Bucket, Policy)'],
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
