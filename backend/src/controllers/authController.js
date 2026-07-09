const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Helper to sign JWT tokens
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'supersecretjwtkeyplaceholder', {
    expiresIn: '30d',
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
exports.registerUser = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, and password.',
      });
    }

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'A user is already registered with this email address.',
      });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      role: role || 'Viewer',
    });

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Log in user
// @route   POST /api/auth/login
// @access  Public
exports.loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password.',
      });
    }

    // Find user (include password field explicitly)
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials.',
      });
    }

    // Verify password matches hashed database value
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials.',
      });
    }

    // Generate token
    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get currently logged-in user profile
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    // req.user has already been set by protect middleware
    res.status(200).json({
      success: true,
      user: req.user,
    });
  } catch (error) {
    next(error);
  }
};
