/**
 * CIS Microsoft Azure Foundations Benchmark 6.2 - Ensure Network Security Group Inbound RDP Port 3389 is Restricted
 */
module.exports = {
  id: 'CL-AZ-08',
  title: 'Network Security Group (NSG) Inbound RDP Port 3389 Open to Any (*)',
  service: 'NSG',
  severity: 'Critical',
  description: 'Azure Network Security Group allows inbound Remote Desktop Protocol (RDP Port 3389) from any internet source (*), exposing virtual machines to automated brute-force and remote compromise.',
  remediation: 'In Azure Portal ➔ Network Security Groups ➔ Select NSG ➔ Settings ➔ Inbound security rules. Edit the RDP rule and change Source from Any/* to IP Addresses with authorized CIDR, or set Action to Deny.',
  recommendation: 'In Azure Portal ➔ Network Security Groups ➔ Select NSG ➔ Settings ➔ Inbound security rules. Edit the RDP rule and change Source from Any/* to IP Addresses with authorized CIDR, or set Action to Deny.',
  complianceMapping: {
    cisAzure: '6.2',
    nist: 'PR.AC-5'
  },
  docLink: 'https://learn.microsoft.com/en-us/azure/virtual-network/network-security-groups-overview',

  check: (resource) => {
    if (resource.cloudProvider !== 'AZURE' || resource.service !== 'NSG') {
      return false;
    }
    const tags = resource.tags || {};
    const port = typeof tags.get === 'function' ? tags.get('DestinationPortRange') : tags.DestinationPortRange;
    const sourcePrefix = typeof tags.get === 'function' ? tags.get('SourceAddressPrefix') : tags.SourceAddressPrefix;
    const access = typeof tags.get === 'function' ? tags.get('Access') : tags.Access;

    const isRdp = port === '3389' || port === '*' || port === 'any';
    const isOpen = sourcePrefix === '*' || sourcePrefix === 'Internet' || sourcePrefix === '0.0.0.0/0';

    return isRdp && isOpen && access === 'Allow';
  }
};
