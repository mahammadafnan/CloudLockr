const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes - Verify JWT token
const protect = async (req, res, next) => {
  let token;

  // Check if authorization header is present and format matches
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecretjwtkeyplaceholder');

      // Fetch user from DB and mount to request object (excluding password)
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Not authorized: User associated with token no longer exists.',
        });
      }

      next();
    } catch (error) {
      console.error('[Auth Middleware] Token validation failed:', error.message);
      return res.status(401).json({
        success: false,
        message: 'Not authorized: Token verification failed.',
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized: No token provided in header.',
    });
  }
};

// Gating routes based on specific user roles
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(500).json({
        success: false,
        message: 'Internal server authorization error: User context missing.',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: User role '${req.user.role}' lacks permission to access this resource.`,
      });
    }
    
    next();
  };
};

module.exports = { protect, authorize };
