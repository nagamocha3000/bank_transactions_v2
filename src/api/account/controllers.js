const { validateAccountDetails } = require("./validators");
const DAL = require("./DAL");

//res has accountID set
const createNewAccount = async accountDetails => {
    const newAccount = await DAL.validateAccountDetails(accountDetails);
    const res = await createNewAccount(newAccount);
    return res;
};

const activateAccount = DAL.activateAccount;
const deactivateAccount = DAL.deactivateAccount;

module.exports = { createNewAccount };
