/**
 * CIS Microsoft Azure Foundations Benchmark 4.2 - Ensure Transparent Data Encryption (TDE) on SQL Databases is Enabled
 */
module.exports = {
  id: 'CL-AZ-15',
  title: 'Azure SQL Database Transparent Data Encryption (TDE) Disabled',
  service: 'SQLDatabase',
  severity: 'High',
  description: 'Transparent Data Encryption (TDE) is disabled on the Azure SQL database, leaving data files, log files, and backups unencrypted at rest.',
  remediation: 'In Azure Portal ➔ SQL databases ➔ Select Database ➔ Transparent data encryption, set Data encryption to "Enabled".',
  complianceMapping: {
    cisAzure: '4.2',
    nist: 'SC-28'
  },
  docLink: 'https://learn.microsoft.com/en-us/azure/azure-sql/database/transparent-data-encryption-tde-overview',

  check: (resource) => {
    if (resource.cloudProvider !== 'AZURE' || resource.service !== 'SQLDatabase') {
      return false;
    }
    const tags = resource.tags || {};
    const tde = typeof tags.get === 'function' ? tags.get('TdeStatus') : tags.TdeStatus;

    return tde === 'Disabled' || tde === 'false';
  }
};
