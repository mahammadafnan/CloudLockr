/**
 * CIS Microsoft Azure Foundations Benchmark 6.3 - Ensure Inbound All Ports Rule is Restricted
 */
module.exports = {
  id: 'CL-AZ-09',
  title: 'Network Security Group Inbound Traffic Fully Open on All Ports (*)',
  service: 'NSG',
  severity: 'Critical',
  description: 'Azure NSG rule permits unrestricted inbound traffic across all destination ports (*) from any source address (*), completely disabling network filtering.',
  remediation: 'In Azure Portal ➔ Network Security Groups ➔ Inbound Security Rules, remove any rule specifying destination port "*" and source "*", replacing it with explicit least-privilege rules.',
  complianceMapping: {
    cisAzure: '6.3',
    nist: 'SC-7'
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

    const isAllPorts = port === '*' || port === 'any' || port === '0-65535';
    const isOpen = sourcePrefix === '*' || sourcePrefix === 'Internet' || sourcePrefix === '0.0.0.0/0';

    return isAllPorts && isOpen && access === 'Allow';
  }
};
