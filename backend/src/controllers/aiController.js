const { GoogleGenerativeAI } = require('@google/generative-ai');
const Finding = require('../models/Finding');

// @desc    Analyze vulnerability and return AI-remediation steps via Gemini Pro
// @route   GET /api/ai/explain/:findingId
// @access  Private
exports.explainFinding = async (req, res, next) => {
  const { findingId } = req.params;
  console.log(`[AI Controller] Analyzing finding ID: ${findingId}`);

  try {
    const finding = await Finding.findById(findingId).populate('resourceId');
    if (!finding) {
      return res.status(404).json({
        success: false,
        message: 'Security finding document not found in database.',
      });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey || apiKey === 'your_google_gemini_api_key_placeholder') {
      console.log('[AI Controller] GEMINI_API_KEY not set. Serving local fallback template.');
      return res.status(200).json({
        success: true,
        isFallback: true,
        analysis: generateFallbackAnalysis(finding),
      });
    }

    try {
      console.log('[AI Controller] Connecting to Google GenAI SDK...');
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' }); // Use flash as default fast model

      const prompt = `
You are an expert DevSecOps and Cloud Security Architect. Analyze the following security vulnerability:
- Service: ${finding.resourceId ? finding.resourceId.service : 'Cloud Asset'}
- Resource Type: ${finding.resourceId ? finding.resourceId.type : 'Unknown'}
- Resource ARN: ${finding.resourceArn}
- Severity: ${finding.severity}
- Finding Title: ${finding.title}
- Description: ${finding.description}

Provide a response with exactly two sections using these headings:

### Security Risk Analysis
Explain the exact security risk and blast radius in 3 short, high-impact bullet points.

### Remediation Command
Provide the exact, copy-pasteable AWS CLI v2 command to remediate this configuration issue.
Output ONLY the bash code block containing standard aws-cli commands, prefixed with comments explaining each flag. Do not add any extra conversational text.
`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      res.status(200).json({
        success: true,
        isFallback: false,
        analysis: text,
      });
    } catch (apiError) {
      console.error('[AI Controller] Google Gemini API request failed:', apiError.message);
      
      // Graceful fallback if API fails (rate limits, key issues, server down)
      res.status(200).json({
        success: true,
        isFallback: true,
        analysis: generateFallbackAnalysis(finding),
      });
    }
  } catch (error) {
    console.error('[AI Controller] Execution failed:', error.message);
    next(error);
  }
};

/**
 * Local markdown generator template if Gemini API key is missing or failed
 * @param {Object} finding Mongoose Finding document
 * @returns {String} Local markdown text
 */
const generateFallbackAnalysis = (finding) => {
  return `### Security Risk Analysis
- **Resource Exposure:** The configurations of resource \`${finding.resourceArn.split('/').pop()}\` deviate from security baselines.
- **Access Vectors:** Left unaddressed, unauthorized identities may discover and exploit this asset configuration drift.
- **Compliance Gap:** Flagged as a **${finding.severity}** severity risk mapping to standard check policies (**${finding.complianceMapping ? finding.complianceMapping.cisAWS : 'CIS Baseline'}**).

### Remediation Command
\`\`\`bash
# Recommended Fix Action (Local database fallback):
# Execute standard fix instructions:
# ${finding.recommendation}

# For detailed command syntax, visit:
# ${finding.docLink || 'https://docs.aws.amazon.com/'}
\`\`\``;
};
