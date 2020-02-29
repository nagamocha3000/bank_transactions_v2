const Joi = require("@hapi/joi");

const numSchema = Joi.number()
    .positive()
    .required();

const transferRequestSchema = Joi.object({
    from: numSchema,
    to: numSchema,
    amount: numSchema
});

const transferFinalizeSchema = Joi.object({
    transferID: Joi.string()
        .guid()
        .required(),
    action: Joi.string().valid("cancel", "confirm")
});

const accountDetailsSchema = Joi.object({
    accountID: Joi.number().integer()
});

module.exports = {
    transferRequestSchema,
    transferFinalizeSchema,
    accountDetailsSchema
};
