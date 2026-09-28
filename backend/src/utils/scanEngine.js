const { STSClient, GetCallerIdentityCommand } = require('@aws-sdk/client-sts');
const awsConfig = require('../config/aws');
const gcpConfig = require('../config/gcp');
const azureConfig = require('../config/azure');

const Scan = require('../models/Scan');
const Resource = require('../models/Resource');
const Finding = require('../models/Finding');
const { evaluateRules } = require('../rules/index');
const { calculateSecurityPosture } = require('./postureCalculator');
const { sendSecurityAlert } = require('./mailer');

// Import scanners
const { scanS3 } = require('../scanners/s3Scanner');
const { scanEC2 } = require('../scanners/ec2Scanner');
const { scanIAM } = require('../scanners/iamScanner');
const { scanSecurityGroups } = require('../scanners/securityGroupScanner');
const { scanCloudTrail } = require('../scanners/cloudTrailScanner');
const { scanGCP } = require('../scanners/gcpScanner');
const { scanAzure } = require('../scanners/azureScanner');

/**
 * Executes a full or provider-scoped security scan with real-time state synchronization
 * 
 * @param {Object} options Scan options { provider, projectId, triggerType }
 * @returns {Promise<Object>} Completed Scan document
 */
exports.runProgrammaticScan = async (options = {}) => {
  const triggerType = typeof options === 'string' ? options : (options.triggerType || 'Manual');
  const targetProvider = (options.provider || 'ALL').toUpperCase();
  const targetGcpProjectId = options.projectId || gcpConfig.projectId;
  const targetAzureSubscriptionId = azureConfig.subscriptionId;

  console.log(`\n==================================================`);
  console.log(`SCAN STARTED`);
  console.log(`Trigger: ${triggerType}`);
  console.log(`Target Provider: ${targetProvider}`);
  if (targetProvider === 'GCP' || targetProvider === 'ALL' || targetProvider === 'MULTI-CLOUD') {
    if (gcpConfig.isConfigured) {
      console.log(`GCP Project: ${targetGcpProjectId} (Identity: ${gcpConfig.clientEmail})`);
    }
  }
  if (targetProvider === 'AZURE' || targetProvider === 'ALL' || targetProvider === 'MULTI-CLOUD') {
    if (azureConfig.isConfigured) {
      console.log(`Azure Subscription: ${targetAzureSubscriptionId} (Tenant: ${azureConfig.tenantId})`);
    }
  }
  console.log(`==================================================`);

  let currentScan;
  let scanProvider = targetProvider;
  let accountId = '464433361537';

  if (targetProvider === 'AZURE') {
    accountId = targetAzureSubscriptionId || '48131ce1-65df-4433-bb54-cb966376f6b6';
    scanProvider = 'AZURE';
  } else if (targetProvider === 'GCP') {
    accountId = targetGcpProjectId || 'project-25a7942f-6ee6-4832-a57';
    scanProvider = 'GCP';
  } else if (targetProvider === 'AWS') {
    accountId = '464433361537';
    scanProvider = 'AWS';
  } else {
    accountId = 'Multi-Cloud (AWS/GCP/Azure)';
    scanProvider = 'MULTI-CLOUD';
  }

  try {
    // 1. Initialize Scan log status in MongoDB
    currentScan = await Scan.create({
      accountId,
      provider: scanProvider,
      triggerType,
      status: 'In-Progress',
      startedAt: new Date()
    });

    let liveScannedResources = [];
    let scanHasError = false;
    let scanErrorMessage = '';

    // 2. Execute GCP Scanning if targeted
    if (targetProvider === 'GCP' || targetProvider === 'ALL' || targetProvider === 'MULTI-CLOUD') {
      if (gcpConfig.isConfigured) {
        console.log(`[Scan Engine] Initiating live GCP API requests...`);
        try {
          const gcpResult = await scanGCP(targetGcpProjectId);
          const gcpRes = (gcpResult && gcpResult.resources) ? gcpResult.resources : [];
          liveScannedResources = liveScannedResources.concat(gcpRes);

          // Synchronize MongoDB ONLY if GCP API succeeded: remove stale GCP resources no longer existing in GCP
          const currentArns = gcpRes.map(r => r.arn);
          const staleGcpResources = await Resource.find({
            cloudProvider: 'GCP',
            accountId: targetGcpProjectId,
            arn: { $nin: currentArns }
          });

          if (staleGcpResources.length > 0) {
            const staleIds = staleGcpResources.map(r => r._id);
            await Finding.updateMany({ resourceId: { $in: staleIds } }, { status: 'Resolved', lastDetectedAt: new Date() });
            await Resource.deleteMany({ _id: { $in: staleIds } });
            console.log(`[Scan Engine] Removed ${staleGcpResources.length} decommissioned/fixed GCP resource(s) from DB.`);
          }
        } catch (err) {
          scanHasError = true;
          scanErrorMessage = `GCP Scan Failed: ${err.message}`;
          console.error('[Scan Engine] GCP Ingestion failed:', err.message);
        }
      } else {
        console.warn('[Scan Engine] GCP is not configured. Skipping GCP scan.');
      }
    }

    // 3. Execute AWS Scanning if targeted
    if (targetProvider === 'AWS' || targetProvider === 'ALL' || targetProvider === 'MULTI-CLOUD') {
      const isAwsConfigured = process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY;
      if (isAwsConfigured) {
        try {
          const stsClient = new STSClient(awsConfig);
          const callerIdentity = await stsClient.send(new GetCallerIdentityCommand({}));
          accountId = callerIdentity.Account;
          currentScan.accountId = accountId;

          const s3Res = await scanS3(awsConfig, accountId);
          const ec2Res = await scanEC2(awsConfig, accountId);
          const iamRes = await scanIAM(awsConfig, accountId);
          const sgRes = await scanSecurityGroups(awsConfig, accountId);
          const ctRes = await scanCloudTrail(awsConfig, accountId);

          liveScannedResources = liveScannedResources.concat(s3Res, ec2Res, iamRes, sgRes, ctRes);
        } catch (awsErr) {
          console.error('[Scan Engine] AWS Ingestion failed:', awsErr.message);
        }
      }
    }

    // 4. Execute Azure Scanning if targeted
    if (targetProvider === 'AZURE' || targetProvider === 'ALL' || targetProvider === 'MULTI-CLOUD') {
      if (azureConfig.isConfigured) {
        console.log(`[Scan Engine] Initiating live Azure ARM API requests for Subscription ${targetAzureSubscriptionId}...`);
        try {
          const azureResult = await scanAzure(targetAzureSubscriptionId);
          const azureRes = (azureResult && azureResult.resources) ? azureResult.resources : [];
          liveScannedResources = liveScannedResources.concat(azureRes);

          // Synchronize MongoDB: remove stale Azure resources no longer existing in subscription
          const currentAzureArns = azureRes.map(r => r.arn);
          const staleAzureResources = await Resource.find({
            cloudProvider: 'AZURE',
            accountId: targetAzureSubscriptionId,
            arn: { $nin: currentAzureArns }
          });

          if (staleAzureResources.length > 0) {
            const staleIds = staleAzureResources.map(r => r._id);
            await Finding.updateMany({ resourceId: { $in: staleIds } }, { status: 'Resolved', lastDetectedAt: new Date() });
            await Resource.deleteMany({ _id: { $in: staleIds } });
            console.log(`[Scan Engine] Removed ${staleAzureResources.length} decommissioned/fixed Azure resource(s) from DB.`);
          }
        } catch (azErr) {
          scanHasError = true;
          scanErrorMessage = `Azure Scan Failed: ${azErr.message}`;
          console.error('[Scan Engine] Azure Ingestion failed:', azErr.message);
        }
      } else {
        console.warn('[Scan Engine] Azure is not configured. Skipping Azure scan.');
      }
    }

    // If target scan failed completely, do not mark as clean
    if (scanHasError && liveScannedResources.length === 0) {
      currentScan.status = 'Failed';
      currentScan.error = scanErrorMessage;
      currentScan.completedAt = new Date();
      await currentScan.save();
      throw new Error(scanErrorMessage);
    }

    // 5. Ingest all currently active live resources in MongoDB for the target provider scope
    const queryFilter = (targetProvider === 'ALL' || targetProvider === 'MULTI-CLOUD') ? {} : { cloudProvider: targetProvider };
    const allActiveResources = await Resource.find(queryFilter);

    console.log(`[Scan Engine] DATABASE UPDATED: ${allActiveResources.length} active resource(s) ready for rule evaluation.`);

    // 6. Run security rules engine with active/resolved finding lifecycle
    const findingsResult = await evaluateRules(allActiveResources);

    const posture = calculateSecurityPosture({
      resources: allActiveResources,
      findings: findingsResult,
      provider: targetProvider
    });

    // Save completed scan record
    currentScan.provider = scanProvider;
    currentScan.status = scanHasError ? 'Partial-Failure' : 'Completed';
    if (scanHasError) currentScan.error = scanErrorMessage;
    currentScan.resourcesScanned = allActiveResources.length;
    currentScan.findingsFound = {
      critical: findingsResult.critical,
      high: findingsResult.high,
      medium: findingsResult.medium,
      low: findingsResult.low,
      informational: findingsResult.informational || 0
    };
    currentScan.totalFindings = posture.findingsCount.total;
    currentScan.securityScore = posture.securityScore;
    currentScan.completedAt = new Date();
    await currentScan.save();

    console.log(`\n==================================================`);
    console.log(`FINDINGS DETECTED: ${posture.findingsCount.total} Active`);
    console.log(`FINDINGS RESOLVED: ${findingsResult.resolvedCount || 0} Resolved`);
    console.log(`SCAN COMPLETED (Status: ${currentScan.status})`);
    console.log(`==================================================\n`);

    // Dispatch security alerts if active findings exist
    try {
      const activeFindings = await Finding.find({ status: 'Active' }).populate('resourceId');
      await sendSecurityAlert(currentScan, activeFindings);
    } catch (mailErr) {
      console.warn('[Scan Engine] Mailer alert skipped:', mailErr.message);
    }

    return currentScan;
  } catch (error) {
    console.error('[Scan Engine] Scan failed:', error.message);
    if (currentScan) {
      currentScan.status = 'Failed';
      currentScan.error = error.message;
      currentScan.completedAt = new Date();
      await currentScan.save();
    }
    throw error;
  }
};
