const { genClientErrors } = require("../../lib/errorManagement");

const userErrCodes = ["invalidUserDetails", "emailAlreadyExists"];
const userErrors = genClientErrors(userErrCodes);

function validationError(message) {
    const err = Object.create(userErrors.invalidUserDetails);
    err.message = message;
    return err;
}

module.exports = {
    userErrors: genClientErrors(userErrCodes),
    validationError
};
