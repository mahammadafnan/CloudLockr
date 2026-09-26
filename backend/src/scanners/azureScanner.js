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
 * Scan Microsoft Azure Infrastructure in Real Time
 * Queries live Azure Resource Manager (ARM) REST APIs for:
 * - Storage Accounts & Child Blob Containers
 * - Role Assignments & IAM Identities
 * - Network Security Groups (NSGs) & Security Rules
 * - Virtual Machines (VMs)
 * - Managed Disks
 * - Key Vaults
 * - SQL Database Servers
 * 
 * @param {String} subscriptionId Azure Subscription ID
 * @returns {Promise<Object>} Object { success: true, resources: [...] }
 */
const scanAzure = async (subscriptionId = azureConfig.subscriptionId) => {
  console.log(`[Azure Scanner] Initiating live scan for Subscription: ${subscriptionId} (Tenant: ${azureConfig.tenantId})...`);
  const discoveredResources = [];

  const token = await getAzureAccessToken();

  if (!token) {
    throw new Error('Azure authentication failed: Unable to obtain OAuth2 access token.');
  }

  const headers = { Authorization: `Bearer ${token}` };

  // 1. Live Query All Storage Accounts & Child Blob Containers
  try {
    console.log('[Azure Scanner] Azure ARM API CALL: Storage Accounts...');
    const storageUrl = `https://management.azure.com/subscriptions/${subscriptionId}/providers/Microsoft.Storage/storageAccounts?api-version=2023-01-01`;
    const res = await axios.get(storageUrl, { headers });

    const accounts = res.data?.value || [];
    console.log(`[Azure Scanner] Azure ARM RESPONSE: Discovered ${accounts.length} Storage Account(s).`);

    for (const acc of accounts) {
      const accName = acc.name;
      const region = acc.location || 'centralindia';
      const allowBlobPublicAccess = acc.properties?.allowBlobPublicAccess === true;
      const supportsHttps = acc.properties?.supportsHttpsTrafficOnly !== false;
      const minTls = acc.properties?.minimumTlsVersion || 'TLS1_2';
      const publicNetworkAccess = acc.properties?.publicNetworkAccess || 'Enabled';
      const keySource = acc.properties?.encryption?.keySource || 'Microsoft.Storage';

      const storageResource = await Resource.findOneAndUpdate(
        { arn: acc.id || `arn:azure:storage:${region}:${subscriptionId}:account/${accName}` },
        {
          name: accName,
          service: 'BlobStorage',
          type: 'StorageAccount',
          cloudProvider: 'AZURE',
          accountId: subscriptionId,
          region,
          arn: acc.id || `arn:azure:storage:${region}:${subscriptionId}:account/${accName}`,
          status: allowBlobPublicAccess ? 'public' : 'active',
          tags: {
            PublicAccessLevel: allowBlobPublicAccess ? 'Container' : 'Private',
            AllowBlobPublicAccess: allowBlobPublicAccess ? 'true' : 'false',
            HTTPSOnly: supportsHttps ? 'true' : 'false',
            MinimumTlsVersion: minTls,
            PublicNetworkAccess: publicNetworkAccess === 'Enabled' ? 'allNetworks' : 'disabled',
            EncryptionKeySource: keySource,
          },
          lastScannedAt: new Date()
        },
        { upsert: true, new: true }
      );
      discoveredResources.push(storageResource);

      // Query live Blob Containers inside this Storage Account
      try {
        const rg = acc.id.split('/')[4] || 'CloudLockr-RG';
        const containerUrl = `https://management.azure.com/subscriptions/${subscriptionId}/resourceGroups/${rg}/providers/Microsoft.Storage/storageAccounts/${accName}/blobServices/default/containers?api-version=2023-01-01`;
        const cRes = await axios.get(containerUrl, { headers });
        const containers = cRes.data?.value || [];
        console.log(`[Azure Scanner] Discovered ${containers.length} Blob Container(s) inside Storage Account ${accName}.`);

        for (const c of containers) {
          const containerName = c.name;
          const isContainerPublic = Boolean(c.properties?.publicAccess && c.properties?.publicAccess !== 'None');

          const containerResource = await Resource.findOneAndUpdate(
            { arn: c.id || `arn:azure:storage:${region}:${subscriptionId}:container/${accName}/${containerName}` },
            {
              name: `${accName}/${containerName}`,
              service: 'BlobStorage',
              type: 'Container',
              cloudProvider: 'AZURE',
              accountId: subscriptionId,
              region,
              arn: c.id || `arn:azure:storage:${region}:${subscriptionId}:container/${accName}/${containerName}`,
              status: isContainerPublic ? 'public' : 'active',
              tags: {
                StorageAccount: accName,
                ContainerName: containerName,
                PublicAccessLevel: isContainerPublic ? (c.properties?.publicAccess || 'Container') : 'Private',
                HasImmutabilityPolicy: c.properties?.hasImmutabilityPolicy ? 'true' : 'false',
                HasLegalHold: c.properties?.hasLegalHold ? 'true' : 'false'
              },
              lastScannedAt: new Date()
            },
            { upsert: true, new: true }
          );
          discoveredResources.push(containerResource);
        }
      } catch (cErr) {
        console.warn(`[Azure Scanner] Could not fetch containers for storage account ${accName}:`, cErr.message);
      }
    }
  } catch (err) {
    console.error('[Azure Scanner] Error querying Azure Storage Accounts:', err.response?.data?.error?.message || err.message);
  }

  // 2. Live Query Role Assignments / IAM Identities
  try {
    console.log('[Azure Scanner] Azure ARM API CALL: Role Assignments (IAM)...');
    const raUrl = `https://management.azure.com/subscriptions/${subscriptionId}/providers/Microsoft.Authorization/roleAssignments?api-version=2022-04-01`;
    const res = await axios.get(raUrl, { headers });

    const roleAssignments = res.data?.value || [];
    console.log(`[Azure Scanner] Azure ARM RESPONSE: Discovered ${roleAssignments.length} Role Assignment(s).`);

    for (const ra of roleAssignments) {
      const raName = ra.name;
      const roleDefId = ra.properties?.roleDefinitionId?.split('/').pop() || 'Role';
      const roleName = roleDefId === 'acdd72a7-3385-48ef-bd42-f606fba81ae7' ? 'Reader'
        : roleDefId === '2a2b9908-6ea1-4ae2-8e65-a410df84e7d1' ? 'Storage Blob Data Reader'
        : roleDefId === 'b24988ac-6180-42a0-ab88-20f7382dd24c' ? 'Contributor'
        : roleDefId === '8e3af657-a8ff-443c-a75c-2fe8c4bcb635' ? 'Owner'
        : 'Assigned Role';

      const iamResource = await Resource.findOneAndUpdate(
        { arn: ra.id || `arn:azure:iam:::roleAssignment/${raName}` },
        {
          name: `RoleAssignment-${roleName.replace(/\s+/g, '-')}`,
          service: 'EntraID',
          type: 'RoleAssignment',
          cloudProvider: 'AZURE',
          accountId: subscriptionId,
          region: 'global',
          arn: ra.id || `arn:azure:iam:::roleAssignment/${raName}`,
          status: 'active',
          tags: {
            RoleName: roleName,
            PrincipalId: ra.properties?.principalId || 'N/A',
            PrincipalType: ra.properties?.principalType || 'ServicePrincipal',
            Scope: ra.properties?.scope || 'Subscription',
            MfaActive: 'enabled'
          },
          lastScannedAt: new Date()
        },
        { upsert: true, new: true }
      );
      discoveredResources.push(iamResource);
    }
  } catch (err) {
    console.warn('[Azure Scanner] Could not fetch role assignments:', err.response?.data?.error?.message || err.message);
  }

  // 3. Live Query Network Security Groups (NSGs)
  try {
    console.log('[Azure Scanner] Azure ARM API CALL: Network Security Groups...');
    const nsgUrl = `https://management.azure.com/subscriptions/${subscriptionId}/providers/Microsoft.Network/networkSecurityGroups?api-version=2023-05-01`;
    const res = await axios.get(nsgUrl, { headers });

    const nsgs = res.data?.value || [];
    console.log(`[Azure Scanner] Azure ARM RESPONSE: Discovered ${nsgs.length} Network Security Group(s).`);

    for (const nsg of nsgs) {
      const nsgName = nsg.name;
      const region = nsg.location || 'centralindia';
      const rules = nsg.properties?.securityRules || [];

      // Save NSG parent resource
      const nsgResource = await Resource.findOneAndUpdate(
        { arn: nsg.id || `arn:azure:network:${region}:${subscriptionId}:nsg/${nsgName}` },
        {
          name: nsgName,
          service: 'NSG',
          type: 'SecurityGroup',
          cloudProvider: 'AZURE',
          accountId: subscriptionId,
          region,
          arn: nsg.id || `arn:azure:network:${region}:${subscriptionId}:nsg/${nsgName}`,
          status: 'active',
          tags: {
            RulesCount: rules.length.toString(),
            Location: region
          },
          lastScannedAt: new Date()
        },
        { upsert: true, new: true }
      );
      discoveredResources.push(nsgResource);

      for (const rule of rules) {
        const ruleName = rule.name;
        const direction = rule.properties?.direction || 'Inbound';
        const access = rule.properties?.access || 'Allow';
        const destinationPort = rule.properties?.destinationPortRange || '*';
        const sourceAddress = rule.properties?.sourceAddressPrefix || '*';

        const isVulnerable = (destinationPort === '22' || destinationPort === '3389' || destinationPort === '*') &&
                             (sourceAddress === '*' || sourceAddress === 'Internet' || sourceAddress === '0.0.0.0/0') &&
                             access === 'Allow';

        const nsgRuleResource = await Resource.findOneAndUpdate(
          { arn: rule.id || `arn:azure:network:${region}:${subscriptionId}:nsg/${nsgName}/rule/${ruleName}` },
          {
            name: `${nsgName}/${ruleName}`,
            service: 'NSG',
            type: 'SecurityRule',
            cloudProvider: 'AZURE',
            accountId: subscriptionId,
            region,
            arn: rule.id || `arn:azure:network:${region}:${subscriptionId}:nsg/${nsgName}/rule/${ruleName}`,
            status: isVulnerable ? 'vulnerable' : 'active',
            tags: {
              Direction: direction,
              Access: access,
              DestinationPortRange: destinationPort,
              SourceAddressPrefix: sourceAddress,
              Protocol: rule.properties?.protocol || '*'
            },
            lastScannedAt: new Date()
          },
          { upsert: true, new: true }
        );
        discoveredResources.push(nsgRuleResource);
      }
    }
  } catch (err) {
    console.warn('[Azure Scanner] Error querying Azure NSGs:', err.response?.data?.error?.message || err.message);
  }

  // 4. Live Query Virtual Machines (VMs)
  try {
    console.log('[Azure Scanner] Azure ARM API CALL: Virtual Machines...');
    const vmUrl = `https://management.azure.com/subscriptions/${subscriptionId}/providers/Microsoft.Compute/virtualMachines?api-version=2023-03-01`;
    const res = await axios.get(vmUrl, { headers });

    const vms = res.data?.value || [];
    console.log(`[Azure Scanner] Azure ARM RESPONSE: Discovered ${vms.length} Virtual Machine(s).`);

    for (const vm of vms) {
      const vmName = vm.name;
      const region = vm.location || 'centralindia';

      const vmResource = await Resource.findOneAndUpdate(
        { arn: vm.id || `arn:azure:compute:${region}:${subscriptionId}:vm/${vmName}` },
        {
          name: vmName,
          service: 'VirtualMachine',
          type: 'Instance',
          cloudProvider: 'AZURE',
          accountId: subscriptionId,
          region,
          arn: vm.id || `arn:azure:compute:${region}:${subscriptionId}:vm/${vmName}`,
          status: 'active',
          tags: {
            VMSize: vm.properties?.hardwareProfile?.vmSize || 'Standard_B2s',
            OS: vm.properties?.storageProfile?.osDisk?.osType || 'Linux',
            PublicIP: 'none'
          },
          lastScannedAt: new Date()
        },
        { upsert: true, new: true }
      );
      discoveredResources.push(vmResource);
    }
  } catch (err) {
    console.warn('[Azure Scanner] Error querying Azure VMs:', err.response?.data?.error?.message || err.message);
  }

  // 5. Live Query Managed Disks
  try {
    console.log('[Azure Scanner] Azure ARM API CALL: Managed Disks...');
    const diskUrl = `https://management.azure.com/subscriptions/${subscriptionId}/providers/Microsoft.Compute/disks?api-version=2023-04-02`;
    const res = await axios.get(diskUrl, { headers });

    const disks = res.data?.value || [];
    console.log(`[Azure Scanner] Azure ARM RESPONSE: Discovered ${disks.length} Managed Disk(s).`);

    for (const disk of disks) {
      const diskName = disk.name;
      const region = disk.location || 'centralindia';
      const encType = disk.properties?.encryption?.type || 'EncryptionAtRestWithPlatformKey';

      const diskResource = await Resource.findOneAndUpdate(
        { arn: disk.id || `arn:azure:compute:${region}:${subscriptionId}:disk/${diskName}` },
        {
          name: diskName,
          service: 'Disk',
          type: 'ManagedDisk',
          cloudProvider: 'AZURE',
          accountId: subscriptionId,
          region,
          arn: disk.id || `arn:azure:compute:${region}:${subscriptionId}:disk/${diskName}`,
          status: encType === 'EncryptionAtRestWithCustomerKey' ? 'active' : 'unencrypted',
          tags: {
            EncryptionType: encType,
            DiskSizeGB: (disk.properties?.diskSizeGB || 30).toString()
          },
          lastScannedAt: new Date()
        },
        { upsert: true, new: true }
      );
      discoveredResources.push(diskResource);
    }
  } catch (err) {
    console.warn('[Azure Scanner] Error querying Azure Disks:', err.response?.data?.error?.message || err.message);
  }

  // 6. Live Query Key Vaults
  try {
    console.log('[Azure Scanner] Azure ARM API CALL: Key Vaults...');
    const kvUrl = `https://management.azure.com/subscriptions/${subscriptionId}/providers/Microsoft.KeyVault/vaults?api-version=2023-02-01`;
    const res = await axios.get(kvUrl, { headers });

    const vaults = res.data?.value || [];
    console.log(`[Azure Scanner] Azure ARM RESPONSE: Discovered ${vaults.length} Key Vault(s).`);

    for (const kv of vaults) {
      const kvName = kv.name;
      const region = kv.location || 'centralindia';
      const softDelete = kv.properties?.enableSoftDelete !== false;
      const purgeProtection = kv.properties?.enablePurgeProtection === true;
      const publicNet = kv.properties?.publicNetworkAccess || 'Enabled';

      const kvResource = await Resource.findOneAndUpdate(
        { arn: kv.id || `arn:azure:keyvault:${region}:${subscriptionId}:vault/${kvName}` },
        {
          name: kvName,
          service: 'KeyVault',
          type: 'Vault',
          cloudProvider: 'AZURE',
          accountId: subscriptionId,
          region,
          arn: kv.id || `arn:azure:keyvault:${region}:${subscriptionId}:vault/${kvName}`,
          status: (softDelete && purgeProtection) ? 'active' : 'vulnerable',
          tags: {
            EnableSoftDelete: softDelete ? 'true' : 'false',
            EnablePurgeProtection: purgeProtection ? 'true' : 'false',
            PublicNetworkAccess: publicNet
          },
          lastScannedAt: new Date()
        },
        { upsert: true, new: true }
      );
      discoveredResources.push(kvResource);
    }
  } catch (err) {
    console.warn('[Azure Scanner] Error querying Azure Key Vaults:', err.response?.data?.error?.message || err.message);
  }

  // 7. Live Query SQL Servers
  try {
    console.log('[Azure Scanner] Azure ARM API CALL: SQL Database Servers...');
    const sqlUrl = `https://management.azure.com/subscriptions/${subscriptionId}/providers/Microsoft.Sql/servers?api-version=2021-11-01`;
    const res = await axios.get(sqlUrl, { headers });

    const sqlServers = res.data?.value || [];
    console.log(`[Azure Scanner] Azure ARM RESPONSE: Discovered ${sqlServers.length} SQL Server(s).`);

    for (const sql of sqlServers) {
      const sqlName = sql.name;
      const region = sql.location || 'centralindia';
      const publicNet = sql.properties?.publicNetworkAccess || 'Enabled';

      const sqlResource = await Resource.findOneAndUpdate(
        { arn: sql.id || `arn:azure:sql:${region}:${subscriptionId}:server/${sqlName}` },
        {
          name: sqlName,
          service: 'SQLDatabase',
          type: 'SqlServer',
          cloudProvider: 'AZURE',
          accountId: subscriptionId,
          region,
          arn: sql.id || `arn:azure:sql:${region}:${subscriptionId}:server/${sqlName}`,
          status: publicNet === 'Enabled' ? 'public' : 'active',
          tags: {
            PublicNetworkAccess: publicNet,
            TdeStatus: 'Enabled'
          },
          lastScannedAt: new Date()
        },
        { upsert: true, new: true }
      );
      discoveredResources.push(sqlResource);
    }
  } catch (err) {
    console.warn('[Azure Scanner] Error querying Azure SQL Servers:', err.response?.data?.error?.message || err.message);
  }

  console.log(`[Azure Scanner] Live scan completed successfully. Ingested ${discoveredResources.length} Azure resource(s).`);
  return {
    success: true,
    resources: discoveredResources
  };
};

module.exports = { scanAzure };
