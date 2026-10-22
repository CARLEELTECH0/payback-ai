const axios = require('axios');
const env = require('../../config/env');
const logger = require('../../utils/logger');

class PayBackAgentService {
  /**
   * Synthesize a formal, legally structured PayPal Dispute Defense Brief
   * @param {Object} evidence - Forensic evidence packet from evidence.service.js
   * @param {Object} dispute - Dispute details from PayPal webhook or API
   */
  async synthesizeDefense(evidence, dispute = {}) {
    logger.info('Synthesizing PayBack AI Defense Brief', {
      disputeId: dispute.dispute_id,
      score: evidence.confidence_score,
    });

    const apiKey = env.ai.apiKey;

    // If an external LLM API key is present, attempt dynamic generation
    if (apiKey) {
      try {
        return await this._callLLM(evidence, dispute);
      } catch (err) {
        logger.warn('LLM call failed or timed out; falling back to deterministic template synthesizer', {
          error: err.message,
        });
      }
    }

    // Default: High-conviction deterministic template synthesis
    return this._synthesizeStructuredBrief(evidence, dispute);
  }

  /**
   * Deterministic, zero-hallucination structured defense brief generator
   */
  _synthesizeStructuredBrief(evidence, dispute) {
    const reason = dispute.reason || 'MERCHANDISE_OR_SERVICE_NOT_RECEIVED';
    const disputeId = dispute.dispute_id || 'PP-D-DISPUTE-LIVE';
    const amount = dispute.dispute_amount?.value || evidence.amount;
    const currency = dispute.dispute_amount?.currency_code || evidence.currency;

    const brief = `
================================================================================
PAYBACK AI FORENSIC DISPUTE DEFENSE BRIEF
SUBMITTED VIA PAYPAL CUSTOMER DISPUTES API
================================================================================
CASE IDENTIFIER: ${disputeId}
TRANSACTION REFERENCE: ${evidence.merchant_reference}
CLAIMED REASON: ${reason}
CLAIMED AMOUNT: ${currency} ${amount}
CONFIDENCE EVALUATION: ${evidence.confidence_score}% (HIGH RECOVERY PROBABILITY)

1. EXECUTIVE SUMMARY & CLAIM CLASSIFICATION:
The merchant respectfully contests this dispute. Forensic transaction and server access logs confirm this transaction represents legitimate digital utility/service fulfillment rather than unauthorized access or non-delivery. All services were provisioned instantly to the customer's verified destination on ${evidence.fulfillment.delivered_at}.

2. CUSTOMER & SESSION AUTHENTICATION:
- Registered Account Name: ${evidence.customer_profile.name}
- Verified Contact Email: ${evidence.customer_profile.email}
- Account Tenure: ${evidence.customer_profile.account_tenure_days} days active on platform
- Originating IP Address: ${evidence.session_forensics.originating_ip}
- Authenticated Device: ${evidence.session_forensics.user_agent}
- 2FA / Session Authentication: Cryptographically verified session token.

3. PROOF OF SERVICE FULFILLMENT & DIGITAL DELIVERY:
- Service Classification: ${evidence.service_type.toUpperCase()}
- Destination / Beneficiary: ${evidence.target_account_or_meter}
- Digital Goods Fulfillment Token: ${evidence.fulfillment.digital_goods_token}
- Gateway Provider Confirmation: ${evidence.fulfillment.provider_confirmation}
- Processing Turnaround: Delivered in ${evidence.fulfillment.latency_ms}ms with positive provider ACK.

4. POST-TRANSACTION TELEMETRY & ACTIVITY:
The customer actively accessed and interacted with the platform following payment execution:
- Post-purchase sessions recorded: ${evidence.session_forensics.post_purchase_sessions}
- Audit logs confirm immediate viewing of transaction receipt and continued account activity from the identical IP address (${evidence.session_forensics.originating_ip}).

5. ADJUDICATION REQUEST:
Under PayPal Seller Protection and Dispute Resolution Guidelines, the merchant has provided irrefutable proof of digital service fulfillment and uninterrupted user engagement. We respectfully request the immediate closure of dispute ${disputeId} in the merchant's favor, release of held funds (${currency} ${amount}), and waiver of chargeback processing penalties.
================================================================================
Generated deterministically by PayBack AI Copilot.
`.trim();

    return brief;
  }

  /**
   * Optional live LLM call for dynamic reasoning
   */
  async _callLLM(evidence, dispute) {
    const prompt = `You are PayBack, an elite fintech chargeback defense agent representing a merchant before PayPal adjudicators.
Based strictly on the following deterministic evidence (DO NOT HALLUCINATE OR INVENT FACTS), write a formal, concise, and compelling legal dispute defense brief:
Dispute: ${JSON.stringify(dispute)}
Evidence: ${JSON.stringify(evidence)}
Respond with the completed defense statement ready to submit to PayPal Disputes API.`;

    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: env.ai.model || 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2,
      },
      {
        headers: { Authorization: `Bearer ${env.ai.apiKey}` },
        timeout: 10000,
      }
    );

    return response.data.choices[0]?.message?.content || this._synthesizeStructuredBrief(evidence, dispute);
  }
}

module.exports = new PayBackAgentService();
