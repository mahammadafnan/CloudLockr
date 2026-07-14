const Resource = require('../models/Resource');
const Finding = require('../models/Finding');
const Scan = require('../models/Scan');

// @desc    Get dashboard metrics, charts data, and recent issues
// @route   GET /api/dashboard
// @access  Private
exports.getDashboardStats = async (req, res, next) => {
  try {
    // 1. Fetch count totals
    const totalResources = await Resource.countDocuments();
    const cloudAccounts = await Resource.distinct('accountId');
    const cloudAccountsCount = cloudAccounts.length;

    // 2. Fetch findings severity grouping counts
    const criticalCount = await Finding.countDocuments({ severity: 'Critical', status: 'Active' });
    const highCount = await Finding.countDocuments({ severity: 'High', status: 'Active' });
    const mediumCount = await Finding.countDocuments({ severity: 'Medium', status: 'Active' });
    const lowCount = await Finding.countDocuments({ severity: 'Low', status: 'Active' });
    const informationalCount = await Finding.countDocuments({ severity: 'Informational', status: 'Active' });
    
    const totalFindings = criticalCount + highCount + mediumCount + lowCount + informationalCount;

    // 3. Recalculate security score dynamically
    // Formula: Initial = 100. Deductions: Critical = -20, High = -10, Medium = -5, Low = -2, Informational = 0.
    // Score cannot drop below 0.
    const deductions = (criticalCount * 20) + (highCount * 10) + (mediumCount * 5) + (lowCount * 2);
    const securityScore = Math.max(0, 100 - deductions);

    // 4. Fetch compliance levels percentage (mock/aggregation check)
    // In Sprint 8, we will build a real audit engine. For now, we count passing checks over total checks.
    // We mock passing controls percentages based on finding volume.
    const passedControlsPercent = totalFindings === 0 ? 100 : Math.max(45, 95 - (totalFindings * 1.5));

    // 5. Fetch latest completed scan detail
    const latestScan = await Scan.findOne({ status: 'Completed' }).sort({ completedAt: -1 });

    // 6. Fetch recent active findings (top 5 critical/high severity findings with resource data populated)
    const recentFindings = await Finding.find({ status: 'Active' })
      .populate('resourceId')
      .sort({ severity: 1, firstDetectedAt: -1 }) // Sorts by severity weight (if we map strings, sort by firstDetectedAt)
      .limit(5);

    // 7. Fetch recent scans runs logs
    const recentScans = await Scan.find().sort({ startedAt: -1 }).limit(5);

    res.status(200).json({
      success: true,
      stats: {
        securityScore,
        totalResources,
        cloudAccountsCount,
        complianceRate: Math.round(passedControlsPercent * 10) / 10,
        lastScanTime: latestScan ? latestScan.completedAt : null,
        findingsCount: {
          critical: criticalCount,
          high: highCount,
          medium: mediumCount,
          low: lowCount,
          informational: informationalCount,
          total: totalFindings,
        },
      },
      recentFindings,
      recentScans,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all discovered resources
// @route   GET /api/dashboard/resources
// @access  Private
exports.getResources = async (req, res, next) => {
  try {
    const resources = await Resource.find().sort({ service: 1, type: 1 });
    res.status(200).json({
      success: true,
      resources
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all security findings
// @route   GET /api/dashboard/findings
// @access  Private
exports.getFindings = async (req, res, next) => {
  try {
    const findings = await Finding.find().populate('resourceId').sort({ firstDetectedAt: -1 });
    res.status(200).json({
      success: true,
      findings
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all scan logs
// @route   GET /api/dashboard/scans
// @access  Private
exports.getScans = async (req, res, next) => {
  try {
    const scans = await Scan.find().sort({ startedAt: -1 });
    res.status(200).json({
      success: true,
      scans
    });
  } catch (error) {
    next(error);
  }
};
