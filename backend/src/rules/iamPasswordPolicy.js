module.exports = {
  id: 'CL-IAM-04',
  title: 'IAM Password Policy Minimum Length Less Than 14',
  description: 'The AWS account password policy does not enforce a minimum password length of 14 characters.',
  severity: 'Low',
  deduction: 1,
  recommendation: 'Update the IAM password policy to require a minimum length of 14 characters.',
  complianceMapping: {
    cisAWS: '1.8',
    awsBestPractices: 'IAM-005',
    nist: 'PR.AC-1',
  },
  docLink: 'https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_passwords_account-policy.html',
  
  /**
   * Check if the resource violates the policy
   * @param {Object} resource Mongoose Resource document
   * @returns {Boolean} true if violation is found (fail), false otherwise (pass)
   */
  check: (resource) => {
    if (resource.service === 'IAM' && resource.type === 'AccountPolicy') {
      const minLengthStr = resource.tags.get('MinimumPasswordLength');
      if (!minLengthStr) return true; // Fail if not set
      
      const minLength = parseInt(minLengthStr, 10);
      if (isNaN(minLength) || minLength < 14) {
        return true; // Fail if less than 14
      }
    }
    return false; // Pass
  },
};
