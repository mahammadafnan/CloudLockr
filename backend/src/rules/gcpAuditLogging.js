/**
 * CIS GCP Foundations Benchmark 2.1 - Ensure Cloud Audit Logging is Enabled Across All GCP Services
 */
module.exports = {
  id: 'CL-GCP-18',
  title: 'GCP Cloud Audit Logging Disabled Across Services',
  service: 'Logging',
  severity: 'High',
  description: 'Cloud Audit Logging (Admin Read, Data Write, Data Read) is not configured for all services, leaving API requests and data modifications unmonitored.',
  remediation: 'In GCP Console ➔ IAM & Admin ➔ Audit Logs, set log types to "Admin Read", "Data Read", and "Data Write" for all service integrations.',
  complianceMapping: {
    cisGCP: '2.1',
    nist: 'AU-2'
  },
  docLink: 'https://cloud.google.com/logging/docs/audit',

  check: (resource) => {
    if (resource.cloudProvider !== 'GCP' || (resource.service !== 'Logging' && resource.service !== 'AuditLog')) {
      return false;
    }
    const tags = resource.tags || {};
    const status = typeof tags.get === 'function' ? tags.get('AuditStatus') : tags.AuditStatus;

    return status === 'disabled' || status === 'incomplete' || resource.status === 'unconfigured';
  }
};
