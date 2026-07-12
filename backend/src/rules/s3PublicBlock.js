module.exports = {
  id: 'CL-S3-01',
  title: 'S3 Public Bucket Access Detected',
  description: 'The S3 bucket allows unrestricted public read/write access permissions to Anonymous principal identities.',
  severity: 'Critical',
  deduction: 20,
  recommendation: 'Modify S3 Bucket ACL policies and configure Block Public Access configurations on the bucket properties.',
  complianceMapping: {
    cisAWS: '2.1.1',
    awsBestPractices: 'S3-002',
    nist: 'PR.AC-4',
  },
  docLink: 'https://docs.aws.amazon.com/AmazonS3/latest/userguide/access-control-block-public-access.html',
  
  /**
   * Check if the resource violates the policy
   * @param {Object} resource Mongoose Resource document
   * @returns {Boolean} true if violation is found (fail), false otherwise (pass)
   */
  check: (resource) => {
    return resource.service === 'S3' && resource.status === 'public';
  },
};
