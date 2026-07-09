const express = require('express');
const { registerUser, loginUser, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Public auth endpoints
router.post('/register', registerUser);
router.post('/login', loginUser);

// Secure session profile query endpoint
router.get('/me', protect, getMe);

module.exports = router;
