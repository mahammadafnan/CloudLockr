/**
 * CIS GCP Foundations Benchmark 1.13 - Avoid Creating User-Managed Service Account Keys
 */
module.exports = {
  id: 'CL-GCP-07',
  title: 'User-Managed Service Account Key Created for GCP Service Account',
  service: 'IAM',
  severity: 'High',
  description: 'A user-managed Service Account Key (JSON/P12) has been generated for a GCP Service Account. User-managed keys introduce severe credential leakage risks if stored in source repositories or local developer workstations.',
  remediation: 'In GCP Console ➔ IAM & Admin ➔ Service Accounts ➔ Keys, delete user-managed keys and use Workload Identity Federation or short-lived OAuth tokens instead.',
  complianceMapping: {
    cisGCP: '1.13',
    nist: 'IA-5'
  },
  docLink: 'https://cloud.google.com/iam/docs/creating-managing-service-account-keys',
  
  check: (resource) => {
    if (resource.cloudProvider !== 'GCP' || resource.service !== 'IAM') {
      return false;
    }
    const tags = resource.tags || {};
    const hasUserKey = typeof tags.get === 'function' ? tags.get('HasUserManagedKey') : tags.HasUserManagedKey;
    const isExposed = resource.status === 'exposed';

    return hasUserKey === 'true' || isExposed;
  }
};
