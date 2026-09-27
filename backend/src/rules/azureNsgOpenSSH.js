/**
 * CIS Microsoft Azure Foundations Benchmark 6.1 - Ensure Network Security Group Inbound SSH is Restricted
 */
module.exports = {
  id: 'CL-AZ-02',
  title: 'Network Security Group (NSG) Inbound SSH Port 22 Open to Any (*)',
  service: 'NSG',
  severity: 'Critical',
  description: 'Azure NSG Inbound Security Rule permits SSH traffic on Port 22 from any source IP (*), exposing Azure VMs to unauthorized remote access and brute-force attacks.',
  remediation: 'In Azure Portal ➔ Network Security Groups ➔ Select NSG ➔ Settings ➔ Inbound security rules. Edit the rule and change Source from Any/* to IP Addresses with authorized CIDR, or set Action to Deny.',
  recommendation: 'In Azure Portal ➔ Network Security Groups ➔ Select NSG ➔ Settings ➔ Inbound security rules. Edit the rule and change Source from Any/* to IP Addresses with authorized CIDR, or set Action to Deny.',
  complianceMapping: {
    cisAzure: '6.1',
    nist: 'PR.AC-5'
  },
  docLink: 'https://learn.microsoft.com/en-us/azure/virtual-network/network-security-groups-overview',
  
  check: (resource) => {
    if (resource.cloudProvider !== 'AZURE' || resource.service !== 'NSG') {
      return false;
    }
    const port = resource.tags?.DestinationPortRange;
    const sourcePrefix = resource.tags?.SourceAddressPrefix;
    const access = resource.tags?.Access;

    return port === '22' && sourcePrefix === '*' && access === 'Allow';
  }
};
