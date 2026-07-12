module.exports = {
  id: 'CL-EC2-02',
  title: 'Security Group RDP Port 3389 Open to Public',
  description: 'The security group rules permit direct inbound TCP traffic on Windows Remote Desktop port 3389 from the public IP scope 0.0.0.0/0.',
  severity: 'Critical',
  deduction: 20,
  recommendation: 'Edit the Security Group ingress rule list to allow RDP connections only from authorized developer workstation addresses.',
  complianceMapping: {
    cisAWS: '4.1',
    awsBestPractices: 'EC2-009',
    nist: 'PR.PT-4',
  },
  docLink: 'https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/authorizing-access-to-an-instance.html',
  
  /**
   * Check if the resource violates the policy
   * @param {Object} resource Mongoose Resource document
   * @returns {Boolean} true if violation is found (fail), false otherwise (pass)
   */
  check: (resource) => {
    return resource.service === 'Security Groups' && resource.tags.get('OpenRDP') === 'true';
  },
};
