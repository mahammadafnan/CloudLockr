/**
 * CIS Microsoft Azure Foundations Benchmark 3.8 - Ensure Storage Account Minimum TLS Version is set to 1.2
 */
module.exports = {
  id: 'CL-AZ-05',
  title: 'Azure Storage Account Minimum TLS Version Less Than 1.2',
  service: 'StorageAccount',
  severity: 'Medium',
  description: 'The Azure Storage account allows incoming client connections using legacy TLS 1.0 or TLS 1.1 protocols containing known cryptographic vulnerabilities.',
  remediation: 'In Azure Portal ➔ Storage Accounts ➔ Configuration, set "Minimum TLS version" to TLS 1.2.',
  complianceMapping: {
    cisAzure: '3.8',
    nist: 'SC-8(1)'
  },
  docLink: 'https://learn.microsoft.com/en-us/azure/storage/common/transport-layer-security-configure-minimum-version',

  check: (resource) => {
    if (resource.cloudProvider !== 'AZURE' || resource.type !== 'StorageAccount') {
      return false;
    }
    const tags = resource.tags || {};
    const minTls = typeof tags.get === 'function' ? tags.get('MinimumTlsVersion') : tags.MinimumTlsVersion;

    return Boolean(minTls && minTls !== 'TLS1_2' && minTls !== 'TLS1_3');
  }
};
