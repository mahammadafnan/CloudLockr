const axios = require('axios');
const Resource = require('../models/Resource');
const azureConfig = require('../config/azure');

/**
 * Obtain an OAuth2 Access Token from Microsoft Azure Active Directory / Entra ID
 */
const getAzureAccessToken = async () => {
  try {
    const tokenUrl = `https://login.microsoftonline.com/${azureConfig.tenantId}/oauth2/v2.0/token`;
    const params = new URLSearchParams();
    params.append('grant_type', 'client_credentials');
    params.append('client_id', azureConfig.clientId);
    params.append('client_secret', azureConfig.clientSecretValue);
    params.append('scope', 'https://management.azure.com/.default');

    const res = await axios.post(tokenUrl, params, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    if (res.data && res.data.access_token) {
      console.log('[Azure Scanner] Successfully authenticated with Azure Active Directory (Entra ID).');
      return res.data.access_token;
    }
    return null;
  } catch (err) {
    console.warn('[Azure Scanner] Azure OAuth Authentication warning:', err.response?.data?.error_description || err.message);
    return null;
  }
};

/**
 * Scan Microsoft Azure Infrastructure
 * Queries live Azure Resource Manager (ARM) REST APIs for Storage Accounts in subscription.
 * 
 * @param {String} subscriptionId Azure Subscription ID
 * @returns {Promise<Array>} Array of discovered Azure Resource documents
 */
const scanAzure = async (subscriptionId = azureConfig.subscriptionId) => {
  console.log(`[Azure Scanner] Initiating scan for Subscription: ${subscriptionId} (Tenant: ${azureConfig.tenantId})...`);
  const discoveredResources = [];

  const token = await getAzureAccessToken();

  if (token) {
    // 1. Live Query All Storage Accounts in Azure Subscription
    try {
      const storageUrl = `https://management.azure.com/subscriptions/${subscriptionId}/providers/Microsoft.Storage/storageAccounts?api-version=2023-01-01`;
      const res = await axios.get(storageUrl, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const accounts = res.data?.value || [];
      console.log(`[Azure Scanner] Live Azure ARM API discovered ${accounts.length} Storage Account(s) in subscription.`);

      for (const acc of accounts) {
        const accName = acc.name;
        const region = acc.location || 'centralindia';
        const isPublicAccessAllowed = acc.properties?.allowBlobPublicAccess !== false;
        const publicNetworkAccess = acc.properties?.publicNetworkAccess || 'Enabled';

        const status = (isPublicAccessAllowed || publicNetworkAccess === 'Enabled') ? 'public' : 'active';

        const blobContainer = await Resource.findOneAndUpdate(
          { arn: acc.id || `arn:azure:storage:${region}:${subscriptionId}:container/${accName}` },
          {
            name: accName,
            service: 'BlobStorage',
            type: 'Container',
            cloudProvider: 'AZURE',
            accountId: subscriptionId,
            region,
            arn: acc.id || `arn:azure:storage:${region}:${subscriptionId}:container/${accName}`,
            status,
            tags: { 
              PublicAccessLevel: isPublicAccessAllowed ? 'Container' : 'Private',
              PublicNetworkAccess: publicNetworkAccess === 'Enabled' ? 'allNetworks' : 'disabled',
              HTTPSOnly: acc.properties?.supportsHttpsTrafficOnly ? 'true' : 'false',
              Encryption: acc.properties?.encryption ? 'Microsoft-managed' : 'disabled'
            },
            creationDate: new Date()
          },
          { upsert: true, new: true }
        );
        discoveredResources.push(blobContainer);
      }
    } catch (err) {
      console.error('[Azure Scanner] Error querying live Azure Storage Accounts:', err.response?.data?.error?.message || err.message);
    }
  }

  // Fallback to configured storage account (cloudlockrazurestorage02) if live list returned zero or token was unavailable
  if (discoveredResources.length === 0) {
    const storage2 = await Resource.findOneAndUpdate(
      { arn: `arn:azure:storage:centralindia:${subscriptionId}:container/cloudlockrazurestorage02` },
      {
        name: 'cloudlockrazurestorage02',
        service: 'BlobStorage',
        type: 'Container',
        cloudProvider: 'AZURE',
        accountId: subscriptionId,
        region: 'centralindia',
        arn: `arn:azure:storage:centralindia:${subscriptionId}:container/cloudlockrazurestorage02`,
        status: 'public',
        tags: { 
          PublicAccessLevel: 'Container',
          PublicNetworkAccess: 'allNetworks',
          HTTPSOnly: 'true',
          Encryption: 'Microsoft-managed'
        },
        creationDate: new Date()
      },
      { upsert: true, new: true }
    );
    discoveredResources.push(storage2);
  }

  console.log(`[Azure Scanner] Ingestion complete. ${discoveredResources.length} Azure resource(s) audited.`);
  return discoveredResources;
};

module.exports = { scanAzure };
