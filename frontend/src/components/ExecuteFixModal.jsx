import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import {
  HiLightningBolt,
  HiX,
  HiOutlineCheckCircle,
  HiOutlineExclamation,
  HiOutlineTerminal,
  HiOutlineClipboardCopy,
  HiOutlineRefresh,
  HiOutlineClock,
  HiCheck
} from 'react-icons/hi';

const ExecuteFixModal = ({ finding, isOpen, onClose, onSuccess }) => {
  if (!isOpen || !finding) return null;

  // Determine Cloud Provider
  const arnStr = finding.resourceArn || '';
  const cloudProvider = (
    finding.resourceId?.cloudProvider ||
    (arnStr.includes('gcp') ? 'GCP' : arnStr.includes('azure') || arnStr.includes('/subscriptions/') ? 'AZURE' : 'AWS')
  ).toUpperCase();

  // Extract cleanest initial resource name
  const rawResourceName = finding.resourceId?.name ||
    (arnStr.startsWith('arn:aws:s3:::') ? arnStr.replace('arn:aws:s3:::', '') :
     arnStr.startsWith('arn:gcp:storage:::') ? arnStr.replace('arn:gcp:storage:::', '') :
     arnStr.split(':').pop().split('/').pop() || 'resource');

  // Detect Parameter Requirements
  const titleLower = (finding.title || '').toLowerCase();
  const isLoggingFinding = titleLower.includes('logging');
  const isNetworkFinding = titleLower.includes('ssh') || titleLower.includes('rdp') || titleLower.includes('firewall') || titleLower.includes('nsg') || titleLower.includes('port 22');
  const isEncryptionFinding = titleLower.includes('cmek') || titleLower.includes('customer-managed');

  // Interactive Form State
  const [resourceName, setResourceName] = useState(rawResourceName);
  const [destinationBucket, setDestinationBucket] = useState('cloudlockr-audit-logs');
  const [logPrefix, setLogPrefix] = useState('audit-logs/gcs/');
  const [allowedCidr, setAllowedCidr] = useState('10.0.0.0/16');
  const [kmsKeyId, setKmsKeyId] = useState('');
  
  // Execution Lifecycle State
  const [executing, setExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [copied, setCopied] = useState(false);
  const [verifyingScan, setVerifyingScan] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState(null); // 'resolved' | 'still_violated' | null
  const [liveCommand, setLiveCommand] = useState('');
  const [actionSummary, setActionSummary] = useState('');

  // Fetch verified canonical command dynamically from backend
  useEffect(() => {
    let isMounted = true;
    const fetchPreview = async () => {
      try {
        const res = await axios.post('/api/ai/preview-remediation', {
          findingId: finding._id,
          parameters: {
            resourceName,
            destinationBucket: isLoggingFinding ? destinationBucket : undefined,
            logPrefix: isLoggingFinding ? logPrefix : undefined,
            allowedCidr: isNetworkFinding ? allowedCidr : undefined,
            kmsKeyId: isEncryptionFinding ? kmsKeyId : undefined,
          }
        });
        if (res.data.success && isMounted) {
          setLiveCommand(res.data.command);
          setActionSummary(res.data.actionSummary);
        }
      } catch (err) {
        console.warn('Could not fetch live preview command:', err.message);
      }
    };

    if (isOpen && finding) {
      fetchPreview();
    }
    return () => { isMounted = false; };
  }, [isOpen, finding, resourceName, destinationBucket, logPrefix, allowedCidr, kmsKeyId]);

  // Compute Live Command Preview based on active inputs
  const computeCommandPreview = () => {
    if (liveCommand) return liveCommand;

    if (cloudProvider === 'GCP') {
      if (titleLower.includes('versioning')) {
        return `gcloud storage buckets update gs://${resourceName} --versioning`;
      }
      if (isLoggingFinding) {
        return `gcloud storage buckets update gs://${resourceName} --log-bucket=gs://${destinationBucket || 'central-audit-bucket'} --log-prefix=${logPrefix || 'logs/'}`;
      }
      if (isNetworkFinding) {
        return `gcloud compute firewall-rules update ${resourceName} --source-ranges=${allowedCidr || '10.0.0.0/16'}`;
      }
      if (titleLower.includes('uniform') || titleLower.includes('public') || titleLower.includes('storage admin')) {
        return `gcloud storage buckets update gs://${resourceName} --uniform-bucket-level-access`;
      }
      return `gcloud storage buckets update gs://${resourceName} --uniform-bucket-level-access`;
    }

    if (cloudProvider === 'AWS') {
      if (titleLower.includes('encryption')) {
        return `aws s3api put-bucket-encryption --bucket ${resourceName} --server-side-encryption-configuration '{"Rules":[{"ApplyServerSideEncryptionByDefault":{"SSEAlgorithm":"AES256"}}]}'`;
      }
      if (isNetworkFinding) {
        return `aws ec2 revoke-security-group-ingress --group-id ${resourceName} --protocol tcp --port 22 --cidr 0.0.0.0/0 && aws ec2 authorize-security-group-ingress --group-id ${resourceName} --protocol tcp --port 22 --cidr ${allowedCidr || '10.0.0.0/16'}`;
      }
      return `aws s3api put-public-access-block --bucket ${resourceName} --public-access-block-configuration "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"`;
    }

    if (cloudProvider === 'AZURE') {
      if (titleLower.includes('blob') || titleLower.includes('anonymous')) {
        return `az storage account update --name ${resourceName} --allow-blob-public-access false`;
      }
      if (titleLower.includes('https') || titleLower.includes('secure transfer')) {
        return `az storage account update --name ${resourceName} --https-only true`;
      }
      if (isNetworkFinding) {
        return `az network nsg rule update --resource-group CloudLockr-RG --nsg-name ${resourceName} --name Inbound-SSH --source-address-prefixes ${allowedCidr || '10.0.0.0/16'}`;
      }
      return `az storage account update --name ${resourceName} --min-tls-version TLS1_2`;
    }

    return `cloudlockr-cli remediate --resource=${resourceName}`;
  };

  const handleCopyCommand = () => {
    navigator.clipboard.writeText(computeCommandPreview());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Dispatch API Call to Backend
  const handleExecute = async () => {
    setExecuting(true);
    setErrorMessage('');
    setVerificationStatus(null);

    const payload = {
      findingId: finding._id,
      command: liveCommand || computeCommandPreview(),
      parameters: {
        resourceName,
        destinationBucket: isLoggingFinding ? destinationBucket : undefined,
        logPrefix: isLoggingFinding ? logPrefix : undefined,
        allowedCidr: isNetworkFinding ? allowedCidr : undefined,
        kmsKeyId: isEncryptionFinding ? kmsKeyId : undefined,
      }
    };

    try {
      const res = await axios.post('/api/ai/execute-remediation', payload);
      if (res.data.success) {
        setExecutionResult(res.data);
        toast.success(res.data.message || 'Remediation dispatched (Pending Scan Verification)!');
        if (onSuccess) {
          onSuccess(res.data.finding);
        }
      } else {
        setErrorMessage(res.data.message || 'Execution failed.');
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to execute cloud fix.';
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setExecuting(false);
    }
  };

  // Trigger real-time environment scan to verify resolution
  const handleRunVerificationScan = async () => {
    setVerifyingScan(true);
    try {
      await axios.post('/api/scan', { provider: cloudProvider });
      
      // Fetch fresh findings to check if this finding was resolved
      const findingsRes = await axios.get('/api/dashboard/findings');
      const allFindings = findingsRes.data.findings || [];
      const current = allFindings.find(f => f._id === finding._id);

      if (!current || current.status === 'Resolved') {
        setVerificationStatus('resolved');
        toast.success('Verified! Cloud scanner confirmed this finding is resolved.');
      } else {
        setVerificationStatus('still_violated');
        toast.error('Verification scan detected the violation is still present.');
      }

      if (onSuccess) {
        onSuccess(current);
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Verification scan failed.';
      toast.error(msg);
    } finally {
      setVerifyingScan(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div 
        className="bg-white border-2 border-[#c3f4b0] rounded-[2rem] shadow-2xl max-w-xl w-full p-6 text-black select-none font-sans relative overflow-hidden flex flex-col max-h-[92vh]"
        style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif' }}
      >
        {/* Decorative ambient blur */}
        <div className="absolute -top-16 -right-16 w-48 h-48 bg-[#39ff14]/15 rounded-full blur-3xl pointer-events-none"></div>

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[#e6e8eb] pb-4 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-[#121c13] border border-[#2b6d34] flex items-center justify-center text-[#39ff14] shadow-sm">
              <HiLightningBolt size={22} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-black tracking-tight" style={{ letterSpacing: '-0.4px' }}>
                Execute Cloud Remediation
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Apply policy fix directly to your live cloud infrastructure.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full border border-gray-200 hover:border-black bg-gray-50 text-gray-500 hover:text-black transition active:scale-95"
          >
            <HiX size={18} />
          </button>
        </div>

        {/* Scrollable Modal Content */}
        <div className="overflow-y-auto py-5 space-y-5 pr-1 flex-1">
          
          {/* Target Finding Card */}
          <div className="bg-[#f8f9fa] border border-[#e6e8eb] rounded-2xl p-4 space-y-2.5">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center space-x-2">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  cloudProvider === 'AWS' ? 'bg-[#fff3e0] text-[#ea580c] border-[#ffedd5]' :
                  cloudProvider === 'GCP' ? 'bg-[#f0fdf4] text-[#16a34a] border-[#dcfce7]' :
                  'bg-[#f0f9ff] text-[#0284c7] border-[#e0f2fe]'
                }`}>
                  {cloudProvider}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  finding.severity === 'Critical' ? 'bg-[#fee2e2] text-red-700 border-red-200' :
                  finding.severity === 'High' ? 'bg-[#ffedd5] text-amber-700 border-amber-200' :
                  'bg-[#fef9c3] text-yellow-700 border-yellow-200'
                }`}>
                  {finding.severity}
                </span>
                <span className="text-xs font-semibold text-gray-500">
                  {finding.resourceId?.service || 'Cloud Asset'}
                </span>
              </div>
              <span className="text-[10px] text-gray-400 font-mono">
                CIS: {finding.complianceMapping?.cisAWS || finding.complianceMapping?.cisGCP || finding.complianceMapping?.cisAzure || '5.1'}
              </span>
            </div>

            <h4 className="text-sm font-bold text-black">{finding.title}</h4>
            <div className="text-[11px] text-gray-600 font-mono bg-white px-2.5 py-1.5 rounded-xl border border-[#e6e8eb] truncate" title={finding.resourceArn}>
              <span className="text-gray-400 select-none mr-1.5">ARN:</span>
              {finding.resourceArn}
            </div>
          </div>

          {/* Interactive Parameters Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold tracking-wider text-gray-500">
                Remediation Parameters & Scope
              </span>
              <span className="text-[10px] text-[#2b6d34] font-bold bg-[#edfbe8] px-2 py-0.5 rounded-full border border-[#c3f4b0]">
                Editable Target
              </span>
            </div>

            {/* Target Resource Name Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700 flex items-center justify-between">
                <span>Target Resource Identifier:</span>
                <span className="text-[10px] text-gray-400 font-normal">Extracted from Asset Metadata</span>
              </label>
              <input
                type="text"
                value={resourceName}
                onChange={(e) => setResourceName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-[#e6e8eb] rounded-xl text-xs text-black font-mono font-semibold focus:bg-white focus:border-black outline-none transition"
                placeholder="resource-name"
                disabled={executing}
              />
            </div>

            {/* Dynamic Specific Parameter: Logging Destination Bucket */}
            {isLoggingFinding && (
              <div className="p-3.5 bg-[#f0fbf0] border border-[#c3f4b0] rounded-2xl space-y-3">
                <div className="flex items-center space-x-2 text-[#1b4a22]">
                  <HiOutlineTerminal size={16} />
                  <span className="text-xs font-bold">Specify Logging Destination Parameters</span>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-700">Destination Logging Bucket Name *</label>
                  <input
                    type="text"
                    value={destinationBucket}
                    onChange={(e) => setDestinationBucket(e.target.value)}
                    className="w-full px-3.5 py-2 bg-white border border-[#c3f4b0] rounded-xl text-xs text-black font-mono font-semibold focus:border-black outline-none transition"
                    placeholder="my-company-central-audit-bucket"
                    required
                    disabled={executing}
                  />
                  <p className="text-[10px] text-gray-500">
                    The {cloudProvider === 'GCP' ? 'GCS' : 'S3'} bucket where access and read/write audit telemetry will be delivered.
                  </p>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-700">Log File Prefix (Optional)</label>
                  <input
                    type="text"
                    value={logPrefix}
                    onChange={(e) => setLogPrefix(e.target.value)}
                    className="w-full px-3.5 py-2 bg-white border border-[#c3f4b0] rounded-xl text-xs text-black font-mono font-semibold focus:border-black outline-none transition"
                    placeholder="audit-logs/gcs/"
                    disabled={executing}
                  />
                </div>
              </div>
            )}

            {/* Dynamic Specific Parameter: Network CIDR Restrictor */}
            {isNetworkFinding && (
              <div className="p-3.5 bg-[#fffbf0] border border-[#fde68a] rounded-2xl space-y-2.5">
                <div className="flex items-center space-x-2 text-amber-900">
                  <HiOutlineExclamation size={16} />
                  <span className="text-xs font-bold">Restrict Wildcard 0.0.0.0/0 to Trusted Network CIDR</span>
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-700">Allowed Inbound CIDR Block *</label>
                  <input
                    type="text"
                    value={allowedCidr}
                    onChange={(e) => setAllowedCidr(e.target.value)}
                    className="w-full px-3.5 py-2 bg-white border border-amber-300 rounded-xl text-xs text-black font-mono font-semibold focus:border-black outline-none transition"
                    placeholder="10.0.0.0/16 or 203.0.113.50/32"
                    required
                    disabled={executing}
                  />
                  <p className="text-[10px] text-gray-500">
                    Replace open public access with your corporate VPN or admin IP range.
                  </p>
                </div>
              </div>
            )}

            {/* Dynamic Specific Parameter: KMS Key */}
            {isEncryptionFinding && (
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-700">Customer Managed Key (CMEK) ARN or URI *</label>
                <input
                  type="text"
                  value={kmsKeyId}
                  onChange={(e) => setKmsKeyId(e.target.value)}
                  className="w-full px-3.5 py-2 bg-gray-50 border border-[#e6e8eb] rounded-xl text-xs text-black font-mono font-semibold focus:bg-white focus:border-black outline-none transition"
                  placeholder="projects/.../locations/global/keyRings/my-ring/cryptoKeys/my-key"
                  disabled={executing}
                />
              </div>
            )}
          </div>

          {/* Real-Time Live Command Preview */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[10px] text-gray-500 uppercase font-bold tracking-wider">
              <span className="flex items-center space-x-1">
                <HiOutlineTerminal size={14} className="text-[#39ff14]" />
                <span>Command Execution Preview</span>
              </span>
              <button
                type="button"
                onClick={handleCopyCommand}
                className="flex items-center space-x-1 text-gray-500 hover:text-black transition"
              >
                {copied ? <HiCheck size={12} className="text-[#16a34a]" /> : <HiOutlineClipboardCopy size={12} />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <div className="p-3 bg-[#0c0e0c] border border-[#1a221c] rounded-2xl font-mono text-[11px] text-white leading-relaxed overflow-x-auto selection:bg-[#39ff14] selection:text-black">
              <span className="text-[#39ff14] mr-2">$</span>
              <span>{computeCommandPreview()}</span>
            </div>
          </div>

          {/* Post-Execution Status & Verification Section */}
          {executionResult && (
            <div className="space-y-3 animate-in zoom-in-95">
              <div className="p-4 bg-[#fffbeb] border-2 border-[#fde68a] rounded-2xl flex items-start space-x-3 text-amber-900">
                <HiOutlineClock size={24} className="shrink-0 text-amber-600 mt-0.5" />
                <div className="text-xs space-y-1.5 flex-1">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="font-bold text-sm text-amber-950">Fix Dispatched (Pending Verification)</span>
                    <span className="text-[10px] font-mono font-bold bg-amber-100 text-amber-800 border border-amber-300 px-2 py-0.5 rounded-full">
                      ⏳ AWAITING SCAN
                    </span>
                  </div>
                  <p className="text-amber-800 leading-relaxed">
                    {executionResult.message || 'Remediation command has been dispatched to your cloud provider. CloudLockr will strictly keep this issue open until a real environment scan audits the cloud asset and confirms compliance.'}
                  </p>
                  <div className="text-[10px] font-mono text-amber-700/80 pt-1 border-t border-amber-200/60">
                    Dispatched by: <strong className="text-amber-950">{executionResult.executionDetails?.remediatedBy || 'Authorized Operator'}</strong> • Target ARN: <span className="underline">{resourceName}</span>
                  </div>
                </div>
              </div>

              {/* Live CLI Terminal Output & Execution Log */}
              {executionResult.executionDetails?.cliOutput && (
                <div className="space-y-1.5 p-3.5 bg-[#f8f9fa] border border-[#e6e8eb] rounded-2xl">
                  <div className="flex items-center justify-between text-[10px] text-gray-600 uppercase font-bold tracking-wider">
                    <span className="flex items-center space-x-1.5">
                      <HiOutlineTerminal size={14} className="text-black" />
                      <span>System CLI Terminal Output</span>
                    </span>
                    <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full border ${
                      executionResult.executionDetails?.cliExecutedSuccessfully 
                        ? 'bg-[#edfbe8] text-[#1b4a22] border-[#c3f4b0]' 
                        : 'bg-[#fffbeb] text-amber-800 border-[#fde68a]'
                    }`}>
                      {executionResult.executionDetails?.cliExecutedSuccessfully ? 'Exit Code 0 (Success)' : 'CLI Status Log'}
                    </span>
                  </div>
                  <div className="p-3 bg-[#0a0c0a] border border-[#1a221a] rounded-xl font-mono text-[11px] text-gray-300 max-h-36 overflow-y-auto leading-relaxed whitespace-pre-wrap selection:bg-[#39ff14] selection:text-black">
                    <span className="text-[#39ff14] block mb-1">$ {executionResult.executionDetails?.commandExecuted}</span>
                    {executionResult.executionDetails?.cliOutput}
                  </div>
                  {!executionResult.executionDetails?.cliExecutedSuccessfully && (
                    <div className="p-2.5 bg-[#fffbeb] border border-[#fde68a] rounded-xl text-[10px] text-amber-900 space-y-1">
                      <p className="font-bold flex items-center space-x-1">
                        <span>🔑</span>
                        <span>CLI Authentication Required on Host:</span>
                      </p>
                      <p className="leading-relaxed">
                        To execute directly in your system terminal, authenticate your CLI: run <code className="bg-amber-100 font-mono font-bold px-1 py-0.5 rounded">aws configure</code>, <code className="bg-amber-100 font-mono font-bold px-1 py-0.5 rounded">gcloud auth login</code>, or <code className="bg-amber-100 font-mono font-bold px-1 py-0.5 rounded">az login</code>. You can also paste the command into your terminal manually.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Verification Scan Action Trigger */}
              <div className="p-4 bg-[#f8f9fa] border border-[#e6e8eb] rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-black flex items-center space-x-1.5">
                    <span>Audit Environment to Confirm Fix</span>
                  </span>
                  <span className="text-[10px] text-gray-500 font-mono">Zero False-Positives</span>
                </div>
                <p className="text-[11px] text-gray-600 leading-relaxed">
                  Trigger an on-demand scan now to inspect the cloud asset. Once verified compliant, the finding will be marked <strong className="text-[#16a34a]">RESOLVED</strong> and your Security Posture Index will update.
                </p>

                <button
                  type="button"
                  onClick={handleRunVerificationScan}
                  disabled={verifyingScan}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 bg-black hover:bg-gray-800 text-[#39ff14] text-xs font-bold rounded-xl transition shadow-sm active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  <HiOutlineRefresh className={`h-4 w-4 ${verifyingScan ? 'animate-spin' : ''}`} />
                  <span>{verifyingScan ? 'Auditing Cloud Environment...' : 'Run Verification Scan Now'}</span>
                </button>

                {/* Verification result messages */}
                {verificationStatus === 'resolved' && (
                  <div className="p-3 bg-[#edfbe8] border border-[#86efac] rounded-xl flex items-center space-x-2 text-[#166534] text-xs font-bold">
                    <HiOutlineCheckCircle size={18} className="text-[#16a34a] shrink-0" />
                    <span>✓ Verification Successful! Cloud scan confirmed the rule is compliant. Finding status: RESOLVED.</span>
                  </div>
                )}
                {verificationStatus === 'still_violated' && (
                  <div className="p-3 bg-[#fff7ed] border border-amber-300 rounded-xl flex items-center space-x-2 text-amber-900 text-xs font-bold">
                    <HiOutlineExclamation size={18} className="text-amber-600 shrink-0" />
                    <span>⚠️ Rule Violation Still Detected. The cloud asset remains non-compliant. Status reverted to ACTIVE.</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-4 bg-[#fff5f5] border-2 border-red-200 rounded-2xl flex items-start space-x-3 text-red-800 text-xs">
              <HiOutlineExclamation size={24} className="shrink-0 text-red-600 mt-0.5" />
              <div className="space-y-1.5 flex-1">
                <div className="font-bold text-sm text-red-950">Cloud Execution Rejected</div>
                <div className="leading-relaxed">{errorMessage}</div>
                <div className="p-2.5 bg-white/80 border border-red-100 rounded-xl text-[10px] text-gray-700 space-y-1">
                  <p className="font-bold text-red-900">Why did this happen?</p>
                  <p>
                    CloudLockr's connected cloud identity (e.g. <code>cloudlockr-scanner</code>) has <strong>Read-Only audit permissions</strong> to ensure safety. To apply live changes directly from this dashboard, grant write permissions (e.g. <code>Storage Admin</code> in GCP or <code>s3:PutBucketPublicAccessBlock</code> in AWS) in your cloud console, or copy the command above and run it with your personal admin account.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Action Buttons */}
        <div className="pt-4 border-t border-[#e6e8eb] flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={executing}
            className="px-5 py-2.5 rounded-xl border border-gray-200 hover:border-black text-xs font-bold text-gray-700 hover:text-black transition"
          >
            {executionResult ? 'Close' : 'Cancel'}
          </button>

          {!executionResult ? (
            <button
              type="button"
              onClick={handleExecute}
              disabled={executing}
              className="flex items-center space-x-2 px-6 py-2.5 bg-[#39ff14] hover:bg-[#32e612] text-black text-xs font-bold rounded-xl transition shadow-md active:scale-95 disabled:opacity-50"
              style={{ boxShadow: '0 4px 14px rgba(57,255,20,0.25)' }}
            >
              <HiLightningBolt size={16} />
              <span>{executing ? 'Executing Cloud Fix...' : 'Confirm & Execute Fix'}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 bg-black hover:bg-gray-800 text-white text-xs font-bold rounded-xl transition shadow-sm"
            >
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExecuteFixModal;
