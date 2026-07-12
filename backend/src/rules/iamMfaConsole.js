module.exports = {
  id: 'CL-IAM-01',
  title: 'IAM User Console Login Lacks MFA Security',
  description: 'An IAM user account console login configuration exists without Multi-Factor Authentication token locks enabled.',
  severity: 'Medium',
  deduction: 5,
  recommendation: 'Activate Virtual MFA devices on user configurations to ensure dual-step authorization validations on login.',
  complianceMapping: {
    cisAWS: '1.2',
    awsBestPractices: 'IAM-002',
    nist: 'PR.AC-6',
  },
  docLink: 'https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_mfa.html',
  
  /**
   * Check if the resource violates the policy
   * @param {Object} resource Mongoose Resource document
   * @returns {Boolean} true if violation is found (fail), false otherwise (pass)
   */
  check: (resource) => {
    return (
      resource.service === 'IAM' &&
      resource.tags.get('ConsoleAccess') === 'enabled' &&
      resource.tags.get('MfaActive') === 'disabled'
    );
  },
};
