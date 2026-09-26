/**
 * CIS GCP Foundations Benchmark 3.6 - Ensure VPC Firewall Rules Do Not Allow Inbound SSH from 0.0.0.0/0
 */
module.exports = {
  id: 'CL-GCP-02',
  title: 'VPC Firewall Rule Allows Public Inbound SSH (Port 22)',
  service: 'Firewall',
  severity: 'Critical',
  description: 'VPC Ingress Firewall rule permits SSH traffic on Port 22 from any source IP (0.0.0.0/0), exposing Compute Engine instances to brute-force attacks.',
  remediation: 'Edit the VPC Firewall rule in GCP Console ➔ VPC Network ➔ Firewall. Restrict source IP ranges to authorized corporate CIDR blocks.',
  complianceMapping: {
    cisGCP: '3.6',
    nist: 'PR.AC-5'
  },
  docLink: 'https://cloud.google.com/vpc/docs/firewalls',
  
  check: (resource) => {
    if (resource.cloudProvider !== 'GCP' || (resource.service !== 'Firewall' && resource.service !== 'Security Groups')) {
      return false;
    }
    const tags = resource.tags || {};
    const port = typeof tags.get === 'function' ? tags.get('Port') : tags.Port;
    const sourceRanges = typeof tags.get === 'function' ? tags.get('SourceRanges') : tags.SourceRanges;
    const action = typeof tags.get === 'function' ? tags.get('Action') : tags.Action;
    const direction = typeof tags.get === 'function' ? tags.get('Direction') : tags.Direction;

    const isIngress = !direction || direction === 'INGRESS' || direction === 'Inbound';
    const isAllow = !action || action === 'ALLOW' || action === 'Allow';
    const isPublic = sourceRanges === '0.0.0.0/0' || (typeof sourceRanges === 'string' && sourceRanges.includes('0.0.0.0/0'));
    const isPort22 = port === '22' || (typeof port === 'string' && (port.includes('22') || port === '0-65535' || port === '*'));

    const protocols = typeof tags.get === 'function' ? tags.get('Protocols') : tags.Protocols;
    const isTcp = !protocols || protocols.toLowerCase().includes('tcp') || protocols.toLowerCase().includes('all');

    return isIngress && isAllow && isPublic && isPort22 && isTcp;
  }
};
