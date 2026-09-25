/**
 * CIS GCP Foundations Benchmark 5.2 - Ensure Uniform Bucket-Level Access is Enabled on Cloud Storage Buckets
 */
module.exports = {
  id: 'CL-GCP-09',
  title: 'GCS Bucket Uniform Bucket-Level Access Disabled',
  service: 'GCS',
  severity: 'High',
  description: 'Uniform bucket-level access is disabled on the GCS bucket. Fine-grained Object ACLs are permitted, increasing the risk of unauthorized object exposure.',
  remediation: 'In GCP Console ➔ Cloud Storage ➔ Buckets ➔ Select Bucket ➔ Permissions, enable "Uniform" bucket-level access.',
  complianceMapping: {
    cisGCP: '5.2',
    nist: 'PR.AC-3'
  },
  docLink: 'https://cloud.google.com/storage/docs/uniform-bucket-level-access',

  check: (resource) => {
    if (resource.cloudProvider !== 'GCP' || resource.service !== 'GCS') {
      return false;
    }
    const tags = resource.tags || {};
    const uniform = typeof tags.get === 'function' ? tags.get('UniformBucketLevelAccess') : tags.UniformBucketLevelAccess;

    return uniform === 'disabled' || uniform === 'false';
  }
};
