const db = require('../../config/database');
const { NotFoundError, BadRequestError } = require('../../utils/errors');
const { logAudit } = require('../../utils/audit');
const logger = require('../../utils/logger');
const { getAutopayQueue } = require('../../queues/autopay.queue');

/**
 * Create a new auto-pay rule
 */
const createRule = async (userId, { type, target, amount, schedule }) => {
  // Validate schedule (cron format)
  if (!isValidCron(schedule)) {
    throw new BadRequestError('Invalid schedule format. Use cron format like "0 8 * * *" (daily at 8am)');
  }

  const nextRun = calculateNextRun(schedule);

  const result = await db.query(
    `INSERT INTO autopay_rules (user_id, type, target, amount, schedule, next_run)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [userId, type, target, amount, schedule, nextRun]
  );

  const rule = result.rows[0];

  // Schedule the job in BullMQ
  await scheduleAutopayJob(rule);

  await logAudit(userId, 'AUTOPAY_CREATED', { ruleId: rule.id, type, target, amount, schedule });
  logger.info('Auto-pay rule created', { userId, ruleId: rule.id });

  return rule;
};

/**
 * Get all auto-pay rules for a user
 */
const getRules = async (userId) => {
  const result = await db.query(
    'SELECT * FROM autopay_rules WHERE user_id = $1 ORDER BY created_at DESC',
    [userId]
  );
  return result.rows;
};

/**
 * Update an auto-pay rule
 */
const updateRule = async (userId, ruleId, updates) => {
  const existing = await db.query(
    'SELECT * FROM autopay_rules WHERE id = $1 AND user_id = $2',
    [ruleId, userId]
  );

  if (existing.rows.length === 0) {
    throw new NotFoundError('Auto-pay rule not found');
  }

  const fields = [];
  const values = [];
  let paramIndex = 1;

  if (updates.amount !== undefined) {
    fields.push(`amount = $${paramIndex++}`);
    values.push(updates.amount);
  }

  if (updates.target !== undefined) {
    fields.push(`target = $${paramIndex++}`);
    values.push(updates.target);
  }

  if (updates.schedule !== undefined) {
    if (!isValidCron(updates.schedule)) {
      throw new BadRequestError('Invalid cron schedule format');
    }
    fields.push(`schedule = $${paramIndex++}`);
    values.push(updates.schedule);
    fields.push(`next_run = $${paramIndex++}`);
    values.push(calculateNextRun(updates.schedule));
  }

  if (updates.is_active !== undefined) {
    fields.push(`is_active = $${paramIndex++}`);
    values.push(updates.is_active);
  }

  if (fields.length === 0) {
    throw new BadRequestError('No updates provided');
  }

  values.push(ruleId, userId);
  const result = await db.query(
    `UPDATE autopay_rules SET ${fields.join(', ')} WHERE id = $${paramIndex++} AND user_id = $${paramIndex}
     RETURNING *`,
    values
  );

  const rule = result.rows[0];

  // Re-schedule or remove the BullMQ job
  if (rule.is_active) {
    await scheduleAutopayJob(rule);
  } else {
    await removeAutopayJob(rule.id);
  }

  await logAudit(userId, 'AUTOPAY_UPDATED', { ruleId, updates });

  return rule;
};

/**
 * Delete an auto-pay rule
 */
const deleteRule = async (userId, ruleId) => {
  const result = await db.query(
    'DELETE FROM autopay_rules WHERE id = $1 AND user_id = $2 RETURNING id',
    [ruleId, userId]
  );

  if (result.rows.length === 0) {
    throw new NotFoundError('Auto-pay rule not found');
  }

  await removeAutopayJob(ruleId);
  await logAudit(userId, 'AUTOPAY_DELETED', { ruleId });

  return { deleted: true };
};

// ============================================
// Helpers
// ============================================

/**
 * Simple cron validation
 */
const isValidCron = (schedule) => {
  const parts = schedule.trim().split(/\s+/);
  return parts.length === 5;
};

/**
 * Calculate the next run time from a cron schedule
 */
const calculateNextRun = (schedule) => {
  // For MVP, calculate next run as simple time offset
  // In production, use a proper cron parser
  const now = new Date();
  const parts = schedule.trim().split(/\s+/);

  // Simple: if schedule is daily (0 8 * * *), next run is tomorrow at that hour
  const minute = parseInt(parts[0]) || 0;
  const hour = parseInt(parts[1]) || 8;

  const nextRun = new Date(now);
  nextRun.setHours(hour, minute, 0, 0);

  if (nextRun <= now) {
    nextRun.setDate(nextRun.getDate() + 1);
  }

  return nextRun;
};

/**
 * Schedule a BullMQ repeatable job for auto-pay
 */
const scheduleAutopayJob = async (rule) => {
  try {
    const queue = getAutopayQueue();
    if (!queue) {
      logger.warn('Autopay queue not available, skipping job scheduling');
      return;
    }

    // Remove any existing job for this rule
    await removeAutopayJob(rule.id);

    // Add repeatable job
    await queue.add(
      `autopay-${rule.id}`,
      {
        ruleId: rule.id,
        userId: rule.user_id,
        type: rule.type,
        target: rule.target,
        amount: parseFloat(rule.amount),
      },
      {
        repeat: {
          pattern: rule.schedule,
        },
        jobId: `autopay-${rule.id}`,
        removeOnComplete: { count: 50 },
        removeOnFail: { count: 100 },
      }
    );

    logger.info('Auto-pay job scheduled', { ruleId: rule.id, schedule: rule.schedule });
  } catch (error) {
    logger.error('Failed to schedule auto-pay job', { ruleId: rule.id, error: error.message });
  }
};

/**
 * Remove a BullMQ repeatable job
 */
const removeAutopayJob = async (ruleId) => {
  try {
    const queue = getAutopayQueue();
    if (!queue) return;

    const repeatableJobs = await queue.getRepeatableJobs();
    for (const job of repeatableJobs) {
      if (job.name === `autopay-${ruleId}`) {
        await queue.removeRepeatableByKey(job.key);
      }
    }
  } catch (error) {
    logger.error('Failed to remove auto-pay job', { ruleId, error: error.message });
  }
};

module.exports = {
  createRule,
  getRules,
  updateRule,
  deleteRule,
};
