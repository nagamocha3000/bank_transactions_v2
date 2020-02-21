const Joi = require("@hapi/joi");

const numSchema = Joi.number()
    .positive()
    .required();

const transferRequestSchema = Joi.object({
    from: numSchema,
    to: numSchema,
    amount: numSchema
});

const transferDetailsSchema = Joi.object({
    transferID: Joi.string()
        .guid()
        .required()
});

module.exports = { transferRequestSchema, transferDetailsSchema };
