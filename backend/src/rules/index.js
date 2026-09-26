const Finding = require('../models/Finding');
const Resource = require('../models/Resource');

// Load AWS rules
const s3PublicBlock = require('./s3PublicBlock');
const s3Encryption = require('./s3Encryption');
const ec2Port22Ingress = require('./ec2Port22Ingress');
const ec2Port3389Ingress = require('./ec2Port3389Ingress');
const ebsVolumeEncryption = require('./ebsVolumeEncryption');
const iamMfaConsole = require('./iamMfaConsole');
const iamKeyAge90Days = require('./iamKeyAge90Days');
const iamPasswordPolicy = require('./iamPasswordPolicy');
const cloudTrailLoggingEnabled = require('./cloudTrailLoggingEnabled');

// Load Comprehensive GCP Rule Engine
const gcsPublicAccess = require('./gcsPublicAccess');
const gceFirewallOpenSSH = require('./gceFirewallOpenSSH');
const gcpIamOwnerRole = require('./gcpIamOwnerRole');
const gcsPublicStorageAdmin = require('./gcsPublicStorageAdmin');
const gcsLoggingEnabled = require('./gcsLoggingEnabled');
const gcsVersioningEnabled = require('./gcsVersioningEnabled');
const gcpServiceAccountUserKey = require('./gcpServiceAccountUserKey');
const gcsEncryption = require('./gcsEncryption');
const gcsUniformBucketLevel = require('./gcsUniformBucketLevel');
const gceFirewallOpenRDP = require('./gceFirewallOpenRDP');
const gceDiskEncryption = require('./gceDiskEncryption');
const gceInstancePublicIP = require('./gceInstancePublicIP');
const gceShieldedVM = require('./gceShieldedVM');
const gcpKeyAge90Days = require('./gcpKeyAge90Days');
const gcpUserMfaConsole = require('./gcpUserMfaConsole');
const gcpServiceAccountAdmin = require('./gcpServiceAccountAdmin');
const gcpAuditLogging = require('./gcpAuditLogging');
const gcpCloudSqlPublicIp = require('./gcpCloudSqlPublicIp');
const gcpBigQueryPublicAccess = require('./gcpBigQueryPublicAccess');
const gcpKmsKeyRotation = require('./gcpKmsKeyRotation');

// Load Comprehensive CIS Azure Foundations Rule Engine
const azureBlobPublicAccess = require('./azureBlobPublicAccess');
const azureStorageHttpsOnly = require('./azureStorageHttpsOnly');
const azureStorageMinTls = require('./azureStorageMinTls');
const azureStoragePublicNetwork = require('./azureStoragePublicNetwork');
const azureStorageCmek = require('./azureStorageCmek');
const azureNsgOpenSSH = require('./azureNsgOpenSSH');
const azureNsgOpenRDP = require('./azureNsgOpenRDP');
const azureNsgAllOpen = require('./azureNsgAllOpen');
const azureVmPublicIp = require('./azureVmPublicIp');
const azureDiskCmek = require('./azureDiskCmek');
const azureEntraMfa = require('./azureEntraMfa');
const azureKeyVaultPurgeProtection = require('./azureKeyVaultPurgeProtection');
const azureKeyVaultPublicNetwork = require('./azureKeyVaultPublicNetwork');
const azureSqlPublicNetwork = require('./azureSqlPublicNetwork');
const azureSqlTdeDisabled = require('./azureSqlTdeDisabled');
const azureActivityLogAlert = require('./azureActivityLogAlert');

// Registry of active multi-cloud rules
const rulesRegistry = [
  // AWS Security Rules
  s3PublicBlock,
  s3Encryption,
  ec2Port22Ingress,
  ec2Port3389Ingress,
  ebsVolumeEncryption,
  iamMfaConsole,
  iamKeyAge90Days,
  iamPasswordPolicy,
  cloudTrailLoggingEnabled,

  // GCP Security & CIS Benchmark Rules
  gcsPublicAccess,
  gceFirewallOpenSSH,
  gcpIamOwnerRole,
  gcsPublicStorageAdmin,
  gcsLoggingEnabled,
  gcsVersioningEnabled,
  gcpServiceAccountUserKey,
  gcsEncryption,
  gcsUniformBucketLevel,
  gceFirewallOpenRDP,
  gceDiskEncryption,
  gceInstancePublicIP,
  gceShieldedVM,
  gcpKeyAge90Days,
  gcpUserMfaConsole,
  gcpServiceAccountAdmin,
  gcpAuditLogging,
  gcpCloudSqlPublicIp,
  gcpBigQueryPublicAccess,
  gcpKmsKeyRotation,

  // Azure Security & CIS Benchmark Rules
  azureBlobPublicAccess,
  azureStorageHttpsOnly,
  azureStorageMinTls,
  azureStoragePublicNetwork,
  azureStorageCmek,
  azureNsgOpenSSH,
  azureNsgOpenRDP,
  azureNsgAllOpen,
  azureVmPublicIp,
  azureDiskCmek,
  azureEntraMfa,
  azureKeyVaultPurgeProtection,
  azureKeyVaultPublicNetwork,
  azureSqlPublicNetwork,
  azureSqlTdeDisabled,
  azureActivityLogAlert,
];

/**
 * Audit resources against the registered security rules with full state lifecycle (Active vs Resolved)
 * @param {Array} resources List of Mongoose Resource documents to audit
 * @returns {Promise<Object>} Object containing counts of active & resolved findings found by severity
 */
const evaluateRules = async (resources) => {
  if (!resources || !Array.isArray(resources)) {
    resources = await Resource.find({ status: { $ne: 'deleted' } });
  }

  console.log(`[Rules Engine] SECURITY RULES EXECUTED: ${rulesRegistry.length} policy rules against ${resources.length} live resource(s)...`);

  const counts = { critical: 0, high: 0, medium: 0, low: 0, informational: 0, activeCount: 0, resolvedCount: 0 };
  const evaluatedResourceIds = resources.map(r => r._id);

  for (const res of resources) {
    // Fetch existing findings for this resource
    const existingFindings = await Finding.find({ resourceId: res._id });
    const existingFindingMap = new Map(existingFindings.map(f => [f.title, f]));

    for (const rule of rulesRegistry) {
      try {
        const isViolated = rule.check(res);
        const existing = existingFindingMap.get(rule.title);

        if (isViolated) {
          if (existing) {
            // Update timestamp on existing active finding
            existing.status = 'Active';
            existing.lastDetectedAt = new Date();
            await existing.save();
            console.log(`[Rules Engine] ⚠️  Existing Finding Maintained: '${rule.title}' on ${res.name}`);
          } else {
            // Create new active finding
            await Finding.create({
              title: rule.title,
              description: rule.description,
              severity: rule.severity,
              resourceId: res._id,
              resourceArn: res.arn,
              recommendation: rule.recommendation || rule.remediation || '',
              complianceMapping: rule.complianceMapping,
              docLink: rule.docLink,
              status: 'Active',
              firstDetectedAt: new Date(),
              lastDetectedAt: new Date()
            });
            console.log(`[Rules Engine] 🚨 New Finding Raised: '${rule.title}' on ${res.name}`);
          }

          counts.activeCount++;
          const sevKey = rule.severity.toLowerCase();
          if (counts[sevKey] !== undefined) {
            counts[sevKey]++;
          }
        } else {
          // Rule is compliant: resolve any existing active finding for this rule on this resource
          if (existing && existing.status === 'Active') {
            existing.status = 'Resolved';
            existing.lastDetectedAt = new Date();
            await existing.save();
            counts.resolvedCount++;
            console.log(`[Rules Engine] ✅ Finding Resolved: '${rule.title}' on ${res.name}`);
          }
        }
      } catch (err) {
        console.error(`[Rules Engine] Error running rule ${rule.id} on resource ${res.arn}:`, err.message);
      }
    }
  }

  // Resolve findings ONLY for decommissioned resources of the specific provider(s) being evaluated
  const evaluatedProviders = [...new Set(resources.map(r => r.cloudProvider))];
  if (evaluatedProviders.length > 0) {
    const staleResources = await Resource.find({
      cloudProvider: { $in: evaluatedProviders },
      _id: { $nin: evaluatedResourceIds }
    });
    const staleIds = staleResources.map(r => r._id);

    const orphanedFindings = await Finding.find({
      resourceId: { $in: staleIds },
      status: 'Active'
    });
    for (const orphan of orphanedFindings) {
      orphan.status = 'Resolved';
      orphan.lastDetectedAt = new Date();
      await orphan.save();
      counts.resolvedCount++;
      console.log(`[Rules Engine] ✅ Finding Resolved (Resource Decommissioned/Cleaned): '${orphan.title}' on ARN: ${orphan.resourceArn}`);
    }
  }

  console.log(`[Rules Engine] Audit completed. FINDINGS DETECTED: ${counts.activeCount} Active | FINDINGS RESOLVED: ${counts.resolvedCount} Resolved.`);
  return counts;
};

module.exports = {
  rules: rulesRegistry,
  evaluateRules,
};
