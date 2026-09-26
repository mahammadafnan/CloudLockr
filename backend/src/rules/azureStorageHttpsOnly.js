/**
 * CIS Microsoft Azure Foundations Benchmark 3.2 - Ensure 'Secure transfer required' is set to 'Enabled'
 */
module.exports = {
  id: 'CL-AZ-04',
  title: 'Azure Storage Account Secure Transfer (HTTPS) Disabled',
  service: 'StorageAccount',
  severity: 'High',
  description: 'The "Secure transfer required" feature is disabled on the Azure Storage account, allowing insecure HTTP connections that can expose storage data to eavesdropping or man-in-the-middle attacks.',
  remediation: 'In Azure Portal ➔ Storage Accounts ➔ Configuration, enable "Secure transfer required" (supportsHttpsTrafficOnly: true).',
  complianceMapping: {
    cisAzure: '3.2',
    nist: 'SC-8'
  },
  docLink: 'https://learn.microsoft.com/en-us/azure/storage/common/storage-require-secure-transfer',

  check: (resource) => {
    if (resource.cloudProvider !== 'AZURE' || resource.type !== 'StorageAccount') {
      return false;
    }
    const tags = resource.tags || {};
    const httpsOnly = typeof tags.get === 'function' ? tags.get('HTTPSOnly') : tags.HTTPSOnly;

    return httpsOnly === 'false' || httpsOnly === 'disabled';
  }
};
