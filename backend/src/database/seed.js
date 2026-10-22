const bcrypt = require('bcryptjs');
const db = require('../config/database');
const logger = require('../utils/logger');

async function seedDatabase() {
  console.log('🌱 Starting PayBack AI & AutoPay Database Seeder...\n');

  try {
    // 1. Seed Demo Merchant / User
    const passwordHash = await bcrypt.hash('Password123!', 10);
    const userRes = await db.query(
      `INSERT INTO users (email, phone, first_name, last_name, password_hash, is_verified, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (email) DO UPDATE SET is_active = true
       RETURNING id, email`,
      [
        'merchant@payback.ai',
        '+2348099887766',
        'Carleel',
        'Enterprise',
        passwordHash,
        true,
        true,
      ]
    );

    const userId = userRes.rows[0].id;
    console.log(`✅ Seeded Merchant User: ${userRes.rows[0].email} (ID: ${userId})`);

    // 2. Seed Merchant Wallet
    const walletRes = await db.query(
      `INSERT INTO wallets (user_id, balance, currency)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id) DO UPDATE SET balance = 450000.00
       RETURNING id, balance`,
      [userId, 450000.00, 'NGN']
    );
    const walletId = walletRes.rows[0].id;
    console.log(`✅ Seeded Merchant Wallet: NGN ${walletRes.rows[0].balance} (ID: ${walletId})`);

    // 3. Seed Verified Transactions with Digital Proof
    const txns = [
      {
        reference: 'TXN-AUTO-99124',
        providerRef: 'PAYPAL-CAP-881920',
        amount: 115.00,
        type: 'electricity',
        status: 'success',
        target: '04192837461 (Eko Electric Meter)',
        metadata: {
          token: '4920-1928-3847-1920-3849',
          units_kwh: '82.4',
          disco: 'EKEDC',
          service_delivered: true,
          delivery_timestamp: new Date(Date.now() - 3 * 86400000).toISOString(),
        },
      },
      {
        reference: 'TXN-SUB-44129',
        providerRef: 'PAYPAL-SUB-99412',
        amount: 60.00,
        type: 'data',
        status: 'success',
        target: '08012345678 (MTN 40GB Pro)',
        metadata: {
          network: 'MTN',
          plan_code: 'MTN_40GB_CORP',
          token: 'MTN-DATA-ACK-9921',
          service_delivered: true,
          delivery_timestamp: new Date(Date.now() - 7 * 86400000).toISOString(),
        },
      },
    ];

    for (const t of txns) {
      await db.query(
        `INSERT INTO transactions (
           user_id, wallet_id, amount, type, status, reference, provider_reference, target, metadata, processed_at
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
         ON CONFLICT (reference) DO UPDATE SET status = EXCLUDED.status`,
        [userId, walletId, t.amount, t.type, t.status, t.reference, t.providerRef, t.target, JSON.stringify(t.metadata)]
      );
    }
    console.log(`✅ Seeded ${txns.length} Verified Transactions`);

    // 4. Seed Audit Logs with Originating IP and Session Fingerprints
    const auditEvents = [
      {
        action: 'USER_LOGIN_SUCCESS',
        ip: '102.89.33.14',
        ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15',
        meta: { auth_method: 'PASSWORD_AND_JWT', device: 'Apple iPhone' },
        timeOffset: 3 * 86400000 + 180000,
      },
      {
        action: 'TRANSACTION_INITIATED',
        ip: '102.89.33.14',
        ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15',
        meta: { reference: 'TXN-AUTO-99124', amount: 115.00 },
        timeOffset: 3 * 86400000,
      },
      {
        action: 'BILLER_DISPATCH_SUCCESS',
        ip: '102.89.33.14',
        ua: 'AutoPay/Worker-BullMQ',
        meta: { provider: 'Interswitch/BillerGateway', response_code: '90000', delivered: true },
        timeOffset: 3 * 86400000 - 1200,
      },
      {
        action: 'POST_PURCHASE_SESSION_ACTIVE',
        ip: '102.89.33.14',
        ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15',
        meta: { view: 'RECEIPT_MODAL_VIEWED', screen_time_seconds: 45 },
        timeOffset: 3 * 86400000 - 45000,
      },
    ];

    for (const a of auditEvents) {
      await db.query(
        `INSERT INTO audit_logs (user_id, action, ip_address, user_agent, metadata, created_at)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [userId, a.action, a.ip, a.ua, JSON.stringify(a.meta), new Date(Date.now() - a.timeOffset)]
      );
    }
    console.log(`✅ Seeded ${auditEvents.length} Forensic Audit Records`);

    // 5. Seed PayBack Disputes
    await db.query(
      `INSERT INTO payback_disputes (
         paypal_dispute_id, user_id, dispute_amount, dispute_currency, reason, status,
         confidence_score, evidence_packet, ai_defense_summary, submitted_at
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
       ON CONFLICT (paypal_dispute_id) DO NOTHING`,
      [
        'PP-D-882194',
        userId,
        75.00,
        'USD',
        'MERCHANDISE_OR_SERVICE_NOT_RECEIVED',
        'EVIDENCE_SUBMITTED',
        95.00,
        JSON.stringify({
          originating_ip: '102.89.33.14',
          digital_token: '4920-1928-3847-1920-3849',
          verified_delivery: true,
        }),
        'Forensic telemetry and gateway delivery confirmations prove digital utility was provisioned instantly.',
      ]
    );

    await db.query(
      `INSERT INTO payback_disputes (
         paypal_dispute_id, user_id, dispute_amount, dispute_currency, reason, status,
         confidence_score, evidence_packet, ai_defense_summary, submitted_at
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW() - INTERVAL '2 days')
       ON CONFLICT (paypal_dispute_id) DO NOTHING`,
      [
        'PP-D-771923',
        userId,
        120.00,
        'USD',
        'UNAUTHORIZED_TRANSACTION',
        'RESOLVED_MERCHANT_WIN',
        98.00,
        JSON.stringify({
          originating_ip: '102.89.33.14',
          device_match: true,
          retained: true,
        }),
        'Irrefutable session matching and authenticated 2FA token verify buyer authorization.',
      ]
    );
    console.log('✅ Seeded PayBack Active & Won Disputes');

    console.log('\n🎉 DATABASE SEEDING COMPLETED SUCCESSFULLY!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seedDatabase();
