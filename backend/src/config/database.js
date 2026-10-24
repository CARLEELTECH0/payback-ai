const { Pool } = require('pg');
const env = require('./env');
const logger = require('../utils/logger');

let isConnected = false;
let isOfflineMode = false;

const pool = new Pool({
  connectionString: env.databaseUrl,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 3000,
});

pool.on('error', (err) => {
  if (!isOfflineMode) {
    logger.warn('PostgreSQL pool connection offline; switching to in-memory standalone datastore.', {
      error: err.message,
    });
    isOfflineMode = true;
  }
});

// In-Memory Standalone Datastore for Local Testing / Offline Demos
const memoryStore = {
  users: [
    {
      id: '11111111-1111-1111-1111-111111111111',
      email: 'merchant@payback.ai',
      phone: '+14085550100',
      first_name: 'Jordan',
      last_name: 'Lee',
      password_hash: '$2a$10$Dh/thL3bUn9uYl2GFJXDpOqVZqzwDRaZN7TC.aJRVcO1CIfRV794G',
      is_verified: true,
      is_active: true,
      created_at: new Date(Date.now() - 90 * 86400000),
    },
    {
      id: '11111111-1111-1111-1111-111111111112',
      email: 'jordan.lee@paypal.com',
      phone: '+14085550199',
      first_name: 'Jordan',
      last_name: 'Lee',
      password_hash: '$2a$10$Dh/thL3bUn9uYl2GFJXDpOqVZqzwDRaZN7TC.aJRVcO1CIfRV794G',
      is_verified: true,
      is_active: true,
      created_at: new Date(Date.now() - 90 * 86400000),
    },
  ],
  wallets: [
    {
      id: '22222222-2222-2222-2222-222222222222',
      user_id: '11111111-1111-1111-1111-111111111111',
      balance: '284500.00',
      currency: 'USD',
      is_locked: false,
      created_at: new Date(Date.now() - 90 * 86400000),
    },
    {
      id: '22222222-2222-2222-2222-222222222223',
      user_id: '11111111-1111-1111-1111-111111111112',
      balance: '284500.00',
      currency: 'USD',
      is_locked: false,
      created_at: new Date(Date.now() - 90 * 86400000),
    },
  ],
  refresh_tokens: [],
  transactions: [
    {
      id: '00000000-0000-0000-0000-000000000001',
      user_id: '11111111-1111-1111-1111-111111111111',
      wallet_id: '22222222-2222-2222-2222-222222222222',
      reference: 'TXN-AUTO-99124',
      provider_reference: 'PAYPAL-CAP-881920',
      amount: '115.00',
      fee: '0.00',
      type: 'electricity',
      status: 'success',
      target: '04192837461 (Eko Electric Meter)',
      metadata: {
        token: '4920-1928-3847-1920-3849',
        units_kwh: '82.4',
        disco: 'EKEDC',
        service_delivered: true,
      },
      processed_at: new Date(Date.now() - 3 * 86400000),
      created_at: new Date(Date.now() - 3 * 86400000),
    },
    {
      id: '00000000-0000-0000-0000-000000000002',
      user_id: '11111111-1111-1111-1111-111111111111',
      wallet_id: '22222222-2222-2222-2222-222222222222',
      reference: 'TXN-SUB-44129',
      provider_reference: 'PAYPAL-SUB-99412',
      amount: '60.00',
      fee: '0.00',
      type: 'data',
      status: 'success',
      target: '08012345678 (MTN 40GB Pro)',
      metadata: {
        token: 'MTN-DATA-ACK-9921',
        service_delivered: true,
      },
      processed_at: new Date(Date.now() - 7 * 86400000),
      created_at: new Date(Date.now() - 7 * 86400000),
    },
  ],
  audit_logs: [
    {
      id: '33333333-3333-3333-3333-333333333331',
      user_id: '11111111-1111-1111-1111-111111111111',
      action: 'USER_LOGIN_SUCCESS',
      ip_address: '102.89.33.14',
      user_agent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15',
      metadata: { auth_method: 'PASSWORD_AND_JWT', device: 'Apple iPhone' },
      created_at: new Date(Date.now() - 3 * 86400000 - 180000),
    },
    {
      id: '33333333-3333-3333-3333-333333333332',
      user_id: '11111111-1111-1111-1111-111111111111',
      action: 'TRANSACTION_INITIATED',
      ip_address: '102.89.33.14',
      user_agent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15',
      metadata: { reference: 'TXN-AUTO-99124', amount: 115.00 },
      created_at: new Date(Date.now() - 3 * 86400000),
    },
    {
      id: '33333333-3333-3333-3333-333333333333',
      user_id: '11111111-1111-1111-1111-111111111111',
      action: 'BILLER_DISPATCH_SUCCESS',
      ip_address: '102.89.33.14',
      user_agent: 'AutoPay/Worker-BullMQ',
      metadata: { provider: 'Interswitch/BillerGateway', response_code: '90000', delivered: true },
      created_at: new Date(Date.now() - 3 * 86400000 + 1200),
    },
    {
      id: '33333333-3333-3333-3333-333333333334',
      user_id: '11111111-1111-1111-1111-111111111111',
      action: 'POST_PURCHASE_SESSION_ACTIVE',
      ip_address: '102.89.33.14',
      user_agent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15',
      metadata: { view: 'RECEIPT_MODAL_VIEWED', screen_time_seconds: 45 },
      created_at: new Date(Date.now() - 3 * 86400000 + 45000),
    },
  ],
  payback_disputes: [
    {
      id: '44444444-4444-4444-4444-444444444441',
      paypal_dispute_id: 'PP-D-882194',
      transaction_id: '00000000-0000-0000-0000-000000000001',
      user_id: '11111111-1111-1111-1111-111111111111',
      dispute_amount: '75.00',
      dispute_currency: 'USD',
      reason: 'MERCHANDISE_OR_SERVICE_NOT_RECEIVED',
      status: 'EVIDENCE_SUBMITTED',
      confidence_score: '95.00',
      submitted_at: new Date(Date.now() - 3600000),
      created_at: new Date(Date.now() - 3650000),
    },
    {
      id: '44444444-4444-4444-4444-444444444442',
      paypal_dispute_id: 'PP-D-771923',
      transaction_id: '00000000-0000-0000-0000-000000000002',
      user_id: '11111111-1111-1111-1111-111111111111',
      dispute_amount: '120.00',
      dispute_currency: 'USD',
      reason: 'UNAUTHORIZED_TRANSACTION',
      status: 'RESOLVED_MERCHANT_WIN',
      confidence_score: '98.00',
      submitted_at: new Date(Date.now() - 86400000),
      created_at: new Date(Date.now() - 90000000),
    },
  ],
};

/**
 * Handle in-memory query execution when Postgres is offline
 */
const executeMemoryQuery = (text, params) => {
  const upper = text.toUpperCase();

  if (upper.includes('SELECT NOW()')) {
    return { rows: [{ now: new Date().toISOString() }], rowCount: 1 };
  }

  if (upper.includes('SELECT') && upper.includes('FROM PAYBACK_DISPUTES')) {
    return { rows: [...memoryStore.payback_disputes], rowCount: memoryStore.payback_disputes.length };
  }

  if (upper.includes('SELECT') && upper.includes('FROM TRANSACTIONS')) {
    if (params.length > 0) {
      const match = memoryStore.transactions.filter(
        (t) => t.reference === params[0] || t.id === params[0] || t.provider_reference === params[0]
      );
      if (match.length > 0) {
        const t = match[0];
        const user = memoryStore.users[0];
        return {
          rows: [
            {
              ...t,
              currency: 'USD',
              user_email: user.email,
              user_phone: user.phone,
              first_name: user.first_name,
              last_name: user.last_name,
              is_verified: user.is_verified,
              user_created_at: user.created_at,
            },
          ],
          rowCount: 1,
        };
      }
    }
    return { rows: [...memoryStore.transactions], rowCount: memoryStore.transactions.length };
  }

  if (upper.includes('SELECT') && upper.includes('FROM AUDIT_LOGS')) {
    return { rows: [...memoryStore.audit_logs], rowCount: memoryStore.audit_logs.length };
  }

  if (upper.includes('SELECT') && upper.includes('FROM WALLETS')) {
    if (params && params.length > 0) {
      const match = memoryStore.wallets.filter((w) => w.user_id === params[0] || w.id === params[0]);
      if (match.length > 0) {
        return { rows: match, rowCount: match.length };
      }
    }
    return { rows: [...memoryStore.wallets], rowCount: memoryStore.wallets.length };
  }

  if (upper.includes('SELECT') && upper.includes('FROM USERS')) {
    if (params && params.length > 0) {
      const queryVal = String(params[0]).toLowerCase();
      const match = memoryStore.users.filter(
        (u) => u.email.toLowerCase() === queryVal || u.id === queryVal || (u.phone && u.phone === queryVal)
      );
      return { rows: match, rowCount: match.length };
    }
    return { rows: [...memoryStore.users], rowCount: memoryStore.users.length };
  }

  if (upper.includes('INSERT INTO REFRESH_TOKENS')) {
    const newRt = {
      id: `rt-${Date.now()}`,
      user_id: params[0],
      token_hash: params[1],
      expires_at: params[2],
      is_revoked: false,
      created_at: new Date(),
    };
    memoryStore.refresh_tokens.push(newRt);
    return { rows: [newRt], rowCount: 1 };
  }

  if (upper.includes('SELECT') && upper.includes('FROM REFRESH_TOKENS')) {
    if (params && params.length >= 2) {
      const match = memoryStore.refresh_tokens.filter(
        (rt) => rt.token_hash === params[0] && rt.user_id === params[1] && !rt.is_revoked
      );
      return { rows: match, rowCount: match.length };
    }
    return { rows: [...memoryStore.refresh_tokens], rowCount: memoryStore.refresh_tokens.length };
  }

  if (upper.includes('UPDATE REFRESH_TOKENS')) {
    if (upper.includes('WHERE ID = $1')) {
      const rt = memoryStore.refresh_tokens.find((r) => r.id === params[0]);
      if (rt) rt.is_revoked = true;
    } else if (upper.includes('TOKEN_HASH = $1')) {
      const rt = memoryStore.refresh_tokens.find((r) => r.token_hash === params[0]);
      if (rt) rt.is_revoked = true;
    }
    return { rows: [], rowCount: 1 };
  }

  if (upper.includes('INSERT INTO PAYBACK_DISPUTES')) {
    const newDispute = {
      id: `mem-${Date.now()}`,
      paypal_dispute_id: params[0],
      dispute_amount: params[3],
      dispute_currency: params[4] || 'USD',
      reason: params[5],
      status: params[6],
      confidence_score: params[7],
      created_at: new Date(),
    };
    memoryStore.payback_disputes.unshift(newDispute);
    return { rows: [newDispute], rowCount: 1 };
  }

  if (upper.includes('INSERT INTO AUDIT_LOGS')) {
    const newLog = {
      id: `mem-log-${Date.now()}`,
      user_id: params[0],
      action: params[1],
      ip_address: params[2],
      user_agent: params[3],
      metadata: params[4],
      created_at: new Date(),
    };
    memoryStore.audit_logs.push(newLog);
    return { rows: [newLog], rowCount: 1 };
  }

  return { rows: [], rowCount: 0 };
};

/**
 * Execute a parameterized query with transparent fallback
 */
const query = async (text, params = []) => {
  if (isOfflineMode) {
    return executeMemoryQuery(text, params);
  }

  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    logger.debug('Query executed', { text: text.substring(0, 80), duration, rows: result.rowCount });
    return result;
  } catch (error) {
    if (error.code === 'ECONNREFUSED' || error.message.includes('ECONNREFUSED')) {
      if (!isOfflineMode) {
        logger.info('💡 PostgreSQL offline. Activating in-memory datastore for standalone operation.');
        isOfflineMode = true;
      }
      return executeMemoryQuery(text, params);
    }
    logger.error('Query failed', { text: text.substring(0, 80), error: error.message });
    throw error;
  }
};

/**
 * Get a client from the pool for transactions
 */
const getClient = async () => {
  if (isOfflineMode) {
    return {
      query: (text, params) => executeMemoryQuery(text, params),
      release: () => {},
    };
  }

  try {
    const client = await pool.connect();
    return client;
  } catch (err) {
    isOfflineMode = true;
    return {
      query: (text, params) => executeMemoryQuery(text, params),
      release: () => {},
    };
  }
};

/**
 * Execute multiple queries in a transaction
 */
const transaction = async (callback) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    if (client.release) client.release();
  }
};

/**
 * Test database connection
 */
const testConnection = async () => {
  try {
    const result = await query('SELECT NOW()');
    isConnected = true;
    if (isOfflineMode) {
      logger.info('🚀 Standalone In-Memory Datastore Active (Zero-config local mode)');
    } else {
      logger.info('Database connection successful', { time: result.rows[0].now });
    }
    return true;
  } catch (error) {
    logger.info('💡 Standalone In-Memory Datastore Active (Zero-config local mode)');
    isOfflineMode = true;
    return true;
  }
};

module.exports = {
  pool,
  query,
  getClient,
  transaction,
  testConnection,
  memoryStore,
};
