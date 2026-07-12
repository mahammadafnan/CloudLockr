const express = require('express');
const { downloadSecurityReport } = require('../controllers/reportController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Private report download endpoint - Requires authenticated JWT session
router.get('/download', protect, downloadSecurityReport);

module.exports = router;
