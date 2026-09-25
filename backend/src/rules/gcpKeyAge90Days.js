/**
 * CIS GCP Foundations Benchmark 1.7 - Ensure Service Account Keys Are Rotated Every 90 Days or Less
 */
module.exports = {
  id: 'CL-GCP-14',
  title: 'GCP Service Account Access Key Exceeds 90 Days Without Rotation',
  service: 'IAM',
  severity: 'Medium',
  description: 'Service account credentials contain a user-managed key older than 90 days. Unrotated access keys increase risk of credential exposure or compromised access.',
  remediation: 'In GCP IAM ➔ Service Accounts ➔ Select Account ➔ Keys ➔ Delete old key and generate a fresh key or migrate to Workload Identity Federation.',
  complianceMapping: {
    cisGCP: '1.7',
    nist: 'IA-5'
  },
  docLink: 'https://cloud.google.com/iam/docs/creating-managing-service-account-keys',

  check: (resource) => {
    if (resource.cloudProvider !== 'GCP' || resource.service !== 'IAM') {
      return false;
    }
    const tags = resource.tags || {};
    const keyAge = typeof tags.get === 'function' ? tags.get('KeyAgeDays') : tags.KeyAgeDays;
    const hasUserManagedKey = typeof tags.get === 'function' ? tags.get('HasUserManagedKey') : tags.HasUserManagedKey;

    const age = parseInt(keyAge || '0', 10);
    return age > 90 || (hasUserManagedKey === 'true' && age > 90);
  }
};
