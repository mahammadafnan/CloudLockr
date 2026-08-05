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

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey || apiKey === 'your_google_gemini_api_key_placeholder') {
      console.log('[AI Controller] GEMINI_API_KEY not set. Serving local fallback template.');
      return res.status(200).json({
        success: true,
        isFallback: true,
        remediation: generateFallbackAnalysis(finding),
      });
    }

    try {
      console.log('[AI Controller] Connecting to Google GenAI SDK...');
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

      const prompt = `
You are a friendly, enthusiastic, and incredibly helpful Cloud Security Mentor. You explain complex cloud security concepts in a simple, easy-to-understand, and conversational way, exactly like you are guiding a friend. Analyze the following security vulnerability:
- Service: ${finding.resourceId ? finding.resourceId.service : 'Cloud Asset'}
- Resource Type: ${finding.resourceId ? finding.resourceId.type : 'Unknown'}
- Resource ARN: ${finding.resourceArn}
- Severity: ${finding.severity}
- Finding Title: ${finding.title}
- Description: ${finding.description}

Provide a response with exactly three sections using these exact headings:

### Security Risk & Consequences
Explain the exact security problem and its potential consequences (blast radius) in 2-3 short, easy-to-understand bullet points. Use a friendly, conversational tone (e.g. "Here is what happens if we leave this open!").

### AWS Console Remediation Steps
Provide super clear, friendly, step-by-step instructions on how the user can fix this vulnerability manually in the AWS Console (e.g., "First, go to the EC2 Dashboard..."). Write it as if you are guiding a beginner over their shoulder.

### CLI Remediation Command
Provide the exact, copy-pasteable AWS CLI v2 command to remediate this issue. Output ONLY the bash code block.
`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      res.status(200).json({
        success: true,
        isFallback: false,
        remediation: text,
      });
    } catch (apiError) {
      console.error('[AI Controller] Google Gemini API request failed:', apiError.message);
      
      // Graceful fallback if API fails (rate limits, key issues, server down)
      res.status(200).json({
        success: true,
        isFallback: true,
        remediation: generateFallbackAnalysis(finding),
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
  return `### Security Risk & Consequences
- **Here is the problem:** You have a misconfiguration in your ${finding.resourceId ? finding.resourceId.service : 'AWS'} resource!
- **What happens if we leave this open:** Hackers constantly scan the internet for vulnerabilities just like this. If they find it, they could exploit it to steal data or take over the resource!
- **Compliance penalty:** This violates the CIS Baseline and drops your security score.

### AWS Console Remediation Steps
Don't worry, we can fix this easily! Here is exactly what to click in the AWS Console:
1. Log in to your AWS Console and search for **${finding.resourceId ? finding.resourceId.service : 'the affected service'}**.
2. Find the resource named \`${finding.resourceArn.split('/').pop()}\`.
3. Click into its settings and look for the configuration mentioned in this finding: *${finding.title}*.
4. Update the setting to the recommended secure configuration and click **Save**.

### CLI Remediation Command
\`\`\`bash
# If you prefer to use the terminal instead of clicking in the UI, you can use the AWS CLI!
# Follow these exact instructions:
# ${finding.recommendation}

# For detailed command syntax, visit:
# ${finding.docLink || 'https://docs.aws.amazon.com/'}
\`\`\``;
};
