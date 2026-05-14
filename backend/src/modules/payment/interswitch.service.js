const axios = require('axios');
const crypto = require('crypto');
const env = require('../../config/env');
const logger = require('../../utils/logger');
const { PaymentError } = require('../../utils/errors');

/**
 * Interswitch Quickteller API v5 Integration Service
 * 
 * Uses the TransferFunds endpoint:
 *   POST https://qa.interswitchng.com/quicktellerservice/api/v5/transactions/TransferFunds
 * 
 * Authentication: InterswitchAuth (HMAC-SHA512 signature) or Bearer token.
 * 
 * When INTERSWITCH_MOCK_MODE=true, returns simulated responses.
 * When ready for production, set INTERSWITCH_MOCK_MODE=false and provide real credentials.
 */

// ============================================
// API Base URLs
// ============================================
const QA_BASE_URL = 'https://qa.interswitchng.com';
const PRODUCTION_BASE_URL = 'https://saturn.interswitchng.com';

const getBaseUrl = () => {
  if (env.interswitch.baseUrl) return env.interswitch.baseUrl;
  return env.nodeEnv === 'production' ? PRODUCTION_BASE_URL : QA_BASE_URL;
};

// Quickteller v5 endpoints
const ENDPOINTS = {
  transferFunds: '/quicktellerservice/api/v5/transactions/TransferFunds',
  validateCustomer: '/quicktellerservice/api/v5/Transactions/validatecustomers',
  getBillers: '/quicktellerservice/api/v5/services',
  getBillersByCategory: '/quicktellerservice/api/v5/services?categoryid=',
  queryTransaction: '/quicktellerservice/api/v5/Transactions',
  sendBillPaymentAdvice: '/quicktellerservice/api/v5/Transactions/sendBillPaymentAdvice',
};

// ============================================
// Authentication
// ============================================

let accessToken = null;
let tokenExpiry = null;

/**
 * Get Interswitch OAuth2 Bearer access token
 */
const getAccessToken = async () => {
  if (accessToken && tokenExpiry && Date.now() < tokenExpiry) {
    return accessToken;
  }

  if (env.interswitch.mockMode) {
    accessToken = 'mock-access-token';
    tokenExpiry = Date.now() + 3600000;
    return accessToken;
  }

  try {
    const credentials = Buffer.from(
      `${env.interswitch.clientId}:${env.interswitch.clientSecret}`
    ).toString('base64');

    const response = await axios.post(
      `${getBaseUrl()}/passport/oauth/token`,
      'grant_type=client_credentials',
      {
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    accessToken = response.data.access_token;
    tokenExpiry = Date.now() + (response.data.expires_in * 1000) - 60000; // 1 min buffer
    return accessToken;
  } catch (error) {
    logger.error('Failed to get Interswitch access token', { error: error.message });
    throw new PaymentError('Payment service authentication failed');
  }
};

/**
 * Generate InterswitchAuth signature headers (HMAC-SHA512)
 * 
 * Signature = SHA512(httpMethod + url + timestamp + nonce + clientId + clientSecret)
 */
const generateAuthHeaders = (httpMethod, resourceUrl) => {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const nonce = crypto.randomUUID();

  const signatureSource = `${httpMethod}${resourceUrl}${timestamp}${nonce}${env.interswitch.clientId}${env.interswitch.clientSecret}`;
  const signature = crypto
    .createHash('sha512')
    .update(signatureSource)
    .digest('hex');

  const encodedClientId = Buffer.from(env.interswitch.clientId).toString('base64');

  return {
    'Authorization': `InterswitchAuth ${encodedClientId}`,
    'Timestamp': timestamp,
    'Nonce': nonce,
    'Signature': signature,
    'SignatureMethod': 'SHA512',
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'TerminalID': env.interswitch.terminalId,
  };
};

/**
 * Build headers for Quickteller v5 API calls  
 * Supports both InterswitchAuth and Bearer token methods
 */
const buildHeaders = async (httpMethod, fullUrl) => {
  // Use InterswitchAuth signature method (preferred for Quickteller v5)
  if (env.interswitch.clientId && env.interswitch.clientSecret) {
    return generateAuthHeaders(httpMethod, fullUrl);
  }

  // Fallback: OAuth2 Bearer token
  const token = await getAccessToken();
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'TerminalID': env.interswitch.terminalId,
  };
};

// ============================================
// Customer Validation
// ============================================

/**
 * Validate customer before bill payment
 * Required before sending payment advice
 */
const validateCustomer = async ({ paymentCode, customerId }) => {
  if (env.interswitch.mockMode) {
    return mockValidationResponse(paymentCode, customerId);
  }

  const fullUrl = `${getBaseUrl()}${ENDPOINTS.validateCustomer}`;

  try {
    const headers = await buildHeaders('POST', fullUrl);

    const response = await axios.post(
      fullUrl,
      {
        customers: [
          {
            PaymentCode: paymentCode,
            CustomerId: customerId,
          },
        ],
      },
      {
        headers,
        timeout: 30000,
      }
    );

    const customer = response.data?.Customers?.[0] || response.data;

    return {
      valid: customer?.ResponseCode === '90000',
      fullName: customer?.FullName || customer?.CustomerName || null,
      responseCode: customer?.ResponseCode,
      responseDescription: customer?.ResponseDescription || null,
      amountType: customer?.AmountType || null,
      amount: customer?.Amount || null,
    };
  } catch (error) {
    logger.error('Customer validation failed', { error: error.message, paymentCode, customerId });
    throw new PaymentError(`Customer validation failed: ${error.message}`);
  }
};

// ============================================
// Bill Payment (Airtime, Data, Electricity)
// ============================================

/**
 * Send Bill Payment Advice via Quickteller v5
 * Used for airtime, data, and electricity bill payments
 */
const sendBillPaymentAdvice = async ({ paymentCode, customerId, customerMobile, customerEmail, amount, requestReference }) => {
  if (env.interswitch.mockMode) {
    return mockPaymentResponse('bill_payment', { paymentCode, customerId, amount, requestReference });
  }

  const fullUrl = `${getBaseUrl()}${ENDPOINTS.sendBillPaymentAdvice}`;

  try {
    const headers = await buildHeaders('POST', fullUrl);

    const response = await axios.post(
      fullUrl,
      {
        TerminalId: env.interswitch.terminalId,
        paymentCode,
        customerId,
        customerMobile: customerMobile || '',
        customerEmail: customerEmail || '',
        amount: Math.round(amount * 100), // Convert to kobo (minor denomination)
        requestReference,
      },
      {
        headers,
        timeout: 60000, // Interswitch recommends minimum 60s timeout for bill payments
      }
    );

    return {
      success: response.data?.ResponseCode === '90000' || response.data?.ResponseCodeGrouping === 'SUCCESSFUL',
      providerReference: response.data?.TransactionRef || response.data?.TransactionReference || null,
      responseCode: response.data?.ResponseCode,
      responseMessage: response.data?.ResponseDescription || response.data?.ResponseMessage || 'Transaction completed',
      miscData: response.data?.MiscData || null,
      rechargePIN: response.data?.RechargePIN || null,
    };
  } catch (error) {
    logger.error('Bill payment advice failed', { error: error.message, requestReference });
    throw new PaymentError(`Bill payment failed: ${error.message}`);
  }
};

/**
 * Transfer Funds via Quickteller v5 TransferFunds endpoint
 * POST https://qa.interswitchng.com/quicktellerservice/api/v5/transactions/TransferFunds
 */
const transferFunds = async ({
  sourceAccountNumber,
  sourceAccountName,
  sourceBankCode,
  destinationAccountNumber,
  destinationAccountName,
  destinationInstitutionCode,
  transactionAmount,
  currencyCode = '566', // NGN ISO numeric
  clientRef,
  channelCode = 7, // Web channel
  mobileNumber,
  emailAddress,
  paymentLocation,
}) => {
  if (env.interswitch.mockMode) {
    return mockTransferResponse({
      destinationAccountNumber,
      transactionAmount,
      clientRef,
    });
  }

  const fullUrl = `${getBaseUrl()}${ENDPOINTS.transferFunds}`;

  try {
    const headers = await buildHeaders('POST', fullUrl);

    const payload = {
      sourceAccountNumber,
      sourceAccountName,
      sourceBankVerificationNumber: '', // Optional BVN
      destinationAccountNumber,
      destinationInstitutionCode,
      transactionAmount: Math.round(transactionAmount * 100), // Amount in kobo
      currencyCode,
      clientRef,
      channelCode,
      terminalId: env.interswitch.terminalId,
    };

    // Add optional fields
    if (mobileNumber) payload.mobileNumber = mobileNumber;
    if (emailAddress) payload.emailAddress = emailAddress;
    if (paymentLocation) payload.paymentLocation = paymentLocation;
    if (destinationAccountName) payload.destinationAccountName = destinationAccountName;
    if (sourceBankCode) payload.sourceBankCode = sourceBankCode;

    const response = await axios.post(fullUrl, payload, {
      headers,
      timeout: 60000,
    });

    return {
      success: response.data?.ResponseCode === '90000' || response.data?.ResponseCodeGrouping === 'SUCCESSFUL',
      providerReference: response.data?.TransactionRef || response.data?.TransferCode || null,
      responseCode: response.data?.ResponseCode,
      responseMessage: response.data?.ResponseDescription || response.data?.ResponseMessage || 'Transfer completed',
      macValue: response.data?.Mac || null,
    };
  } catch (error) {
    logger.error('Fund transfer failed', { error: error.message, clientRef });
    throw new PaymentError(`Fund transfer failed: ${error.message}`);
  }
};

// ============================================
// Transaction Query
// ============================================

/**
 * Query a transaction status
 * Interswitch recommends waiting at least 360s after SendBillPaymentAdvice
 */
const queryTransaction = async (requestReference) => {
  if (env.interswitch.mockMode) {
    return {
      status: 'COMPLETED',
      responseCode: '90000',
      responseMessage: '[MOCK] Transaction completed successfully',
    };
  }

  const fullUrl = `${getBaseUrl()}${ENDPOINTS.queryTransaction}?requestRef=${requestReference}`;

  try {
    const headers = await buildHeaders('GET', fullUrl);

    const response = await axios.get(fullUrl, {
      headers,
      timeout: 30000,
    });

    return {
      status: response.data?.Status || response.data?.ResponseCodeGrouping,
      responseCode: response.data?.ResponseCode,
      responseMessage: response.data?.ResponseDescription || response.data?.ResponseMessage,
      transactionRef: response.data?.TransactionRef || null,
      amount: response.data?.Amount || null,
    };
  } catch (error) {
    logger.error('Transaction query failed', { error: error.message, requestReference });
    throw new PaymentError(`Transaction query failed: ${error.message}`);
  }
};

// ============================================
// Service-Specific Wrappers
// ============================================

/**
 * Purchase airtime via Quickteller v5 SendBillPaymentAdvice
 */
const purchaseAirtime = async ({ phone, amount, reference, network }) => {
  if (env.interswitch.mockMode) {
    return mockPaymentResponse('airtime', { phone, amount, reference, network });
  }

  // Step 1: Validate customer
  const paymentCode = getPaymentCode('airtime', network);
  const validation = await validateCustomer({
    paymentCode,
    customerId: phone,
  });

  if (!validation.valid) {
    throw new PaymentError(`Customer validation failed: ${validation.responseDescription || 'Invalid phone number'}`);
  }

  // Step 2: Send payment advice
  return await sendBillPaymentAdvice({
    paymentCode,
    customerId: phone,
    customerMobile: phone,
    amount,
    requestReference: reference,
  });
};

/**
 * Purchase data bundle via Quickteller v5 SendBillPaymentAdvice
 */
const purchaseData = async ({ phone, amount, reference, network, bundleCode }) => {
  if (env.interswitch.mockMode) {
    return mockPaymentResponse('data', { phone, amount, reference, network });
  }

  const paymentCode = bundleCode || getPaymentCode('data', network);

  // Step 1: Validate customer
  const validation = await validateCustomer({
    paymentCode,
    customerId: phone,
  });

  if (!validation.valid) {
    throw new PaymentError(`Customer validation failed: ${validation.responseDescription || 'Invalid phone number'}`);
  }

  // Step 2: Send payment advice
  return await sendBillPaymentAdvice({
    paymentCode,
    customerId: phone,
    customerMobile: phone,
    amount,
    requestReference: reference,
  });
};

/**
 * Pay electricity bill via Quickteller v5 SendBillPaymentAdvice
 */
const payElectricity = async ({ meterNumber, amount, reference, disco }) => {
  if (env.interswitch.mockMode) {
    return mockPaymentResponse('electricity', { meterNumber, amount, reference, disco });
  }

  const paymentCode = getPaymentCode('electricity', disco);

  // Step 1: Validate customer (meter number)
  const validation = await validateCustomer({
    paymentCode,
    customerId: meterNumber,
  });

  if (!validation.valid) {
    throw new PaymentError(`Meter validation failed: ${validation.responseDescription || 'Invalid meter number'}`);
  }

  // Step 2: Send payment advice
  const result = await sendBillPaymentAdvice({
    paymentCode,
    customerId: meterNumber,
    amount,
    requestReference: reference,
  });

  // Electricity payments return a token via MiscData
  return {
    ...result,
    token: result.miscData || result.rechargePIN || null,
    customerName: validation.fullName || null,
  };
};

// ============================================
// Webhook Validation
// ============================================

/**
 * Validate webhook signature from Interswitch
 */
const validateWebhookSignature = (payload, signature) => {
  if (env.interswitch.mockMode) return true;

  const expectedSignature = crypto
    .createHmac('sha512', env.interswitch.clientSecret)
    .update(JSON.stringify(payload))
    .digest('hex');

  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch {
    return false;
  }
};

// ============================================
// Payment Codes
// ============================================

/**
 * Get Interswitch Quickteller payment code based on service type and provider
 * 
 * These are real Quickteller payment codes from the Interswitch platform.
 * Biller Category IDs:
 *   - 4  = Airtime/Mobile Recharge
 *   - 2  = Utility Bills (Electricity)
 *   - 5  = Internet/Data Services
 * 
 * You can dynamically fetch updated codes using fetchBillerPaymentCodes()
 */
const getPaymentCode = (type, provider) => {
  const codes = {
    airtime: {
      MTN: '10901',       // MTN Airtime VTU
      GLO: '40301',       // GLO Airtime Quickteller
      AIRTEL: '90301',    // Airtel Airtime VTU
      '9MOBILE': '90401', // 9mobile Airtime
    },
    data: {
      MTN: '10901',       // MTN Data VTU
      GLO: '40302',       // GLO Data Bundle
      AIRTEL: '90302',    // Airtel Data Bundle
      '9MOBILE': '90402', // 9mobile Data Bundle
    },
    electricity: {
      IKEDC: '76601',     // Ikeja Electric Prepaid
      EKEDC: '35332',     // Eko Electric Prepaid
      AEDC: '82500',      // Abuja Electric Prepaid
      PHEDC: '48802',     // Port Harcourt Electric Prepaid
      KAEDC: '82301',     // Kaduna Electric Prepaid
      JEDC: '84601',      // Jos Electric Prepaid
      IBEDC: '84801',     // Ibadan Electric Prepaid
      BEDC: '82901',      // Benin Electric Prepaid
      EEDC: '82701',      // Enugu Electric Prepaid
    },
  };

  return codes[type]?.[provider?.toUpperCase()] || '';
};

// Biller Category IDs on Quickteller
const BILLER_CATEGORIES = {
  AIRTIME: 4,
  UTILITY: 2,
  DATA: 5,
  CABLE_TV: 6,
  INTERNET: 7,
};

/**
 * Fetch billers by category from Interswitch Quickteller v5
 * Useful for dynamically populating the biller list
 */
const getBillersByCategory = async (categoryId) => {
  if (env.interswitch.mockMode) {
    return getMockBillers(categoryId);
  }

  const fullUrl = `${getBaseUrl()}${ENDPOINTS.getBillersByCategory}${categoryId}`;

  try {
    const headers = await buildHeaders('GET', fullUrl);
    const response = await axios.get(fullUrl, { headers, timeout: 30000 });

    return response.data?.services || response.data || [];
  } catch (error) {
    logger.error('Failed to fetch billers', { error: error.message, categoryId });
    throw new PaymentError(`Failed to fetch billers: ${error.message}`);
  }
};

/**
 * Fetch payment items (payment codes) for a specific biller
 * This gives you the real paymentCode values to use with sendBillPaymentAdvice
 */
const fetchBillerPaymentCodes = async (billerId) => {
  if (env.interswitch.mockMode) {
    return getMockPaymentItems(billerId);
  }

  const fullUrl = `${getBaseUrl()}/quicktellerservice/api/v5/services/${billerId}/serviceoptions`;

  try {
    const headers = await buildHeaders('GET', fullUrl);
    const response = await axios.get(fullUrl, { headers, timeout: 30000 });

    return response.data?.serviceOptions || response.data || [];
  } catch (error) {
    logger.error('Failed to fetch payment codes', { error: error.message, billerId });
    throw new PaymentError(`Failed to fetch payment codes: ${error.message}`);
  }
};

/**
 * Mock billers for development
 */
const getMockBillers = (categoryId) => {
  const billers = {
    4: [ // Airtime
      { id: '901', name: 'MTN Nigeria', shortName: 'MTN' },
      { id: '902', name: 'Globacom', shortName: 'GLO' },
      { id: '903', name: 'Airtel Nigeria', shortName: 'AIRTEL' },
      { id: '904', name: '9mobile', shortName: '9MOBILE' },
    ],
    2: [ // Electricity
      { id: '766', name: 'Ikeja Electric Prepaid', shortName: 'IKEDC' },
      { id: '353', name: 'Eko Electric Prepaid', shortName: 'EKEDC' },
      { id: '825', name: 'Abuja Electric Prepaid', shortName: 'AEDC' },
      { id: '488', name: 'Port Harcourt Electric Prepaid', shortName: 'PHEDC' },
    ],
  };
  return billers[categoryId] || [];
};

/**
 * Mock payment items for development
 */
const getMockPaymentItems = (billerId) => {
  return [
    { paymentCode: '10403', name: 'Default Payment', amount: 0, amountType: 0 },
  ];
};

// ============================================
// Mock Responses (Development/Testing)
// ============================================

/**
 * Mock payment response for development/testing
 */
const mockPaymentResponse = (type, details) => {
  logger.info(`[MOCK] Processing ${type} payment`, details);

  // Simulate occasional failures for testing (5% failure rate)
  const random = Math.random();
  if (random < 0.05) {
    return {
      success: false,
      providerReference: null,
      responseCode: 'Z1',
      responseMessage: '[MOCK] Transaction failed — simulated failure',
    };
  }

  return {
    success: true,
    providerReference: `MOCK-${Date.now()}-${Math.random().toString(36).substring(7)}`,
    responseCode: '90000',
    responseMessage: `[MOCK] ${type} payment successful`,
    ...(type === 'electricity' && {
      token: `${Math.random().toString().substring(2, 22)}`,
      customerName: 'Mock Customer',
    }),
  };
};

/**
 * Mock transfer response for development/testing
 */
const mockTransferResponse = (details) => {
  logger.info('[MOCK] Processing fund transfer', details);

  const random = Math.random();
  if (random < 0.05) {
    return {
      success: false,
      providerReference: null,
      responseCode: 'Z1',
      responseMessage: '[MOCK] Transfer failed — simulated failure',
    };
  }

  return {
    success: true,
    providerReference: `MOCK-TRF-${Date.now()}-${Math.random().toString(36).substring(7)}`,
    responseCode: '90000',
    responseMessage: '[MOCK] Fund transfer successful',
  };
};

/**
 * Mock customer validation response
 */
const mockValidationResponse = (paymentCode, customerId) => {
  logger.info('[MOCK] Validating customer', { paymentCode, customerId });

  return {
    valid: true,
    fullName: 'Mock Customer Name',
    responseCode: '90000',
    responseDescription: 'Customer validated successfully',
    amountType: null,
    amount: null,
  };
};

module.exports = {
  // Authentication
  getAccessToken,
  generateAuthHeaders,
  buildHeaders,

  // Core API methods
  validateCustomer,
  sendBillPaymentAdvice,
  transferFunds,
  queryTransaction,

  // Service wrappers
  purchaseAirtime,
  purchaseData,
  payElectricity,

  // Biller discovery
  getBillersByCategory,
  fetchBillerPaymentCodes,
  BILLER_CATEGORIES,

  // Utilities
  validateWebhookSignature,
  getPaymentCode,
};
