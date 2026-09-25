/**
 * CIS GCP Foundations Benchmark 4.2 - Ensure GCE Compute Engine Disks are Encrypted with CMEK
 */
module.exports = {
  id: 'CL-GCP-11',
  title: 'GCE Persistent Disk Missing Customer-Managed Encryption Key (CMEK)',
  service: 'GCE',
  severity: 'Medium',
  description: 'Compute Engine persistent disk is encrypted with default Google-managed keys rather than Customer-Managed Encryption Keys (CMEK).',
  remediation: 'When creating GCE VM instances or disks, select "Customer-managed key (CMEK)" under Security/Disks settings in GCP Console.',
  complianceMapping: {
    cisGCP: '4.2',
    nist: 'SC-13'
  },
  docLink: 'https://cloud.google.com/compute/docs/disks/customer-managed-encryption',

  check: (resource) => {
    if (resource.cloudProvider !== 'GCP' || resource.service !== 'GCE' || resource.type !== 'Disk') {
      return false;
    }
    const tags = resource.tags || {};
    const enc = typeof tags.get === 'function' ? tags.get('Encryption') : tags.Encryption;

    return !enc || enc === 'Google-managed' || enc === 'unencrypted';
  }
};
