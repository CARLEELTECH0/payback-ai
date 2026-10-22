const express = require('express');
const paybackController = require('./payback.controller');
const { authenticate } = require('../../middleware/auth');

const router = express.Router();

// Public webhook route (PayPal Webhook Engine)
router.post('/webhook', paybackController.handleWebhook);

// Dispute operations & simulation
router.get('/disputes', paybackController.getDisputes);
router.get('/disputes/:id', paybackController.getDisputeDossier);
router.post('/disputes/simulate', paybackController.simulateDispute);

// Subscription recovery with PayPal Pay Later
router.post('/recovery/rescue', paybackController.triggerPayLaterRescue);

module.exports = router;
