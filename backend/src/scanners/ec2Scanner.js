const { EC2Client, DescribeInstancesCommand, DescribeVolumesCommand } = require('@aws-sdk/client-ec2');
const Resource = require('../models/Resource');

/**
 * Scan EC2 Instances and EBS Volumes, then persist in MongoDB
 * @param {Object} awsConfig Configuration options for EC2 Client
 * @param {String} accountId The target AWS Account ID
 * @returns {Promise<Array>} List of saved EC2/EBS Mongoose Resource documents
 */
const scanEC2 = async (awsConfig, accountId) => {
  console.log('[EC2 Scanner] Initializing EC2 & EBS volume audit...');
  const ec2Client = new EC2Client(awsConfig);
  const savedResources = [];
  const region = awsConfig.region || 'us-east-1';

  try {
    // 1. Scan EC2 Instances
    const instancesRes = await ec2Client.send(new DescribeInstancesCommand({}));
    const reservations = instancesRes.Reservations || [];
    console.log(`[EC2 Scanner] Discovered ${reservations.length} reservation block(s).`);

    for (const reservation of reservations) {
      const instances = reservation.Instances || [];
      for (const instance of instances) {
        const instanceId = instance.InstanceId;
        const arn = `arn:aws:ec2:${region}:${accountId}:instance/${instanceId}`;
        const status = instance.State ? instance.State.Name : 'unknown';
        
        // Parse tag array to flat map object
        const tags = {};
        if (instance.Tags) {
          instance.Tags.forEach((t) => {
            tags[t.Key] = t.Value;
          });
        }
        
        // Add extra metadata to tags for rule evaluations later
        tags['InstanceType'] = instance.InstanceType || 'unknown';
        tags['AmiId'] = instance.ImageId || 'unknown';
        
        const resourceData = {
          name: tags['Name'] || instanceId,
          service: 'EC2',
          type: 'Instance',
          cloudProvider: 'AWS',
          accountId,
          region,
          arn,
          status,
          tags,
          creationDate: instance.LaunchTime ? new Date(instance.LaunchTime) : new Date(),
          lastScannedAt: new Date(),
        };

        const updated = await Resource.findOneAndUpdate(
          { arn },
          resourceData,
          { new: true, upsert: true }
        );
        savedResources.push(updated);
      }
    }

    // 2. Scan EBS Volumes
    try {
      const volumesRes = await ec2Client.send(new DescribeVolumesCommand({}));
      const volumes = volumesRes.Volumes || [];
      console.log(`[EC2 Scanner] Discovered ${volumes.length} EBS volume(s).`);

      for (const volume of volumes) {
        const volumeId = volume.VolumeId;
        const arn = `arn:aws:ec2:${region}:${accountId}:volume/${volumeId}`;
        const status = volume.State || 'unknown';

        const tags = {};
        if (volume.Tags) {
          volume.Tags.forEach((t) => {
            tags[t.Key] = t.Value;
          });
        }

        // Check encryption properties
        const isEncrypted = !!volume.Encrypted;
        tags['Encrypted'] = isEncrypted ? 'enabled' : 'disabled';
        tags['SizeGB'] = String(volume.Size || 0);

        const resourceData = {
          name: tags['Name'] || volumeId,
          service: 'EBS',
          type: 'Volume',
          cloudProvider: 'AWS',
          accountId,
          region,
          arn,
          status,
          tags,
          creationDate: volume.CreateTime ? new Date(volume.CreateTime) : new Date(),
          lastScannedAt: new Date(),
        };

        const updated = await Resource.findOneAndUpdate(
          { arn },
          resourceData,
          { new: true, upsert: true }
        );
        savedResources.push(updated);
      }
    } catch (err) {
      console.error('[EC2 Scanner] EBS volume audit failed:', err.message);
    }

    return savedResources;
  } catch (error) {
    console.error(`[EC2 Scanner] Ingestion scan failed: ${error.message}`);
    throw error;
  }
};

module.exports = { scanEC2 };
