const Joi = require("@hapi/joi");
const { userErrors } = require("./errors");

const nameSchema = Joi.string()
    .alphanum()
    .min(1)
    .max(50)
    .pattern(/\S/)
    .required();

const userSchema = Joi.object({
    firstname: nameSchema,
    lastname: nameSchema,
    password: Joi.string(),
    email: Joi.string().email({
        minDomainSegments: 2,
        tlds: { allow: true }
    })
});

const validateNewUser = (newUser = {}) =>
    new Promise((resolve, reject) => {
        const { error, value } = userSchema.validate(newUser);
        if (error) {
            reject(userErrors.invalidNewUserDetails);
        } else resolve(value);
    });

module.exports = {
    validateNewUser
};
