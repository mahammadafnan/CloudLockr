/**
 * CIS GCP Foundations Benchmark 5.1 - Ensure Storage Buckets are not Publicly Accessible
 */
module.exports = {
  id: 'CL-GCP-01',
  title: 'Google Cloud Storage (GCS) Bucket Publicly Accessible',
  service: 'GCS',
  severity: 'Critical',
  description: 'GCS bucket has Public Access set to allUsers or Uniform Bucket-Level Access disabled, exposing sensitive bucket assets publicly.',
  remediation: 'Enable Uniform Bucket-Level Access in GCP Storage console and remove allUsers / allAuthenticatedUsers permissions from the IAM policy.',
  complianceMapping: {
    cisGCP: '5.1',
    nist: 'PR.AC-3'
  },
  docLink: 'https://cloud.google.com/storage/docs/access-control/iam',
  
  check: (resource) => {
    if (resource.cloudProvider !== 'GCP' || resource.service !== 'GCS') {
      return false;
    }
    const tags = resource.tags || {};
    const publicAccess = typeof tags.get === 'function' ? tags.get('PublicAccess') : tags.PublicAccess;
    const uniformAccess = typeof tags.get === 'function' ? tags.get('UniformBucketLevelAccess') : tags.UniformBucketLevelAccess;

    return publicAccess === 'allUsers' || uniformAccess === 'disabled' || resource.status === 'public';
  }
};
