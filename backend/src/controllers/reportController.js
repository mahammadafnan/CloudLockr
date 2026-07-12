const PDFDocument = require('pdfkit');
const Resource = require('../models/Resource');
const Finding = require('../models/Finding');
const Scan = require('../models/Scan');

// @desc    Generate and stream security assessment PDF report
// @route   GET /api/reports/download
// @access  Private
exports.downloadSecurityReport = async (req, res, next) => {
  console.log('[Report Controller] Initiating PDF report compilation stream...');

  try {
    // 1. Fetch statistics from database collections
    const totalResources = await Resource.countDocuments();
    const activeFindings = await Finding.find({ status: 'Active' }).populate('resourceId');
    const latestScan = await Scan.findOne({ status: 'Completed' }).sort({ completedAt: -1 });

    const criticalCount = activeFindings.filter((f) => f.severity === 'Critical').length;
    const highCount = activeFindings.filter((f) => f.severity === 'High').length;
    const mediumCount = activeFindings.filter((f) => f.severity === 'Medium').length;
    const lowCount = activeFindings.filter((f) => f.severity === 'Low').length;
    const totalFindings = activeFindings.length;

    // Calculate score
    const deductions = (criticalCount * 20) + (highCount * 10) + (mediumCount * 5) + (lowCount * 2);
    const securityScore = Math.max(0, 100 - deductions);

    // 2. Setup Express response headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=CloudLockr_Security_Report.pdf');

    // 3. Initialize PDFKit document
    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    // Stream PDF directly to Express response
    doc.pipe(res);

    // --- PDF LAYOUT DESIGN ---

    // Primary Theme Colors
    const primaryColor = '#1E3A8A'; // Navy Blue
    const secondaryColor = '#0F172A'; // Slate Dark
    const grayColor = '#64748B'; // Muted Gray
    
    // Severity Colors
    const colorCritical = '#EF4444'; // Red
    const colorHigh = '#F97316'; // Orange
    const colorMedium = '#EAB308'; // Yellow
    const colorLow = '#3B82F6'; // Blue

    // 4. Header Section
    doc
      .fillColor(primaryColor)
      .fontSize(22)
      .text('CLOUDLOCKR', 50, 50, { characterSpacing: 1 })
      .fontSize(10)
      .fillColor(grayColor)
      .text('AI-POWERED CLOUD SECURITY POSTURE MANAGEMENT (CSPM)', 50, 75);

    // Header Horizontal Rule
    doc.moveTo(50, 90).lineTo(545, 90).strokeColor('#E2E8F0').lineWidth(1).stroke();

    // Document Title Block
    doc
      .fillColor(secondaryColor)
      .fontSize(16)
      .text('Cloud Security Assessment & Audit Report', 50, 110, { font: 'Helvetica-Bold' })
      .fontSize(9)
      .fillColor(grayColor)
      .text(`Report Compiled: ${new Date().toUTCString()}`, 50, 130)
      .text(`Target Account ID: ${latestScan ? latestScan.accountId : '123456789012'}`, 50, 142)
      .text('Audit Scope: S3, EC2, IAM, SGs, CloudTrail (CIS AWS Foundations Benchmarks)', 50, 154);

    // 5. Executive Posture Panel Callout Box
    doc
      .rect(50, 180, 495, 90)
      .fillAndStroke('#F8FAFC', '#E2E8F0');

    // Posture Score Label
    doc
      .fillColor(secondaryColor)
      .fontSize(10)
      .text('OVERALL SECURITY POSTURE INDEX', 70, 195, { font: 'Helvetica-Bold' });

    // Posture Score Large Number
    const scoreColor = securityScore >= 80 ? '#10B981' : securityScore >= 50 ? '#F59E0B' : '#EF4444';
    doc
      .fillColor(scoreColor)
      .fontSize(32)
      .text(`${securityScore}`, 70, 215, { font: 'Helvetica-Bold' })
      .fillColor(grayColor)
      .fontSize(12)
      .text('/ 100', 125, 231);

    // Posture Score description
    let evaluation = 'Posture Status: COMPLIANT';
    if (securityScore < 50) evaluation = 'Posture Status: ACTION REQUIRED (CRITICAL RISK)';
    else if (securityScore < 80) evaluation = 'Posture Status: DEVIATIONS FOUND (WARNING)';
    doc
      .fillColor(scoreColor)
      .fontSize(9)
      .text(evaluation, 70, 252, { font: 'Helvetica-Bold' });

    // Inventory metrics inside Callout box (Right Column)
    doc
      .fillColor(secondaryColor)
      .fontSize(9)
      .text(`Discovered Resources: ${totalResources}`, 350, 198)
      .text(`Total Active Issues: ${totalFindings}`, 350, 213)
      .text(`  • Critical Risks: ${criticalCount}`, 350, 226, { fillColor: colorCritical })
      .text(`  • High Risks: ${highCount}`, 350, 237, { fillColor: colorHigh })
      .text(`  • Medium Risks: ${mediumCount}`, 350, 248, { fillColor: colorMedium })
      .text(`  • Low Risks: ${lowCount}`, 350, 259, { fillColor: colorLow });

    // Executive summary text block
    doc
      .fillColor(secondaryColor)
      .fontSize(10)
      .text('Executive Summary:', 50, 290, { font: 'Helvetica-Bold' })
      .fontSize(9.5)
      .fillColor(secondaryColor)
      .text(
        `CloudLockr executed an automated configuration scan against your AWS deployment resources. ` +
        `A total of ${totalResources} cloud assets were inventoried and checked against CIS Foundations parameters. ` +
        `The scanner identified ${totalFindings} active vulnerabilities. ` +
        `Immediate actions are recommended for ${criticalCount} Critical and ${highCount} High priority violations to secure the infrastructure boundaries.`,
        50,
        305,
        { align: 'justify', lineGap: 3 }
      );

    // 6. Detailed Audit Findings Section
    doc
      .fillColor(primaryColor)
      .fontSize(12)
      .text('Detailed Audit Findings List', 50, 360, { font: 'Helvetica-Bold' });

    doc.moveTo(50, 375).lineTo(545, 375).strokeColor(primaryColor).lineWidth(1.5).stroke();

    let currentY = 390;

    if (activeFindings.length === 0) {
      doc
        .fillColor(grayColor)
        .fontSize(10)
        .text('No active configuration misconfigurations found. Cloud deployment is compliant.', 50, currentY);
    } else {
      for (const finding of activeFindings) {
        // Page break logic to prevent truncation at page bottom
        if (currentY > 700) {
          doc.addPage();
          currentY = 50; // Reset Y coordinate on new page
          
          // Re-draw small header on new page
          doc
            .fillColor(primaryColor)
            .fontSize(10)
            .text('CLOUDLOCKR - Security Assessment Report', 50, 30)
            .moveTo(50, 42).lineTo(545, 42).strokeColor('#E2E8F0').lineWidth(0.5).stroke();
          
          currentY = 60;
        }

        // Determine severity label colors
        let sevColor = colorLow;
        if (finding.severity === 'Critical') sevColor = colorCritical;
        else if (finding.severity === 'High') sevColor = colorHigh;
        else if (finding.severity === 'Medium') sevColor = colorMedium;

        // Card Frame
        doc
          .rect(50, currentY, 495, 95)
          .strokeColor('#F1F5F9')
          .lineWidth(1)
          .stroke();

        // Severity Badge Tag
        doc
          .rect(60, currentY + 10, 55, 14)
          .fill(sevColor);

        doc
          .fillColor('#FFFFFF')
          .fontSize(7.5)
          .text(finding.severity.toUpperCase(), 60, currentY + 13, { align: 'center', width: 55, font: 'Helvetica-Bold' });

        // Finding Title & Service name
        doc
          .fillColor(secondaryColor)
          .fontSize(10)
          .text(finding.title, 125, currentY + 10, { font: 'Helvetica-Bold' })
          .fillColor(grayColor)
          .fontSize(8.5)
          .text(`Service: ${finding.resourceId ? finding.resourceId.service : 'Cloud Asset'}`, 125, currentY + 23)
          .text(`Resource: ${finding.resourceArn}`, 125, currentY + 33, { width: 405, height: 12, ellipsis: true });

        // Description
        doc
          .fillColor(secondaryColor)
          .fontSize(8.5)
          .text(`Description: ${finding.description}`, 125, currentY + 47, { width: 405, lineGap: 1 });

        // Mappings
        doc
          .fillColor(grayColor)
          .fontSize(8)
          .text(`CIS Standard: ${finding.complianceMapping ? finding.complianceMapping.cisAWS : 'N/A'}`, 125, currentY + 75)
          .text(`NIST Rule: ${finding.complianceMapping ? finding.complianceMapping.nist : 'N/A'}`, 280, currentY + 75)
          .fillColor(primaryColor)
          .text('Remediation guidance available on Dashboard console.', 400, currentY + 75, { underline: true });

        currentY += 110; // Shift down for next card
      }
    }

    // 7. Finalize & Close stream
    doc.end();
    console.log('[Report Controller] PDF report generation completed successfully.');
  } catch (error) {
    console.error('[Report Controller] Generation failed:', error.message);
    next(error);
  }
};
