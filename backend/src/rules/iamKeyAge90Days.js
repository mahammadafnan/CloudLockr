module.exports = {
  id: 'CL-IAM-02',
  title: 'Programmatic Access Keys Older Than 90 Days',
  description: 'An IAM user account has an active access key that has not been rotated in over 90 days, increasing key compromise risk.',
  severity: 'Low',
  deduction: 2,
  recommendation: 'Rotate active API credentials regularly. Inactivate keys older than 90 days and replace them with fresh key pairs.',
  complianceMapping: {
    cisAWS: '1.4',
    awsBestPractices: 'IAM-004',
    nist: 'PR.AC-1',
  },
  docLink: 'https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_access-keys.html',
  
  /**
   * Check if the resource violates the policy
   * @param {Object} resource Mongoose Resource document
   * @returns {Boolean} true if violation is found (fail), false otherwise (pass)
   */
  check: (resource) => {
    return resource.service === 'IAM' && resource.tags.get('AccessKeysCompliant') === 'false';
  },
};
