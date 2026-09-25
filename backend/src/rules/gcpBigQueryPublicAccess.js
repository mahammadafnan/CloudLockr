/**
 * CIS GCP Foundations Benchmark 7.1 - Ensure BigQuery Datasets Are Not Publicly Accessible
 */
module.exports = {
  id: 'CL-GCP-21',
  title: 'GCP BigQuery Dataset Accessible to Public (allUsers)',
  service: 'BigQuery',
  severity: 'Critical',
  description: 'BigQuery dataset permissions grant reader or admin roles to "allUsers" or "allAuthenticatedUsers", exposing proprietary database tables and analytics data publicly.',
  remediation: 'In GCP Console ➔ BigQuery ➔ Select Dataset ➔ Sharing ➔ Edit Permissions, revoke access for allUsers and allAuthenticatedUsers.',
  complianceMapping: {
    cisGCP: '7.1',
    nist: 'AC-3'
  },
  docLink: 'https://cloud.google.com/bigquery/docs/dataset-access-controls',

  check: (resource) => {
    if (resource.cloudProvider !== 'GCP' || resource.service !== 'BigQuery') {
      return false;
    }
    const tags = resource.tags || {};
    const access = typeof tags.get === 'function' ? tags.get('PublicAccess') : tags.PublicAccess;

    return access === 'allUsers' || access === 'allAuthenticatedUsers' || resource.status === 'public';
  }
};
