const { CloudTrailClient, DescribeTrailsCommand, GetTrailStatusCommand } = require('@aws-sdk/client-cloudtrail');
const Resource = require('../models/Resource');

/**
 * Scan CloudTrail configurations and inspect logging status, then save in database
 * @param {Object} awsConfig Configuration options for CloudTrail Client
 * @param {String} accountId The target AWS Account ID
 * @returns {Promise<Array>} List of saved CloudTrail Mongoose Resource documents
 */
const scanCloudTrail = async (awsConfig, accountId) => {
  console.log('[CloudTrail Scanner] Initializing audit trails inspection...');
  const ctClient = new CloudTrailClient(awsConfig);
  const savedResources = [];
  const region = awsConfig.region || 'us-east-1';

  try {
    const trailsRes = await ctClient.send(new DescribeTrailsCommand({}));
    const trails = trailsRes.trailList || [];
    console.log(`[CloudTrail Scanner] Discovered ${trails.length} Audit Trail(s) in account.`);

    for (const trail of trails) {
      const trailName = trail.Name;
      const arn = trail.TrailARN || `arn:aws:cloudtrail:${region}:${accountId}:trail/${trailName}`;
      let isLogging = false;

      // Audit status logging parameters
      try {
        const statusRes = await ctClient.send(new GetTrailStatusCommand({ Name: trailName }));
        isLogging = !!statusRes.IsLogging;
      } catch (err) {
        console.error(`[CloudTrail Scanner] Error auditing status for trail ${trailName}:`, err.message);
      }

      // Map dynamic properties to tags object
      const tags = {
        S3BucketName: trail.S3BucketName || 'unknown',
        MultiRegionTrail: trail.IsMultiRegionTrail ? 'true' : 'false',
        LoggingActive: isLogging ? 'true' : 'false',
      };

      const resourceData = {
        name: trailName,
        service: 'CloudTrail',
        type: 'Trail',
        cloudProvider: 'AWS',
        accountId,
        region: trail.HomeRegion || region,
        arn,
        status: isLogging ? 'active' : 'disabled',
        tags,
        creationDate: new Date(), // API metadata does not expose creation date directly
        lastScannedAt: new Date(),
      };

      const updated = await Resource.findOneAndUpdate(
        { arn },
        resourceData,
        { new: true, upsert: true }
      );
      savedResources.push(updated);
    }

    return savedResources;
  } catch (error) {
    console.error(`[CloudTrail Scanner] Ingestion scan failed: ${error.message}`);
    throw error;
  }
};

module.exports = { scanCloudTrail };
