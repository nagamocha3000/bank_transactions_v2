const db = require("../../lib/db");
const { ClientError } = require("../utils");

const createNewAccount = async ({ userID }) => {
    const res = await db.query(
        "insert into account(user_id) values ($1) returning account_id",
        [userID]
    );
    return { accountID: res.rows[0].account_id };
};

const getAccountDetails = async ({ accountID }) => {
    const res = await db.query(
        "select balance, created_at, updated_at, is_active from account where account_id = $1",
        [accountID]
    );
    const acct = res.rows[0];
    if (!acct)
        throw new ClientError(
            `invalid account retrieval ${accountID} does not exist`
        );
    return {
        accountID,
        balance: acct.balance,
        isActive: acct.is_active,
        createdAt: acct.created_at,
        lastUpdated: acct.updated_at
    };
};

const setActivation = bool => async ({ accountID }) => {
    const res = await db.query(
        "update account set is_active = $1 where is_active = $2 and account_id = $3 returning 't'::boolean",
        [bool, !bool, accountID]
    );
    return { success: Boolean(res.rows[0]) };
};
const activateAccount = setActivation(true);
const deactivateAccount = setActivation(false);

module.exports = {
    activateAccount,
    deactivateAccount,
    createNewAccount,
    getAccountDetails
};
