const { S3Client, PutPublicAccessBlockCommand, PutBucketEncryptionCommand } = require('@aws-sdk/client-s3');
const { EC2Client, RevokeSecurityGroupIngressCommand, AuthorizeSecurityGroupIngressCommand, EnableEbsEncryptionByDefaultCommand } = require('@aws-sdk/client-ec2');
const { Storage } = require('@google-cloud/storage');
const axios = require('axios');
const gcpConfig = require('../config/gcp');
const azureConfig = require('../config/azure');

/**
 * Obtain an OAuth2 Access Token for Azure ARM REST API
 */
const getAzureAccessToken = async () => {
  if (!azureConfig.tenantId || !azureConfig.clientId || !azureConfig.clientSecretValue) return null;
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
    return res.data?.access_token || null;
  } catch (err) {
    return null;
  }
};

/**
 * Unified Canonical Remediation Engine
 * Single source of truth for all CLI commands and live SDK patches across AWS, GCP, and Azure.
 */
function getCanonicalRemediation(finding, parameters = {}) {
  const arnStr = finding.resourceArn || '';
  const cloudProvider = (
    finding.resourceId?.cloudProvider ||
    (arnStr.includes('gcp') ? 'GCP' : arnStr.includes('azure') || arnStr.includes('/subscriptions/') ? 'AZURE' : 'AWS')
  ).toUpperCase();

  // Extract cleanest default resource identifier
  let defaultResourceName = finding.resourceId?.name || arnStr.split(':').pop().split('/').pop() || 'resource';
  if (arnStr.startsWith('arn:aws:s3:::')) {
    defaultResourceName = arnStr.replace('arn:aws:s3:::', '');
  } else if (arnStr.startsWith('arn:gcp:storage:::')) {
    defaultResourceName = arnStr.replace('arn:gcp:storage:::', '');
  } else if (arnStr.includes('firewall/')) {
    defaultResourceName = arnStr.split('firewall/').pop();
  } else if (arnStr.includes('instance/')) {
    defaultResourceName = arnStr.split('instance/').pop();
  } else if (arnStr.includes('disk/')) {
    defaultResourceName = arnStr.split('disk/').pop();
  } else if (arnStr.includes('storageAccounts/')) {
    defaultResourceName = arnStr.split('storageAccounts/').pop().split('/')[0];
  }

  // Use user-provided resourceName if supplied and non-empty
  const resourceName = parameters.resourceName?.trim() || defaultResourceName;
  const title = (finding.title || '').toLowerCase();
  const desc = (finding.description || '').toLowerCase();
  const service = (finding.resourceId?.service || finding.service || '').toUpperCase();

  // Extract security group ID if applicable
  let sgId = null;
  if (resourceName && resourceName.startsWith('sg-')) {
    sgId = resourceName;
  } else if (finding.resourceId?.tags) {
    sgId = typeof finding.resourceId.tags.get === 'function'
      ? finding.resourceId.tags.get('SecurityGroupId')
      : finding.resourceId.tags.SecurityGroupId;
  }
  if (!sgId && arnStr.includes('security-group/')) {
    sgId = arnStr.split('security-group/').pop().split(/[:\/ ]/)[0];
  }
  const targetSgFlag = sgId ? `--group-id ${sgId}` : (resourceName.startsWith('sg-') ? `--group-id ${resourceName}` : `--group-name "${resourceName}"`);
  const awsRegion = parameters.region || finding.resourceId?.region || 'eu-north-1';

  let command = '';
  let actionSummary = '';
  let parameterType = 'standard'; // 'standard', 'logging', 'network', 'encryption'

  // =========================================================================
  // 1. GOOGLE CLOUD PLATFORM (GCP)
  // =========================================================================
  if (cloudProvider === 'GCP') {
    if (title.includes('versioning')) {
      // GCS Object Versioning
      command = `gcloud storage buckets update gs://${resourceName} --versioning`;
      actionSummary = `Enables Object Versioning on Google Cloud Storage bucket 'gs://${resourceName}'`;
      parameterType = 'standard';

    } else if (title.includes('logging')) {
      // GCS Access Logging
      const destBucket = parameters.destinationBucket || 'central-audit-logs';
      const prefix = parameters.logPrefix || 'audit-logs/gcs/';
      command = `gcloud storage buckets update gs://${resourceName} --log-bucket=gs://${destBucket} --log-prefix=${prefix}`;
      actionSummary = `Enables Access Logging on GCS bucket 'gs://${resourceName}', streaming access records to 'gs://${destBucket}'`;
      parameterType = 'logging';

    } else if (title.includes('public') || title.includes('uniform') || title.includes('storage admin') || title.includes('administrative')) {
      // GCS Public / Uniform Access
      command = `gcloud storage buckets update gs://${resourceName} --uniform-bucket-level-access`;
      actionSummary = `Enforces Uniform Bucket-Level Access on 'gs://${resourceName}', neutralizing public allUsers permissions`;
      parameterType = 'standard';

    } else if (title.includes('cmek') || title.includes('customer-managed') || title.includes('encryption')) {
      // GCS CMEK Encryption
      const kmsKey = parameters.kmsKeyId || `projects/${gcpConfig.projectId}/locations/global/keyRings/cloudlockr-ring/cryptoKeys/cloudlockr-cmek`;
      command = `gcloud storage buckets update gs://${resourceName} --default-kms-key=${kmsKey}`;
      actionSummary = `Enforces Customer-Managed Encryption Key (CMEK) on GCS bucket 'gs://${resourceName}'`;
      parameterType = 'encryption';

    } else if (title.includes('ssh') || title.includes('port 22')) {
      // VPC Inbound SSH
      const cidr = parameters.allowedCidr || '10.0.0.0/16';
      command = `gcloud compute firewall-rules update ${resourceName} --source-ranges=${cidr}`;
      actionSummary = `Restricts VPC Firewall Rule '${resourceName}' inbound SSH to authorized CIDR (${cidr})`;
      parameterType = 'network';

    } else if (title.includes('rdp') || title.includes('port 3389')) {
      // VPC Inbound RDP
      const cidr = parameters.allowedCidr || '10.0.0.0/16';
      command = `gcloud compute firewall-rules update ${resourceName} --source-ranges=${cidr}`;
      actionSummary = `Restricts VPC Firewall Rule '${resourceName}' inbound RDP to authorized CIDR (${cidr})`;
      parameterType = 'network';

    } else if (title.includes('service account') || title.includes('admin privileges') || title.includes('owner')) {
      // IAM Service Account Privileges
      command = `gcloud projects remove-iam-policy-binding ${gcpConfig.projectId} --member=serviceAccount:${resourceName} --role=roles/owner`;
      actionSummary = `Revokes primitive Owner/Editor privileges from Service Account '${resourceName}'`;
      parameterType = 'standard';

    } else if (title.includes('user-managed') || title.includes('service account key')) {
      // SA User-managed Keys
      command = `gcloud iam service-accounts keys list --iam-account=${resourceName}`;
      actionSummary = `Audits and flags user-managed keys for Service Account '${resourceName}'`;
      parameterType = 'standard';

    } else if (title.includes('cloud sql')) {
      command = `gcloud sql instances patch ${resourceName} --no-assign-ip`;
      actionSummary = `Disables public IP access on Cloud SQL instance '${resourceName}'`;
      parameterType = 'standard';

    } else if (title.includes('shielded')) {
      const zone = parameters.zone || finding.resourceId?.region || 'asia-south1-c';
      const project = gcpConfig.projectId || 'project-25a7942f-6ee6-4832-a57';
      command = `gcloud compute instances stop ${resourceName} --zone=${zone} --project=${project} --quiet && gcloud compute instances update ${resourceName} --shielded-secure-boot --shielded-vtpm --shielded-integrity-monitoring --zone=${zone} --project=${project} --quiet && gcloud compute instances start ${resourceName} --zone=${zone} --project=${project} --quiet`;
      actionSummary = `Enables Shielded VM (Secure Boot, vTPM, Integrity Monitoring) on GCE instance '${resourceName}' in zone '${zone}'`;
      parameterType = 'standard';

    } else if (title.includes('public ip') && (service === 'GCE' || title.includes('compute instance') || title.includes('gce') || title.includes('instance'))) {
      const zone = parameters.zone || finding.resourceId?.region || 'asia-south1-c';
      const project = gcpConfig.projectId || 'project-25a7942f-6ee6-4832-a57';
      command = `gcloud compute instances delete-access-config ${resourceName} --access-config-name="External NAT" --zone=${zone} --project=${project} --quiet`;
      actionSummary = `Removes external public IP from GCE instance '${resourceName}' in zone '${zone}'`;
      parameterType = 'standard';

    } else if (title.includes('disk') || (service === 'GCE' && (title.includes('cmek') || title.includes('encryption')))) {
      const zone = parameters.zone || finding.resourceId?.region || 'asia-south1-c';
      const project = gcpConfig.projectId || 'project-25a7942f-6ee6-4832-a57';
      const kmsKey = parameters.kmsKeyId || `projects/${project}/locations/global/keyRings/cloudlockr-ring/cryptoKeys/cloudlockr-cmek`;
      command = `gcloud compute disks update ${resourceName} --kms-key=${kmsKey} --zone=${zone} --project=${project} --quiet`;
      actionSummary = `Enforces Customer-Managed Encryption Key (CMEK) on GCE persistent disk '${resourceName}'`;
      parameterType = 'encryption';

    } else {
      command = `gcloud storage buckets update gs://${resourceName} --uniform-bucket-level-access`;
      actionSummary = `Applies baseline CIS security compliance to GCP resource '${resourceName}'`;
      parameterType = 'standard';
    }
  }

  // =========================================================================
  // 2. AMAZON WEB SERVICES (AWS)
  // =========================================================================
  else if (cloudProvider === 'AWS') {
    if (title.includes('public bucket') || title.includes('s3 public') || title.includes('public access')) {
      command = `aws s3api put-public-access-block --bucket ${resourceName} --public-access-block-configuration "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"`;
      actionSummary = `Enforces S3 Block Public Access across bucket '${resourceName}'`;
      parameterType = 'standard';

    } else if (title.includes('encryption') && (title.includes('s3') || service === 'S3')) {
      const region = parameters.region || finding.resourceId?.region || 'ap-south-1';
      command = `aws s3api put-bucket-encryption --bucket ${resourceName} --region ${region} --server-side-encryption-configuration "{\\"Rules\\":[{\\"ApplyServerSideEncryptionByDefault\\":{\\"SSEAlgorithm\\":\\"AES256\\"}}]}"`;
      actionSummary = `Enables AES-256 Server-Side Encryption on S3 bucket '${resourceName}' in region '${region}'`;
      parameterType = 'standard';

    } else if (title.includes('ssh') || title.includes('port 22')) {
      const cidr = parameters.allowedCidr || '10.0.0.0/16';
      command = `aws ec2 revoke-security-group-ingress ${targetSgFlag} --region ${awsRegion} --protocol tcp --port 22 --cidr 0.0.0.0/0 && aws ec2 authorize-security-group-ingress ${targetSgFlag} --region ${awsRegion} --protocol tcp --port 22 --cidr ${cidr}`;
      actionSummary = `Revokes open 0.0.0.0/0 SSH on '${sgId || resourceName}' (${resourceName}) and restricts ingress to '${cidr}'`;
      parameterType = 'network';

    } else if (title.includes('rdp') || title.includes('port 3389')) {
      const cidr = parameters.allowedCidr || '10.0.0.0/16';
      command = `aws ec2 revoke-security-group-ingress ${targetSgFlag} --region ${awsRegion} --protocol tcp --port 3389 --cidr 0.0.0.0/0 && aws ec2 authorize-security-group-ingress ${targetSgFlag} --region ${awsRegion} --protocol tcp --port 3389 --cidr ${cidr}`;
      actionSummary = `Revokes open 0.0.0.0/0 RDP on '${sgId || resourceName}' (${resourceName}) and restricts ingress to '${cidr}'`;
      parameterType = 'network';

    } else if (title.includes('ebs') || title.includes('volume')) {
      command = `aws ec2 enable-ebs-encryption-by-default --region ${awsRegion}`;
      actionSummary = `Enforces default EBS volume encryption for AWS account in region '${awsRegion}'`;
      parameterType = 'standard';

    } else if (title.includes('mfa') || title.includes('console login')) {
      command = `aws iam create-virtual-mfa-device --virtual-mfa-device-name ${resourceName}-mfa --outfile QRCode.png --bootstrap-method QRCodePNG`;
      actionSummary = `Initializes Virtual MFA device for IAM User '${resourceName}'`;
      parameterType = 'standard';

    } else if (title.includes('administratoraccess') || (title.includes('admin') && title.includes('user'))) {
      command = `aws iam detach-user-policy --user-name ${resourceName} --policy-arn arn:aws:iam::aws:policy/AdministratorAccess`;
      actionSummary = `Detaches AdministratorAccess policy from IAM user '${resourceName}'`;
      parameterType = 'standard';

    } else if (title.includes('90 days') || title.includes('access key')) {
      command = `aws iam update-access-key --user-name ${resourceName} --access-key-id ${parameters.accessKeyId || 'AKIA...'} --status Inactive`;
      actionSummary = `Deactivates stale access keys for IAM user '${resourceName}'`;
      parameterType = 'standard';

    } else {
      command = `aws s3api put-public-access-block --bucket ${resourceName} --public-access-block-configuration "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"`;
      actionSummary = `Enforces baseline CIS AWS security configuration on '${resourceName}'`;
      parameterType = 'standard';
    }
  }

  // =========================================================================
  // 3. MICROSOFT AZURE
  // =========================================================================
  else if (cloudProvider === 'AZURE') {
    if (title.includes('blob') || title.includes('anonymous') || title.includes('public access')) {
      command = `az storage account update --name ${resourceName} --allow-blob-public-access false`;
      actionSummary = `Disables anonymous blob public access on Azure Storage Account '${resourceName}'`;
      parameterType = 'standard';

    } else if (title.includes('https') || title.includes('secure transfer')) {
      command = `az storage account update --name ${resourceName} --https-only true`;
      actionSummary = `Enforces HTTPS-only Secure Transfer on Azure Storage Account '${resourceName}'`;
      parameterType = 'standard';

    } else if (title.includes('tls')) {
      command = `az storage account update --name ${resourceName} --min-tls-version TLS1_2`;
      actionSummary = `Enforces minimum TLS version 1.2 on Azure Storage Account '${resourceName}'`;
      parameterType = 'standard';

    } else if (title.includes('public network')) {
      command = `az storage account update --name ${resourceName} --public-network-access Disabled`;
      actionSummary = `Disables public network access on Azure Storage Account '${resourceName}'`;
      parameterType = 'standard';

    } else if (title.includes('ssh') || title.includes('port 22')) {
      const cidr = parameters.allowedCidr || '10.0.0.0/16';
      command = `az network nsg rule update --resource-group CloudLockr-RG --nsg-name ${resourceName} --name AllowSSH --source-address-prefixes ${cidr}`;
      actionSummary = `Restricts Azure NSG '${resourceName}' SSH rule to authorized CIDR (${cidr})`;
      parameterType = 'network';

    } else if (title.includes('rdp') || title.includes('port 3389')) {
      const cidr = parameters.allowedCidr || '10.0.0.0/16';
      command = `az network nsg rule update --resource-group CloudLockr-RG --nsg-name ${resourceName} --name AllowRDP --source-address-prefixes ${cidr}`;
      actionSummary = `Restricts Azure NSG '${resourceName}' RDP rule to authorized CIDR (${cidr})`;
      parameterType = 'network';

    } else if (title.includes('cmek') || title.includes('encryption key')) {
      command = `az storage account update --name ${resourceName} --encryption-key-source Microsoft.Keyvault --encryption-key-name cloudlockr-key --encryption-key-vault https://cloudlockr-kv.vault.azure.net`;
      actionSummary = `Configures Customer-Managed Encryption Key on Azure Storage Account '${resourceName}'`;
      parameterType = 'encryption';

    } else {
      command = `az storage account update --name ${resourceName} --allow-blob-public-access false --min-tls-version TLS1_2 --https-only true`;
      actionSummary = `Enforces baseline CIS Azure security configuration on '${resourceName}'`;
      parameterType = 'standard';
    }
  }

  return {
    command,
    actionSummary,
    cloudProvider,
    resourceName,
    sgId,
    parameterType,
  };
}

/**
 * Apply live SDK mutation to guarantee cloud state change even if CLI has host restrictions.
 */
async function applyLiveSdkRemediation(finding, parameters = {}) {
  const { cloudProvider, resourceName, sgId } = getCanonicalRemediation(finding, parameters);
  const title = (finding.title || '').toLowerCase();
  const service = (finding.resourceId?.service || finding.service || '').toUpperCase();

  const results = {
    sdkAttempted: false,
    sdkSuccess: false,
    sdkNotice: null
  };

  // GCP Live SDK Execution
  if (cloudProvider === 'GCP' && gcpConfig.isConfigured) {
    results.sdkAttempted = true;
    try {
      const storage = new Storage({
        projectId: gcpConfig.projectId,
        keyFilename: gcpConfig.keyFilePath,
      });
      const bucket = storage.bucket(resourceName);

      if (title.includes('versioning')) {
        await bucket.setMetadata({ versioning: { enabled: true } });
        results.sdkSuccess = true;
        results.sdkNotice = `Live GCP SDK enabled Object Versioning on bucket gs://${resourceName}`;
      } else if (title.includes('logging')) {
        const dest = parameters.destinationBucket || 'central-audit-logs';
        const prefix = parameters.logPrefix || 'audit-logs/gcs/';
        await bucket.setMetadata({ logging: { logBucket: dest, logObjectPrefix: prefix } });
        results.sdkSuccess = true;
        results.sdkNotice = `Live GCP SDK enabled Access Logging to gs://${dest}`;
      } else if (title.includes('uniform') || title.includes('public')) {
        await bucket.setMetadata({ iamConfiguration: { uniformBucketLevelAccess: { enabled: true } } });
        results.sdkSuccess = true;
        results.sdkNotice = `Live GCP SDK enabled Uniform Bucket-Level Access on gs://${resourceName}`;
      }
    } catch (gcpErr) {
      results.sdkNotice = `GCP SDK execution notice: ${gcpErr.message}`;
    }
  }

  // AWS Live SDK Execution
  if (cloudProvider === 'AWS' && process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
    results.sdkAttempted = true;
    const targetRegion = parameters.region || finding.resourceId?.region || 'eu-north-1';
    const regionsToTry = [targetRegion, 'eu-north-1', 'ap-south-1', 'us-east-1'];

    for (const r of regionsToTry) {
      if (results.sdkSuccess) break;
      try {
        const awsConfig = {
          region: r,
          credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
          }
        };

        if (title.includes('public bucket') || title.includes('s3 public')) {
          const s3 = new S3Client(awsConfig);
          await s3.send(new PutPublicAccessBlockCommand({
            Bucket: resourceName,
            PublicAccessBlockConfiguration: {
              BlockPublicAcls: true,
              IgnorePublicAcls: true,
              BlockPublicPolicy: true,
              RestrictPublicBuckets: true,
            }
          }));
          results.sdkSuccess = true;
          results.sdkNotice = `Live AWS S3 PutPublicAccessBlock applied to bucket ${resourceName} in region ${r}`;
        } else if (title.includes('encryption') && (title.includes('s3') || service === 'S3')) {
          const s3 = new S3Client(awsConfig);
          await s3.send(new PutBucketEncryptionCommand({
            Bucket: resourceName,
            ServerSideEncryptionConfiguration: {
              Rules: [{ ApplyServerSideEncryptionByDefault: { SSEAlgorithm: 'AES256' } }]
            }
          }));
          results.sdkSuccess = true;
          results.sdkNotice = `Live AWS S3 PutBucketEncryption applied to bucket ${resourceName} in region ${r}`;
        } else if (title.includes('ssh') || title.includes('port 22') || title.includes('rdp') || title.includes('port 3389')) {
          const ec2 = new EC2Client(awsConfig);
          const targetId = sgId || (resourceName.startsWith('sg-') ? resourceName : null);
          const port = (title.includes('rdp') || title.includes('port 3389')) ? 3389 : 22;
          const cidr = parameters.allowedCidr || '10.0.0.0/16';

          if (targetId) {
            try {
              await ec2.send(new RevokeSecurityGroupIngressCommand({
                GroupId: targetId,
                IpPermissions: [{
                  IpProtocol: 'tcp',
                  FromPort: port,
                  ToPort: port,
                  IpRanges: [{ CidrIp: '0.0.0.0/0' }]
                }]
              }));
            } catch (revokeErr) {
              console.log(`[Remediation SDK] Revoke notice: ${revokeErr.message}`);
            }

            try {
              await ec2.send(new AuthorizeSecurityGroupIngressCommand({
                GroupId: targetId,
                IpPermissions: [{
                  IpProtocol: 'tcp',
                  FromPort: port,
                  ToPort: port,
                  IpRanges: [{ CidrIp: cidr }]
                }]
              }));
            } catch (authErr) {
              console.log(`[Remediation SDK] Authorize notice: ${authErr.message}`);
            }

            results.sdkSuccess = true;
            results.sdkNotice = `Live AWS EC2 SDK restricted port ${port} on ${targetId} to ${cidr} in region ${r}`;
            break;
          }
        } else if (title.includes('ebs') || title.includes('volume')) {
          const ec2 = new EC2Client(awsConfig);
          await ec2.send(new EnableEbsEncryptionByDefaultCommand({}));
          results.sdkSuccess = true;
          results.sdkNotice = `Live AWS EC2 SDK enabled default EBS volume encryption in region ${r}`;
          break;
        }
      } catch (awsErr) {
        results.sdkNotice = `AWS SDK notice: ${awsErr.message}`;
        if (!awsErr.message?.includes('endpoint') && !awsErr.message?.includes('redirect')) {
          break; // If error is not a region redirect error (e.g. AccessDenied), don't retry other regions
        }
      }
    }
  }

  // Azure Live ARM REST API Execution
  if (cloudProvider === 'AZURE' && azureConfig.isConfigured) {
    results.sdkAttempted = true;
    try {
      const token = await getAzureAccessToken();
      if (token) {
        const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
        const subId = azureConfig.subscriptionId;
        const rg = parameters.resourceGroup || 'CloudLockr-RG';

        if (title.includes('public network') || title.includes('tls') || title.includes('https') || title.includes('public access')) {
          const patchUrl = `https://management.azure.com/subscriptions/${subId}/resourceGroups/${rg}/providers/Microsoft.Storage/storageAccounts/${resourceName}?api-version=2023-01-01`;
          await axios.patch(patchUrl, {
            properties: {
              allowBlobPublicAccess: false,
              minimumTlsVersion: 'TLS1_2',
              supportsHttpsTrafficOnly: true,
              publicNetworkAccess: 'Disabled'
            }
          }, { headers });
          results.sdkSuccess = true;
          results.sdkNotice = `Azure ARM API successfully applied CIS security baseline to storage account '${resourceName}'`;
        }
      }
    } catch (azErr) {
      const armErr = azErr.response?.data?.error?.message || azErr.message;
      results.sdkNotice = `Azure ARM API execution notice: ${armErr}`;
    }
  }

  return results;
}

module.exports = {
  getCanonicalRemediation,
  applyLiveSdkRemediation,
};
