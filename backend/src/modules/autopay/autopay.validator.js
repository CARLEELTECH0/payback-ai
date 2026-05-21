const { z } = require('zod');
const { nigerianPhone } = require('../auth/auth.validator');

const createRuleSchema = z.object({
  type: z.enum(['airtime', 'data', 'electricity']),
  target: z.string().min(1, 'Target is required'),
  amount: z.number().min(50, 'Minimum amount is ₦50').max(100000, 'Maximum is ₦100,000'),
  schedule: z.string().min(5, 'Schedule is required (cron format)'),
});

const updateRuleSchema = z.object({
  target: z.string().min(1).optional(),
  amount: z.number().min(50).max(100000).optional(),
  schedule: z.string().min(5).optional(),
  is_active: z.boolean().optional(),
});

module.exports = {
  createRuleSchema,
  updateRuleSchema,
};
