/**
 * CIS Microsoft Azure Foundations Benchmark 8.7 - Ensure Key Vault Public Network Access is Disabled
 */
module.exports = {
  id: 'CL-AZ-13',
  title: 'Azure Key Vault Public Network Access Enabled',
  service: 'KeyVault',
  severity: 'High',
  description: 'The Azure Key Vault permits incoming traffic from public IP addresses or all networks, exposing cryptographic keys and secrets endpoints to internet-based traffic rather than restricting to Private Endpoints.',
  remediation: 'In Azure Portal ➔ Key Vaults ➔ Select Vault ➔ Networking, set "Allow access from" to "Disabled" and connect applications via Private Endpoints.',
  complianceMapping: {
    cisAzure: '8.7',
    nist: 'SC-7'
  },
  docLink: 'https://learn.microsoft.com/en-us/azure/key-vault/general/network-security',

  check: (resource) => {
    if (resource.cloudProvider !== 'AZURE' || resource.service !== 'KeyVault') {
      return false;
    }
    const tags = resource.tags || {};
    const netAccess = typeof tags.get === 'function' ? tags.get('PublicNetworkAccess') : tags.PublicNetworkAccess;

    return netAccess === 'Enabled' || netAccess === 'allNetworks';
  }
};
