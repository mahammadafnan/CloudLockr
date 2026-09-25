/**
 * CIS GCP Foundations Benchmark 5.2 - Ensure Storage Bucket Access Logging is Enabled
 */
module.exports = {
  id: 'CL-GCP-05',
  title: 'Google Cloud Storage Access Logging Disabled',
  service: 'GCS',
  severity: 'Medium',
  description: 'GCS bucket access logging is disabled, preventing audit logging for object access, modifications, and data exfiltration attempts.',
  remediation: 'In GCP Storage Console ➔ Bucket Details ➔ Configuration, enable Access Logging and specify a designated log storage bucket.',
  complianceMapping: {
    cisGCP: '5.2',
    nist: 'AU-2'
  },
  docLink: 'https://cloud.google.com/storage/docs/access-logs',
  
  check: (resource) => {
    if (resource.cloudProvider !== 'GCP' || resource.service !== 'GCS') {
      return false;
    }
    const tags = resource.tags || {};
    const logging = typeof tags.get === 'function' ? tags.get('Logging') : tags.Logging;

    return logging === 'disabled';
  }
};
