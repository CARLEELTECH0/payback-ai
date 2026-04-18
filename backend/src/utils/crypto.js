const CryptoJS = require('crypto-js');
const env = require('../config/env');

/**
 * Encrypt sensitive data (e.g., meter numbers, account details)
 */
const encrypt = (text) => {
  if (!text) return null;
  return CryptoJS.AES.encrypt(text, env.encryptionKey).toString();
};

/**
 * Decrypt sensitive data
 */
const decrypt = (ciphertext) => {
  if (!ciphertext) return null;
  const bytes = CryptoJS.AES.decrypt(ciphertext, env.encryptionKey);
  return bytes.toString(CryptoJS.enc.Utf8);
};

module.exports = {
  encrypt,
  decrypt,
};
