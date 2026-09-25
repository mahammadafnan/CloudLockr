/**
 * CIS GCP Foundations Benchmark 1.1 - Ensure 2-Step Verification (MFA) is Enforced for All Administrative Users
 */
module.exports = {
  id: 'CL-GCP-15',
  title: 'GCP User Account Missing 2-Step Verification / MFA Enforcement',
  service: 'IAM',
  severity: 'High',
  description: 'User account has access to Google Cloud Platform Console without mandatory 2-Step Verification (MFA) enabled, exposing credentials to credential stuffing or phishing attacks.',
  remediation: 'In Google Workspace / Cloud Identity Admin Console ➔ Security ➔ 2-Step Verification, turn on enforcement for all organizational users.',
  complianceMapping: {
    cisGCP: '1.1',
    nist: 'IA-2(1)'
  },
  docLink: 'https://support.google.com/a/answer/175197',

  check: (resource) => {
    if (resource.cloudProvider !== 'GCP' || resource.service !== 'IAM' || resource.type !== 'User') {
      return false;
    }
    const tags = resource.tags || {};
    const mfa = typeof tags.get === 'function' ? tags.get('MFA') : tags.MFA;

    return mfa === 'disabled' || mfa === 'false' || !mfa;
  }
};
