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
${cloudProvider === 'GCP' ? '- Client CLI Environment: Google Cloud SDK 585.0.0 (core 2026.09.11). Ensure all commands use modern Google Cloud SDK 585.0.0 syntax (specifically: use modern "gcloud storage" commands instead of legacy gsutil, modern "gcloud compute firewall-rules", "gcloud projects add-iam-policy-binding / remove-iam-policy-binding", and "gcloud sql instances patch").' : ''}
${cloudProvider === 'AZURE' ? `- Client Console & CLI Environment: Current Microsoft Azure Portal (latest UI redesign) and modern Azure CLI (az 2.60+).
CRITICAL AZURE PORTAL CONSOLE NAVIGATION INSTRUCTIONS (Must follow strictly - DO NOT reference outdated or nonexistent menus):
1. IDENTITY / MFA: Microsoft rebranded "Azure Active Directory (Azure AD)" to "Microsoft Entra ID". NEVER reference "Azure Active Directory". The path is: Search for "Microsoft Entra ID" > in left sidebar under "Manage", select "Properties" > scroll down to the bottom and click "Manage security defaults" > toggle "Security defaults" to "Enabled" > click "Save". (Or under "Protection" > "Conditional Access" > "New policy").
2. STORAGE ACCOUNTS / BLOB:
   - In modern Azure Portal, search for "Storage accounts" > select account > in left sidebar under "Settings", click "Configuration".
   - The public access setting is explicitly titled "Allow Blob anonymous access" (NOT "Allow Blob public access"). Change this to "Disabled".
   - TLS version is under "Settings" > "Configuration" > "Minimum TLS version" > select "Version 1.2".
   - HTTPS enforcement is under "Settings" > "Configuration" > "Secure transfer required" > set to "Enabled".
   - Click "Save" at the top.
   - Container-level permissions: in left sidebar under "Data storage", select "Containers" > click container > click "Change access level" in the top bar > select "Private (no anonymous access)" > click "OK".
   - Network firewall: in left sidebar under "Security + networking", select "Networking".
3. NETWORK SECURITY GROUPS (NSG):
   - Search for "Network security groups" > select NSG.
   - In left sidebar under "Settings", select "Inbound security rules".
   - Click the rule allowing port 22 (SSH) or 3389 (RDP) from "*" or "Internet" (e.g. AllowSSH / Port_22).
   - In the edit panel: change "Source" from "Any" or "Service Tag" to "IP Addresses" and input specific authorized admin IP/CIDR (e.g., your office/VPN IP /32), or change "Action" to "Deny".
   - Click "Save".
4. VIRTUAL MACHINES (PUBLIC IP & DISKS):
   - To remove Public IP: Go to "Virtual machines" > select VM > in left sidebar under "Networking", click "Network settings" > click the hyperlinked "Network Interface" name (e.g. vm-nic) > in the NIC page under "Settings", click "IP configurations" > click "ipconfig1" > change "Public IP address" to "Disassociate" (or None) > click "Save".
   - For Disk Encryption: In the VM page under "Settings", click "Disks" > select OS disk > "Encryption".
5. AZURE SQL:
   - Go to "SQL servers" > select server > in left sidebar under "Security", select "Networking" (NOT "Firewalls and virtual networks"). Under "Public network access", select "Disabled". Under "Firewall rules", delete any 0.0.0.0-255.255.255.255 rules and uncheck "Allow Azure services and resources to access this server".
   - Under "Security", select "Transparent data encryption" > verify Data encryption is "Enabled".
6. AZURE KEY VAULT:
   - Go to "Key vaults" > select vault > under "Settings", select "Properties" > enable "Purge protection". Under "Settings" > "Networking", set "Allow access from" to "Disabled" or "Selected networks".
Provide exact, clickable, unambiguous modern Azure Portal navigation breadcrumbs.` : ''}

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
    } else if (finding.service === 'CloudSQL' || finding.title.includes('Cloud SQL') || finding.title.includes('Public IP')) {
      gcpCliCommand = `# Disable public authorized networks and enforce private connectivity on Cloud SQL instance\ngcloud sql instances patch ${resourceName} --no-assign-ip`;
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
    const isNsg = finding.service === 'NSG' || finding.title.includes('NSG') || finding.title.includes('SSH') || finding.title.includes('RDP');
    const isEntra = finding.service === 'EntraID' || finding.title.includes('MFA') || finding.title.includes('Identity') || finding.title.includes('Entra');
    const isVm = finding.service === 'VM' || finding.resourceType === 'VirtualMachine' || finding.title.includes('Virtual Machine') || finding.title.includes('Public IP');
    const isSql = finding.service === 'SQL' || finding.service === 'AzureSQL' || finding.title.includes('SQL');
    const isKeyVault = finding.service === 'KeyVault' || finding.title.includes('Key Vault');

    let azurePortalSteps = '';
    let azureCliCommand = '';

    if (isNsg) {
      azurePortalSteps = `1. Log in to the [Azure Portal](https://portal.azure.com/) and search for **Network security groups** in the top search bar.
2. Select your Network Security Group: \`${resourceName}\`.
3. In the left navigation pane under **Settings**, click **Inbound security rules**.
4. Click on the offending rule allowing port 22 or 3389 (e.g., \`AllowSSH\`, \`AllowRDP\`, or rules with Source \`*\` or \`Internet\`).
5. In the edit pane on the right:
   - Change **Source** from **Any** or **Service Tag** to **IP Addresses**.
   - In **Source IP addresses/CIDR ranges**, enter your authorized corporate admin IP (e.g. \`YOUR_IP/32\` or \`10.0.0.0/16\`), or change **Action** to **Deny**.
6. Click **Save** at the bottom of the blade.`;

      azureCliCommand = `# Restrict Inbound NSG rule to authorized administrative CIDR
az network nsg rule update \\
  --resource-group CloudLockr-RG \\
  --nsg-name ${resourceName} \\
  --name AllowSSH \\
  --source-address-prefixes "10.0.0.0/16"`;
    } else if (isEntra) {
      azurePortalSteps = `1. Log in to the [Azure Portal](https://portal.azure.com/) and search for **Microsoft Entra ID** (formerly Azure Active Directory).
2. In the left navigation menu under **Manage**, select **Properties**.
3. Scroll down to the bottom of the page and click the blue link: **Manage security defaults**.
4. In the side panel that appears, toggle **Security defaults** to **Enabled**.
5. Click **Save**.
*(Alternatively, if using Entra ID P1/P2: Navigate to **Protection** ➔ **Conditional Access** ➔ **Create new policy**, and set Access Controls to "Require multifactor authentication" for all administrative roles).*`;

      azureCliCommand = `# Enforce Security Defaults across tenant via Microsoft Graph API
az rest --method patch \\
  --url "https://graph.microsoft.com/v1.0/policies/identitySecurityDefaultsEnforcementPolicy" \\
  --headers "Content-Type=application/json" \\
  --body "{\\"isEnabled\\": true}"`;
    } else if (isVm) {
      azurePortalSteps = `1. Log in to the [Azure Portal](https://portal.azure.com/) and search for **Virtual machines**.
2. Select your VM: \`${resourceName}\`.
3. In the left navigation menu under **Networking**, click **Network settings**.
4. Click on the hyperlinked **Network Interface** name (e.g., \`${resourceName}-nic\`).
5. In the Network Interface blade, under **Settings**, click **IP configurations**.
6. Click on the primary configuration row (e.g., \`ipconfig1\`).
7. In the panel that opens, under **Public IP address**, select **Disassociate** (or choose **Associate: None**).
8. Click **Save** at the top.`;

      azureCliCommand = `# Disassociate public IP address from Azure VM Network Interface
az network nic ip-config update \\
  --resource-group CloudLockr-RG \\
  --nic-name ${resourceName}-nic \\
  --name ipconfig1 \\
  --remove PublicIpAddress`;
    } else if (isSql) {
      azurePortalSteps = `1. Log in to the [Azure Portal](https://portal.azure.com/) and search for **SQL servers**.
2. Select your logical SQL server: \`${resourceName}\`.
3. In the left navigation menu under **Security**, click **Networking** (formerly "Firewalls and virtual networks").
4. Under **Public network access**, select **Disabled** (or choose **Selected networks** with specific IPs).
5. Under **Exceptions**, uncheck **"Allow Azure services and resources to access this server"** to prevent open access.
6. Under **Firewall rules**, remove any rules with Start IP \`0.0.0.0\`.
7. Click **Save** at the top.`;

      azureCliCommand = `# Disable Public Network Access on Azure SQL Server
az sql server update \\
  --name ${resourceName} \\
  --resource-group CloudLockr-RG \\
  --public-network-access Disabled`;
    } else if (isKeyVault) {
      azurePortalSteps = `1. Log in to the [Azure Portal](https://portal.azure.com/) and search for **Key vaults**.
2. Select your Key Vault: \`${resourceName}\`.
3. In the left navigation menu under **Settings**, click **Properties**.
4. In the Purge protection section, click **Enable purge protection** (ensures deleted items cannot be permanently deleted during retention).
5. In the left menu under **Settings**, click **Networking** and set **Allow access from** to **Disabled** or **Selected networks**.
6. Click **Save**.`;

      azureCliCommand = `# Enable Purge Protection and restrict network on Azure Key Vault
az keyvault update \\
  --name ${resourceName} \\
  --resource-group CloudLockr-RG \\
  --enable-purge-protection true \\
  --default-action Deny`;
    } else {
      // Default: Storage Accounts / Blob Storage
      azurePortalSteps = `1. Log in to the [Azure Portal](https://portal.azure.com/) and search for **Storage accounts**.
2. Select your storage account: \`${resourceName}\`.
3. In the left navigation pane under **Settings**, click **Configuration**.
4. Look for the setting titled **"Allow Blob anonymous access"** (Note: Microsoft renamed this from "Allow Blob public access").
5. Set **Allow Blob anonymous access** to **Disabled**.
6. Ensure **Minimum TLS version** is set to **Version 1.2**.
7. Ensure **Secure transfer required** is set to **Enabled**.
8. Click **Save** at the top left of the Configuration toolbar.
9. *(Container verification)*: In the left navigation under **Data storage**, click **Containers**. Select your container, click **Change access level** in the top bar, and verify it is set to **Private (no anonymous access)**. Click **OK**.`;

      azureCliCommand = `# Disable Blob Anonymous Access and enforce TLS 1.2 on Storage Account
az storage account update \\
  --name ${resourceName} \\
  --resource-group CloudLockr-RG \\
  --allow-blob-public-access false \\
  --min-tls-version TLS1_2 \\
  --https-only true`;
    }

    return `### Security Risk & Consequences
- **Security Vulnerability:** Misconfiguration on Azure resource \`${resourceName}\` violating baseline CIS Azure Benchmarks.
- **Blast Radius:** Threat actors or unauthenticated internet entities can access internal assets, storage blobs, or administrative endpoints.
- **Compliance Impact:** Violates CIS Microsoft Azure Foundations Benchmark and NIST PR.AC controls.

### Azure Portal Remediation Steps
${azurePortalSteps}

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
