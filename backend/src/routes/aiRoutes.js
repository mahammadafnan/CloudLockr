const express = require('express');
const { explainFinding } = require('../controllers/aiController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Private AI Assistant explanation endpoint - Requires authenticated JWT session
router.get('/explain/:findingId', protect, explainFinding);

module.exports = router;
