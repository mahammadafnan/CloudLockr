/**
 * CIS GCP Foundations Benchmark 5.1 - Ensure Storage Buckets Do Not Grant Storage Admin / Object Admin to Public Users (allUsers / allAuthenticatedUsers)
 */
module.exports = {
  id: 'CL-GCP-04',
  title: 'GCS Bucket Public Full Administrative Privileges Granted',
  service: 'GCS',
  severity: 'Critical',
  description: 'GCS bucket grants Full Administrative privileges (roles/storage.admin or roles/storage.objectAdmin) to anonymous public internet users (allUsers or allAuthenticatedUsers).',
  remediation: 'In GCP Storage Console ➔ Bucket Permissions, remove allUsers and allAuthenticatedUsers from roles/storage.admin or roles/storage.objectAdmin roles immediately.',
  complianceMapping: {
    cisGCP: '5.1',
    nist: 'PR.AC-6'
  },
  docLink: 'https://cloud.google.com/storage/docs/access-control/iam-roles',
  
  check: (resource) => {
    if (resource.cloudProvider !== 'GCP' || resource.service !== 'GCS') {
      return false;
    }
    const tags = resource.tags || {};
    const publicRole = typeof tags.get === 'function' ? tags.get('PublicRole') : tags.PublicRole;

    return publicRole === 'roles/storage.admin' || publicRole === 'roles/storage.objectAdmin';
  }
};
