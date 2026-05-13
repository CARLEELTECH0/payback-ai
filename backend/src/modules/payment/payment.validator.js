const { z } = require('zod');
const { nigerianPhone } = require('../auth/auth.validator');

const airtimeSchema = z.object({
  phone: nigerianPhone,
  amount: z.number().min(50, 'Minimum airtime is ₦50').max(50000, 'Maximum airtime is ₦50,000'),
  network: z.enum(['MTN', 'GLO', 'AIRTEL', '9MOBILE'], {
    errorMap: () => ({ message: 'Select a valid network: MTN, GLO, AIRTEL, or 9MOBILE' }),
  }),
});

const dataSchema = z.object({
  phone: nigerianPhone,
  amount: z.number().min(100, 'Minimum data purchase is ₦100').max(50000, 'Maximum data purchase is ₦50,000'),
  network: z.enum(['MTN', 'GLO', 'AIRTEL', '9MOBILE']),
  bundleCode: z.string().optional(),
});

const electricitySchema = z.object({
  meterNumber: z.string().min(10, 'Enter a valid meter number').max(20),
  amount: z.number().min(500, 'Minimum electricity payment is ₦500').max(100000, 'Maximum is ₦100,000'),
  disco: z.enum(['IKEDC', 'EKEDC', 'AEDC', 'PHEDC'], {
    errorMap: () => ({ message: 'Select a valid distribution company' }),
  }),
});

const transferSchema = z.object({
  destinationAccountNumber: z.string()
    .min(10, 'Enter a valid account number')
    .max(10, 'Account number must be 10 digits'),
  destinationInstitutionCode: z.string()
    .min(3, 'Enter a valid bank code'),
  destinationAccountName: z.string().optional(),
  amount: z.number()
    .min(100, 'Minimum transfer is ₦100')
    .max(5000000, 'Maximum transfer is ₦5,000,000'),
  narration: z.string().max(100).optional(),
});

const historySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  type: z.enum(['airtime', 'data', 'electricity', 'wallet_funding', 'fund_transfer']).optional(),
  status: z.enum(['pending', 'processing', 'success', 'failed', 'refunded']).optional(),
});

module.exports = {
  airtimeSchema,
  dataSchema,
  electricitySchema,
  transferSchema,
  historySchema,
};
