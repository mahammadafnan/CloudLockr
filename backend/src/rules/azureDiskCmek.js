/**
 * CIS Microsoft Azure Foundations Benchmark 7.1 - Ensure Azure Managed Disks are Encrypted with Customer-Managed Keys (CMEK)
 */
module.exports = {
  id: 'CL-AZ-11',
  title: 'Azure Managed Disk Missing Customer-Managed Key (CMEK) Encryption',
  service: 'Disk',
  severity: 'Medium',
  description: 'The Azure Managed Disk uses default Platform-Managed Keys (PMK) instead of Customer-Managed Keys (CMEK) via Disk Encryption Sets in Azure Key Vault.',
  remediation: 'In Azure Portal ➔ Disks ➔ Select Disk ➔ Configuration ➔ Encryption, select "Encryption at-rest with a customer-managed key" and specify a Disk Encryption Set.',
  complianceMapping: {
    cisAzure: '7.1',
    nist: 'SC-13'
  },
  docLink: 'https://learn.microsoft.com/en-us/azure/virtual-machines/disk-encryption',

  check: (resource) => {
    if (resource.cloudProvider !== 'AZURE' || resource.service !== 'Disk') {
      return false;
    }
    const tags = resource.tags || {};
    const encType = typeof tags.get === 'function' ? tags.get('EncryptionType') : tags.EncryptionType;

    return encType !== 'EncryptionAtRestWithCustomerKey';
  }
};
