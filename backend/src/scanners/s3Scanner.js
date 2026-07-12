const {
  S3Client,
  ListBucketsCommand,
  GetPublicAccessBlockCommand,
  GetBucketEncryptionCommand,
} = require('@aws-sdk/client-s3');
const Resource = require('../models/Resource');

/**
 * Scan AWS S3 Buckets in the account and persist/update in database
 * @param {Object} awsConfig Configuration options for S3 Client
 * @param {String} accountId The target AWS Account ID
 * @returns {Promise<Array>} List of saved S3 Mongoose Resource documents
 */
const scanS3 = async (awsConfig, accountId) => {
  console.log('[S3 Scanner] Initializing S3 asset audit...');
  const s3Client = new S3Client(awsConfig);
  const savedResources = [];

  try {
    const listResponse = await s3Client.send(new ListBucketsCommand({}));
    const buckets = listResponse.Buckets || [];
    console.log(`[S3 Scanner] Discovered ${buckets.length} bucket(s) in account.`);

    for (const bucket of buckets) {
      const bucketName = bucket.Name;
      const arn = `arn:aws:s3:::${bucketName}`;
      let status = 'active'; // Default
      let encryption = 'disabled';

      // 1. Audit Public Access Block settings
      try {
        const publicBlockRes = await s3Client.send(
          new GetPublicAccessBlockCommand({ Bucket: bucketName })
        );
        const config = publicBlockRes.PublicAccessBlockConfiguration;
        
        // If any of the blocks are false, we flag it as public
        const isPublic = 
          !config.BlockPublicAcls || 
          !config.IgnorePublicAcls || 
          !config.BlockPublicPolicy || 
          !config.RestrictPublicBuckets;
          
        if (isPublic) {
          status = 'public';
        }
      } catch (err) {
        // If block config doesn't exist, S3 defaults to allow public access policies
        if (err.name === 'NoSuchPublicAccessBlockConfiguration') {
          status = 'public';
        } else {
          console.error(`[S3 Scanner] Error auditing public block for ${bucketName}:`, err.message);
        }
      }

      // 2. Audit Server Side Encryption configurations
      try {
        const encryptionRes = await s3Client.send(
          new GetBucketEncryptionCommand({ Bucket: bucketName })
        );
        if (encryptionRes.ServerSideEncryptionConfiguration) {
          encryption = 'enabled';
        }
      } catch (err) {
        if (err.name === 'ServerSideEncryptionConfigurationNotFoundError') {
          encryption = 'disabled';
        } else {
          console.error(`[S3 Scanner] Error auditing encryption for ${bucketName}:`, err.message);
        }
      }

      // 3. Map to Mongoose Schema and Upsert (insert or update)
      const resourceData = {
        name: bucketName,
        service: 'S3',
        type: 'Bucket',
        cloudProvider: 'AWS',
        accountId,
        region: awsConfig.region || 'us-east-1',
        arn,
        status,
        tags: {
          Encryption: encryption,
          CreationDate: bucket.CreationDate ? bucket.CreationDate.toISOString() : 'Unknown',
        },
        lastScannedAt: new Date(),
      };

      const updatedResource = await Resource.findOneAndUpdate(
        { arn },
        resourceData,
        { new: true, upsert: true }
      );
      savedResources.push(updatedResource);
    }

    return savedResources;
  } catch (error) {
    console.error(`[S3 Scanner] Ingestion scan failed: ${error.message}`);
    throw error;
  }
};

module.exports = { scanS3 };
