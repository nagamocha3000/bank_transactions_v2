const Joi = require("@hapi/joi");

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

module.exports = {
    userSchema
};
