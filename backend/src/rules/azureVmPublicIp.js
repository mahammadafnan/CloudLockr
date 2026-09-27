/**
 * CIS Microsoft Azure Foundations Benchmark 6.4 - Ensure Azure Virtual Machines Do Not Have Direct Public IP Addresses
 */
module.exports = {
  id: 'CL-AZ-10',
  title: 'Azure Virtual Machine Configured with Direct Public IP Address',
  service: 'VirtualMachine',
  severity: 'High',
  description: 'The Azure Virtual Machine has a Public IP address directly bound to its network interface, exposing the host directly to internet reconnaissance and threats rather than fronting it with Azure Bastion or Application Gateway.',
  remediation: 'In Azure Portal ➔ Virtual Machines ➔ Select VM ➔ Network settings ➔ click the Network Interface link ➔ under Settings click IP configurations ➔ click ipconfig1 ➔ set Public IP address to Disassociate (None).',
  recommendation: 'In Azure Portal ➔ Virtual Machines ➔ Select VM ➔ Network settings ➔ click the Network Interface link ➔ under Settings click IP configurations ➔ click ipconfig1 ➔ set Public IP address to Disassociate (None).',
  complianceMapping: {
    cisAzure: '6.4',
    nist: 'SC-7'
  },
  docLink: 'https://learn.microsoft.com/en-us/azure/virtual-network/ip-services/public-ip-addresses',

  check: (resource) => {
    if (resource.cloudProvider !== 'AZURE' || resource.service !== 'VirtualMachine') {
      return false;
    }
    const tags = resource.tags || {};
    const publicIp = typeof tags.get === 'function' ? tags.get('PublicIP') : tags.PublicIP;

    return Boolean(publicIp && publicIp !== 'none' && publicIp !== 'null' && publicIp !== 'disabled');
  }
};
