const { genClientErrors } = require("../../lib/errorManagement");

const userErrCodes = ["invalidNewUserDetails"];

module.exports = {
    userErrors: genClientErrors(userErrCodes)
};
