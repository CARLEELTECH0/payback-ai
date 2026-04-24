const { z } = require('zod');

// Nigerian phone number: +234 or 0 prefix, 10-11 digits
const nigerianPhone = z.string()
  .regex(/^(\+234|0)[789]\d{9}$/, 'Enter a valid Nigerian phone number');

const signupSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  phone: nigerianPhone,
  firstName: z.string().min(2, 'First name must be at least 2 characters').max(100),
  lastName: z.string().min(2, 'Last name must be at least 2 characters').max(100),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});

const loginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

module.exports = {
  signupSchema,
  loginSchema,
  refreshSchema,
  nigerianPhone,
};
