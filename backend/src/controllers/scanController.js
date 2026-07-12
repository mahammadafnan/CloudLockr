const { STSClient, GetCallerIdentityCommand } = require('@aws-sdk/client-sts');
const awsConfig = require('../config/aws');
const Scan = require('../models/Scan');
const Resource = require('../models/Resource');
const Finding = require('../models/Finding');

// Import individual AWS SDK scanners
const { scanS3 } = require('../scanners/s3Scanner');
const { scanEC2 } = require('../scanners/ec2Scanner');
const { scanIAM } = require('../scanners/iamScanner');
const { scanSecurityGroups } = require('../scanners/securityGroupScanner');
const { scanCloudTrail } = require('../scanners/cloudTrailScanner');

/**
 * Basic Rule Evaluation Engine to create findings dynamically from resource configurations
 * @param {Array} resources List of Mongoose Resource documents scanned
 * @returns {Promise<Object>} Object containing counts of findings found
 */
const runRuleEvaluations = async (resources) => {
  console.log('[Rules Evaluator] Auditing ingested resources configurations...');
  
  // Wipe previous findings to prevent duplicate tracking logs
  const resourceIds = resources.map((r) => r._id);
  await Finding.deleteMany({ resourceId: { $in: resourceIds } });

  const counts = { critical: 0, high: 0, medium: 0, low: 0, informational: 0 };

  for (const res of resources) {
    // Rule 1: S3 Public Access Block
    if (res.service === 'S3' && res.status === 'public') {
      await Finding.create({
        title: 'S3 Public Bucket Access Detected',
        description: `The S3 bucket '${res.name}' allows public read/write configurations.`,
        severity: 'Critical',
        resourceId: res._id,
        resourceArn: res.arn,
        recommendation: 'Configure Block Public Access settings on the bucket to prevent unauthorized data exposure.',
        complianceMapping: { cisAWS: '2.1.1', awsBestPractices: 'S3-002', nist: 'PR.AC-4' },
        docLink: 'https://docs.aws.amazon.com/AmazonS3/latest/userguide/access-control-block-public-access.html',
        status: 'Active',
      });
      counts.critical++;
    }

    // Rule 2: Unencrypted S3 Bucket
    if (res.service === 'S3' && res.tags.get('Encryption') === 'disabled') {
      await Finding.create({
        title: 'S3 Bucket Encryption Disabled',
        description: `The S3 bucket '${res.name}' does not have default server-side encryption enabled.`,
        severity: 'High',
        resourceId: res._id,
        resourceArn: res.arn,
        recommendation: 'Enable default SSE-S3 or SSE-KMS encryption in the bucket configuration properties.',
        complianceMapping: { cisAWS: '2.1.2', awsBestPractices: 'S3-004', nist: 'PR.DS-1' },
        docLink: 'https://docs.aws.amazon.com/AmazonS3/latest/userguide/bucket-encryption.html',
        status: 'Active',
      });
      counts.high++;
    }

    // Rule 3: Security Group SSH Port 22 exposed to Internet
    if (res.service === 'Security Groups' && res.tags.get('OpenSSH') === 'true') {
      await Finding.create({
        title: 'Security Group SSH Port 22 Open to Public',
        description: `Security Group '${res.name}' allows inbound SSH traffic from any IP scope (0.0.0.0/0).`,
        severity: 'Critical',
        resourceId: res._id,
        resourceArn: res.arn,
        recommendation: 'Modify the security group ingress rule list to allow SSH connections only from authorized CIDRs.',
        complianceMapping: { cisAWS: '4.1', awsBestPractices: 'EC2-008', nist: 'PR.PT-4' },
        docLink: 'https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/authorizing-access-to-an-instance.html',
        status: 'Active',
      });
      counts.critical++;
    }

    // Rule 4: Unencrypted EBS Volume
    if (res.service === 'EBS' && res.tags.get('Encrypted') === 'disabled') {
      await Finding.create({
        title: 'EBS Volume Encryption Disabled',
        description: `The virtual storage volume '${res.name}' is unencrypted.`,
        severity: 'High',
        resourceId: res._id,
        resourceArn: res.arn,
        recommendation: 'Configure encryption parameters when launching volumes, or copy the volume to an encrypted snapshot.',
        complianceMapping: { cisAWS: '2.2.1', awsBestPractices: 'EC2-003', nist: 'PR.DS-1' },
        docLink: 'https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/EBSEncryption.html',
        status: 'Active',
      });
      counts.high++;
    }

    // Rule 5: IAM User console access without MFA
    if (res.service === 'IAM' && res.tags.get('ConsoleAccess') === 'enabled' && res.tags.get('MfaActive') === 'disabled') {
      await Finding.create({
        title: 'IAM Console User Missing MFA',
        description: `IAM User '${res.name}' has console login profiles active without MFA tokens enabled.`,
        severity: 'Medium',
        resourceId: res._id,
        resourceArn: res.arn,
        recommendation: 'Configure Virtual MFA device configurations on security user credentials to enable multi-step login protection.',
        complianceMapping: { cisAWS: '1.2', awsBestPractices: 'IAM-002', nist: 'PR.AC-6' },
        docLink: 'https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_mfa.html',
        status: 'Active',
      });
      counts.medium++;
    }

    // Rule 6: CloudTrail logging disabled
    if (res.service === 'CloudTrail' && res.status === 'disabled') {
      await Finding.create({
        title: 'CloudTrail Logging is Disabled',
        description: `Audit logging configuration '${res.name}' is currently in a disabled state.`,
        severity: 'High',
        resourceId: res._id,
        resourceArn: res.arn,
        recommendation: 'Enable logging parameters on the specified audit trail to track environment API operations.',
        complianceMapping: { cisAWS: '1.1', awsBestPractices: 'CT-001', nist: 'DE.AE-3' },
        docLink: 'https://docs.aws.amazon.com/awscloudtrail/latest/userguide/cloudtrail-user-guide.html',
        status: 'Active',
      });
      counts.high++;
    }
  }

  return counts;
};

/**
 * Seed fallback database structures if AWS keys are not configured
 * @param {String} accountId Mock Account ID
 * @returns {Promise<Object>} Discovered resources counts and total findings object
 */
const runMockScanIngestion = async (accountId) => {
  console.log('[Scan Controller] Running Mock Ingestion Fallback...');
  
  // Wipe previous assets to start clean mock scan
  await Resource.deleteMany({});
  await Finding.deleteMany({});

  // 1. Write mock S3 bucket
  const s3 = await Resource.create({
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
  });

  // 2. Write mock EC2 Instance
  const ec2 = await Resource.create({
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
  });

  // 3. Write mock Security Group
  const sg = await Resource.create({
    name: 'default-ingress-sg',
    service: 'Security Groups',
    type: 'SecurityGroup',
    cloudProvider: 'AWS',
    accountId,
    region: 'us-east-1',
    arn: 'arn:aws:ec2:us-east-1:123456789012:security-group/sg-0e99812df',
    status: 'exposed',
    tags: { OpenSSH: 'true', GroupName: 'default' },
  });

  // 4. Write mock IAM user
  const iam = await Resource.create({
    name: 'admin-console-user',
    service: 'IAM',
    type: 'User',
    cloudProvider: 'AWS',
    accountId,
    region: 'global',
    arn: 'arn:aws:iam::123456789012:user/admin-console-user',
    status: 'active',
    tags: { ConsoleAccess: 'enabled', MfaActive: 'disabled' },
  });

  // 5. Write mock CloudTrail
  const ct = await Resource.create({
    name: 'organization-audit-trail',
    service: 'CloudTrail',
    type: 'Trail',
    cloudProvider: 'AWS',
    accountId,
    region: 'us-east-1',
    arn: 'arn:aws:cloudtrail:us-east-1:123456789012:trail/organization-audit-trail',
    status: 'disabled',
    tags: { LoggingActive: 'false' },
  });

  const resources = [s3, ec2, sg, iam, ct];
  const findingsCount = await runRuleEvaluations(resources);

  return {
    scannedCount: resources.length,
    findingsCount,
  };
};

// @desc    Trigger programmatic security scan
// @route   POST /api/scan
// @access  Private (Admin/Analyst)
exports.triggerScan = async (req, res, next) => {
  console.log('[Scan Controller] Initiating scan request payload...');
  let currentScan;
  let accountId = '123456789012'; // Default fallback mock account

  try {
    // 1. Initialize Scan log status in MongoDB
    currentScan = await Scan.create({
      accountId,
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

      return res.status(200).json({
        success: true,
        message: 'Mock Scan completed successfully. Loaded mock resource metadata.',
        scan: currentScan,
      });
    }

    // 2b. Run in Live Mode
    console.log('[Scan Controller] Found AWS credentials. Resolving AWS STS Identity...');
    const stsClient = new STSClient(awsConfig);
    const callerIdentity = await stsClient.send(new GetCallerIdentityCommand({}));
    accountId = callerIdentity.Account;
    
    // Update Scan log with resolved live accountId
    currentScan.accountId = accountId;
    await currentScan.save();

    let allResources = [];

    // Run each scanner sequentially inside separate try-catch blocks.
    // If one service fails, the others will still run and save data.
    try {
      const s3Res = await scanS3(awsConfig, accountId);
      allResources = allResources.concat(s3Res);
    } catch (err) {
      console.error('[Scan Controller] S3 Ingestion failed:', err.message);
    }

    try {
      const ec2Res = await scanEC2(awsConfig, accountId);
      allResources = allResources.concat(ec2Res);
    } catch (err) {
      console.error('[Scan Controller] EC2 Ingestion failed:', err.message);
    }

    try {
      const iamRes = await scanIAM(awsConfig, accountId);
      allResources = allResources.concat(iamRes);
    } catch (err) {
      console.error('[Scan Controller] IAM Ingestion failed:', err.message);
    }

    try {
      const sgRes = await scanSecurityGroups(awsConfig, accountId);
      allResources = allResources.concat(sgRes);
    } catch (err) {
      console.error('[Scan Controller] SG Ingestion failed:', err.message);
    }

    try {
      const ctRes = await scanCloudTrail(awsConfig, accountId);
      allResources = allResources.concat(ctRes);
    } catch (err) {
      console.error('[Scan Controller] CloudTrail Ingestion failed:', err.message);
    }

    // Run rules engine against newly saved live resources
    const findingsCount = await runRuleEvaluations(allResources);
    
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

    res.status(200).json({
      success: true,
      message: 'AWS scan completed successfully. Configurations synchronized.',
      scan: currentScan,
    });
  } catch (error) {
    console.error('[Scan Controller] Scan failed:', error.message);
    if (currentScan) {
      currentScan.status = 'Failed';
      currentScan.error = error.message;
      currentScan.completedAt = new Date();
      await currentScan.save();
    }
    next(error);
  }
};
