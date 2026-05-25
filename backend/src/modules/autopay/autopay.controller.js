const autopayService = require('./autopay.service');
const { createRuleSchema, updateRuleSchema } = require('./autopay.validator');

const createRule = async (req, res, next) => {
  try {
    const data = createRuleSchema.parse(req.body);
    const rule = await autopayService.createRule(req.user.id, data);

    res.status(201).json({
      success: true,
      message: 'Auto-pay rule created successfully',
      data: rule,
    });
  } catch (error) {
    next(error);
  }
};

const getRules = async (req, res, next) => {
  try {
    const rules = await autopayService.getRules(req.user.id);

    res.status(200).json({
      success: true,
      data: rules,
    });
  } catch (error) {
    next(error);
  }
};

const updateRule = async (req, res, next) => {
  try {
    const data = updateRuleSchema.parse(req.body);
    const rule = await autopayService.updateRule(req.user.id, req.params.id, data);

    res.status(200).json({
      success: true,
      message: 'Auto-pay rule updated',
      data: rule,
    });
  } catch (error) {
    next(error);
  }
};

const deleteRule = async (req, res, next) => {
  try {
    await autopayService.deleteRule(req.user.id, req.params.id);

    res.status(200).json({
      success: true,
      message: 'Auto-pay rule deleted',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createRule,
  getRules,
  updateRule,
  deleteRule,
};
