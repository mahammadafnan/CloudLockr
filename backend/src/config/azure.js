const path = require('path');
const fs = require('fs');

const keyFilePath = path.join(__dirname, '../../config/azure-credentials.json');
let azureConfig = {
  tenantId: process.env.AZURE_TENANT_ID || 'f66984f8-1077-4161-ab61-7d1ce72b95f1',
  subscriptionId: process.env.AZURE_SUBSCRIPTION_ID || '48131ce1-65df-4433-bb54-cb966376f6b6',
  clientId: process.env.AZURE_CLIENT_ID || '05e8aa70-1e70-4f65-ad46-d1c884df4696',
  clientSecretId: process.env.AZURE_CLIENT_SECRET_ID || '',
  clientSecretValue: process.env.AZURE_CLIENT_SECRET || '',
  storageAccountName: 'cloudlockrazurestorage02',
  isConfigured: false
};

if (fs.existsSync(keyFilePath)) {
  try {
    const rawData = fs.readFileSync(keyFilePath, 'utf8');
    const keyData = JSON.parse(rawData);
    azureConfig.tenantId = keyData.tenantId || azureConfig.tenantId;
    azureConfig.subscriptionId = keyData.subscriptionId || azureConfig.subscriptionId;
    azureConfig.clientId = keyData.clientId || azureConfig.clientId;
    azureConfig.clientSecretId = keyData.clientSecretId || azureConfig.clientSecretId;
    azureConfig.clientSecretValue = keyData.clientSecretValue || azureConfig.clientSecretValue;
    azureConfig.storageAccountName = keyData.storageAccountName || azureConfig.storageAccountName;
    azureConfig.isConfigured = true;
    console.log(`[Azure Config] Verified Azure Credentials for Subscription: ${azureConfig.subscriptionId}`);
  } catch (err) {
    console.error('[Azure Config] Error parsing azure-credentials.json:', err.message);
  }
}

module.exports = azureConfig;
