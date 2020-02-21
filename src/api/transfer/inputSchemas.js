const Joi = require("@hapi/joi");

const numSchema = Joi.number()
    .positive()
    .required();

const transferRequestSchema = Joi.object({
    from: numSchema,
    to: numSchema,
    amount: numSchema
});

module.exports = { transferRequestSchema };
