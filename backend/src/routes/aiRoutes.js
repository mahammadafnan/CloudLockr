const express = require('express');
const { explainFinding } = require('../controllers/aiController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Private AI Assistant explanation endpoint - Requires authenticated JWT session
router.post('/remediate', protect, explainFinding);

module.exports = router;
