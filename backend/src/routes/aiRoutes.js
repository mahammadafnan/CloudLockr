const express = require('express');
const { explainFinding } = require('../controllers/aiController');
const { executeRemediation, previewRemediation } = require('../controllers/remediationController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Private AI Assistant explanation endpoint - Requires authenticated JWT session
router.post('/remediate', protect, explainFinding);

// Private Cloud Remediation Preview endpoint - Computes canonical command dynamically
router.post('/preview-remediation', protect, previewRemediation);

// Private Cloud Remediation Execution endpoint - Restricted to Admin & Security Analyst
router.post('/execute-remediation', protect, executeRemediation);

module.exports = router;
