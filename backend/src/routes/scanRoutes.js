const express = require('express');
const { triggerScan } = require('../controllers/scanController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Private scan endpoint - Restricted to Admin and Security Analyst roles
router.post('/', protect, authorize('Admin', 'Security Analyst'), triggerScan);

module.exports = router;
