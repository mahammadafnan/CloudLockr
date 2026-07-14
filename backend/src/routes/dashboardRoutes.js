const express = require('express');
const { getDashboardStats, getResources, getFindings, getScans } = require('../controllers/dashboardController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Protected dashboard metrics endpoint
router.get('/', protect, getDashboardStats);
router.get('/resources', protect, getResources);
router.get('/findings', protect, getFindings);
router.get('/scans', protect, getScans);

module.exports = router;
