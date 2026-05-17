const express = require('express');
const router = express.Router();
const interswitchService = require('./interswitch.service');
const { authenticate } = require('../../middleware/auth');

/**
 * GET /api/billers/categories/:categoryId
 * Fetch available billers by category
 * Category IDs: 4=Airtime, 2=Utility/Electricity, 5=Data, 6=CableTV
 */
router.get('/categories/:categoryId', authenticate, async (req, res, next) => {
  try {
    const { categoryId } = req.params;
    const billers = await interswitchService.getBillersByCategory(parseInt(categoryId, 10));

    res.status(200).json({
      success: true,
      data: billers,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/billers/:billerId/payment-items
 * Fetch payment items/codes for a specific biller
 */
router.get('/:billerId/payment-items', authenticate, async (req, res, next) => {
  try {
    const { billerId } = req.params;
    const paymentItems = await interswitchService.fetchBillerPaymentCodes(billerId);

    res.status(200).json({
      success: true,
      data: paymentItems,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/billers/supported
 * Returns the locally-configured supported services and their payment codes
 */
router.get('/supported', authenticate, async (req, res, next) => {
  try {
    const supported = {
      airtime: {
        networks: ['MTN', 'GLO', 'AIRTEL', '9MOBILE'],
        minAmount: 50,
        maxAmount: 50000,
      },
      data: {
        networks: ['MTN', 'GLO', 'AIRTEL', '9MOBILE'],
        minAmount: 100,
        maxAmount: 50000,
      },
      electricity: {
        discos: [
          { code: 'IKEDC', name: 'Ikeja Electric', region: 'Lagos (Ikeja)' },
          { code: 'EKEDC', name: 'Eko Electric', region: 'Lagos (Eko)' },
          { code: 'AEDC', name: 'Abuja Electric', region: 'Abuja' },
          { code: 'PHEDC', name: 'Port Harcourt Electric', region: 'Port Harcourt' },
          { code: 'KAEDC', name: 'Kaduna Electric', region: 'Kaduna' },
          { code: 'JEDC', name: 'Jos Electric', region: 'Jos' },
          { code: 'IBEDC', name: 'Ibadan Electric', region: 'Ibadan' },
          { code: 'BEDC', name: 'Benin Electric', region: 'Benin' },
          { code: 'EEDC', name: 'Enugu Electric', region: 'Enugu' },
        ],
        minAmount: 500,
        maxAmount: 100000,
      },
      transfer: {
        minAmount: 100,
        maxAmount: 5000000,
      },
      categories: interswitchService.BILLER_CATEGORIES,
    };

    res.status(200).json({
      success: true,
      data: supported,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
