const { GoogleGenerativeAI } = require('@google/generative-ai');
const Finding = require('../models/Finding');
const { getCanonicalRemediation } = require('../utils/remediationCommands');

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

      // Canonical command single-source-of-truth
      const canonical = getCanonicalRemediation(finding);

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
${cloudProvider === 'GCP' ? '- Client CLI Environment: Google Cloud SDK 585.0.0 (core 2026.09.11). Ensure all commands use modern Google Cloud SDK syntax (specifically: use modern "gcloud storage" commands instead of legacy gsutil).' : ''}

Provide a response with EXACTLY three sections using these exact headings:

### Security Risk & Consequences
Explain the exact security risk and blast radius in 2-3 concise bullet points.

### ${consoleName} Remediation Steps
Provide step-by-step UI instructions on how to fix this vulnerability manually in the ${consoleName}.

### CLI Remediation Command
CRITICAL: The verified canonical CLI command for this finding is:
${canonical.command}

In your "### CLI Remediation Command" section, you MUST output this EXACT code block verbatim:
\`\`\`bash
${canonical.command}
\`\`\`
Do NOT change the command flags or substitute alternative commands, so that the explain guidance matches the automated execution command word-for-word.
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
  const canonical = getCanonicalRemediation(finding);
  const service = finding.resourceId?.service || 'Cloud Asset';
  const resourceName = canonical.resourceName;
  const consoleName = cloudProvider === 'GCP' ? 'Google Cloud Console' : cloudProvider === 'AZURE' ? 'Azure Portal' : 'AWS Management Console';

  return `### Security Risk & Consequences
- **Security Vulnerability:** Misconfiguration detected on ${cloudProvider} asset \`${resourceName}\`: ${finding.title}.
- **Blast Radius:** Non-compliant configuration exposes the resource to unauthorized access, tampering, or audit failures.
- **Compliance Impact:** Violates baseline CIS ${cloudProvider} Benchmarks and NIST security controls.

### ${consoleName} Remediation Steps
1. Open the **${consoleName}** and locate resource \`${resourceName}\`.
2. Open the **Configuration / Security / IAM** settings tab.
3. Update policy to compliant state (${canonical.actionSummary}).
4. Save and verify configuration.

### CLI Remediation Command
\`\`\`bash
${canonical.command}
\`\`\``;
};
