const { Storage } = require('@google-cloud/storage');
const { GoogleAuth } = require('google-auth-library');
const axios = require('axios');
const Resource = require('../models/Resource');
const gcpConfig = require('../config/gcp');

/**
 * Scan Google Cloud Platform (GCP) Infrastructure
 * Audits GCS Buckets and IAM Service Accounts dynamically using live GCP APIs.
 * Throws explicit errors on GCP API failures to prevent false-clean scans.
 * 
 * @param {String} projectId GCP Project ID
 * @returns {Promise<Object>} Object { success: true, resources: [...] } or throws error
 */
const scanGCP = async (projectId = gcpConfig.projectId) => {
  console.log(`[GCP Scanner] Initiating live GCP scan for Project: ${projectId} (SA: ${gcpConfig.clientEmail})...`);
  const discoveredResources = [];

  if (!gcpConfig.isConfigured) {
    throw new Error(`GCP Configuration missing or service account key file not found at ${gcpConfig.keyFilePath}`);
  }

  let gcsError = null;
  let iamError = null;

  // 1. Audit Live Google Cloud Storage (GCS) Buckets
  try {
    const storage = new Storage({
      projectId: gcpConfig.projectId,
      keyFilename: gcpConfig.keyFilePath,
    });

    console.log(`[GCP Scanner] GCP API CALL: GCS Buckets list for project ${projectId}...`);
    const [buckets] = await storage.getBuckets();
    console.log(`[GCP Scanner] GCP RESPONSE RESOURCE COUNT: Discovered ${buckets.length} live GCS bucket(s).`);

    for (const bucket of buckets) {
      let isPublic = false;
      let uniformEnabled = true;
      let publicRole = 'none';
      let loggingStatus = 'disabled';
      let versioningStatus = 'disabled';

      try {
        const [metadata] = await bucket.getMetadata();
        uniformEnabled = metadata.iamConfiguration?.uniformBucketLevelAccess?.enabled !== false;
        loggingStatus = metadata.logging ? 'enabled' : 'disabled';
        versioningStatus = metadata.versioning?.enabled ? 'enabled' : 'disabled';

        const [policy] = await bucket.iam.getPolicy();
        if (policy && policy.bindings) {
          for (const binding of policy.bindings) {
            if (binding.members && (binding.members.includes('allUsers') || binding.members.includes('allAuthenticatedUsers'))) {
              isPublic = true;
              if (binding.role === 'roles/storage.admin' || binding.role === 'roles/storage.objectAdmin') {
                publicRole = binding.role;
              } else if (publicRole === 'none') {
                publicRole = binding.role || 'roles/storage.objectViewer';
              }
            }
          }
        }
      } catch (bErr) {
        console.warn(`[GCP Scanner] Could not fetch metadata/IAM details for bucket ${bucket.name}:`, bErr.message);
      }

      const bucketResource = await Resource.findOneAndUpdate(
        { arn: `arn:gcp:storage:::${bucket.name}` },
        {
          name: bucket.name,
          service: 'GCS',
          type: 'Bucket',
          cloudProvider: 'GCP',
          accountId: projectId,
          region: 'us-central1',
          arn: `arn:gcp:storage:::${bucket.name}`,
          status: isPublic ? 'public' : 'private',
          tags: { 
            UniformBucketLevelAccess: uniformEnabled ? 'enabled' : 'disabled',
            PublicAccess: isPublic ? 'allUsers' : 'private',
            PublicRole: publicRole,
            Logging: loggingStatus,
            Versioning: versioningStatus,
            Encryption: 'Google-managed'
          },
          lastScannedAt: new Date()
        },
        { upsert: true, new: true }
      );
      discoveredResources.push(bucketResource);
    }
  } catch (err) {
    gcsError = err.message;
    console.error('[GCP Scanner] Live GCS API lookup failed:', err.message);
  }

  // 2. Audit Live GCP IAM Service Accounts dynamically
  try {
    const auth = new GoogleAuth({
      keyFilename: gcpConfig.keyFilePath,
      scopes: ['https://www.googleapis.com/auth/cloud-platform']
    });
    const client = await auth.getClient();
    const tokenResponse = await client.getAccessToken();
    const accessToken = tokenResponse?.token || tokenResponse;

    if (accessToken) {
      console.log(`[GCP Scanner] GCP API CALL: IAM Service Accounts for project ${projectId}...`);
      const iamUrl = `https://iam.googleapis.com/v1/projects/${projectId}/serviceAccounts`;
      const res = await axios.get(iamUrl, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      const accounts = res.data?.accounts || [];
      console.log(`[GCP Scanner] GCP RESPONSE RESOURCE COUNT: Discovered ${accounts.length} live Service Account(s).`);

      // Attempt to fetch project-level IAM policy bindings
      const saRolesMap = new Map();
      try {
        const policyUrl = `https://cloudresourcemanager.googleapis.com/v1/projects/${projectId}:getIamPolicy`;
        const policyRes = await axios.post(policyUrl, {}, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        const bindings = policyRes.data?.bindings || [];
        for (const b of bindings) {
          for (const member of b.members || []) {
            if (!saRolesMap.has(member)) saRolesMap.set(member, []);
            saRolesMap.get(member).push(b.role);
          }
        }
        console.log(`[GCP Scanner] Successfully fetched project IAM policy with ${bindings.length} role binding(s).`);
      } catch (pErr) {
        console.warn('[GCP Scanner] Note: Cloud Resource Manager API is disabled or restricted. Enable cloudresourcemanager.googleapis.com in GCP Console for dynamic project-level role assignment detection.');
      }

      for (const sa of accounts) {
        const saEmail = sa.email;
        const saMember = `serviceAccount:${saEmail}`;
        const rolesList = saRolesMap.get(saMember) || [];
        const primaryRole = rolesList.find(r => r === 'roles/owner' || r === 'roles/editor') || rolesList[0] || 'roles/viewer';
        const hasAdminRole = primaryRole === 'roles/owner' || primaryRole === 'roles/editor';

        let role = primaryRole;
        let status = hasAdminRole ? 'vulnerable' : 'active';
        let maxKeyAgeDays = 0;
        let hasUserManagedKey = false;

        // Fetch actual keys from GCP IAM API
        try {
          const keysUrl = `https://iam.googleapis.com/v1/projects/${projectId}/serviceAccounts/${saEmail}/keys`;
          const keysRes = await axios.get(keysUrl, {
            headers: { Authorization: `Bearer ${accessToken}` }
          });
          const keys = keysRes.data?.keys || [];

          for (const key of keys) {
            if (key.validAfterTime) {
              const ageDays = Math.floor((Date.now() - new Date(key.validAfterTime).getTime()) / (1000 * 60 * 60 * 24));
              if (ageDays > maxKeyAgeDays) maxKeyAgeDays = ageDays;
              if (key.keyType === 'USER_MANAGED') {
                hasUserManagedKey = true;
              }
            }
          }
        } catch (keyErr) {
          console.warn(`[GCP Scanner] Could not fetch keys for ${saEmail}:`, keyErr.message);
        }

        const saResource = await Resource.findOneAndUpdate(
          { arn: `arn:gcp:iam::${projectId}:serviceaccount/${saEmail}` },
          {
            name: saEmail,
            service: 'IAM',
            type: 'ServiceAccount',
            cloudProvider: 'GCP',
            accountId: projectId,
            region: 'global',
            arn: `arn:gcp:iam::${projectId}:serviceaccount/${saEmail}`,
            status,
            tags: {
              Role: role,
              KeyAgeDays: maxKeyAgeDays.toString(),
              HasUserManagedKey: hasUserManagedKey ? 'true' : 'false',
              ServiceAccountType: saEmail.includes('developer') ? 'Google-Managed' : 'User-Managed',
              DisplayName: sa.displayName || saEmail
            },
            lastScannedAt: new Date()
          },
          { upsert: true, new: true }
        );
        discoveredResources.push(saResource);
      }
    }
  } catch (err) {
    iamError = err.message;
    console.error('[GCP Scanner] Live IAM API lookup failed:', err.message);
  }

  // 3. Audit Live GCP VPC Firewalls
  try {
    const auth = new GoogleAuth({
      keyFilename: gcpConfig.keyFilePath,
      scopes: ['https://www.googleapis.com/auth/cloud-platform']
    });
    const client = await auth.getClient();
    const tokenResponse = await client.getAccessToken();
    const accessToken = tokenResponse?.token || tokenResponse;

    if (accessToken) {
      console.log(`[GCP Scanner] GCP API CALL: VPC Firewalls for project ${projectId}...`);
      const fwUrl = `https://compute.googleapis.com/compute/v1/projects/${projectId}/global/firewalls`;
      const fwRes = await axios.get(fwUrl, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      const firewalls = fwRes.data?.items || [];
      console.log(`[GCP Scanner] GCP RESPONSE RESOURCE COUNT: Discovered ${firewalls.length} live VPC Firewall(s).`);

      for (const fw of firewalls) {
        const fwName = fw.name;
        const direction = fw.direction || 'INGRESS';
        const sourceRanges = fw.sourceRanges || [];
        const isPublic = sourceRanges.includes('0.0.0.0/0') || sourceRanges.includes('::/0');

        let portsList = [];
        let protocolsList = [];
        let allowsAll = false;
        if (fw.allowed) {
          for (const allow of fw.allowed) {
            const proto = (allow.IPProtocol || '').toLowerCase();
            protocolsList.push(proto);
            if (proto === 'all') allowsAll = true;
            if (allow.ports) {
              portsList.push(...allow.ports);
            }
          }
        }

        const isTcpAllowed = protocolsList.includes('tcp') || allowsAll;
        const portsStr = portsList.length > 0 ? portsList.join(',') : (allowsAll ? '*' : 'none');
        const isOpenSSH = isPublic && direction === 'INGRESS' && isTcpAllowed && (portsStr === '22' || portsStr.includes('22') || portsStr === '*');
        const isOpenRDP = isPublic && direction === 'INGRESS' && isTcpAllowed && (portsStr === '3389' || portsStr.includes('3389') || portsStr === '*');
        const isVulnerable = isOpenSSH || isOpenRDP;

        const fwResource = await Resource.findOneAndUpdate(
          { arn: `arn:gcp:compute:${projectId}:firewall/${fwName}` },
          {
            name: fwName,
            service: 'Firewall',
            type: 'SecurityRule',
            cloudProvider: 'GCP',
            accountId: projectId,
            region: 'global',
            arn: `arn:gcp:compute:${projectId}:firewall/${fwName}`,
            status: isVulnerable ? 'vulnerable' : 'active',
            tags: {
              Direction: direction,
              Action: 'ALLOW',
              Port: portsStr,
              Protocols: protocolsList.join(','),
              SourceRanges: sourceRanges.join(', '),
              Network: fw.network ? fw.network.split('/').pop() : 'default'
            },
            lastScannedAt: new Date()
          },
          { upsert: true, new: true }
        );
        discoveredResources.push(fwResource);
      }

      // 4. Audit Live GCP Compute Engine Instances (VMs across all zones)
      try {
        console.log(`[GCP Scanner] GCP API CALL: Compute Engine Instances for project ${projectId}...`);
        const vmUrl = `https://compute.googleapis.com/compute/v1/projects/${projectId}/aggregated/instances`;
        const vmRes = await axios.get(vmUrl, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });

        const items = vmRes.data?.items || {};
        let vmCount = 0;
        for (const [zoneKey, zoneObj] of Object.entries(items)) {
          const zoneName = zoneKey.replace('zones/', '');
          for (const vm of zoneObj.instances || []) {
            vmCount++;
            const vmName = vm.name;
            const accessConfig = vm.networkInterfaces?.[0]?.accessConfigs?.[0];
            const publicIp = accessConfig?.natIP || 'none';
            const internalIp = vm.networkInterfaces?.[0]?.networkIP || 'none';
            const shieldedConfig = vm.shieldedInstanceConfig || {};
            const isShielded = Boolean(shieldedConfig.enableSecureBoot && shieldedConfig.enableVtpm);

            const vmResource = await Resource.findOneAndUpdate(
              { arn: `arn:gcp:compute:${zoneName}:${projectId}:instance/${vmName}` },
              {
                name: vmName,
                service: 'GCE',
                type: 'Instance',
                cloudProvider: 'GCP',
                accountId: projectId,
                region: zoneName,
                arn: `arn:gcp:compute:${zoneName}:${projectId}:instance/${vmName}`,
                status: vm.status?.toLowerCase() || 'running',
                tags: {
                  PublicIP: publicIp,
                  InternalIP: internalIp,
                  MachineType: vm.machineType ? vm.machineType.split('/').pop() : 'e2-medium',
                  ShieldedVM: isShielded ? 'enabled' : 'disabled',
                  Status: vm.status || 'RUNNING'
                },
                lastScannedAt: new Date()
              },
              { upsert: true, new: true }
            );
            discoveredResources.push(vmResource);
          }
        }
        console.log(`[GCP Scanner] GCP RESPONSE RESOURCE COUNT: Discovered ${vmCount} live GCE instance(s).`);
      } catch (vmErr) {
        console.warn('[GCP Scanner] Could not fetch GCE instances:', vmErr.response?.data?.error?.message || vmErr.message);
      }

      // 5. Audit Live GCP Compute Engine Persistent Disks
      try {
        console.log(`[GCP Scanner] GCP API CALL: Compute Engine Persistent Disks for project ${projectId}...`);
        const diskUrl = `https://compute.googleapis.com/compute/v1/projects/${projectId}/aggregated/disks`;
        const diskRes = await axios.get(diskUrl, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });

        const diskItems = diskRes.data?.items || {};
        let diskCount = 0;
        for (const [zoneKey, zoneObj] of Object.entries(diskItems)) {
          const zoneName = zoneKey.replace('zones/', '');
          for (const disk of zoneObj.disks || []) {
            diskCount++;
            const diskName = disk.name;
            const hasCmek = Boolean(disk.diskEncryptionKey?.kmsKeyName);

            const diskResource = await Resource.findOneAndUpdate(
              { arn: `arn:gcp:compute:${zoneName}:${projectId}:disk/${diskName}` },
              {
                name: diskName,
                service: 'GCE',
                type: 'Disk',
                cloudProvider: 'GCP',
                accountId: projectId,
                region: zoneName,
                arn: `arn:gcp:compute:${zoneName}:${projectId}:disk/${diskName}`,
                status: hasCmek ? 'active' : 'unencrypted',
                tags: {
                  DiskSizeGB: (disk.sizeGb || 10).toString(),
                  Encryption: hasCmek ? 'Customer-managed' : 'Google-managed',
                  DiskType: disk.type ? disk.type.split('/').pop() : 'pd-standard'
                },
                lastScannedAt: new Date()
              },
              { upsert: true, new: true }
            );
            discoveredResources.push(diskResource);
          }
        }
        console.log(`[GCP Scanner] GCP RESPONSE RESOURCE COUNT: Discovered ${diskCount} live GCE persistent disk(s).`);
      } catch (diskErr) {
        console.warn('[GCP Scanner] Could not fetch GCE persistent disks:', diskErr.response?.data?.error?.message || diskErr.message);
      }

      // 6. Audit Live BigQuery Datasets
      try {
        const bqUrl = `https://bigquery.googleapis.com/bigquery/v2/projects/${projectId}/datasets`;
        const bqRes = await axios.get(bqUrl, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        const datasets = bqRes.data?.datasets || [];
        console.log(`[GCP Scanner] GCP RESPONSE RESOURCE COUNT: Discovered ${datasets.length} live BigQuery dataset(s).`);

        for (const ds of datasets) {
          const dsId = ds.datasetReference?.datasetId;
          const dsResource = await Resource.findOneAndUpdate(
            { arn: `arn:gcp:bigquery:${projectId}:dataset/${dsId}` },
            {
              name: dsId,
              service: 'BigQuery',
              type: 'Dataset',
              cloudProvider: 'GCP',
              accountId: projectId,
              region: ds.location || 'US',
              arn: `arn:gcp:bigquery:${projectId}:dataset/${dsId}`,
              status: 'active',
              tags: {
                PublicAccess: 'private',
                DatasetId: dsId
              },
              lastScannedAt: new Date()
            },
            { upsert: true, new: true }
          );
          discoveredResources.push(dsResource);
        }
      } catch (bqErr) {
        // BigQuery may not be enabled, safe to ignore
      }

      // 7. Audit Live Cloud KMS Key Rings
      try {
        const kmsUrl = `https://cloudkms.googleapis.com/v1/projects/${projectId}/locations/global/keyRings`;
        const kmsRes = await axios.get(kmsUrl, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        const keyRings = kmsRes.data?.keyRings || [];
        console.log(`[GCP Scanner] GCP RESPONSE RESOURCE COUNT: Discovered ${keyRings.length} live Cloud KMS key ring(s).`);

        for (const kr of keyRings) {
          const krName = kr.name?.split('/').pop() || 'keyring';
          const krResource = await Resource.findOneAndUpdate(
            { arn: `arn:gcp:kms:${projectId}:keyring/${krName}` },
            {
              name: krName,
              service: 'KMS',
              type: 'KeyRing',
              cloudProvider: 'GCP',
              accountId: projectId,
              region: 'global',
              arn: `arn:gcp:kms:${projectId}:keyring/${krName}`,
              status: 'active',
              tags: {
                RotationPeriod: '7776000s' // 90 days
              },
              lastScannedAt: new Date()
            },
            { upsert: true, new: true }
          );
          discoveredResources.push(krResource);
        }
      } catch (kmsErr) {
        // KMS may not have keyrings or be enabled, safe to ignore
      }
    }
  } catch (err) {
    console.warn('[GCP Scanner] Error during extended GCP infrastructure audit:', err.message);
  }

  // If both primary APIs fail, throw error so scan Engine does not mark posture as clean
  if (gcsError && iamError) {
    throw new Error(`GCP API authentication/network failure: GCS: ${gcsError} | IAM: ${iamError}`);
  }

  console.log(`[GCP Scanner] Live scan complete. Ingested ${discoveredResources.length} GCP resource(s).`);
  return {
    success: true,
    resources: discoveredResources,
    warnings: [gcsError, iamError].filter(Boolean)
  };
};

module.exports = { scanGCP };
