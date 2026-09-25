const { GoogleGenerativeAI } = require('@google/generative-ai');
const Finding = require('../models/Finding');

// @desc    Analyze vulnerability and return AI-remediation steps via Gemini Pro
// @route   POST /api/ai/remediate
// @access  Private
exports.explainFinding = async (req, res, next) => {
  const { findingId } = req.body;
  console.log(`[AI Controller] Analyzing finding ID: ${findingId}`);

  try {
    const finding = await Finding.findById(findingId).populate('resourceId');
    if (!finding) {
      return res.status(404).json({
        success: false,
        message: 'Security finding document not found in database.',
      });
    }

    // Determine target Cloud Provider accurately (GCP, AZURE, or AWS)
    const arnStr = finding.resourceArn || '';
    const cloudProvider = (
      finding.resourceId?.cloudProvider ||
      (arnStr.includes('gcp') ? 'GCP' : arnStr.includes('azure') || arnStr.includes('/subscriptions/') ? 'AZURE' : 'AWS')
    ).toUpperCase();

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey || apiKey === 'your_google_gemini_api_key_placeholder') {
      console.log(`[AI Controller] GEMINI_API_KEY not set. Serving precise local ${cloudProvider} fallback remediation.`);
      return res.status(200).json({
        success: true,
        isFallback: true,
        cloudProvider,
        remediation: generateFallbackAnalysis(finding, cloudProvider),
      });
    }

    try {
      console.log(`[AI Controller] Connecting to Google GenAI SDK for ${cloudProvider} remediation...`);
      const genAI = new GoogleGenerativeAI(apiKey);

      const consoleName = cloudProvider === 'GCP' ? 'Google Cloud Console' : cloudProvider === 'AZURE' ? 'Azure Portal' : 'AWS Management Console';
      const cliName = cloudProvider === 'GCP' ? 'Google Cloud SDK (gcloud CLI)' : cloudProvider === 'AZURE' ? 'Azure CLI (az)' : 'AWS CLI v2 (aws)';

      const prompt = `
You are an expert, friendly Cloud Security Architect specializing in multi-cloud compliance (${cloudProvider}). You provide precise, copy-pasteable, error-free remediation instructions.

Analyze the following security vulnerability on ${cloudProvider}:
- Cloud Provider: ${cloudProvider}
- Service: ${finding.resourceId ? finding.resourceId.service : 'Cloud Service'}
- Resource Type: ${finding.resourceId ? finding.resourceId.type : 'Resource'}
- Resource ARN / ID: ${finding.resourceArn}
- Severity: ${finding.severity}
- Finding Title: ${finding.title}
- Description: ${finding.description}
- Remediation Guidance: ${finding.recommendation || ''}

Provide a response with EXACTLY three sections using these exact headings:

### Security Risk & Consequences
Explain the exact security risk and blast radius in 2-3 concise bullet points.

### ${consoleName} Remediation Steps
Provide step-by-step UI instructions on how to fix this vulnerability manually in the ${consoleName}.

### CLI Remediation Command
Provide the exact, copy-pasteable ${cliName} terminal command to remediate this issue. Use standard syntax with no placeholders or invalid flags. Output ONLY a valid bash code block.
`;

      let text = null;
      const modelNames = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];
      
      for (const modelName of modelNames) {
        try {
          console.log(`[AI Controller] Attempting generation with model: ${modelName}`);
          const model = genAI.getGenerativeModel({ model: modelName });
          const result = await model.generateContent(prompt);
          const response = await result.response;
          text = response.text();
          if (text) break;
        } catch (modelErr) {
          console.warn(`[AI Controller] Model ${modelName} failed:`, modelErr.message);
        }
      }

      if (!text) {
        throw new Error('All model attempts failed or returned empty content.');
      }

      res.status(200).json({
        success: true,
        isFallback: false,
        cloudProvider,
        remediation: text,
      });
    } catch (apiError) {
      console.error('[AI Controller] Google Gemini API request failed:', apiError.message);
      
      // Graceful fallback if API fails
      res.status(200).json({
        success: true,
        isFallback: true,
        cloudProvider,
        remediation: generateFallbackAnalysis(finding, cloudProvider),
      });
    }
  } catch (error) {
    console.error('[AI Controller] Execution failed:', error.message);
    next(error);
  }
};

/**
 * Local provider-aware markdown generator template with exact CLI syntax
 * @param {Object} finding Mongoose Finding document
 * @param {String} cloudProvider 'GCP', 'AZURE', or 'AWS'
 * @returns {String} Local markdown text with error-free CLI commands
 */
const generateFallbackAnalysis = (finding, cloudProvider) => {
  const service = finding.resourceId?.service || 'Storage';
  const resourceName = finding.resourceArn.split('/').pop().replace('arn:gcp:storage:::', '').replace('arn:aws:s3:::', '');

  if (cloudProvider === 'GCP') {
    let gcpCliCommand = `# Enable Uniform Bucket-Level Access and remove public allUsers IAM binding\ngcloud storage buckets update gs://${resourceName} --uniform-bucket-level-access\ngcloud storage buckets remove-iam-policy-binding gs://${resourceName} --member=allUsers --role=roles/storage.objectViewer`;

    if (finding.title.includes('Storage Admin') || finding.title.includes('Administrative')) {
      gcpCliCommand = `# Remove public Storage Admin privileges from allUsers\ngcloud storage buckets remove-iam-policy-binding gs://${resourceName} --member=allUsers --role=roles/storage.admin`;
    } else if (finding.title.includes('Logging')) {
      gcpCliCommand = `# Enable Access Logging on GCS Storage Bucket\ngcloud storage buckets update gs://${resourceName} --log-bucket=gs://${resourceName}-logs`;
    } else if (finding.title.includes('Versioning')) {
      gcpCliCommand = `# Enable Object Versioning on GCS Storage Bucket\ngcloud storage buckets update gs://${resourceName} --versioning`;
    } else if (finding.service === 'Firewall' || finding.title.includes('Firewall') || finding.title.includes('SSH')) {
      gcpCliCommand = `# Restrict VPC Ingress Firewall rule source IP ranges to authorized corporate CIDR\ngcloud compute firewall-rules update default-allow-ssh-public --source-ranges=10.0.0.0/16`;
    } else if (finding.service === 'IAM' || finding.title.includes('Service Account')) {
      gcpCliCommand = `# Revoke primitive Owner role from Service Account and grant least-privilege Viewer role\ngcloud projects remove-iam-policy-binding project-25a7942f-6ee6-4832-a57 --member=serviceAccount:${resourceName} --role=roles/owner\ngcloud projects add-iam-policy-binding project-25a7942f-6ee6-4832-a57 --member=serviceAccount:${resourceName} --role=roles/viewer`;
    }

    return `### Security Risk & Consequences
- **Security Vulnerability:** Public exposure / misconfiguration detected on Google Cloud asset \`${resourceName}\`.
- **Blast Radius:** Unauthenticated users can inspect or tamper with cloud resources, violating CIS GCP Benchmarks.
- **Compliance Impact:** Drops your Google Cloud project security posture and violates NIST PR.AC-3 / PR.AC-6 controls.

### Google Cloud Console Remediation Steps
1. Open the [Google Cloud Console](https://console.cloud.google.com/) and navigate to **${service === 'GCS' ? 'Cloud Storage' : service === 'Firewall' ? 'VPC Network ➔ Firewall' : 'IAM & Admin'}**.
2. Locate the resource named \`${resourceName}\`.
3. Open the **Permissions / Configuration** tab.
4. Remove public principals (\`allUsers\` / \`allAuthenticatedUsers\`) and save the configuration.

### CLI Remediation Command
\`\`\`bash
${gcpCliCommand}
\`\`\``;
  }

  if (cloudProvider === 'AZURE') {
    let azureCliCommand = `# Disable Blob Public Access on Azure Storage Account\naz storage account update --name ${resourceName} --resource-group CloudLockr-RG --allow-blob-public-access false`;

    if (finding.service === 'NSG' || finding.title.includes('NSG')) {
      azureCliCommand = `# Update Network Security Group rule to restrict inbound SSH to corporate subnet\naz network nsg rule update --resource-group CloudLockr-RG --nsg-name default-allow-ssh-any --name AllowSSH --source-address-prefixes 10.0.0.0/16`;
    } else if (finding.service === 'EntraID' || finding.title.includes('MFA')) {
      azureCliCommand = `# Enable MFA requirement policy for Entra ID Administrator user\naz entra user update --id ${resourceName} --set authentication.mfaRequired=true`;
    }

    return `### Security Risk & Consequences
- **Security Vulnerability:** Misconfiguration on Azure resource \`${resourceName}\` exposing data or management interfaces.
- **Blast Radius:** Threat actors could access storage blobs or compromise privileged tenant directory accounts.
- **Compliance Impact:** Violates CIS Azure Foundations Benchmark 1.1 / 3.1 controls.

### Azure Portal Remediation Steps
1. Log in to the [Azure Portal](https://portal.azure.com/) and search for **${service === 'BlobStorage' ? 'Storage accounts' : 'Microsoft Entra ID'}**.
2. Select \`${resourceName}\`.
3. Navigate to **Configuration / Security** and disable anonymous access or enforce MFA.
4. Save changes.

### CLI Remediation Command
\`\`\`bash
${azureCliCommand}
\`\`\``;
  }

  // Default AWS Fallback
  let awsCliCommand = `aws s3api put-public-access-block --bucket ${resourceName} --public-access-block-configuration "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"`;

  if (finding.title.includes('Encryption')) {
    awsCliCommand = `aws s3api put-bucket-encryption --bucket ${resourceName} --server-side-encryption-configuration '{"Rules": [{"ApplyServerSideEncryptionByDefault": {"SSEAlgorithm": "AES256"}}]}'`;
  } else if (finding.service === 'Security Groups' || finding.title.includes('SSH')) {
    awsCliCommand = `aws ec2 revoke-security-group-ingress --group-id sg-093785f8caea2f527 --protocol tcp --port 22 --cidr 0.0.0.0/0\naws ec2 authorize-security-group-ingress --group-id sg-093785f8caea2f527 --protocol tcp --port 22 --cidr 10.0.0.0/16`;
  } else if (finding.service === 'IAM' || finding.title.includes('MFA')) {
    awsCliCommand = `aws iam update-account-password-policy --minimum-password-length 14 --require-symbols --require-numbers --require-uppercase-characters`;
  }

  return `### Security Risk & Consequences
- **Security Vulnerability:** AWS resource \`${resourceName}\` has security controls disabled or publicly exposed.
- **Blast Radius:** Internet scanners can discover unencrypted assets or attempt brute-force logins.
- **Compliance Impact:** Violates CIS AWS Foundations Benchmark standards.

### AWS Console Remediation Steps
1. Open the [AWS Management Console](https://console.aws.amazon.com/) and navigate to **${service}**.
2. Select \`${resourceName}\`.
3. Go to **Permissions / Security** and update the setting to compliant defaults.
4. Click **Save Changes**.

### CLI Remediation Command
\`\`\`bash
${awsCliCommand}
\`\`\``;
};
