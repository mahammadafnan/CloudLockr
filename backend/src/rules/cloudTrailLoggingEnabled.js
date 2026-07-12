module.exports = {
  id: 'CL-CT-01',
  title: 'CloudTrail Logging is Disabled',
  description: 'An audit trail configuration was found in a disabled state, leaving administrative events unchecked for tracking and correlation.',
  severity: 'High',
  deduction: 10,
  recommendation: 'Enable logging configurations on the specified trail instance to aggregate event logs in an S3 bucket.',
  complianceMapping: {
    cisAWS: '1.1',
    awsBestPractices: 'CT-001',
    nist: 'DE.AE-3',
  },
  docLink: 'https://docs.aws.amazon.com/awscloudtrail/latest/userguide/cloudtrail-user-guide.html',
  
  /**
   * Check if the resource violates the policy
   * @param {Object} resource Mongoose Resource document
   * @returns {Boolean} true if violation is found (fail), false otherwise (pass)
   */
  check: (resource) => {
    return resource.service === 'CloudTrail' && resource.status === 'disabled';
  },
};
