const { validateNewAccountDetails } = require("./validators");
const DAL = require("./DAL");

//res has accountID set
const createNewAccount = async accountDetails => {
    const newAccount = await validateNewAccountDetails(accountDetails);
    const res = await DAL.createNewAccount(newAccount);
    return res;
};

const activateAccount = DAL.activateAccount;
const deactivateAccount = DAL.deactivateAccount;

module.exports = { createNewAccount };
