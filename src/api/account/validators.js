const Joi = require("@hapi/joi");
const { validationError } = require("./errors");

const accountSchema = Joi.object({
    userID: Joi.number()
        .positive()
        .required()
});

const validateNewAccountDetails = (acc = {}) =>
    new Promise((resolve, reject) => {
        const { error, value } = accountSchema.validate(acc);
        if (error) reject(validationError(error.details[0].message));
        else resolve(value);
    });

module.exports = {
    validateNewAccountDetails
};
