const db = require('../config/database');
const logger = require('../utils/logger');

/**
 * Log an action to the audit_logs table
 */
const logAudit = async (userId, action, metadata = {}, req = null) => {
  try {
    const ipAddress = req ? (req.headers['x-forwarded-for'] || req.socket.remoteAddress) : null;
    const userAgent = req ? req.headers['user-agent'] : null;

    await db.query(
      `INSERT INTO audit_logs (user_id, action, ip_address, user_agent, metadata)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, action, ipAddress, userAgent, JSON.stringify(metadata)]
    );
  } catch (error) {
    // Never let audit logging break the request
    logger.error('Failed to write audit log', { error: error.message, action, userId });
  }
};

module.exports = { logAudit };
