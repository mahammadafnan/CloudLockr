const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Resource = require('../models/Resource');
const Finding = require('../models/Finding');
const Scan = require('../models/Scan');
const User = require('../models/User');

// Load environment variables
dotenv.config();

const connUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/cloudlockr';

const mockResources = [
  {
    name: 'prod-web-server-01',
    service: 'EC2',
    type: 'Instance',
    cloudProvider: 'AWS',
    accountId: '123456789012',
    region: 'us-east-1',
    arn: 'arn:aws:ec2:us-east-1:123456789012:instance/i-0c1a2b3c4d5e6f7g8',
    status: 'running',
    tags: { Environment: 'Production', Owner: 'Web Team' },
    creationDate: new Date('2025-06-15T08:30:00Z'),
  },
  {
    name: 'cloudlockr-production-logs',
    service: 'S3',
    type: 'Bucket',
    cloudProvider: 'AWS',
    accountId: '123456789012',
    region: 'us-east-1',
    arn: 'arn:aws:s3:::cloudlockr-production-logs',
    status: 'public',
    tags: { DataClassification: 'Confidential', Compliance: 'PCI-DSS' },
    creationDate: new Date('2025-01-10T12:00:00Z'),
  },
  {
    name: 'admin-console-user',
    service: 'IAM',
    type: 'User',
    cloudProvider: 'AWS',
    accountId: '123456789012',
    region: 'global',
    arn: 'arn:aws:iam::123456789012:user/admin-console-user',
    status: 'active',
    tags: { Dept: 'IT Security' },
    creationDate: new Date('2024-03-01T15:45:00Z'),
  },
  {
    name: 'default-ingress-sg',
    service: 'Security Groups',
    type: 'SecurityGroup',
    cloudProvider: 'AWS',
    accountId: '123456789012',
    region: 'us-east-1',
    arn: 'arn:aws:ec2:us-east-1:123456789012:security-group/sg-0e99812df',
    status: 'active',
    tags: { Purpose: 'Web Traffic' },
    creationDate: new Date('2025-02-12T09:15:00Z'),
  },
  {
    name: 'organization-audit-trail',
    service: 'CloudTrail',
    type: 'Trail',
    cloudProvider: 'AWS',
    accountId: '123456789012',
    region: 'us-east-1',
    arn: 'arn:aws:cloudtrail:us-east-1:123456789012:trail/organization-audit-trail',
    status: 'disabled',
    tags: { Billing: 'SecOps' },
    creationDate: new Date('2025-03-20T10:00:00Z'),
  },
];

const seedData = async () => {
  try {
    // Connect to database
    console.log(`[Seed Script] Connecting to database: ${connUri}`);
    await mongoose.connect(connUri);
    console.log('[Seed Script] Database connected. Clearing existing mock documents...');

    // Clean existing tables
    await Resource.deleteMany({});
    await Finding.deleteMany({});
    await Scan.deleteMany({});

    console.log('[Seed Script] Collections cleared. Writing mock Resources...');
    const createdResources = await Resource.insertMany(mockResources);
    console.log(`[Seed Script] Successfully wrote ${createdResources.length} Resource documents.`);

    // Find references for Findings mapping
    const s3Bucket = createdResources.find((r) => r.service === 'S3');
    const secGroup = createdResources.find((r) => r.service === 'Security Groups');
    const cloudTrail = createdResources.find((r) => r.service === 'CloudTrail');
    const iamUser = createdResources.find((r) => r.service === 'IAM');

    const mockFindings = [
      {
        title: 'S3 Public Bucket Access Detected',
        description: 'The S3 bucket was discovered to allow unrestricted public read/write access permissions to Anonymous principal identities.',
        severity: 'Critical',
        resourceId: s3Bucket._id,
        resourceArn: s3Bucket.arn,
        recommendation: 'Modify S3 Bucket ACL policies and configure Block Public Access configurations on the bucket properties.',
        complianceMapping: {
          cisAWS: '2.1.1',
          awsBestPractices: 'S3-002',
          nist: 'PR.AC-4',
        },
        docLink: 'https://docs.aws.amazon.com/AmazonS3/latest/userguide/access-control-block-public-access.html',
      },
      {
        title: 'EC2 Instance SSH Port 22 Open to Internet',
        description: 'The security group rules permit direct inbound TCP traffic on administrative port 22 from the public IP scope 0.0.0.0/0.',
        severity: 'Critical',
        resourceId: secGroup._id,
        resourceArn: secGroup.arn,
        recommendation: 'Edit the Security Group ingress rule list to lock SSH traffic access down to specific enterprise VPN and bastion CIDR blocks.',
        complianceMapping: {
          cisAWS: '4.1',
          awsBestPractices: 'EC2-008',
          nist: 'PR.PT-4',
        },
        docLink: 'https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/authorizing-access-to-an-instance.html',
      },
      {
        title: 'CloudTrail Logging is Disabled',
        description: 'An audit trail configuration was found in a disabled state, leaving administrative events unchecked for tracking and correlation.',
        severity: 'High',
        resourceId: cloudTrail._id,
        resourceArn: cloudTrail.arn,
        recommendation: 'Enable logging configurations on the specified trail instance to aggregate event logging directories.',
        complianceMapping: {
          cisAWS: '1.1',
          awsBestPractices: 'CT-001',
          nist: 'DE.AE-3',
        },
        docLink: 'https://docs.aws.amazon.com/awscloudtrail/latest/userguide/cloudtrail-user-guide.html',
      },
      {
        title: 'IAM User Console Login Lacks MFA Security',
        description: 'An IAM credential console login configuration exists without Multi-Factor Authentication token locks enabled.',
        severity: 'Medium',
        resourceId: iamUser._id,
        resourceArn: iamUser.arn,
        recommendation: 'Activate Virtual MFA devices on user configurations to ensure dual-step authorization validations on login.',
        complianceMapping: {
          cisAWS: '1.2',
          awsBestPractices: 'IAM-002',
          nist: 'PR.AC-6',
        },
        docLink: 'https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_mfa.html',
      },
    ];

    console.log('[Seed Script] Writing mock Findings documents...');
    const createdFindings = await Finding.insertMany(mockFindings);
    console.log(`[Seed Script] Successfully wrote ${createdFindings.length} Finding documents.`);

    const mockScans = [
      {
        accountId: '123456789012',
        status: 'Completed',
        resourcesScanned: 35,
        findingsFound: { critical: 2, high: 1, medium: 1, low: 0, informational: 0 },
        totalFindings: 4,
        securityScore: 45, // 100 - (2*20 + 1*10 + 1*5) = 45
        startedAt: new Date(Date.now() - 3600000 * 24), // 24 hours ago
        completedAt: new Date(Date.now() - 3600000 * 24 + 12000), // took 12 seconds
      },
      {
        accountId: '123456789012',
        status: 'Completed',
        resourcesScanned: 42,
        findingsFound: { critical: 2, high: 1, medium: 1, low: 0, informational: 0 },
        totalFindings: 4,
        securityScore: 45,
        startedAt: new Date(),
        completedAt: new Date(Date.now() + 15000), // took 15 seconds
      },
    ];

    console.log('[Seed Script] Writing mock Scan history logs...');
    await Scan.insertMany(mockScans);
    console.log('[Seed Script] Successfully wrote Scan documents.');

    console.log('[Seed Script] Database seed successfully completed! Exiting.');
    process.exit(0);
  } catch (error) {
    console.error(`[Seed Script] Failed during run operations: ${error.message}`);
    process.exit(1);
  }
};

seedData();
