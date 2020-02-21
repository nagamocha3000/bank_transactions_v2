const DAL = require("./DAL");
const { controller, makeValidator: v } = require("../utils");
const {
    accountCreationSchema,
    accountUpdateSchema
} = require("./inputSchemas");

const createNewAccount = controller(
    v(accountCreationSchema),
    DAL.createNewAccount
);

const activateAccount = controller(v(accountUpdateSchema), DAL.activateAccount);

const deactivateAccount = controller(
    v(accountUpdateSchema),
    DAL.deactivateAccount
);

const getAccountDetails = controller(
    v(accountUpdateSchema),
    DAL.getAccountDetails
);

module.exports = {
    createNewAccount,
    activateAccount,
    deactivateAccount,
    getAccountDetails
};
