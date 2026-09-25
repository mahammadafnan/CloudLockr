/**
 * CIS GCP Foundations Benchmark 1.8 - Ensure Cloud KMS Encryption Keys Are Rotated Automatically Within 90 Days
 */
module.exports = {
  id: 'CL-GCP-22',
  title: 'GCP Cloud KMS Key Automatic Rotation Disabled',
  service: 'KMS',
  severity: 'Medium',
  description: 'Cloud KMS CryptoKey does not have an active automatic key rotation schedule configured within 90 days, increasing key lifetime risk.',
  remediation: 'In GCP Console ➔ Security ➔ Cryptographic Keys ➔ Select Key ➔ Edit Rotation Schedule, set rotation period to 90 days or less.',
  complianceMapping: {
    cisGCP: '1.8',
    nist: 'SC-12'
  },
  docLink: 'https://cloud.google.com/kms/docs/rotating-keys',

  check: (resource) => {
    if (resource.cloudProvider !== 'GCP' || resource.service !== 'KMS') {
      return false;
    }
    const tags = resource.tags || {};
    const autoRotate = typeof tags.get === 'function' ? tags.get('AutoRotate') : tags.AutoRotate;
    const periodDays = parseInt(typeof tags.get === 'function' ? tags.get('RotationPeriodDays') : tags.RotationPeriodDays || '0', 10);

    return autoRotate === 'disabled' || autoRotate === 'false' || periodDays > 90 || periodDays === 0;
  }
};
