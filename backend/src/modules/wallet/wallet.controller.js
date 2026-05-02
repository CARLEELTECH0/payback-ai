const walletService = require('./wallet.service');

const getBalance = async (req, res, next) => {
  try {
    const wallet = await walletService.getBalance(req.user.id);

    res.status(200).json({
      success: true,
      data: {
        balance: wallet.balance,
        currency: wallet.currency,
        lastUpdated: wallet.updated_at,
      },
    });
  } catch (error) {
    next(error);
  }
};

const fundWallet = async (req, res, next) => {
  try {
    const { amount } = req.body;

    if (!amount || amount < 100) {
      return res.status(400).json({
        success: false,
        message: 'Minimum funding amount is ₦100',
      });
    }

    // In mock mode, directly credit the wallet
    // In production, this would initiate an Interswitch payment
    const wallet = await walletService.credit(req.user.id, amount, `FUND-${Date.now()}`, req);

    res.status(200).json({
      success: true,
      message: 'Wallet funded successfully',
      data: {
        balance: wallet.balance,
        currency: wallet.currency,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getBalance,
  fundWallet,
};
