const { runProgrammaticScan } = require('../utils/scanEngine');

// @desc    Trigger programmatic security scan
// @route   POST /api/scan
// @access  Private (Admin/Analyst)
exports.triggerScan = async (req, res, next) => {
  console.log('[Scan Controller] Manual scan trigger request received.');

  try {
    const completedScan = await runProgrammaticScan('Manual');
    
    res.status(200).json({
      success: true,
      message: 'AWS scan completed successfully. Configurations synchronized.',
      scan: completedScan,
    });
  } catch (error) {
    console.error('[Scan Controller] Trigger failed:', error.message);
    next(error);
  }
};
