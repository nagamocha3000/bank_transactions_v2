const { logParams, getCmdParams } = require("./utils/cmd");
const { genRandomUser } = require("./utils/genTools");
const {
    createNewUser: createNewUserController
} = require("../../api/user").userControllers;
const {
    createNewAccount: createNewAccountController
} = require("../../api/account").accountControllers;
const { Spinner } = require("cli-spinner");

//wrap controller to throw errors
const createNewUser = async userDetails => {
    const { userID, error } = await createNewUserController(userDetails);
    if (error) throw new Error(error.message);
    return { userID };
};

//wrap controller to throw errors
const createNewAccount = async accountDetails => {
    const { accountID, error } = await createNewAccountController(
        accountDetails
    );
    if (error) throw new Error(error.message);
    return { accountID };
};

//given the number of accounts to create a user plus userID
//creates transfer accounts for user
const createAccountsForUserFn = numAccountsPerUser => async accountDetails => {
    const acctNums = await Promise.all(
        Array.from({ length: numAccountsPerUser }).map(() =>
            createNewAccount(accountDetails)
        )
    );
    return acctNums.map(({ accountID }) => accountID);
};

const seedUsersAccounts = async (users, accountsPerUser) => {
    const createAccounts = createAccountsForUserFn(accountsPerUser);
    while (users > 0) {
        try {
            const newUser = genRandomUser();
            const { userID } = await createNewUser(newUser);
            await createAccounts({ userID });
            users--;
        } catch (err) {
            console.error(err.message || err);
        }
    }
};

//startingPt
const main = async () => {
    const spinner = new Spinner();
    spinner.setSpinnerString(0);
    const { users, accountsPerUser } = getCmdParams();
    logParams({ users, accountsPerUser });

    spinner.setSpinnerTitle("creating users & accounts...");
    spinner.start();
    await seedUsersAccounts(users, accountsPerUser);
    spinner.stop(true);
    console.log("done");
};

main().catch(err => console.error(err));
