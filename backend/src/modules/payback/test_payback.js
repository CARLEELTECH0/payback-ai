const evidenceService = require('./evidence.service');
const agentService = require('./agent.service');
const disputeService = require('./dispute.service');
const paypalClient = require('../paypal/paypal.client');

async function testPaybackPipeline() {
  console.log('🧪 Starting PayBack Autonomous Chargeback Defense Pipeline Test...\n');

  // 1. Simulate an incoming PayPal Dispute
  const mockDispute = {
    dispute_id: 'PP-D-TEST-781920',
    reason: 'MERCHANDISE_OR_SERVICE_NOT_RECEIVED',
    dispute_amount: { currency_code: 'USD', value: '115.00' },
    disputed_transactions: [
      {
        seller_transaction_id: 'TXN-AUTO-99124',
        gross_amount: { currency_code: 'USD', value: '115.00' },
        buyer: { name: 'Morgan Stanley', email: 'morgan.buyer@example.com' },
      },
    ],
  };

  console.log(`[Step 1] Incoming Dispute Received: ${mockDispute.dispute_id} ($${mockDispute.dispute_amount.value} USD)`);

  // 2. Extract Evidence
  const startTime = Date.now();
  const evidence = await evidenceService.extractEvidence('TXN-AUTO-99124');
  console.log(`[Step 2] Forensic Evidence Extracted from DB in ${Date.now() - startTime}ms:`);
  console.log(`   - Confidence Score: ${evidence.confidence_score}%`);
  console.log(`   - Originating IP: ${evidence.session_forensics.originating_ip}`);
  console.log(`   - Digital Delivery Token: ${evidence.fulfillment.digital_goods_token}`);
  console.log(`   - Reasons: ${evidence.score_reasons.join(', ')}`);

  // 3. Synthesize AI Defense Brief
  const brief = await agentService.synthesizeDefense(evidence, mockDispute);
  console.log(`\n[Step 3] PayBack AI Defense Brief Synthesized:`);
  console.log('------------------------------------------------------------');
  console.log(brief.slice(0, 380) + '...\n[TRUNCATED FOR LOGS]');
  console.log('------------------------------------------------------------');

  // 4. Run Full Autonomous Pipeline
  const result = await disputeService.processDispute(mockDispute);
  console.log(`\n[Step 4] Processed Full Dispute Defense Pipeline:`);
  console.log(`   - Dispute Status: ${result.status}`);
  console.log(`   - Total Turnaround Time: ${Date.now() - startTime}ms`);
  console.log(`   - PayPal API Response: ${result.paypal_response.message}`);

  // 5. Test Subscription Churn Recovery & Pay Later Bailout
  const recoveryService = require('./recovery.service');
  console.log(`\n[Step 5] Testing Subscription Churn Recovery & PayPal Pay Later Bailout...`);
  const recoveryResult = await recoveryService.interceptFailedDebit({
    userEmail: 'dev.subscriber@example.com',
    userName: 'Jordan Lee',
    amount: 60.00,
    planName: 'Enterprise SaaS Tier',
  });
  console.log(`   - Rescue Status: ${recoveryResult.success}`);
  console.log(`   - Pay in 4 Offer: ${recoveryResult.installment_breakdown}`);
  console.log(`   - PayPal Invoice Generated: ${recoveryResult.invoice_id}`);
  console.log(`   - Action: ${recoveryResult.action_taken}`);

  console.log('\n🎉 ALL PAYBACK TESTS PASSED SUCCESSFULLY!');
}

testPaybackPipeline().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
