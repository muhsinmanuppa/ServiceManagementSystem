import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Authenticate user middleware
export const authenticateUser = async (req, res, next) => {
  try {
    let token;

    // Check for token in headers
    if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    // Check for token in cookies as fallback
    else if (req.cookies?.token) {
      token = req.cookies.token;
    }

    if (!token) {
      console.log('No token found');
      return res.status(401).json({ 
        message: 'Authentication required',
        code: 'NO_TOKEN'
      });
    }

    // Verify token with error handling
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (jwtError) {
      console.error('JWT Verification failed:', jwtError);
      return res.status(401).json({
        message: jwtError.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid token',
        code: jwtError.name
      });
    }

    // Get user with role field
    const user = await User.findById(decoded.id)
      .select('-password')
      .lean();

    if (!user) {
      return res.status(401).json({
        message: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    // Attach user and token info to request
    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ 
      message: 'Authentication error',
      code: 'AUTH_ERROR'
    });
  }
};

// Authorize roles middleware
export const authorizeRoles = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `Access denied. ${req.user.role} role is not authorized.` 
      });
    }
    
    next();
  };
};

export const authorize = authorizeRoles;
export default { authenticateUser, authorizeRoles, authorize };
