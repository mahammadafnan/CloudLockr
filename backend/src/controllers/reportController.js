const PDFDocument = require('pdfkit');
const Resource = require('../models/Resource');
const Finding = require('../models/Finding');
const Scan = require('../models/Scan');
const { calculateSecurityPosture } = require('../utils/postureCalculator');

// @desc    Generate and stream security assessment PDF report for selected cloud provider
// @route   GET /api/reports/download
// @access  Private
exports.downloadSecurityReport = async (req, res, next) => {
  const rawProvider = req.query.provider || 'ALL';
  const targetProvider = rawProvider.toUpperCase();
  console.log(`[Report Controller] Initiating PDF report compilation stream for provider: ${targetProvider}...`);

  try {
    // 1. Fetch statistics from database collections
    const allResources = await Resource.find({ status: { $ne: 'deleted' } }).lean();
    const activeFindings = await Finding.find({ status: 'Active' }).populate('resourceId').lean();

    // 2. Filter resources & findings by selected cloud provider
    const isFiltered = targetProvider !== 'ALL' && targetProvider !== 'MULTI-CLOUD';
    
    const scopedResources = isFiltered
      ? allResources.filter(r => r.cloudProvider === targetProvider)
      : allResources;

    const scopedFindings = isFiltered
      ? activeFindings.filter(f => {
          const prov = f.resourceId?.cloudProvider || (f.resourceArn?.includes('gcp') ? 'GCP' : f.resourceArn?.includes('azure') ? 'AZURE' : 'AWS');
          return prov.toUpperCase() === targetProvider;
        })
      : activeFindings;

    // 3. Find latest relevant scan
    let latestScan = null;
    if (isFiltered) {
      latestScan = await Scan.findOne({ status: 'Completed', provider: targetProvider }).sort({ completedAt: -1 });
      if (!latestScan) {
        latestScan = await Scan.findOne({ status: 'Completed' }).sort({ completedAt: -1 });
      }
    } else {
      latestScan = await Scan.findOne({ status: 'Completed', provider: { $in: ['ALL', 'MULTI-CLOUD'] } }).sort({ completedAt: -1 })
        || await Scan.findOne({ status: 'Completed' }).sort({ completedAt: -1 });
    }

    // 4. Calculate dynamic posture for scoped set
    const posture = calculateSecurityPosture({
      resources: scopedResources,
      findings: scopedFindings,
      provider: targetProvider
    });

    const criticalCount = posture.findingsCount.critical;
    const highCount = posture.findingsCount.high;
    const mediumCount = posture.findingsCount.medium;
    const lowCount = posture.findingsCount.low;
    const totalFindings = posture.findingsCount.total;
    const totalResources = posture.totalResources;
    const securityScore = posture.securityScore;
    const complianceRate = posture.complianceRate;

    // 5. Cloud-specific metadata
    let cloudName = 'Multi-Cloud Environment (AWS, GCP, Azure)';
    let targetAccount = 'Multi-Cloud (AWS: 464433361537 | GCP: project-25a7942f-6ee6-4832-a57 | Azure: 48131ce1-65df-4433-bb54-cb966376f6b6)';
    let auditScope = 'AWS (CIS v1.4.0), GCP (CIS v2.0.0), Azure (CIS v2.0.0) Multi-Cloud Foundations Benchmarks';
    let docTitle = 'Multi-Cloud Infrastructure Security Assessment Report';
    let fileSuffix = 'Multi-Cloud';

    if (targetProvider === 'AWS') {
      cloudName = 'Amazon Web Services (AWS)';
      targetAccount = latestScan?.accountId || scopedResources.find(r => r.cloudProvider === 'AWS')?.accountId || '464433361537';
      auditScope = 'S3, EC2, IAM, Security Groups, CloudTrail (CIS AWS Foundations Benchmark v1.4.0)';
      docTitle = 'AWS Cloud Security Assessment & Audit Report';
      fileSuffix = 'AWS';
    } else if (targetProvider === 'GCP') {
      cloudName = 'Google Cloud Platform (GCP)';
      targetAccount = latestScan?.accountId || scopedResources.find(r => r.cloudProvider === 'GCP')?.accountId || 'project-25a7942f-6ee6-4832-a57';
      auditScope = 'Cloud Storage, Compute Engine, IAM, VPC Networks, Cloud Logging (CIS GCP Benchmark v2.0.0)';
      docTitle = 'Google Cloud Platform (GCP) Security Audit Report';
      fileSuffix = 'GCP';
    } else if (targetProvider === 'AZURE') {
      cloudName = 'Microsoft Azure';
      targetAccount = latestScan?.accountId || scopedResources.find(r => r.cloudProvider === 'AZURE')?.accountId || '48131ce1-65df-4433-bb54-cb966376f6b6';
      auditScope = 'Blob Storage, Virtual Machines, Microsoft Entra ID, NSGs, Azure Monitor (CIS Azure Benchmark v2.0.0)';
      docTitle = 'Microsoft Azure Cloud Security Assessment Report';
      fileSuffix = 'Azure';
    }

    // 6. Setup Express response headers for PDF download
    const filename = `CloudLockr_${fileSuffix}_Security_Report.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    // 7. Initialize PDFKit document
    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    // Stream PDF directly to Express response
    doc.pipe(res);

    // --- PDF LAYOUT DESIGN ---
    const primaryColor = '#1E3A8A'; // Navy Blue
    const secondaryColor = '#0F172A'; // Slate Dark
    const grayColor = '#64748B'; // Muted Gray
    
    // Severity Colors
    const colorCritical = '#EF4444'; // Red
    const colorHigh = '#F97316'; // Orange
    const colorMedium = '#EAB308'; // Yellow
    const colorLow = '#3B82F6'; // Blue

    // Header Section
    doc
      .fillColor(primaryColor)
      .fontSize(22)
      .text('CLOUDLOCKR', 50, 50, { characterSpacing: 1 })
      .fontSize(9.5)
      .fillColor(grayColor)
      .text('AI-POWERED MULTI-CLOUD SECURITY POSTURE MANAGEMENT (CSPM)', 50, 75);

    // Header Horizontal Rule
    doc.moveTo(50, 90).lineTo(545, 90).strokeColor('#E2E8F0').lineWidth(1).stroke();

    // Document Title Block
    doc
      .fillColor(secondaryColor)
      .fontSize(15)
      .text(docTitle, 50, 105, { font: 'Helvetica-Bold' })
      .fontSize(8.5)
      .fillColor(grayColor)
      .text(`Report Compiled: ${new Date().toUTCString()}`, 50, 125)
      .text(`Target Cloud Provider: ${cloudName}`, 50, 137)
      .text(`Target Account / Project / Subscription ID: ${targetAccount}`, 50, 149)
      .text(`Audit Scope: ${auditScope}`, 50, 161);

    // Executive Posture Panel Callout Box
    doc
      .rect(50, 180, 495, 92)
      .fillAndStroke('#F8FAFC', '#E2E8F0');

    // Posture Score Label
    doc
      .fillColor(secondaryColor)
      .fontSize(9.5)
      .text(`${fileSuffix.toUpperCase()} SECURITY POSTURE INDEX`, 70, 193, { font: 'Helvetica-Bold' });

    // Posture Score Large Number
    const scoreColor = securityScore >= 80 ? '#10B981' : securityScore >= 50 ? '#F59E0B' : '#EF4444';
    doc
      .fillColor(scoreColor)
      .fontSize(30)
      .text(`${securityScore}`, 70, 212, { font: 'Helvetica-Bold' })
      .fillColor(grayColor)
      .fontSize(11)
      .text('/ 100', 125, 227);

    // Posture Score description
    let evaluation = 'Posture Status: COMPLIANT';
    if (securityScore < 50) evaluation = 'Posture Status: ACTION REQUIRED (CRITICAL RISK)';
    else if (securityScore < 80) evaluation = 'Posture Status: DEVIATIONS FOUND (WARNING)';
    doc
      .fillColor(scoreColor)
      .fontSize(8.5)
      .text(evaluation, 70, 248, { font: 'Helvetica-Bold' });

    // Inventory metrics inside Callout box (Right Column)
    doc
      .fillColor(secondaryColor)
      .fontSize(8.5)
      .text(`Scanned Resources: ${totalResources}`, 330, 193)
      .text(`Compliance Rate: ${complianceRate}%`, 330, 205)
      .text(`Total Active Findings: ${totalFindings}`, 330, 217)
      .text(`  • Critical: ${criticalCount}`, 330, 229, { fillColor: colorCritical })
      .text(`  • High: ${highCount}`, 330, 240, { fillColor: colorHigh })
      .text(`  • Medium: ${mediumCount}`, 425, 229, { fillColor: colorMedium })
      .text(`  • Low: ${lowCount}`, 425, 240, { fillColor: colorLow });

    // Executive summary text block
    doc
      .fillColor(secondaryColor)
      .fontSize(10)
      .text('Executive Summary:', 50, 285, { font: 'Helvetica-Bold' })
      .fontSize(9)
      .fillColor(secondaryColor)
      .text(
        `CloudLockr executed an automated configuration security scan against your ${cloudName} deployment. ` +
        `A total of ${totalResources} cloud assets were inventoried and verified against benchmark parameters (${auditScope}). ` +
        `The scanner identified ${totalFindings} active misconfiguration findings. ` +
        (totalFindings > 0
          ? `Immediate remediation is recommended for ${criticalCount} Critical and ${highCount} High priority issues to safeguard your infrastructure perimeters.`
          : `All evaluated resources currently satisfy compliance baselines with no active violations.`),
        50,
        300,
        { align: 'justify', lineGap: 2.5 }
      );

    // Detailed Audit Findings Section
    doc
      .fillColor(primaryColor)
      .fontSize(11.5)
      .text(`Detailed ${fileSuffix} Audit Findings (${scopedFindings.length})`, 50, 355, { font: 'Helvetica-Bold' });

    doc.moveTo(50, 370).lineTo(545, 370).strokeColor(primaryColor).lineWidth(1.5).stroke();

    let currentY = 382;

    if (scopedFindings.length === 0) {
      doc
        .fillColor(grayColor)
        .fontSize(9.5)
        .text(`No active misconfigurations identified in ${cloudName}. Deployment is fully compliant with CIS benchmarks.`, 50, currentY);
    } else {
      for (const finding of scopedFindings) {
        // Page break logic to prevent truncation at page bottom
        if (currentY > 670) {
          doc.addPage();
          currentY = 50;
          
          // Small header on continuation page
          doc
            .fillColor(primaryColor)
            .fontSize(9)
            .text(`CLOUDLOCKR - ${fileSuffix} Security Assessment Report (Continued)`, 50, 30)
            .moveTo(50, 42).lineTo(545, 42).strokeColor('#E2E8F0').lineWidth(0.5).stroke();
          
          currentY = 55;
        }

        // Determine finding provider
        const findingProvider = (
          finding.resourceId?.cloudProvider || 
          (finding.resourceArn?.includes('gcp') ? 'GCP' : finding.resourceArn?.includes('azure') ? 'AZURE' : 'AWS')
        ).toUpperCase();

        // Determine severity label colors
        let sevColor = colorLow;
        if (finding.severity === 'Critical') sevColor = colorCritical;
        else if (finding.severity === 'High') sevColor = colorHigh;
        else if (finding.severity === 'Medium') sevColor = colorMedium;

        // Card Frame
        doc
          .rect(50, currentY, 495, 102)
          .strokeColor('#E2E8F0')
          .lineWidth(1)
          .stroke();

        // Severity Badge Tag
        doc
          .rect(58, currentY + 10, 52, 14)
          .fill(sevColor);

        doc
          .fillColor('#FFFFFF')
          .fontSize(7.5)
          .text(finding.severity.toUpperCase(), 58, currentY + 13, { align: 'center', width: 52, font: 'Helvetica-Bold' });

        // Cloud Provider Badge Pill
        const providerPillColor = findingProvider === 'AWS' ? '#F97316' : findingProvider === 'GCP' ? '#10B981' : '#0284C7';
        doc
          .rect(58, currentY + 28, 52, 12)
          .fill(providerPillColor);

        doc
          .fillColor('#FFFFFF')
          .fontSize(7)
          .text(findingProvider, 58, currentY + 30, { align: 'center', width: 52, font: 'Helvetica-Bold' });

        // Finding Title & Service name
        doc
          .fillColor(secondaryColor)
          .fontSize(9.5)
          .text(finding.title, 120, currentY + 10, { font: 'Helvetica-Bold', width: 415, height: 13, ellipsis: true })
          .fillColor(grayColor)
          .fontSize(8)
          .text(`Service: ${finding.resourceId ? finding.resourceId.service : 'Cloud Asset'} | Region: ${finding.resourceId?.region || 'Global'}`, 120, currentY + 24)
          .text(`Resource: ${finding.resourceArn}`, 120, currentY + 34, { width: 415, height: 11, ellipsis: true });

        // Description
        doc
          .fillColor(secondaryColor)
          .fontSize(8)
          .text(`Issue: ${finding.description}`, 120, currentY + 47, { width: 415, height: 20, ellipsis: true, lineGap: 1 });

        // Recommendation
        if (finding.recommendation) {
          doc
            .fillColor('#0F5132')
            .fontSize(7.5)
            .text(`Remediation: ${finding.recommendation}`, 120, currentY + 68, { width: 415, height: 18, ellipsis: true });
        }

        // Compliance Mappings
        let cisStandard = 'CIS Benchmark';
        if (findingProvider === 'AWS') {
          cisStandard = finding.complianceMapping?.cisAWS && finding.complianceMapping.cisAWS !== 'N/A'
            ? `CIS AWS ${finding.complianceMapping.cisAWS}`
            : 'CIS AWS v1.4';
        } else if (findingProvider === 'GCP') {
          cisStandard = 'CIS GCP v2.0';
        } else if (findingProvider === 'AZURE') {
          cisStandard = 'CIS Azure v2.0';
        }

        const nistRule = finding.complianceMapping?.nist && finding.complianceMapping.nist !== 'N/A'
          ? `NIST ${finding.complianceMapping.nist}`
          : 'NIST 800-53';

        doc
          .fillColor(grayColor)
          .fontSize(7.5)
          .text(`Control: ${cisStandard} | ${nistRule}`, 120, currentY + 88)
          .fillColor(primaryColor)
          .text('Remediate via CloudLockr Console', 390, currentY + 88, { underline: true });

        currentY += 114; // Shift down for next card
      }
    }

    // Finalize & Close stream
    doc.end();
    console.log(`[Report Controller] PDF report generation completed successfully for ${fileSuffix}.`);
  } catch (error) {
    console.error('[Report Controller] Generation failed:', error.message);
    next(error);
  }
};
