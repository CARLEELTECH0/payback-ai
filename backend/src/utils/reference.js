const { v4: uuidv4 } = require('uuid');

/**
 * Generate a unique transaction reference
 * Format: AP-{type}-{timestamp}-{random}
 * Example: AP-AIR-1703456789-a1b2c3d4
 */
const generateReference = (type = 'TXN') => {
  const prefix = 'AP';
  const typeCode = {
    airtime: 'AIR',
    data: 'DAT',
    electricity: 'ELC',
    wallet_funding: 'WLT',
    fund_transfer: 'TRF',
  }[type] || 'TXN';

  const timestamp = Date.now().toString(36).toUpperCase();
  const random = uuidv4().split('-')[0].toUpperCase();

  return `${prefix}-${typeCode}-${timestamp}-${random}`;
};

/**
 * Generate a 6-digit OTP code
 */
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

module.exports = {
  generateReference,
  generateOTP,
};
