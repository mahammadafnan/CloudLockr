/**
 * CIS Microsoft Azure Foundations Benchmark 3.6 - Ensure Default Network Access Rule for Storage Accounts is Set to Deny
 */
module.exports = {
  id: 'CL-AZ-06',
  title: 'Azure Storage Account Public Network Access Enabled from All Networks',
  service: 'StorageAccount',
  severity: 'High',
  description: 'The Azure Storage Account has Public Network Access set to "Enabled from all networks", allowing direct internet access to storage endpoints rather than enforcing Private Endpoints or selected Virtual Networks.',
  remediation: 'In Azure Portal ➔ Storage Accounts ➔ Networking, set Public Network Access to "Disabled" or "Enabled from selected virtual networks and IP addresses".',
  complianceMapping: {
    cisAzure: '3.6',
    nist: 'SC-7'
  },
  docLink: 'https://learn.microsoft.com/en-us/azure/storage/common/storage-network-security',

  check: (resource) => {
    if (resource.cloudProvider !== 'AZURE' || resource.type !== 'StorageAccount') {
      return false;
    }
    const tags = resource.tags || {};
    const netAccess = typeof tags.get === 'function' ? tags.get('PublicNetworkAccess') : tags.PublicNetworkAccess;

    return netAccess === 'allNetworks' || netAccess === 'Enabled';
  }
};
