const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const getAwsConfig = () => {
  const region = process.env.AWS_REGION || 'us-east-1';
  
  // Verify configuration keys exist in runtime process environment
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    console.warn(
      '[AWS Config] Warning: AWS credentials missing in environment variables. ' +
      'AWS SDK client will default to local IAM Roles or CLI credentials configuration.'
    );
    return { region };
  }

  return {
    region,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  };
};

module.exports = getAwsConfig();
