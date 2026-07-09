const { STSClient, GetCallerIdentityCommand } = require('@aws-sdk/client-sts');
const awsConfig = require('../config/aws');

const testConnection = async () => {
  console.log('[AWS Test] Initializing STS client...');
  console.log(`[AWS Test] Target Region: ${awsConfig.region || 'default'}`);
  console.log(`[AWS Test] Using Explicit Credentials: ${!!awsConfig.credentials}`);

  const stsClient = new STSClient(awsConfig);
  const command = new GetCallerIdentityCommand({});

  try {
    console.log('[AWS Test] Dispatching GetCallerIdentity request to AWS STS API...');
    const data = await stsClient.send(command);
    
    console.log('\n==================================================');
    console.log('✅ AWS SDK v3 Authentication Successful!');
    console.log('==================================================');
    console.log(`Account ID  : ${data.Account}`);
    console.log(`User ARN    : ${data.Arn}`);
    console.log(`User ID     : ${data.UserId}`);
    console.log('==================================================\n');
    
    console.log('[AWS Test] CloudLockr backend is authorized to query cloud configurations. Exiting.');
    process.exit(0);
  } catch (error) {
    console.error('\n==================================================');
    console.error('❌ AWS SDK v3 Authentication Failed!');
    console.error('==================================================');
    console.error(`Error Type    : ${error.name || 'Unknown'}`);
    console.error(`Error Message : ${error.message}`);
    console.error('==================================================\n');
    
    console.log('Troubleshooting Tips:');
    console.log('1. Verify AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY are spelled correctly in backend/.env');
    console.log('2. Ensure there are no spaces or quotes around keys inside the .env file');
    console.log('3. Ensure your local clock is synced with internet time (AWS rejects requests with skewed timestamps)');
    console.log('4. Verify your internet connection is active');
    
    process.exit(1);
  }
};

testConnection();
