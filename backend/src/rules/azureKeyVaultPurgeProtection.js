/**
 * CIS Microsoft Azure Foundations Benchmark 8.4 - Ensure Azure Key Vault Soft-Delete and Purge Protection are Enabled
 */
module.exports = {
  id: 'CL-AZ-12',
  title: 'Azure Key Vault Soft-Delete or Purge Protection Disabled',
  service: 'KeyVault',
  severity: 'High',
  description: 'The Azure Key Vault does not have Purge Protection enabled, allowing immediate permanent deletion of critical encryption keys, secrets, and certificates without a retention recovery window.',
  remediation: 'In Azure Portal ➔ Key Vaults ➔ Select Vault ➔ Properties, enable "Purge protection" to ensure deleted keys cannot be permanently purged during retention.',
  complianceMapping: {
    cisAzure: '8.4',
    nist: 'SC-12'
  },
  docLink: 'https://learn.microsoft.com/en-us/azure/key-vault/general/soft-delete-overview',

  check: (resource) => {
    if (resource.cloudProvider !== 'AZURE' || resource.service !== 'KeyVault') {
      return false;
    }
    const tags = resource.tags || {};
    const softDelete = typeof tags.get === 'function' ? tags.get('EnableSoftDelete') : tags.EnableSoftDelete;
    const purgeProtection = typeof tags.get === 'function' ? tags.get('EnablePurgeProtection') : tags.EnablePurgeProtection;

    return softDelete === 'false' || purgeProtection === 'false' || !purgeProtection;
  }
};
