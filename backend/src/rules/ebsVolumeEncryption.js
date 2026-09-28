/**
 * AWS-EC2-001 — EBS Volumes Should Be Encrypted
 * Reference: AWS Security Hub EC2.3 — Attached Amazon EBS volumes should be encrypted
 * Compliance Mapping: CIS AWS Foundations Benchmark 2.2.1 / AWS Security Hub EC2.3 / NIST PR.DS-1
 */
module.exports = {
  id: 'AWS-EC2-001',
  title: 'EBS volumes should be encrypted',
  provider: 'AWS',
  service: 'EC2 / EBS',
  resourceType: 'EBS Volume',
  category: 'DATA_PROTECTION / ENCRYPTION',
  severity: 'High',
  deduction: 10,
  description: 'Detects EBS volumes that are not encrypted at rest. Unencrypted EBS volumes can expose stored data if the underlying storage is accessed improperly.',
  detectionLogic: 'Check the Encrypted property of every EBS volume. If Encrypted == false, the resource is NON_COMPLIANT.',
  compliantCondition: 'Encrypted == true',
  nonCompliantCondition: 'Encrypted == false',
  resourceScope: 'All EBS volumes, including volumes attached to EC2 instances',
  findingStatus: 'NON_COMPLIANT when an unencrypted volume is detected',
  recommendation: 'Create an encrypted copy/snapshot and migrate the workload/data to the encrypted EBS volume.',
  remediation: 'Create an encrypted copy/snapshot and migrate the workload/data to the encrypted EBS volume.',
  evidence: 'Volume ID, instance ID if attached, encryption status, availability zone, volume type, and size',
  complianceMapping: {
    cisAWS: '2.2.1',
    awsSecurityHub: 'EC2.3',
    awsBestPractices: 'EC2-003',
    nist: 'PR.DS-1',
  },
  reference: 'AWS Security Hub EC2.3 — Attached Amazon EBS volumes should be encrypted',
  docLink: 'https://docs.aws.amazon.com/securityhub/latest/userguide/ec2-controls.html#ec2-3',

  /**
   * Check if the resource violates the policy
   * Detection Logic: Check the Encrypted property of every EBS volume. If Encrypted == false, the resource is NON_COMPLIANT.
   * @param {Object} resource Mongoose Resource document
   * @returns {Boolean} true if violation is found (fail), false otherwise (pass)
   */
  check: (resource) => {
    // Resource Scope: All EBS volumes, including volumes attached to EC2 instances
    if (resource.cloudProvider && resource.cloudProvider !== 'AWS') {
      return false;
    }
    if (resource.service !== 'EBS' && resource.type !== 'Volume') {
      return false;
    }

    const tags = resource.tags || {};
    const getTag = (key) => typeof tags.get === 'function' ? tags.get(key) : tags[key];

    const isEncrypted = getTag('Encrypted') === 'enabled' || getTag('Encrypted') === 'true' || getTag('Encrypted') === true;
    if (isEncrypted) {
      return false;
    }

    // Pass if account-level EBS encryption by default is enforced across region
    const isAccountDefault = getTag('AccountEbsEncryptionByDefault') === 'true' || getTag('AccountEbsEncryptionByDefault') === true;
    if (isAccountDefault) {
      return false;
    }

    return true;
  },
};
