const Joi = require("@hapi/joi");

const accountSchema = Joi.object({
    accountID: Joi.number().positive()
});

const validateAccountDetails = (acc = {}) =>
    new Promise((resolve, reject) => {
        const { error, value } = accountSchema.validate(acc);
        if (error) reject(validationError(error.details[0].message));
        else resolve(value);
    });

module.exports = {
    validateAccountDetails
};
