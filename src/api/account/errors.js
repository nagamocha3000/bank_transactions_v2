const { genClientErrors } = require("../../lib/errorManagement");

const accountErrors = genClientErrors([
    "invalidAccountDetails",
    "accountAlreadyActivated",
    "accountAlreadyDeactivated"
]);

function validationError(message) {
    const err = Object.create(accountErrors.invalidAccountDetails);
    err.message = message;
    return err;
}

module.exports = {
    accountErrors,
    validationError
};
