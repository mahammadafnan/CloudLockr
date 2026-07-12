module.exports = {
  id: 'CL-EC2-03',
  title: 'EBS Volume Encryption Disabled',
  description: 'An EBS storage volume was found configured in an unencrypted state, exposing static data to potential leaks.',
  severity: 'High',
  deduction: 10,
  recommendation: 'Configure encryption parameters when launching volumes, or copy the volume to an encrypted snapshot.',
  complianceMapping: {
    cisAWS: '2.2.1',
    awsBestPractices: 'EC2-003',
    nist: 'PR.DS-1',
  },
  docLink: 'https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/EBSEncryption.html',
  
  /**
   * Check if the resource violates the policy
   * @param {Object} resource Mongoose Resource document
   * @returns {Boolean} true if violation is found (fail), false otherwise (pass)
   */
  check: (resource) => {
    return resource.service === 'EBS' && resource.tags.get('Encrypted') === 'disabled';
  },
};
