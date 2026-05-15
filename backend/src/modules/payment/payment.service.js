const db = require('../../config/database');
const walletService = require('../wallet/wallet.service');
const interswitchService = require('./interswitch.service');
const { generateReference } = require('../../utils/reference');
const { logAudit } = require('../../utils/audit');
const { BadRequestError, PaymentError } = require('../../utils/errors');
const logger = require('../../utils/logger');

// Transaction fee (₦10 flat or percentage — configurable)
const TRANSACTION_FEE = 10;

/**
 * Process a payment (airtime, data, or electricity)
 */
const processPayment = async (userId, { type, target, amount, network, bundleCode, disco, destinationInstitutionCode, destinationAccountName, narration }, req) => {
  // Validate amount
  if (amount < 50) {
    throw new BadRequestError('Minimum payment amount is ₦50');
  }

  if (amount > 100000) {
    throw new BadRequestError('Maximum payment amount is ₦100,000');
  }

  const totalAmount = parseFloat(amount) + TRANSACTION_FEE;
  const reference = generateReference(type);

  // Execute in transaction to prevent double spending
  const transaction = await db.transaction(async (client) => {
    // 1. Get wallet and lock it
    const walletResult = await client.query(
      'SELECT id, balance FROM wallets WHERE user_id = $1 FOR UPDATE',
      [userId]
    );

    if (walletResult.rows.length === 0) {
      throw new BadRequestError('Wallet not found');
    }

    const wallet = walletResult.rows[0];

    if (parseFloat(wallet.balance) < totalAmount) {
      throw new BadRequestError(
        `Insufficient balance. Available: ₦${parseFloat(wallet.balance).toLocaleString()}, Required: ₦${totalAmount.toLocaleString()} (includes ₦${TRANSACTION_FEE} fee)`
      );
    }

    // 2. Create transaction record (pending)
    const txResult = await client.query(
      `INSERT INTO transactions (user_id, wallet_id, amount, fee, type, status, reference, target, metadata)
       VALUES ($1, $2, $3, $4, $5, 'processing', $6, $7, $8)
       RETURNING *`,
      [
        userId,
        wallet.id,
        amount,
        TRANSACTION_FEE,
        type,
        reference,
        target,
        JSON.stringify({ network, bundleCode, disco, destinationInstitutionCode, destinationAccountName, narration }),
      ]
    );

    // 3. Debit wallet
    const newBalance = parseFloat(wallet.balance) - totalAmount;
    await client.query(
      'UPDATE wallets SET balance = $1 WHERE id = $2',
      [newBalance, wallet.id]
    );

    return txResult.rows[0];
  });

  // 4. Call Interswitch API (outside the DB transaction for speed)
  let paymentResult;
  try {
    switch (type) {
      case 'airtime':
        paymentResult = await interswitchService.purchaseAirtime({
          phone: target,
          amount,
          reference,
          network,
        });
        break;
      case 'data':
        paymentResult = await interswitchService.purchaseData({
          phone: target,
          amount,
          reference,
          network,
          bundleCode,
        });
        break;
      case 'electricity':
        paymentResult = await interswitchService.payElectricity({
          meterNumber: target,
          amount,
          reference,
          disco,
        });
        break;
      case 'fund_transfer':
        paymentResult = await interswitchService.transferFunds({
          sourceAccountNumber: require('../../config/env').interswitch.sourceAccountNumber,
          sourceAccountName: require('../../config/env').interswitch.sourceAccountName,
          sourceBankCode: require('../../config/env').interswitch.sourceBankCode,
          destinationAccountNumber: target,
          destinationAccountName: destinationAccountName || '',
          destinationInstitutionCode: destinationInstitutionCode,
          transactionAmount: amount,
          clientRef: reference,
          mobileNumber: '',
          emailAddress: '',
        });
        break;
      default:
        throw new BadRequestError(`Unknown payment type: ${type}`);
    }
  } catch (error) {
    // Payment API call failed — mark transaction as failed and refund
    await handlePaymentFailure(transaction.id, userId, totalAmount, error.message);
    throw new PaymentError(error.message || 'Payment processing failed');
  }

  // 5. Update transaction status based on result
  if (paymentResult?.success || paymentResult?.responseCode === '90000' || paymentResult?.responseCode === '90009') { // 90009 is processing
    // It's processing or successful. We need to poll 360s later as per V5 docs
    await db.query(
      `UPDATE transactions SET status = $1, provider_reference = $2, processed_at = NOW(),
       metadata = metadata || $3
       WHERE id = $4`,
      [
        paymentResult.responseCode === '90000' ? 'success' : 'processing',
        paymentResult.providerReference || paymentResult.transactionRef,
        JSON.stringify({ responseCode: paymentResult.responseCode, token: paymentResult.token }),
        transaction.id,
      ]
    );

    // Schedule the 360s delayed polling job
    try {
      const { getTransactionQueue } = require('../../queues/transaction.queue');
      const q = getTransactionQueue();
      if (q) {
        await q.add('poll-status', 
          { transactionId: transaction.id, reference },
          { delay: 360 * 1000, jobId: `poll-${reference}` } 
        );
        logger.info(`Scheduled transaction polling job for ${reference} in 360s`);
      }
    } catch (e) {
      logger.error('Failed to schedule polling job', { error: e.message });
    }

    await logAudit(userId, 'PAYMENT_INITIATED', { type, amount, reference, target }, req);

    return {
      status: paymentResult.responseCode === '90000' ? 'success' : 'processing',
      reference,
      amount,
      fee: TRANSACTION_FEE,
      total: totalAmount,
      type,
      target,
      providerReference: paymentResult.providerReference,
      token: paymentResult.token || null,
      message: paymentResult.responseMessage,
    };
  } else {
    // Payment was declined by Interswitch — refund
    await handlePaymentFailure(
      transaction.id,
      userId,
      totalAmount,
      paymentResult.responseMessage
    );

    throw new PaymentError(paymentResult.responseMessage || 'Payment was declined');
  }
};

/**
 * Handle payment failure — refund wallet and update transaction
 */
const handlePaymentFailure = async (transactionId, userId, amount, errorMessage) => {
  await db.transaction(async (client) => {
    // Mark transaction as failed
    await client.query(
      `UPDATE transactions SET status = 'failed', error_message = $1, processed_at = NOW() WHERE id = $2`,
      [errorMessage, transactionId]
    );

    // Refund wallet
    await client.query(
      'UPDATE wallets SET balance = balance + $1 WHERE user_id = $2',
      [amount, userId]
    );
  });

  await logAudit(userId, 'PAYMENT_FAILED', { transactionId, amount, error: errorMessage });
  logger.warn('Payment failed, wallet refunded', { transactionId, userId, amount });
};

/**
 * Get transaction history for a user
 */
const getHistory = async (userId, { page = 1, limit = 20, type, status }) => {
  const offset = (page - 1) * limit;
  let query = `SELECT id, amount, fee, type, status, reference, target, metadata, error_message, created_at, processed_at
               FROM transactions WHERE user_id = $1`;
  const params = [userId];
  let paramIndex = 2;

  if (type) {
    query += ` AND type = $${paramIndex++}`;
    params.push(type);
  }

  if (status) {
    query += ` AND status = $${paramIndex++}`;
    params.push(status);
  }

  query += ` ORDER BY created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex}`;
  params.push(limit, offset);

  const result = await db.query(query, params);

  // Get total count
  let countQuery = 'SELECT COUNT(*) FROM transactions WHERE user_id = $1';
  const countParams = [userId];
  let countIndex = 2;
  if (type) {
    countQuery += ` AND type = $${countIndex++}`;
    countParams.push(type);
  }
  if (status) {
    countQuery += ` AND status = $${countIndex++}`;
    countParams.push(status);
  }

  const countResult = await db.query(countQuery, countParams);
  const total = parseInt(countResult.rows[0].count, 10);

  return {
    transactions: result.rows,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

module.exports = {
  processPayment,
  getHistory,
  handlePaymentFailure,
};
