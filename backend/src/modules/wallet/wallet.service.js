const db = require('../../config/database');
const { NotFoundError, InsufficientFundsError, BadRequestError } = require('../../utils/errors');
const { logAudit } = require('../../utils/audit');
const logger = require('../../utils/logger');

/**
 * Get wallet balance for a user
 */
const getBalance = async (userId) => {
  const result = await db.query(
    'SELECT id, balance, currency, updated_at FROM wallets WHERE user_id = $1',
    [userId]
  );

  if (result.rows.length === 0) {
    throw new NotFoundError('Wallet not found');
  }

  return result.rows[0];
};

/**
 * Credit wallet (add funds) — used after successful payment verification
 */
const credit = async (userId, amount, reference, req) => {
  if (amount <= 0) {
    throw new BadRequestError('Amount must be positive');
  }

  const result = await db.transaction(async (client) => {
    // Lock the wallet row for update to prevent race conditions
    const walletResult = await client.query(
      'SELECT id, balance FROM wallets WHERE user_id = $1 FOR UPDATE',
      [userId]
    );

    if (walletResult.rows.length === 0) {
      throw new NotFoundError('Wallet not found');
    }

    const wallet = walletResult.rows[0];
    const newBalance = parseFloat(wallet.balance) + parseFloat(amount);

    // Update balance
    const updateResult = await client.query(
      'UPDATE wallets SET balance = $1 WHERE id = $2 RETURNING id, balance, currency, updated_at',
      [newBalance, wallet.id]
    );

    return updateResult.rows[0];
  });

  await logAudit(userId, 'WALLET_CREDIT', { amount, reference }, req);
  logger.info('Wallet credited', { userId, amount, reference });

  return result;
};

/**
 * Debit wallet (remove funds) — used when making payments
 */
const debit = async (userId, amount, reference, client = null) => {
  if (amount <= 0) {
    throw new BadRequestError('Amount must be positive');
  }

  const executeDebit = async (dbClient) => {
    // Lock the wallet row
    const walletResult = await dbClient.query(
      'SELECT id, balance, is_locked FROM wallets WHERE user_id = $1 FOR UPDATE',
      [userId]
    );

    if (walletResult.rows.length === 0) {
      throw new NotFoundError('Wallet not found');
    }

    const wallet = walletResult.rows[0];

    if (wallet.is_locked) {
      throw new BadRequestError('Wallet is temporarily locked');
    }

    if (parseFloat(wallet.balance) < parseFloat(amount)) {
      throw new InsufficientFundsError(
        `Insufficient balance. Available: ₦${parseFloat(wallet.balance).toLocaleString()}, Required: ₦${parseFloat(amount).toLocaleString()}`
      );
    }

    const newBalance = parseFloat(wallet.balance) - parseFloat(amount);

    const updateResult = await dbClient.query(
      'UPDATE wallets SET balance = $1 WHERE id = $2 RETURNING id, balance, currency, updated_at',
      [newBalance, wallet.id]
    );

    return updateResult.rows[0];
  };

  // If a client is passed (already in transaction), use it directly
  if (client) {
    return await executeDebit(client);
  }

  // Otherwise create our own transaction
  return await db.transaction(executeDebit);
};

module.exports = {
  getBalance,
  credit,
  debit,
};
