/**
 * CIS Microsoft Azure Foundations Benchmark 3.1 - Ensure Storage Container Public Access Level is set to Private
 */
module.exports = {
  id: 'CL-AZ-01',
  title: 'Azure Storage Blob Container Public Access Enabled',
  service: 'BlobStorage',
  severity: 'Critical',
  description: 'Azure Storage Container has Public Access Level set to Container or Blob, or Public Network Access enabled from all networks, enabling anonymous public read access to stored blob data.',
  recommendation: 'Navigate to Azure Portal ➔ Storage Accounts ➔ Containers. Select the container, click Change Access Level, and set to Private (no anonymous access). Disable public network access.',
  complianceMapping: {
    cisAzure: '3.1',
    nist: 'PR.AC-3'
  },
  docLink: 'https://learn.microsoft.com/en-us/azure/storage/blobs/anonymous-read-access-configure',
  
  check: (resource) => {
    if (resource.cloudProvider !== 'AZURE' || resource.service !== 'BlobStorage') {
      return false;
    }
    const publicAccess = resource.tags?.PublicAccessLevel;
    const publicNetwork = resource.tags?.PublicNetworkAccess;
    return publicAccess === 'Container' || publicAccess === 'Blob' || publicNetwork === 'allNetworks' || resource.status === 'public' || resource.status === 'vulnerable';
  }
};
