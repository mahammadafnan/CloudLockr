/**
 * CIS GCP Foundations Benchmark 1.5 - Ensure Service Account Admin and Service Account User Roles Are Restricted
 */
module.exports = {
  id: 'CL-GCP-17',
  title: 'GCP Service Account Granted Service Account Admin Role',
  service: 'IAM',
  severity: 'High',
  description: 'Service account is assigned Service Account Admin (roles/iam.serviceAccountAdmin) or Service Account User (roles/iam.serviceAccountUser) permissions, enabling privilege escalation across project service accounts.',
  remediation: 'In GCP Console ➔ IAM & Admin ➔ IAM, remove Service Account Admin roles from service accounts and grant to human administrators only.',
  complianceMapping: {
    cisGCP: '1.5',
    nist: 'PR.AC-6'
  },
  docLink: 'https://cloud.google.com/iam/docs/service-accounts-actas',

  check: (resource) => {
    if (resource.cloudProvider !== 'GCP' || resource.service !== 'IAM') {
      return false;
    }
    const tags = resource.tags || {};
    const role = typeof tags.get === 'function' ? tags.get('Role') : tags.Role;

    return role === 'roles/iam.serviceAccountAdmin' || role === 'roles/iam.serviceAccountUser';
  }
};
