const Finding = require('../models/Finding');
const Resource = require('../models/Resource');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);
const { getCanonicalRemediation, applyLiveSdkRemediation } = require('../utils/remediationCommands');

/**
 * @desc    Compute canonical remediation preview and parameter requirements
 * @route   POST /api/ai/preview-remediation
 * @access  Private
 */
exports.previewRemediation = async (req, res, next) => {
  const { findingId, parameters = {} } = req.body;

  try {
    const finding = await Finding.findById(findingId).populate('resourceId');
    if (!finding) {
      return res.status(404).json({
        success: false,
        message: 'Security finding document not found in database.',
      });
    }

    const preview = getCanonicalRemediation(finding, parameters);

    return res.status(200).json({
      success: true,
      ...preview,
    });
  } catch (err) {
    console.error(`[Remediation Controller] Preview failure: ${err.message}`);
    return res.status(500).json({
      success: false,
      message: `Failed to compute remediation preview: ${err.message}`,
    });
  }
};

/**
 * @desc    Execute live cloud remediation for a finding with user-specified parameters
 * @route   POST /api/ai/execute-remediation
 * @access  Private (Admin & Security Analyst only)
 */
exports.executeRemediation = async (req, res, next) => {
  const { findingId, parameters = {}, command: userSuppliedCommand } = req.body;
  const user = req.user;

  console.log(`[Remediation Controller] Remediation triggered for finding ${findingId} by ${user?.name} (${user?.role})`);

  // 1. Role-Based Access Control: Only Admin and Security Analyst permitted
  const userRole = (user?.role || '').toLowerCase();
  if (userRole !== 'admin' && userRole !== 'security analyst') {
    return res.status(403).json({
      success: false,
      message: 'Access Denied: Only Admin and Security Analyst roles are authorized to execute cloud remediations.',
    });
  }

  try {
    // 2. Locate Finding & Associated Resource
    const finding = await Finding.findById(findingId).populate('resourceId');
    if (!finding) {
      return res.status(404).json({
        success: false,
        message: 'Security finding document not found in database.',
      });
    }

    // 3. Generate Canonical Verified Command from Single Source of Truth
    const canonical = getCanonicalRemediation(finding, parameters);
    const executedCommand = userSuppliedCommand?.trim() || canonical.command;
    const actionSummary = canonical.actionSummary;
    const cloudProvider = canonical.cloudProvider;
    const resourceName = canonical.resourceName;

    console.log(`[Remediation Controller] Canonical command generated: ${executedCommand}`);

    // 4. Apply Live Cloud SDK Mutation (Guarantees cloud asset compliance immediately)
    const sdkResult = await applyLiveSdkRemediation(finding, parameters);
    if (sdkResult.sdkAttempted) {
      console.log(`[Remediation Controller] ☁️ Live SDK result: ${sdkResult.sdkSuccess ? 'SUCCESS' : 'NOTICE'} - ${sdkResult.sdkNotice}`);
    }

    // 5. Execute Command directly in the System CLI Terminal
    let cliOutput = '';
    let cliError = null;
    let cliExecutedSuccessfully = false;

    if (executedCommand) {
      try {
        console.log(`[Remediation Controller] 💻 Executing CLI command in system shell: ${executedCommand}`);

        // Enhance system PATH with all CLI bin paths
        const extraPaths = [
          'C:\\Users\\maham\\AppData\\Local\\Programs\\Python\\Python310\\Scripts',
          'C:\\Program Files\\Microsoft SDKs\\Azure\\CLI2\\wbin',
          'C:\\Users\\maham\\AppData\\Local\\Google\\Cloud SDK\\google-cloud-sdk\\bin',
          'C:\\Program Files (x86)\\Google\\Cloud SDK\\google-cloud-sdk\\bin',
          'C:\\Program Files\\Google\\Cloud SDK\\google-cloud-sdk\\bin'
        ].join(';');

        // Pass server credentials into command environment
        const azureCfg = require('../config/azure');
        const shellEnv = {
          ...process.env,
          PATH: `${extraPaths};${process.env.PATH || ''}`,
          AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID || '',
          AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY || '',
          AWS_DEFAULT_REGION: process.env.AWS_REGION || 'eu-north-1',
          GOOGLE_APPLICATION_CREDENTIALS: require('../config/gcp').keyFilePath || '',
          CLOUDSDK_CORE_PROJECT: require('../config/gcp').projectId || '',
          AZURE_CLIENT_ID: azureCfg.clientId || '',
          AZURE_CLIENT_SECRET: azureCfg.clientSecretValue || '',
          AZURE_TENANT_ID: azureCfg.tenantId || '',
          AZURE_SUBSCRIPTION_ID: azureCfg.subscriptionId || '',
        };

        const { stdout, stderr } = await execPromise(executedCommand, {
          env: shellEnv,
          timeout: 20000,
          windowsHide: true,
        });

        cliOutput = stdout || stderr || 'Command returned 0 (no output). Policy patch applied.';
        cliExecutedSuccessfully = true;
        console.log(`[Remediation Controller] CLI execution output:\n${cliOutput}`);
      } catch (cmdErr) {
        cliExecutedSuccessfully = false;
        cliError = cmdErr.message;
        cliOutput = cmdErr.stderr || cmdErr.stdout || cmdErr.message || 'Execution error';
        console.warn(`[Remediation Controller] CLI execution notice: ${cmdErr.message}`);
      }
    }

    // 6. Check if execution actually succeeded
    const isSuccess = cliExecutedSuccessfully || sdkResult.sdkSuccess;

    if (!isSuccess) {
      console.warn(`[Remediation Controller] ❌ Execution rejected by ${cloudProvider}:\n${cliOutput}`);

      let friendlyReason = 'The cloud provider rejected the command.';
      if (cliOutput.includes('AccessDenied') || cliOutput.includes('denied') || cliOutput.includes('does not have') || cliOutput.includes('403') || cliOutput.includes('AuthorizationFailed')) {
        if (cloudProvider === 'AZURE') {
          friendlyReason = `Azure RBAC Access Denied: The Service Principal ('${require('../config/azure').clientId}') has 'Reader' permissions and lacks the 'Contributor' (or 'Storage Account Contributor') role on subscription '${require('../config/azure').subscriptionId}'.`;
        } else if (cloudProvider === 'GCP') {
          friendlyReason = `GCP IAM Access Denied: The service account ('cloudlockr-scanner') lacks the required write permission (e.g. 'roles/storage.admin' or 'roles/editor') on GCP to modify this resource.`;
        } else {
          friendlyReason = `AWS IAM Access Denied: The IAM identity ('cloudlockr-scanner') has Read-Only policies and lacks write permissions (e.g. 'AmazonS3FullAccess') to apply this fix.`;
        }
      }

      return res.status(403).json({
        success: false,
        message: friendlyReason,
        error: cliOutput,
        executionDetails: {
          cloudProvider,
          targetResource: finding.resourceArn,
          resourceName,
          commandExecuted: executedCommand,
          actionSummary,
          parametersApplied: parameters,
          remediatedBy: user.name,
          role: user.role,
          executedAt: new Date().toISOString(),
          cliOutput: cliOutput,
          cliExecutedSuccessfully: false,
          sdkNotice: sdkResult.sdkNotice,
        }
      });
    }

    // 7. Update Finding in Database: transition status to 'Pending Verification' ONLY if the fix actually succeeded in cloud
    finding.status = 'Pending Verification';
    finding.lastDetectedAt = new Date();
    finding.remediationDetails = {
      dispatchedAt: new Date(),
      dispatchedBy: user.name,
      command: executedCommand,
      parameters: parameters,
      cliOutput: cliOutput,
      cliExecutedSuccessfully,
      sdkResult,
    };
    await finding.save();

    console.log(`[Remediation Controller] ⏳ Finding '${finding.title}' dispatched by ${user.name}. Status: PENDING VERIFICATION.`);

    return res.status(200).json({
      success: true,
      message: `Remediation command succeeded on ${cloudProvider}! Finding placed in "Pending Verification" — run an environment scan to verify compliance.`,
      status: 'Pending Verification',
      finding: {
        _id: finding._id,
        title: finding.title,
        status: 'Pending Verification',
        lastDetectedAt: finding.lastDetectedAt,
      },
      executionDetails: {
        cloudProvider,
        targetResource: finding.resourceArn,
        resourceName,
        commandExecuted: executedCommand,
        actionSummary,
        parametersApplied: parameters,
        remediatedBy: user.name,
        role: user.role,
        executedAt: new Date().toISOString(),
        cliOutput: cliOutput,
        cliExecutedSuccessfully,
        sdkNotice: sdkResult.sdkNotice,
      },
    });

  } catch (error) {
    console.error(`[Remediation Controller] Execution failure: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: `Remediation execution failed: ${error.message}`,
    });
  }
};
