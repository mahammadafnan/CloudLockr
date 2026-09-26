/**
 * CIS Microsoft Azure Foundations Benchmark 4.1 - Ensure Azure SQL Database Server Public Network Access is Disabled
 */
module.exports = {
  id: 'CL-AZ-14',
  title: 'Azure SQL Database Server Public Network Access Enabled',
  service: 'SQLDatabase',
  severity: 'Critical',
  description: 'The Azure SQL Server allows incoming connections from public networks, allowing database network ports to be reached from the public internet rather than requiring Private Endpoints.',
  remediation: 'In Azure Portal ➔ SQL servers ➔ Networking, set "Public network access" to "Disabled".',
  complianceMapping: {
    cisAzure: '4.1',
    nist: 'SC-7'
  },
  docLink: 'https://learn.microsoft.com/en-us/azure/azure-sql/database/connectivity-architecture',

  check: (resource) => {
    if (resource.cloudProvider !== 'AZURE' || resource.service !== 'SQLDatabase') {
      return false;
    }
    const tags = resource.tags || {};
    const netAccess = typeof tags.get === 'function' ? tags.get('PublicNetworkAccess') : tags.PublicNetworkAccess;

    return netAccess === 'Enabled' || netAccess === 'allNetworks' || resource.status === 'public';
  }
};
