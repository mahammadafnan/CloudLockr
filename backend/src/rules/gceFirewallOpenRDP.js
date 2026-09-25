/**
 * CIS GCP Foundations Benchmark 3.7 - Ensure VPC Firewall Rules Do Not Allow Unrestricted Ingress to RDP (Port 3389)
 */
module.exports = {
  id: 'CL-GCP-10',
  title: 'GCP VPC Firewall Ingress Allowed Open RDP (Port 3389) from 0.0.0.0/0',
  service: 'Firewall',
  severity: 'Critical',
  description: 'VPC Firewall Rule allows unrestricted ingress traffic on TCP Port 3389 (Remote Desktop Protocol) from any source IP (0.0.0.0/0).',
  remediation: 'In GCP Console ➔ VPC network ➔ Firewall, edit the rule to restrict source IP ranges to authorized bastion networks or delete the rule.',
  complianceMapping: {
    cisGCP: '3.7',
    nist: 'PR.AC-5'
  },
  docLink: 'https://cloud.google.com/vpc/docs/using-firewalls',

  check: (resource) => {
    if (resource.cloudProvider !== 'GCP' || (resource.service !== 'Firewall' && resource.service !== 'GCE')) {
      return false;
    }
    const tags = resource.tags || {};
    const port = typeof tags.get === 'function' ? tags.get('Port') : tags.Port;
    const source = typeof tags.get === 'function' ? tags.get('SourceRanges') : tags.SourceRanges;
    const action = typeof tags.get === 'function' ? tags.get('Action') : tags.Action;

    const isOpenRdp = (port === '3389' || port === 'any' || port === '*') &&
                      (source === '0.0.0.0/0' || source === '::/0') &&
                      (action === 'ALLOW' || !action);

    return isOpenRdp;
  }
};
