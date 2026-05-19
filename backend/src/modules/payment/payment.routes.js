const express = require('express');
const router = express.Router();
const paymentController = require('./payment.controller');
const { authenticate } = require('../../middleware/auth');
const { paymentLimiter } = require('../../middleware/rateLimiter');

// Bill payments
router.post('/airtime', authenticate, paymentLimiter, paymentController.buyAirtime);
router.post('/data', authenticate, paymentLimiter, paymentController.buyData);
router.post('/electricity', authenticate, paymentLimiter, paymentController.payElectricity);

// Fund transfer (Interswitch v5 TransferFunds)
router.post('/transfer', authenticate, paymentLimiter, paymentController.transferFunds);

// Transaction history & status
router.get('/history', authenticate, paymentController.getHistory);
router.get('/status/:reference', authenticate, paymentController.queryTransactionStatus);

module.exports = router;

