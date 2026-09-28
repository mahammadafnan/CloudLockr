const Resource = require('../models/Resource');
const Finding = require('../models/Finding');
const Scan = require('../models/Scan');
const { calculateSecurityPosture } = require('../utils/postureCalculator');

// @desc    Get dashboard metrics, charts data, and recent issues
// @route   GET /api/dashboard
// @access  Private
exports.getDashboardStats = async (req, res, next) => {
  try {
    const targetProvider = (req.query.provider || 'ALL').toUpperCase();

    // 1. Fetch live active resources
    const allResources = await Resource.find({ status: { $ne: 'deleted' } }).lean();
    const activeFindings = await Finding.find({ status: { $in: ['Active', 'Pending Verification'] } }).populate('resourceId').lean();

    // Filter by provider if specified
    const isFiltered = targetProvider !== 'ALL' && targetProvider !== 'MULTI-CLOUD';
    const scopedResources = isFiltered
      ? allResources.filter(r => r.cloudProvider === targetProvider)
      : allResources;

    const scopedFindings = isFiltered
      ? activeFindings.filter(f => {
          const p = f.resourceId?.cloudProvider || (f.resourceArn?.includes('gcp') ? 'GCP' : f.resourceArn?.includes('azure') ? 'AZURE' : 'AWS');
          return p.toUpperCase() === targetProvider;
        })
      : activeFindings;

    // 2. Calculate dynamic CSPM posture & compliance metrics
    const postureMetrics = calculateSecurityPosture({
      resources: scopedResources,
      findings: scopedFindings,
      provider: targetProvider
    });

    // 3. Compute per-provider breakdown
    const providers = ['AWS', 'GCP', 'AZURE'];
    const byProvider = {};
    for (const p of providers) {
      const pRes = allResources.filter(r => r.cloudProvider === p);
      const pFind = activeFindings.filter(f => {
        const prov = f.resourceId?.cloudProvider || (f.resourceArn?.includes('gcp') ? 'GCP' : f.resourceArn?.includes('azure') ? 'AZURE' : 'AWS');
        return prov.toUpperCase() === p;
      });
      byProvider[p] = calculateSecurityPosture({
        resources: pRes,
        findings: pFind,
        provider: p
      });
    }

    // 3.5 Calculate real cloud exposure (Open misconfigurations distribution across AWS, GCP, Azure)
    let awsOpen = 0;
    let gcpOpen = 0;
    let azureOpen = 0;

    activeFindings.forEach(f => {
      const prov = (
        f.resourceId?.cloudProvider ||
        (f.resourceArn?.includes('gcp') ? 'GCP' : f.resourceArn?.includes('azure') || f.resourceArn?.includes('/subscriptions/') ? 'AZURE' : 'AWS')
      ).toUpperCase();

      if (prov === 'GCP') gcpOpen++;
      else if (prov === 'AZURE') azureOpen++;
      else awsOpen++;
    });

    const cloudExposure = {
      aws: awsOpen,
      gcp: gcpOpen,
      azure: azureOpen,
      total: awsOpen + gcpOpen + azureOpen
    };

    const cloudAccounts = [...new Set(scopedResources.map(r => r.accountId))].filter(Boolean);
    const cloudAccountsCount = cloudAccounts.length || (isFiltered ? 1 : 3);

    // 4. Fetch latest completed scan detail
    const latestScanQuery = isFiltered ? { status: 'Completed', accountId: { $in: cloudAccounts } } : { status: 'Completed' };
    let latestScan = await Scan.findOne(latestScanQuery).sort({ completedAt: -1 });
    if (!latestScan) latestScan = await Scan.findOne({ status: 'Completed' }).sort({ completedAt: -1 });

    // 5. Fetch recent active findings
    const recentFindings = scopedFindings
      .sort((a, b) => new Date(b.firstDetectedAt || 0) - new Date(a.firstDetectedAt || 0))
      .slice(0, 10);

    // 6. Fetch recent scans runs logs (limit 30 for historical charts)
    const recentScans = await Scan.find().sort({ startedAt: -1 }).limit(30);

    res.status(200).json({
      success: true,
      stats: {
        securityScore: postureMetrics.securityScore,
        totalResources: postureMetrics.totalResources,
        healthyResourcesCount: postureMetrics.healthyResourcesCount,
        affectedResourcesCount: postureMetrics.affectedResourcesCount,
        cloudAccountsCount,
        complianceRate: postureMetrics.complianceRate,
        lastScanTime: latestScan ? latestScan.completedAt : null,
        findingsCount: postureMetrics.findingsCount,
        byProvider,
        cloudExposure
      },
      cloudExposure,
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
    const statusFilter = req.query.status ? req.query.status : 'Active';
    const queryFilter = statusFilter === 'All'
      ? {}
      : statusFilter === 'Active'
      ? { status: { $in: ['Active', 'Pending Verification'] } }
      : { status: statusFilter };
    const findings = await Finding.find(queryFilter).populate('resourceId').sort({ firstDetectedAt: -1 });
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
    const rawScans = await Scan.find().sort({ startedAt: -1 });
    const scans = rawScans.map(scan => {
      const obj = scan.toObject();
      let acc = obj.accountId || '';
      let provider = obj.provider;

      if (!provider || provider === 'ALL') {
        if (obj.resourcesScanned >= 40) {
          provider = 'MULTI-CLOUD';
          acc = 'Multi-Cloud Scope';
        } else if (obj.resourcesScanned === 22 || obj.resourcesScanned === 23) {
          provider = 'AWS';
          acc = '464433361537';
        } else if (obj.resourcesScanned === 14 || obj.resourcesScanned === 20) {
          provider = 'GCP';
          acc = 'project-25a7942f-6ee6-4832-a57';
        } else if (obj.resourcesScanned === 12) {
          provider = 'AZURE';
          acc = '48131ce1-65df-4433-bb54-cb966376f6b6';
        } else if (acc.startsWith('project-') || acc.includes('gcp')) {
          provider = 'GCP';
        } else if (acc.includes('-') && acc.length > 20) {
          provider = 'AZURE';
        } else {
          provider = 'AWS';
        }
      }
      
      const score = obj.securityScore ?? 100;
      const findings = obj.findingsFound || { critical: 0, high: 0, medium: 0, low: 0 };

      return {
        ...obj,
        provider,
        securityScore: score,
        score,
        findingsFound: findings,
        findingsCount: findings
      };
    });

    res.status(200).json({
      success: true,
      scans
    });
  } catch (error) {
    next(error);
  }
};
