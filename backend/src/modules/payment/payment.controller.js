const paymentService = require('./payment.service');
const interswitchService = require('./interswitch.service');
const { airtimeSchema, dataSchema, electricitySchema, transferSchema, historySchema } = require('./payment.validator');

const buyAirtime = async (req, res, next) => {
  try {
    const data = airtimeSchema.parse(req.body);
    const result = await paymentService.processPayment(
      req.user.id,
      { type: 'airtime', target: data.phone, amount: data.amount, network: data.network },
      req
    );

    res.status(200).json({
      success: true,
      message: 'Airtime purchase successful',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const buyData = async (req, res, next) => {
  try {
    const data = dataSchema.parse(req.body);
    const result = await paymentService.processPayment(
      req.user.id,
      { type: 'data', target: data.phone, amount: data.amount, network: data.network, bundleCode: data.bundleCode },
      req
    );

    res.status(200).json({
      success: true,
      message: 'Data purchase successful',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const payElectricity = async (req, res, next) => {
  try {
    const data = electricitySchema.parse(req.body);
    const result = await paymentService.processPayment(
      req.user.id,
      { type: 'electricity', target: data.meterNumber, amount: data.amount, disco: data.disco },
      req
    );

    res.status(200).json({
      success: true,
      message: 'Electricity payment successful',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getHistory = async (req, res, next) => {
  try {
    const filters = historySchema.parse(req.query);
    const result = await paymentService.getHistory(req.user.id, filters);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const transferFunds = async (req, res, next) => {
  try {
    const data = transferSchema.parse(req.body);
    const result = await paymentService.processPayment(
      req.user.id,
      {
        type: 'fund_transfer',
        target: data.destinationAccountNumber,
        amount: data.amount,
        destinationInstitutionCode: data.destinationInstitutionCode,
        destinationAccountName: data.destinationAccountName,
        narration: data.narration,
      },
      req
    );

    res.status(200).json({
      success: true,
      message: 'Fund transfer successful',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const queryTransactionStatus = async (req, res, next) => {
  try {
    const { reference } = req.params;
    const result = await interswitchService.queryTransaction(reference);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  buyAirtime,
  buyData,
  payElectricity,
  transferFunds,
  getHistory,
  queryTransactionStatus,
};
