const Joi = require("@hapi/joi");
const { validationError } = require("./errors");

const nameSchema = Joi.string()
    .min(1)
    .max(50)
    .pattern(/\S/)
    .required();

const userSchema = Joi.object({
    firstname: nameSchema,
    lastname: nameSchema,
    email: Joi.string().email({
        minDomainSegments: 2,
        tlds: { allow: true }
    }),
    password: Joi.string()
});

const validateNewUser = (newUser = {}) =>
    new Promise((resolve, reject) => {
        const { error, value } = userSchema.validate(newUser);
        if (error) {
            reject(validationError(error.details[0].message));
        } else resolve(value);
    });

module.exports = {
    validateNewUser
};
