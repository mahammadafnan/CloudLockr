const { runProgrammaticScan } = require('../utils/scanEngine');

// @desc    Trigger programmatic security scan
// @route   POST /api/scan
// @access  Private (Admin/Analyst)
exports.triggerScan = async (req, res, next) => {
  const { provider, projectId } = req.body || {};
  console.log(`[Scan Controller] SCAN REQUEST RECEIVED for Provider: ${provider || 'ALL'}, Project: ${projectId || 'default'}`);

  try {
    const completedScan = await runProgrammaticScan({
      provider: provider || 'ALL',
      projectId,
      triggerType: 'Manual'
    });
    
    res.status(200).json({
      success: true,
      message: `${provider || 'Multi-Cloud'} security scan completed successfully. Configurations synchronized.`,
      scan: completedScan,
    });
  } catch (error) {
    console.error('[Scan Controller] Trigger failed:', error.message);
    next(error);
  }
};
