module.exports = {
  id: 'CL-S3-02',
  title: 'S3 Default Bucket Encryption Disabled',
  description: 'The S3 bucket does not have default server-side encryption enabled to encrypt data at rest.',
  severity: 'High',
  deduction: 10,
  recommendation: 'Enable default SSE-S3 or SSE-KMS encryption in the bucket configuration properties.',
  complianceMapping: {
    cisAWS: '2.1.2',
    awsBestPractices: 'S3-004',
    nist: 'PR.DS-1',
  },
  docLink: 'https://docs.aws.amazon.com/AmazonS3/latest/userguide/bucket-encryption.html',
  
  /**
   * Check if the resource violates the policy
   * @param {Object} resource Mongoose Resource document
   * @returns {Boolean} true if violation is found (fail), false otherwise (pass)
   */
  check: (resource) => {
    return resource.service === 'S3' && resource.tags.get('Encryption') === 'disabled';
  },
};
