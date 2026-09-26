/**
 * CIS GCP Foundations Benchmark 1.4 - Ensure Service Accounts Do Not Have Primitive Admin Roles (roles/owner or roles/editor)
 */
module.exports = {
  id: 'CL-GCP-03',
  title: 'GCP Service Account Granted Overly Permissive Admin Privileges',
  service: 'IAM',
  severity: 'High',
  description: 'Service Account is granted Primitive Admin Roles (roles/owner or roles/editor), granting unrestricted control across Google Cloud project resources.',
  remediation: 'In GCP IAM Console ➔ IAM & Admin ➔ IAM, remove primitive roles (Owner/Editor) and assign granular least-privilege roles (e.g. Storage Admin, Viewer).',
  complianceMapping: {
    cisGCP: '1.4',
    nist: 'PR.AC-6'
  },
  docLink: 'https://cloud.google.com/iam/docs/understanding-roles',
  
  check: (resource) => {
    if (resource.cloudProvider !== 'GCP' || resource.service !== 'IAM') {
      return false;
    }
    const tags = resource.tags || {};
    const role = typeof tags.get === 'function' ? tags.get('Role') : tags.Role;

    return role === 'roles/owner' || role === 'roles/editor';
  }
};
