const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const db = require('../../config/database');
const env = require('../../config/env');
const { ConflictError, UnauthorizedError, NotFoundError } = require('../../utils/errors');
const { logAudit } = require('../../utils/audit');
const logger = require('../../utils/logger');

const SALT_ROUNDS = 12;

/**
 * Register a new user
 */
const signup = async ({ email, phone, firstName, lastName, password }, req) => {
  // Check if user exists
  const existing = await db.query(
    'SELECT id FROM users WHERE email = $1 OR phone = $2',
    [email.toLowerCase(), phone]
  );

  if (existing.rows.length > 0) {
    throw new ConflictError('An account with this email or phone already exists');
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  // Create user and wallet in a transaction
  const result = await db.transaction(async (client) => {
    // Insert user
    const userResult = await client.query(
      `INSERT INTO users (email, phone, first_name, last_name, password_hash)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, email, phone, first_name, last_name, created_at`,
      [email.toLowerCase(), phone, firstName, lastName, passwordHash]
    );

    const user = userResult.rows[0];

    // Create wallet for user
    await client.query(
      'INSERT INTO wallets (user_id) VALUES ($1)',
      [user.id]
    );

    return user;
  });

  // Generate tokens
  const tokens = await generateTokens(result.id);

  // Audit log
  await logAudit(result.id, 'USER_SIGNUP', { email: result.email }, req);

  logger.info('New user registered', { userId: result.id, email: result.email });

  return {
    user: {
      id: result.id,
      email: result.email,
      phone: result.phone,
      firstName: result.first_name,
      lastName: result.last_name,
    },
    ...tokens,
  };
};

/**
 * Login user
 */
const login = async ({ email, password }, req) => {
  // Find user
  const result = await db.query(
    'SELECT id, email, phone, first_name, last_name, password_hash, is_active FROM users WHERE email = $1',
    [email.toLowerCase()]
  );

  if (result.rows.length === 0) {
    throw new UnauthorizedError('Invalid email or password');
  }

  const user = result.rows[0];

  if (!user.is_active) {
    throw new UnauthorizedError('Account is deactivated');
  }

  // Verify password
  const isValid = await bcrypt.compare(password, user.password_hash);
  if (!isValid) {
    await logAudit(user.id, 'LOGIN_FAILED', { reason: 'Invalid password' }, req);
    throw new UnauthorizedError('Invalid email or password');
  }

  // Generate tokens
  const tokens = await generateTokens(user.id);

  // Audit log
  await logAudit(user.id, 'USER_LOGIN', {}, req);

  return {
    user: {
      id: user.id,
      email: user.email,
      phone: user.phone,
      firstName: user.first_name,
      lastName: user.last_name,
    },
    ...tokens,
  };
};

/**
 * Refresh access token
 */
const refreshAccessToken = async (refreshToken) => {
  try {
    // Verify the refresh token
    const decoded = jwt.verify(refreshToken, env.jwtRefreshSecret);

    // Hash the token to look it up
    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

    // Check if token exists and is not revoked
    const result = await db.query(
      `SELECT id, user_id, is_revoked, expires_at FROM refresh_tokens
       WHERE token_hash = $1 AND user_id = $2`,
      [tokenHash, decoded.userId]
    );

    if (result.rows.length === 0 || result.rows[0].is_revoked) {
      throw new UnauthorizedError('Invalid refresh token');
    }

    if (new Date(result.rows[0].expires_at) < new Date()) {
      throw new UnauthorizedError('Refresh token expired');
    }

    // Revoke old token and generate new pair (token rotation)
    await db.query('UPDATE refresh_tokens SET is_revoked = TRUE WHERE id = $1', [result.rows[0].id]);

    // Generate new tokens
    const tokens = await generateTokens(decoded.userId);

    return tokens;
  } catch (error) {
    if (error instanceof UnauthorizedError) throw error;
    throw new UnauthorizedError('Invalid refresh token');
  }
};

/**
 * Logout — revoke refresh token
 */
const logout = async (userId, refreshToken) => {
  if (refreshToken) {
    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    await db.query(
      'UPDATE refresh_tokens SET is_revoked = TRUE WHERE token_hash = $1 AND user_id = $2',
      [tokenHash, userId]
    );
  }

  // Revoke all tokens for this user (optional — use for "logout everywhere")
  // await db.query('UPDATE refresh_tokens SET is_revoked = TRUE WHERE user_id = $1', [userId]);

  await logAudit(userId, 'USER_LOGOUT', {});
};

/**
 * Generate access + refresh token pair
 */
const generateTokens = async (userId) => {
  const accessToken = jwt.sign(
    { userId, type: 'access' },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn }
  );

  const refreshToken = jwt.sign(
    { userId, type: 'refresh' },
    env.jwtRefreshSecret,
    { expiresIn: env.jwtRefreshExpiresIn }
  );

  // Store hashed refresh token
  const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  await db.query(
    'INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)',
    [userId, tokenHash, expiresAt]
  );

  return { accessToken, refreshToken };
};

module.exports = {
  signup,
  login,
  refreshAccessToken,
  logout,
};
