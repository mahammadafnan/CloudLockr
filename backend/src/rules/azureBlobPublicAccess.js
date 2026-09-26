/**
 * CIS Microsoft Azure Foundations Benchmark 3.1 - Ensure Storage Container Public Access Level is set to Private
 */
module.exports = {
  id: 'CL-AZ-01',
  title: 'Azure Storage Blob Container Public Access Allowed',
  service: 'BlobStorage',
  severity: 'Critical',
  description: 'Azure Storage Account allows anonymous public read access to blob containers and data. Setting allowBlobPublicAccess to true permits anonymous clients to read blob data without authentication.',
  remediation: 'In Azure Portal ➔ Storage Accounts ➔ Configuration, set "Allow Blob anonymous access" to Disabled (set allowBlobPublicAccess: false).',
  complianceMapping: {
    cisAzure: '3.1',
    nist: 'PR.AC-3'
  },
  docLink: 'https://learn.microsoft.com/en-us/azure/storage/blobs/anonymous-read-access-configure',
  
  check: (resource) => {
    if (resource.cloudProvider !== 'AZURE') {
      return false;
    }
    const tags = resource.tags || {};
    const publicAccess = typeof tags.get === 'function' ? tags.get('PublicAccessLevel') : tags.PublicAccessLevel;
    const allowBlobPublicAccess = typeof tags.get === 'function' ? tags.get('AllowBlobPublicAccess') : tags.AllowBlobPublicAccess;

    if (resource.type === 'Container') {
      return publicAccess === 'Container' || publicAccess === 'Blob';
    }
    if (resource.type === 'StorageAccount') {
      return allowBlobPublicAccess === 'true';
    }
    return false;
  }
};
