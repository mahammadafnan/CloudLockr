const { STSClient, GetCallerIdentityCommand } = require('@aws-sdk/client-sts');
const awsConfig = require('../config/aws');
const Scan = require('../models/Scan');
const Resource = require('../models/Resource');
const Finding = require('../models/Finding');
const { evaluateRules } = require('../rules/index');
const { sendSecurityAlert } = require('./mailer');

// Import individual AWS SDK scanners
const { scanS3 } = require('../scanners/s3Scanner');
const { scanEC2 } = require('../scanners/ec2Scanner');
const { scanIAM } = require('../scanners/iamScanner');
const { scanSecurityGroups } = require('../scanners/securityGroupScanner');
const { scanCloudTrail } = require('../scanners/cloudTrailScanner');
const { scanGCP } = require('../scanners/gcpScanner');
const { scanAzure } = require('../scanners/azureScanner');

/**
 * Seed fallback database structures if AWS keys are not configured
 * @param {String} accountId Mock Account ID
 * @returns {Promise<Object>} Discovered resources counts and total findings object
 */
const runMockScanIngestion = async (accountId) => {
  console.log('[Scan Engine] Running Ingestion Scan...');
  
  // Clean findings before running fresh rules evaluation
  await Finding.deleteMany({});

  // 1. Write/Upsert mock S3 bucket
  const s3 = await Resource.findOneAndUpdate(
    { arn: 'arn:aws:s3:::cloudlockr-production-logs' },
    {
      name: 'cloudlockr-production-logs',
      service: 'S3',
      type: 'Bucket',
      cloudProvider: 'AWS',
      accountId,
      region: 'us-east-1',
      arn: 'arn:aws:s3:::cloudlockr-production-logs',
      status: 'public',
      tags: { Encryption: 'disabled', Compliance: 'PCI-DSS' },
      creationDate: new Date('2025-01-10T12:00:00Z'),
    },
    { upsert: true, new: true }
  );

  // 2. Write/Upsert mock EC2 Instance
  const ec2 = await Resource.findOneAndUpdate(
    { arn: 'arn:aws:ec2:us-east-1:123456789012:instance/i-0c1a2b3c4d5e6f7g8' },
    {
      name: 'prod-web-server-01',
      service: 'EC2',
      type: 'Instance',
      cloudProvider: 'AWS',
      accountId,
      region: 'us-east-1',
      arn: 'arn:aws:ec2:us-east-1:123456789012:instance/i-0c1a2b3c4d5e6f7g8',
      status: 'running',
      tags: { InstanceType: 't3.medium', Environment: 'Production' },
      creationDate: new Date('2025-06-15T08:30:00Z'),
    },
    { upsert: true, new: true }
  );

  // 3. Write/Upsert mock Security Group
  const sg = await Resource.findOneAndUpdate(
    { arn: 'arn:aws:ec2:us-east-1:123456789012:security-group/sg-0e99812df' },
    {
      name: 'default-ingress-sg',
      service: 'Security Groups',
      type: 'SecurityGroup',
      cloudProvider: 'AWS',
      accountId,
      region: 'us-east-1',
      arn: 'arn:aws:ec2:us-east-1:123456789012:security-group/sg-0e99812df',
      status: 'exposed',
      tags: { OpenSSH: 'true', GroupName: 'default' },
    },
    { upsert: true, new: true }
  );

  // 4. Write/Upsert mock IAM user
  const iam = await Resource.findOneAndUpdate(
    { arn: 'arn:aws:iam::123456789012:user/admin-console-user' },
    {
      name: 'admin-console-user',
      service: 'IAM',
      type: 'User',
      cloudProvider: 'AWS',
      accountId,
      region: 'global',
      arn: 'arn:aws:iam::123456789012:user/admin-console-user',
      status: 'active',
      tags: { ConsoleAccess: 'enabled', MfaActive: 'disabled' },
    },
    { upsert: true, new: true }
  );

  // 5. Write/Upsert mock CloudTrail
  const ct = await Resource.findOneAndUpdate(
    { arn: 'arn:aws:cloudtrail:us-east-1:123456789012:trail/organization-audit-trail' },
    {
      name: 'organization-audit-trail',
      service: 'CloudTrail',
      type: 'Trail',
      cloudProvider: 'AWS',
      accountId,
      region: 'us-east-1',
      arn: 'arn:aws:cloudtrail:us-east-1:123456789012:trail/organization-audit-trail',
      status: 'disabled',
      tags: { LoggingActive: 'false' },
    },
    { upsert: true, new: true }
  );

  const gcpRes = await scanGCP('project-25a7942f-6ee6-4832-a57');
  const azureRes = await scanAzure('48131ce1-65df-4433-bb54-cb966376f6b6');
  
  // Ingest all resources currently in MongoDB (including custom & new storage buckets)
  const allResources = await Resource.find({});
  const findingsCount = await evaluateRules(allResources);

  return {
    scannedCount: allResources.length,
    findingsCount,
  };
};

/**
 * Executes a full security scan, evaluates rules, saves to DB and sends alerts
 * @param {String} triggerType 'Manual' or 'Scheduled'
 * @returns {Promise<Object>} Completed Scan document
 */
exports.runProgrammaticScan = async (triggerType = 'Manual') => {
  console.log(`[Scan Engine] Starting programmatic scan. Trigger: ${triggerType}`);
  let currentScan;
  let accountId = '123456789012'; // Default fallback mock account

  try {
    // 1. Initialize Scan log status in MongoDB
    currentScan = await Scan.create({
      accountId,
      triggerType,
      status: 'In-Progress',
    });

    const isAwsConfigured =
      process.env.AWS_ACCESS_KEY_ID &&
      process.env.AWS_SECRET_ACCESS_KEY;

    if (!isAwsConfigured) {
      // 2a. Run in Mock mode
      const result = await runMockScanIngestion(accountId);
      
      const totalFindings =
        result.findingsCount.critical +
        result.findingsCount.high +
        result.findingsCount.medium +
        result.findingsCount.low;

      const deductions =
        result.findingsCount.critical * 20 +
        result.findingsCount.high * 10 +
        result.findingsCount.medium * 5 +
        result.findingsCount.low * 2;

      const score = Math.max(0, 100 - deductions);

      currentScan.status = 'Completed';
      currentScan.resourcesScanned = result.scannedCount;
      currentScan.findingsFound = result.findingsCount;
      currentScan.totalFindings = totalFindings;
      currentScan.securityScore = score;
      currentScan.completedAt = new Date();
      await currentScan.save();

      // Dispatch security email alerts for new findings
      const activeFindings = await Finding.find({ status: 'Active' }).populate('resourceId');
      await sendSecurityAlert(currentScan, activeFindings);

      return currentScan;
    }

    // 2b. Run in Live Mode
    console.log('[Scan Engine] Found AWS credentials. Resolving AWS STS Identity...');
    try {
      const stsClient = new STSClient(awsConfig);
      const callerIdentity = await stsClient.send(new GetCallerIdentityCommand({}));
      accountId = callerIdentity.Account;
    } catch (stsErr) {
      console.warn('[Scan Engine] AWS STS Identity resolution failed (Network/DNS):', stsErr.message);
      accountId = '464433361537'; // Default verified account fallback
    }
    
    // Update Scan log with resolved accountId
    currentScan.accountId = accountId;
    await currentScan.save();

    let allResources = [];

    // Run each scanner sequentially inside separate try-catch blocks.
    try {
      const s3Res = await scanS3(awsConfig, accountId);
      allResources = allResources.concat(s3Res);
    } catch (err) {
      console.error('[Scan Engine] S3 Ingestion failed:', err.message);
    }

    try {
      const ec2Res = await scanEC2(awsConfig, accountId);
      allResources = allResources.concat(ec2Res);
    } catch (err) {
      console.error('[Scan Engine] EC2 Ingestion failed:', err.message);
    }

    try {
      const iamRes = await scanIAM(awsConfig, accountId);
      allResources = allResources.concat(iamRes);
    } catch (err) {
      console.error('[Scan Engine] IAM Ingestion failed:', err.message);
    }

    try {
      const sgRes = await scanSecurityGroups(awsConfig, accountId);
      allResources = allResources.concat(sgRes);
    } catch (err) {
      console.error('[Scan Engine] SG Ingestion failed:', err.message);
    }

    try {
      const ctRes = await scanCloudTrail(awsConfig, accountId);
      allResources = allResources.concat(ctRes);
    } catch (err) {
      console.error('[Scan Engine] CloudTrail Ingestion failed:', err.message);
    }

    try {
      const gcpRes = await scanGCP('project-25a7942f-6ee6-4832-a57');
      allResources = allResources.concat(gcpRes);
    } catch (err) {
      console.error('[Scan Engine] GCP Ingestion failed:', err.message);
    }

    try {
      const azureRes = await scanAzure('48131ce1-65df-4433-bb54-cb966376f6b6');
      allResources = allResources.concat(azureRes);
    } catch (err) {
      console.error('[Scan Engine] Azure Ingestion failed:', err.message);
    }

    // Run rules engine against newly saved live resources
    const findingsCount = await evaluateRules(allResources);
    
    const totalFindings =
      findingsCount.critical +
      findingsCount.high +
      findingsCount.medium +
      findingsCount.low;

    const deductions =
      findingsCount.critical * 20 +
      findingsCount.high * 10 +
      findingsCount.medium * 5 +
      findingsCount.low * 2;

    const score = Math.max(0, 100 - deductions);

    // Save final scan state
    currentScan.status = 'Completed';
    currentScan.resourcesScanned = allResources.length;
    currentScan.findingsFound = findingsCount;
    currentScan.totalFindings = totalFindings;
    currentScan.securityScore = score;
    currentScan.completedAt = new Date();
    await currentScan.save();

    // Dispatch security email alerts for new findings
    const activeFindings = await Finding.find({ status: 'Active' }).populate('resourceId');
    await sendSecurityAlert(currentScan, activeFindings);

    return currentScan;
  } catch (error) {
    console.error('[Scan Engine] Background scan failed:', error.message);
    if (currentScan) {
      currentScan.status = 'Failed';
      currentScan.error = error.message;
      currentScan.completedAt = new Date();
      await currentScan.save();
    }
    throw error;
  }
};
