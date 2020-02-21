const DAL = require("./DAL");
const { controller } = require("../utils");
const {
    accountCreationSchema,
    accountUpdateSchema
} = require("./inputSchemas");

const createNewAccount = controller(
    accountCreationSchema,
    DAL.createNewAccount
);

const activateAccount = controller(accountUpdateSchema, DAL.activateAccount);
const deactivateAccount = controller(
    accountUpdateSchema,
    DAL.deactivateAccount
);

const getAccountDetails = controller(
    accountUpdateSchema,
    DAL.getAccountDetails
);

module.exports = {
    createNewAccount,
    activateAccount,
    deactivateAccount,
    getAccountDetails
};
