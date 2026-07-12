const { EC2Client, DescribeSecurityGroupsCommand } = require('@aws-sdk/client-ec2');
const Resource = require('../models/Resource');

/**
 * Scan EC2 Security Groups and inspect ingress rules, then save in database
 * @param {Object} awsConfig Configuration options for EC2 Client
 * @param {String} accountId The target AWS Account ID
 * @returns {Promise<Array>} List of saved Security Group Mongoose Resource documents
 */
const scanSecurityGroups = async (awsConfig, accountId) => {
  console.log('[SG Scanner] Initializing Security Groups network audit...');
  const ec2Client = new EC2Client(awsConfig);
  const savedResources = [];
  const region = awsConfig.region || 'us-east-1';

  try {
    const sgsRes = await ec2Client.send(new DescribeSecurityGroupsCommand({}));
    const sgs = sgsRes.SecurityGroups || [];
    console.log(`[SG Scanner] Discovered ${sgs.length} Security Group(s) in account.`);

    for (const sg of sgs) {
      const groupId = sg.GroupId;
      const arn = `arn:aws:ec2:${region}:${accountId}:security-group/${groupId}`;
      
      let isOpenSSH = false;
      let isOpenRDP = false;

      // Inspect Inbound (Ingress) Rules list
      const ipPermissions = sg.IpPermissions || [];
      for (const permission of ipPermissions) {
        const fromPort = permission.FromPort;
        const toPort = permission.ToPort;
        const ipRanges = permission.IpRanges || [];

        // Check if any rule allows traffic from 0.0.0.0/0 (Global Public Access)
        const isPublicScope = ipRanges.some((range) => range.CidrIp === '0.0.0.0/0');

        if (isPublicScope) {
          // Check if SSH port (22) or RDP port (3389) falls within the allowed port range
          if (fromPort <= 22 && toPort >= 22) {
            isOpenSSH = true;
          }
          if (fromPort <= 3389 && toPort >= 3389) {
            isOpenRDP = true;
          }
        }
      }

      // Map rule alerts to tags map
      const tags = {
        OpenSSH: isOpenSSH ? 'true' : 'false',
        OpenRDP: isOpenRDP ? 'true' : 'false',
        VpcId: sg.VpcId || 'default',
        GroupName: sg.GroupName || 'unknown',
      };

      const resourceData = {
        name: sg.GroupName || groupId,
        service: 'Security Groups',
        type: 'SecurityGroup',
        cloudProvider: 'AWS',
        accountId,
        region,
        arn,
        status: (isOpenSSH || isOpenRDP) ? 'exposed' : 'active',
        tags,
        creationDate: new Date(), // SGs don't expose CreationTime in API directly
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
    console.error(`[SG Scanner] Ingestion scan failed: ${error.message}`);
    throw error;
  }
};

module.exports = { scanSecurityGroups };
