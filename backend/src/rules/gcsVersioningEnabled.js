/**
 * CIS GCP Foundations Benchmark 5.3 - Ensure Object Versioning is Enabled on GCS Storage Buckets
 */
module.exports = {
  id: 'CL-GCP-06',
  title: 'Google Cloud Storage Object Versioning Disabled',
  service: 'GCS',
  severity: 'Low',
  description: 'GCS bucket Object Versioning is disabled, making objects vulnerable to irreversible accidental deletion or ransomware overwrites.',
  remediation: 'In GCP Storage Console ➔ Bucket Details ➔ Protection, enable Object Versioning to maintain object history.',
  complianceMapping: {
    cisGCP: '5.3',
    nist: 'SI-12'
  },
  docLink: 'https://cloud.google.com/storage/docs/object-versioning',
  
  check: (resource) => {
    if (resource.cloudProvider !== 'GCP' || resource.service !== 'GCS') {
      return false;
    }
    const tags = resource.tags || {};
    const versioning = typeof tags.get === 'function' ? tags.get('Versioning') : tags.Versioning;

    return versioning === 'disabled';
  }
};
