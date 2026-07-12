const Finding = require('../models/Finding');

// Load decoupled rule definition objects
const s3PublicBlock = require('./s3PublicBlock');
const s3Encryption = require('./s3Encryption');
const ec2Port22Ingress = require('./ec2Port22Ingress');
const ec2Port3389Ingress = require('./ec2Port3389Ingress');
const ebsVolumeEncryption = require('./ebsVolumeEncryption');
const iamMfaConsole = require('./iamMfaConsole');
const iamKeyAge90Days = require('./iamKeyAge90Days');
const cloudTrailLoggingEnabled = require('./cloudTrailLoggingEnabled');

// Registry of active rules
const rulesRegistry = [
  s3PublicBlock,
  s3Encryption,
  ec2Port22Ingress,
  ec2Port3389Ingress,
  ebsVolumeEncryption,
  iamMfaConsole,
  iamKeyAge90Days,
  cloudTrailLoggingEnabled,
];

/**
 * Audit resources against the registered security rules
 * @param {Array} resources List of Mongoose Resource documents to audit
 * @returns {Promise<Object>} Object containing counts of active findings found by severity
 */
const evaluateRules = async (resources) => {
  console.log(`[Rules Engine] Evaluating ${resources.length} resource(s) against ${rulesRegistry.length} policy rule(s)...`);
  
  // Clean previous findings for the specific resources being evaluated
  const resourceIds = resources.map((r) => r._id);
  await Finding.deleteMany({ resourceId: { $in: resourceIds } });

  const counts = { critical: 0, high: 0, medium: 0, low: 0, informational: 0 };

  for (const res of resources) {
    for (const rule of rulesRegistry) {
      try {
        const isViolated = rule.check(res);
        if (isViolated) {
          console.log(`[Rules Engine] 🚨 Finding Raised: '${rule.title}' on resource: ${res.arn}`);
          
          await Finding.create({
            title: rule.title,
            description: rule.description,
            severity: rule.severity,
            resourceId: res._id,
            resourceArn: res.arn,
            recommendation: rule.recommendation,
            complianceMapping: rule.complianceMapping,
            docLink: rule.docLink,
            status: 'Active',
          });

          // Increment count based on severity weight
          const sevKey = rule.severity.toLowerCase();
          if (counts[sevKey] !== undefined) {
            counts[sevKey]++;
          }
        }
      } catch (err) {
        console.error(`[Rules Engine] Error running rule ${rule.id} on resource ${res.arn}:`, err.message);
      }
    }
  }

  console.log(`[Rules Engine] Audit completed. Total findings raised: ${counts.critical + counts.high + counts.medium + counts.low}`);
  return counts;
};

module.exports = {
  rules: rulesRegistry,
  evaluateRules,
};
