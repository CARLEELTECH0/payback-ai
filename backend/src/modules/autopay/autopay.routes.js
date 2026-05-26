const express = require('express');
const router = express.Router();
const autopayController = require('./autopay.controller');
const { authenticate } = require('../../middleware/auth');

router.post('/rules', authenticate, autopayController.createRule);
router.get('/rules', authenticate, autopayController.getRules);
router.put('/rules/:id', authenticate, autopayController.updateRule);
router.delete('/rules/:id', authenticate, autopayController.deleteRule);

module.exports = router;
