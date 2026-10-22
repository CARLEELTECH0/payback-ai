const axios = require('axios');
const env = require('../../config/env');
const logger = require('../../utils/logger');
const { AppError } = require('../../utils/errors');

class PayPalClient {
  constructor() {
    this.clientId = env.paypal.clientId;
    this.clientSecret = env.paypal.clientSecret;
    this.baseUrl = env.paypal.baseUrl;
    this.mockMode = env.paypal.mockMode;
    this.cachedToken = null;
    this.tokenExpiresAt = null;
  }

  /**
   * Acquire or return cached OAuth 2.0 access token
   */
  async getAccessToken() {
    if (this.mockMode) {
      return 'mock-sandbox-paypal-access-token-payback';
    }

    // Return active token if valid for at least 60 more seconds
    if (this.cachedToken && this.tokenExpiresAt && Date.now() < this.tokenExpiresAt - 60000) {
      return this.cachedToken;
    }

    try {
      const auth = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
      const response = await axios.post(
        `${this.baseUrl}/v1/oauth2/token`,
        'grant_type=client_credentials',
        {
          headers: {
            Authorization: `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          timeout: 10000,
        }
      );

      this.cachedToken = response.data.access_token;
      this.tokenExpiresAt = Date.now() + response.data.expires_in * 1000;
      logger.info('Acquired fresh PayPal OAuth 2.0 access token', {
        expiresIn: response.data.expires_in,
      });

      return this.cachedToken;
    } catch (error) {
      logger.error('Failed to obtain PayPal OAuth token', {
        error: error.response?.data || error.message,
      });
      if (this.clientId.includes('placeholder')) {
        logger.warn('Placeholder credentials detected; falling back to Mock Sandbox mode.');
        this.mockMode = true;
        return 'mock-sandbox-paypal-access-token-payback';
      }
      throw new AppError('Failed to authenticate with PayPal API', 502, 'PAYPAL_AUTH_FAILED');
    }
  }

  /**
   * Generic authenticated PayPal API request wrapper
   */
  async request(method, endpoint, data = null, customHeaders = {}) {
    if (this.mockMode) {
      return this._handleMockRequest(method, endpoint, data);
    }

    const token = await this.getAccessToken();
    try {
      const response = await axios({
        method,
        url: `${this.baseUrl}${endpoint}`,
        data,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          ...customHeaders,
        },
        timeout: 15000,
      });

      return response.data;
    } catch (error) {
      const status = error.response?.status || 500;
      const details = error.response?.data || { message: error.message };
      logger.error('PayPal API request failed', { endpoint, method, status, details });
      throw new AppError(
        details.message || 'PayPal API Error',
        status >= 500 ? 502 : status,
        'PAYPAL_API_ERROR'
      );
    }
  }

  /**
   * Fetch dispute details from PayPal Customer Disputes API
   */
  async getDispute(disputeId) {
    return this.request('GET', `/v1/customer/disputes/${disputeId}`);
  }

  /**
   * Provide evidence to PayPal Customer Disputes API
   * PayPal accepts evidence_type: 'PROOF_OF_FULFILLMENT', 'PROOF_OF_DELIVERY', 'PROOF_OF_SERVICE', etc.
   */
  async provideEvidence(disputeId, evidencePayload) {
    return this.request(
      'POST',
      `/v1/customer/disputes/${disputeId}/provide-evidence`,
      evidencePayload
    );
  }

  /**
   * Accept claim (issue refund) if evidence shows merchant fault or customer is entitled
   */
  async acceptClaim(disputeId, note = 'Refund issued automatically by PayBack AI policy') {
    return this.request('POST', `/v1/customer/disputes/${disputeId}/accept-claim`, { note });
  }

  /**
   * Create an invoice for churn recovery or failed recurring payment
   */
  async createInvoice(invoicePayload) {
    return this.request('POST', '/v2/invoicing/invoices', invoicePayload);
  }

  /**
   * Send created invoice to customer
   */
  async sendInvoice(invoiceId, subject = 'Payment Recovery Notice from PayBack') {
    return this.request('POST', `/v2/invoicing/invoices/${invoiceId}/send`, {
      subject,
      send_to_recipient: true,
    });
  }

  /**
   * Internal mock handler for local development & demonstration
   */
  _handleMockRequest(method, endpoint, data) {
    logger.info(`[MOCK PAYPAL API] ${method} ${endpoint}`, { data });

    if (endpoint.includes('/provide-evidence')) {
      return {
        acknowledged: true,
        dispute_id: endpoint.split('/')[4],
        status: 'UNDER_REVIEW',
        message: 'Evidence successfully submitted to PayPal Dispute Adjudication Engine.',
        submitted_at: new Date().toISOString(),
      };
    }

    if (endpoint.includes('/v1/customer/disputes/')) {
      return {
        dispute_id: endpoint.split('/')[4] || 'PP-D-MOCK-99281',
        create_time: new Date(Date.now() - 3600000).toISOString(),
        dispute_amount: { currency_code: 'USD', value: '75.00' },
        reason: 'MERCHANDISE_OR_SERVICE_NOT_RECEIVED',
        status: 'WAITING_FOR_SELLER_RESPONSE',
        disputed_transactions: [
          {
            seller_transaction_id: 'TXN-MOCK-REF-78912',
            gross_amount: { currency_code: 'USD', value: '75.00' },
            buyer: { name: 'Alex Johnson', email: 'alex.buyer@example.com' },
          },
        ],
      };
    }

    if (endpoint.includes('/invoicing/invoices')) {
      return {
        id: 'INV2-MOCK-RECOVERY-4412',
        status: 'SENT',
        href: 'https://www.sandbox.paypal.com/invoice/p/#INV2-MOCK-RECOVERY-4412',
      };
    }

    return { success: true, mock: true, timestamp: new Date().toISOString() };
  }
}

module.exports = new PayPalClient();
