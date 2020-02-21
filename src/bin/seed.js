const { path: appRootPath } = require("app-root-path");
require("dotenv").config({ path: require("path").join(appRootPath, ".env") });
const faker = require("faker");
const program = require("commander");
const Joi = require("@hapi/joi");
const { Spinner } = require("cli-spinner");
const _ = require("lodash");
const { createNewUser } = require("../api/user").userControllers;
const { createNewAccount } = require("../api/account").accountControllers;
const {
    requestTransfer,
    confirmTransfer
} = require("../api/transfer").transferControllers;

//faker.seed(54321);

//fns for parsing cmdline args
const getInt = value => parseInt(value);
const getBool = value => value.toLowerCase().startsWith("t");
const timer = (ms = 1000) => new Promise(resolve => setTimeout(resolve, ms));

//setup cmdline args
const setupCMD = () => {
    program
        .description("db seed script, for one-time use")
        .option("-u --users <users>", "number of users to insert", getInt, 10)
        .option(
            "-a --accounts <accounts>",
            "number of accounts per user to insert",
            getInt,
            2
        )
        .option(
            "-t --transfers <transfers>",
            "number of transfers per account to insert",
            getInt,
            5
        )
        .option(
            "-c --constant <constant>",
            "whether to use a constant value for each transfer value otherwise random value between upper,lower used. Use -n/--num to set constant",
            getBool,
            false
        )
        .option(
            "-x --upper <upper>",
            "upper value for random, inclusive",
            getInt,
            20
        )
        .option(
            "-y --lower <lower>",
            "lower value for random, inclusive",
            getInt,
            5
        )
        .option(
            "-n --num <num>",
            "if non-random, value for each transfer",
            getInt,
            10
        );
    program.parse(process.argv);
    return program;
};
//for validation of cmd line args
const validateCmdArgs = args => {
    const _numSchema = Joi.number()
        .integer()
        .required();
    const numSchema = _numSchema.min(1);
    const userNumSchema = _numSchema.min(2);
    const v = {
        users: userNumSchema.validate(args.users),
        accounts: numSchema.validate(args.accounts),
        transfers: numSchema.validate(args.transfers),
        upper: numSchema.validate(args.upper),
        lower: numSchema.validate(args.lower),
        num: numSchema.validate(args.num)
    };
    const invalidEntry = Object.entries(v).find(([k, v]) => v.error);

    if (invalidEntry) {
        console.error(
            `invalid entry for [${invalidEntry[0]}] arg: ${invalidEntry[1].error}`
        );
        process.exit(1);
    }

    return Object.freeze({
        users: v.users.value,
        accountsPerUser: v.accounts.value,
        transfersPerAccount: v.transfers.value,
        useRandom: !args.constant,
        upper: v.upper.value,
        lower: v.lower.value,
        constAmount: v.num.value
    });
};

//logging params
const logParams = params => {
    const paramEntries = Object.entries(params);
    const longestLen = (len, [paramName]) =>
        paramName.length > len ? paramName.length : len;
    const padVal = paramEntries.reduce(longestLen, 0) + 2;
    const output = [
        "Params\n---------------------\n",
        ...paramEntries.map(
            ([name, val]) => `${name.padEnd(padVal)}:  ${val}\n`
        ),
        "\n"
    ];
    console.log(output.join(""));
};

//for generating amount per each transfer to be created
const amountFn = params => {
    let max = params.upper;
    let min = params.lower;
    if (params.useRandom) {
        return () =>
            Math.round(
                (Math.random() * (max - min) + min + Number.EPSILON) * 100
            ) / 100;
    } else {
        return () => params.constAmount;
    }
};

//given the number of accounts to create a user plus userID
//creates transfer accounts for user
const createAccountsForUserFn = numAccountsPerUser => async userID => {
    const acctNums = await Promise.all(
        Array.from({ length: numAccountsPerUser }).map(() =>
            createNewAccount({ userID })
        )
    );
    return acctNums;
};

//generate fake user data
const genRandomUser = () => {
    const user = {
        firstname: faker.name.firstName(),
        lastname: faker.name.lastName(),
        email: faker.internet.email()
    };
    user.password = user.email.split("@")[0];
    return user;
};

//wraps acct nums array to facilitate making transfers
const cycle = (arr, startingPt) => {
    let i = startingPt;
    let len = arr.length;
    const getNextIndex = n => (n + 1) % len;
    return () => {
        i = getNextIndex(i);
        if (i === startingPt) i = getNextIndex(i);
        return arr[i];
    };
};

//makesTransfers
const makeSingleTransfer = async (from, to, amount) => {
    const { transferID } = await requestTransfer({ from, to, amount });
    const res = await confirmTransfer({ transferID });
    return res;
};

const makeMultipleTransfers = async (
    sender,
    receiverFn,
    amountFn,
    numTransfers
) => {
    const transfers = [];
    for (let i = 0; i < numTransfers; i++) {
        const res = await makeSingleTransfer(sender, receiverFn(), amountFn());
        transfers.push(res);
    }
    return transfers;
};

// const spinner = {
//     start() {},
//     setSpinnerTitle() {},
//     setSpinnerString() {},
//     stop() {}
// };

//brings in everything together
const seed = async params => {
    const spinner = new Spinner();
    spinner.setSpinnerString(0);

    //create users
    spinner.setSpinnerTitle("creating users ...");
    spinner.start();
    const userInsertions = [];
    for (let i = 0; i < params.users; i++) {
        const userDetails = genRandomUser();
        userInsertions.push(
            createNewUser(userDetails).catch(() => {
                console.log(`unable to insert: `, userDetails);
            })
        );
    }
    const userInsertionRes = await Promise.all(userInsertions);
    const userIDs = userInsertionRes
        .map(res => (res ? res.userID : -1))
        .filter(n => n >= 0);
    spinner.stop(true);
    console.log(`${userIDs.length}/${userInsertions.length} users inserted`);

    //create accounts
    spinner.setSpinnerTitle("adding accounts for transfers for each user ...");
    spinner.start();
    const createAccounts = createAccountsForUserFn(params.accountsPerUser);
    const accountInsertions = [];
    userIDs.forEach(id => {
        accountInsertions.push(createAccounts(id));
    });
    const acctNumsNested = await Promise.all(accountInsertions);
    const acctNums = _(acctNumsNested)
        .flatten()
        .map(({ accountID }) => accountID)
        .shuffle()
        .value();
    spinner.stop(true);
    console.log(
        `${acctNums.length}/${params.users *
            params.accountsPerUser} accounts created`
    );

    //adding transfers
    spinner.setSpinnerTitle("generating transfers for each account ...");
    spinner.start();
    const transferInsertions = [];
    acctNums.forEach((acct, index) => {
        const transfers = makeMultipleTransfers(
            acct,
            cycle(acctNums, index),
            amountFn(params),
            params.transfersPerAccount
        );
        transferInsertions.push(transfers);
    });
    const transferRes = await Promise.all(transferInsertions);
    spinner.stop(true);
    console.log(
        `${transferRes.filter(t => t && t.confirmed).length *
            params.transfersPerAccount}/${params.users *
            params.accountsPerUser *
            params.transfersPerAccount} transfers made`
    );
    console.log("done");
};

//startingPt
const main = async () => {
    const cmd = setupCMD();
    const params = validateCmdArgs(cmd);
    logParams(params);
    try {
        await seed(params);
    } catch (err) {
        console.error(err);
    } finally {
    }
};

main().catch(err => console.error(err));
