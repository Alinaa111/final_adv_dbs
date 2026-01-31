const jwt = require('jsonwebtoken');
const User = require('../models/User');

// ===============================================
// MIDDLEWARE: Verify JWT Token
// Protects routes that require authentication
// ===============================================
const protect = async (req, res, next) => {
  try {
    let token;

    // Check if token exists in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      // Extract token from "Bearer TOKEN"
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized. Please log in.'
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from database (excluding password)
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'User not found. Token invalid.'
        });
      }

      if (!req.user.isActive) {
        return res.status(403).json({
          success: false,
          message: 'Your account has been deactivated.'
        });
      }

      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Token is invalid or has expired.'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error during authentication',
      error: error.message
    });
  }
};

// ===============================================
// MIDDLEWARE: Authorize Admin Role
// Use after protect middleware
// ===============================================
const authorizeAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({
      success: false,
      message: 'Access denied. Admin privileges required.'
    });
  }
};

// ===============================================
// MIDDLEWARE: Authorize Specific Roles
// Flexible role authorization
// ===============================================
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role '${req.user.role}' is not authorized to access this resource`
      });
    }

    next();
  };
};

module.exports = { protect, authorizeAdmin, authorizeRoles };
