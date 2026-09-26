/**
 * CIS Microsoft Azure Foundations Benchmark 3.10 - Ensure Storage Accounts Use Customer-Managed Key (CMEK) for Encryption
 */
module.exports = {
  id: 'CL-AZ-07',
  title: 'Azure Storage Account Missing Customer-Managed Encryption Key (CMEK)',
  service: 'StorageAccount',
  severity: 'Medium',
  description: 'The Azure Storage Account relies solely on default Microsoft-managed keys rather than Customer-Managed Keys (CMEK) hosted inside an Azure Key Vault for enhanced key governance.',
  remediation: 'In Azure Portal ➔ Storage Accounts ➔ Encryption, choose "Customer-managed keys" and select a Key Vault key.',
  complianceMapping: {
    cisAzure: '3.10',
    nist: 'SC-13'
  },
  docLink: 'https://learn.microsoft.com/en-us/azure/storage/common/customer-managed-keys-overview',

  check: (resource) => {
    if (resource.cloudProvider !== 'AZURE' || resource.type !== 'StorageAccount') {
      return false;
    }
    const tags = resource.tags || {};
    const keySource = typeof tags.get === 'function' ? tags.get('EncryptionKeySource') : tags.EncryptionKeySource;

    return keySource !== 'Microsoft.Keyvault';
  }
};
