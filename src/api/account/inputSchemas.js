const Joi = require("@hapi/joi");

const accountCreationSchema = Joi.object({
    userID: Joi.number()
        .positive()
        .required()
});

const accountUpdateSchema = Joi.object({
    accountID: Joi.number()
        .positive()
        .required()
});

module.exports = {
    accountCreationSchema,
    accountUpdateSchema
};
