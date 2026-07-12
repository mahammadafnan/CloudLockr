module.exports = {
  id: 'CL-EC2-01',
  title: 'Security Group SSH Port 22 Open to Public',
  description: 'The security group rules permit direct inbound TCP traffic on administrative port 22 from the public IP scope 0.0.0.0/0.',
  severity: 'Critical',
  deduction: 20,
  recommendation: 'Edit the Security Group ingress rule list to lock SSH traffic access down to specific enterprise VPN and bastion CIDR blocks.',
  complianceMapping: {
    cisAWS: '4.1',
    awsBestPractices: 'EC2-008',
    nist: 'PR.PT-4',
  },
  docLink: 'https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/authorizing-access-to-an-instance.html',
  
  /**
   * Check if the resource violates the policy
   * @param {Object} resource Mongoose Resource document
   * @returns {Boolean} true if violation is found (fail), false otherwise (pass)
   */
  check: (resource) => {
    return resource.service === 'Security Groups' && resource.tags.get('OpenSSH') === 'true';
  },
};
