const Joi = require('joi');

const createSchema = Joi.object({
  sku: Joi.string().max(100).required(),
  name: Joi.string().max(255).required(),
  description: Joi.string().allow('', null).max(1000),
  barcode: Joi.string().max(200).allow('', null),
  quantity: Joi.number().integer().min(0).default(0),
  price: Joi.alternatives().try(Joi.number(), Joi.string()).default('0'),
  category: Joi.string().max(100).default('general'),
  location: Joi.string().max(255).allow('', null),
});

const updateSchema = Joi.object({
  sku: Joi.string().max(100),
  name: Joi.string().max(255),
  description: Joi.string().allow('', null).max(1000),
  barcode: Joi.string().max(200).allow('', null),
  quantity: Joi.number().integer().min(0),
  price: Joi.alternatives().try(Joi.number(), Joi.string()),
  category: Joi.string().max(100),
  location: Joi.string().max(255).allow('', null),
});

function validate(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, { stripUnknown: true });
    if (error) return res.status(400).json({ error: error.details[0].message });
    req.body = value;
    next();
  };
}

module.exports = {
  validateCreateItem: validate(createSchema),
  validateUpdateItem: validate(updateSchema),
};
