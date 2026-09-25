/**
 * CIS GCP Foundations Benchmark 5.3 - Ensure Google Cloud Storage Buckets use Customer-Managed Encryption Keys (CMEK)
 */
module.exports = {
  id: 'CL-GCP-08',
  title: 'GCS Bucket Missing Customer-Managed Encryption Key (CMEK)',
  service: 'GCS',
  severity: 'Medium',
  description: 'GCS bucket is relying on default Google-managed encryption keys instead of Customer-Managed Encryption Keys (CMEK) managed via Cloud KMS.',
  remediation: 'In Google Cloud Console ➔ Cloud Storage ➔ Select Bucket ➔ Configuration ➔ Encryption, select "Use a customer-managed key (CMEK)" and specify a Cloud KMS key ARN.',
  complianceMapping: {
    cisGCP: '5.3',
    nist: 'SC-13'
  },
  docLink: 'https://cloud.google.com/storage/docs/encryption/customer-managed-keys',

  check: (resource) => {
    if (resource.cloudProvider !== 'GCP' || resource.service !== 'GCS') {
      return false;
    }
    const tags = resource.tags || {};
    const enc = typeof tags.get === 'function' ? tags.get('Encryption') : tags.Encryption;

    return !enc || enc === 'Google-managed' || enc === 'none';
  }
};
