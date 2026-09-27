/**
 * Rule: SSH exposed to the internet
 * Rule ID: EC2_SG_SSH_OPEN_TO_WORLD
 * 
 * Condition:
 * IF
 *     SecurityGroup.InboundRules
 *     contains
 *         Protocol = TCP (or all / -1)
 *         AND Port = 22 (from_port <= 22 <= to_port)
 *         AND Source = 0.0.0.0/0 (or ::/0)
 * THEN
 *     Finding = "SSH port 22 is open to the internet"
 *     Severity = HIGH
 */
module.exports = {
  id: 'EC2_SG_SSH_OPEN_TO_WORLD',
  title: 'SSH port 22 is open to the internet',
  service: 'Security Groups',
  resource: 'EC2 Security Group',
  severity: 'High',
  description: 'The EC2 Security Group inbound rules permit unrestricted TCP traffic on port 22 (SSH) from 0.0.0.0/0 (or ::/0), leaving administrative remote access exposed to internet-wide brute-force attempts.',
  recommendation: 'Restrict SSH to trusted IP/CIDR or use a private access mechanism',
  remediation: 'Restrict SSH to trusted IP/CIDR or use a private access mechanism (such as AWS Systems Manager Session Manager or EC2 Instance Connect).',
  complianceMapping: {
    cisAWS: '4.1',
    awsBestPractices: 'EC2-008',
    nist: 'PR.PT-4',
  },
  docLink: 'https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/authorizing-access-to-an-instance.html',

  /**
   * Check if the resource violates the policy
   * Evaluates SecurityGroup inbound rules directly (IpPermissions)
   * Does NOT treat Public IPv4 address alone as a misconfiguration.
   * @param {Object} resource Mongoose Resource document
   * @returns {Boolean} true if violation is found (fail), false otherwise (pass)
   */
  check: (resource) => {
    // Only evaluate AWS Security Groups
    if (resource.cloudProvider && resource.cloudProvider !== 'AWS') {
      return false;
    }

    if (resource.service !== 'Security Groups' && resource.type !== 'SecurityGroup') {
      return false;
    }

    const tags = resource.tags || {};
    const getTag = (key) => typeof tags.get === 'function' ? tags.get(key) : tags[key];

    // 1. Evaluate raw InboundRules (IpPermissions) from AWS EC2 API
    const rawInboundRules = getTag('InboundRules') || getTag('IpPermissions');
    if (rawInboundRules) {
      try {
        const rules = typeof rawInboundRules === 'string' ? JSON.parse(rawInboundRules) : rawInboundRules;
        if (Array.isArray(rules)) {
          for (const rule of rules) {
            const protocol = (rule.IpProtocol || '').toLowerCase();
            const isTcp = protocol === 'tcp' || protocol === '-1'; // -1 represents all protocols

            const fromPort = rule.FromPort;
            const toPort = rule.ToPort;

            // Port 22 check: either all traffic (-1) or from_port <= 22 <= to_port
            const matchesPort22 = protocol === '-1' || (fromPort <= 22 && toPort >= 22);

            const ipRanges = rule.IpRanges || [];
            const ipv6Ranges = rule.Ipv6Ranges || [];

            // Check if source CIDR allows global public traffic (0.0.0.0/0 or ::/0)
            const isCidrOpenToWorld = ipRanges.some((range) => range.CidrIp === '0.0.0.0/0') ||
                                     ipv6Ranges.some((range) => range.CidrIpv6 === '::/0');

            if (isTcp && matchesPort22 && isCidrOpenToWorld) {
              return true;
            }
          }
          // If parsed rules exist and none violated, it is compliant
          return false;
        }
      } catch (err) {
        console.warn(`[Rule EC2_SG_SSH_OPEN_TO_WORLD] Error parsing InboundRules: ${err.message}`);
      }
    }

    // 2. Fallback check for OpenSSH tag populated by securityGroupScanner
    return getTag('OpenSSH') === 'true';
  },
};
