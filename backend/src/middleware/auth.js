const jwt = require('jsonwebtoken');
const env = require('../config/env');
const { UnauthorizedError } = require('../utils/errors');
const db = require('../config/database');

/**
 * Authenticate JWT token from Authorization header
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('No token provided');
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, env.jwtSecret);

    // Verify user still exists and is active
    const result = await db.query(
      'SELECT id, email, phone, first_name, last_name, is_active, is_verified FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      throw new UnauthorizedError('User not found');
    }

    const user = result.rows[0];
    if (!user.is_active) {
      throw new UnauthorizedError('Account is deactivated');
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return next(new UnauthorizedError('Invalid token'));
    }
    if (error.name === 'TokenExpiredError') {
      return next(new UnauthorizedError('Token expired'));
    }
    next(error);
  }
};

module.exports = { authenticate };
