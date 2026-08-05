const {
  IAMClient,
  ListUsersCommand,
  ListAccessKeysCommand,
  ListMFADevicesCommand,
  GetLoginProfileCommand,
  GetAccountPasswordPolicyCommand,
} = require('@aws-sdk/client-iam');
const Resource = require('../models/Resource');

/**
 * Scan IAM Users, MFA policies, access keys status and save in database
 * @param {Object} awsConfig Configuration options for IAM Client
 * @param {String} accountId The target AWS Account ID
 * @returns {Promise<Array>} List of saved IAM Mongoose Resource documents
 */
const scanIAM = async (awsConfig, accountId) => {
  console.log('[IAM Scanner] Initializing Identity Access audit...');
  const iamClient = new IAMClient(awsConfig);
  const savedResources = [];

  try {
    const usersRes = await iamClient.send(new ListUsersCommand({}));
    const users = usersRes.Users || [];
    console.log(`[IAM Scanner] Discovered ${users.length} user identity(s) in account.`);

    for (const user of users) {
      const userName = user.UserName;
      const arn = user.Arn || `arn:aws:iam::${accountId}:user/${userName}`;
      let hasMfa = false;
      let hasConsoleLogin = false;
      let keysRotated = true; // Default
      let status = 'active';

      // 1. Audit MFA status
      try {
        const mfaRes = await iamClient.send(new ListMFADevicesCommand({ UserName: userName }));
        const devices = mfaRes.MFADevices || [];
        if (devices.length > 0) {
          hasMfa = true;
        }
      } catch (err) {
        console.error(`[IAM Scanner] Error auditing MFA for user ${userName}:`, err.message);
      }

      // 2. Audit Console Access (Login Profile)
      try {
        await iamClient.send(new GetLoginProfileCommand({ UserName: userName }));
        hasConsoleLogin = true;
      } catch (err) {
        // NoSuchEntity means the user is programmatic-only (no password console profile)
        if (err.name === 'NoSuchEntity') {
          hasConsoleLogin = false;
        } else {
          console.error(`[IAM Scanner] Error auditing login profile for user ${userName}:`, err.message);
        }
      }

      // 3. Audit Access Keys age (threshold: 90 days)
      try {
        const keysRes = await iamClient.send(new ListAccessKeysCommand({ UserName: userName }));
        const keys = keysRes.AccessKeyMetadata || [];
        
        const now = new Date();
        const ninetyDays = 90 * 24 * 60 * 60 * 1000;

        for (const key of keys) {
          if (key.Status === 'Active' && key.CreateDate) {
            const age = now - new Date(key.CreateDate);
            if (age > ninetyDays) {
              keysRotated = false; // Found an active access key older than 90 days
            }
          }
        }
      } catch (err) {
        console.error(`[IAM Scanner] Error auditing access keys for user ${userName}:`, err.message);
      }

      // Map dynamic properties to tags object
      const tags = {
        ConsoleAccess: hasConsoleLogin ? 'enabled' : 'disabled',
        MfaActive: hasMfa ? 'enabled' : 'disabled',
        AccessKeysCompliant: keysRotated ? 'true' : 'false',
        PasswordLastUsed: user.PasswordLastUsed ? user.PasswordLastUsed.toISOString() : 'Never',
      };

      const resourceData = {
        name: userName,
        service: 'IAM',
        type: 'User',
        cloudProvider: 'AWS',
        accountId,
        region: 'global', // IAM is global
        arn,
        status,
        tags,
        creationDate: user.CreateDate ? new Date(user.CreateDate) : new Date(),
        lastScannedAt: new Date(),
      };

      const updated = await Resource.findOneAndUpdate(
        { arn },
        resourceData,
        { new: true, upsert: true }
      );
      savedResources.push(updated);
    }

    // NEW: Audit Account Password Policy
    try {
      console.log('[IAM Scanner] Auditing global Account Password Policy...');
      const policyRes = await iamClient.send(new GetAccountPasswordPolicyCommand({}));
      const policy = policyRes.PasswordPolicy;
      
      const policyTags = {
        MinimumPasswordLength: (policy && policy.MinimumPasswordLength) ? policy.MinimumPasswordLength.toString() : '8',
        RequireSymbols: (policy && policy.RequireSymbols) ? 'true' : 'false',
        RequireNumbers: (policy && policy.RequireNumbers) ? 'true' : 'false',
      };

      const policyResource = {
        name: 'Account Password Policy',
        service: 'IAM',
        type: 'AccountPolicy',
        cloudProvider: 'AWS',
        accountId,
        region: 'global',
        arn: `arn:aws:iam::${accountId}:account/password-policy`,
        status: 'active',
        tags: policyTags,
        lastScannedAt: new Date(),
      };

      const updatedPolicy = await Resource.findOneAndUpdate(
        { arn: policyResource.arn },
        policyResource,
        { new: true, upsert: true }
      );
      savedResources.push(updatedPolicy);

    } catch (err) {
      if (err.name === 'NoSuchEntityException' || err.name === 'NoSuchEntity') {
        console.log('[IAM Scanner] No custom password policy found. AWS defaults are in effect.');
        // AWS Default is 8 characters, no symbols/numbers required
        const defaultPolicyResource = {
          name: 'Account Password Policy (Default)',
          service: 'IAM',
          type: 'AccountPolicy',
          cloudProvider: 'AWS',
          accountId,
          region: 'global',
          arn: `arn:aws:iam::${accountId}:account/password-policy`,
          status: 'active',
          tags: { MinimumPasswordLength: '8', RequireSymbols: 'false', RequireNumbers: 'false' },
          lastScannedAt: new Date(),
        };
        const updatedPolicy = await Resource.findOneAndUpdate(
          { arn: defaultPolicyResource.arn },
          defaultPolicyResource,
          { new: true, upsert: true }
        );
        savedResources.push(updatedPolicy);
      } else {
        console.error('[IAM Scanner] Error fetching password policy:', err.message);
      }
    }

    return savedResources;
  } catch (error) {
    console.error(`[IAM Scanner] Ingestion scan failed: ${error.message}`);
    throw error;
  }
};

module.exports = { scanIAM };
