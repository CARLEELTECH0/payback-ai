const express = require('express');
const router = express.Router();
const walletController = require('./wallet.controller');
const { authenticate } = require('../../middleware/auth');
const { paymentLimiter } = require('../../middleware/rateLimiter');

router.get('/balance', authenticate, walletController.getBalance);
router.post('/fund', authenticate, paymentLimiter, walletController.fundWallet);

module.exports = router;
