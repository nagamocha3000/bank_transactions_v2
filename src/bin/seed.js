const faker = require("faker");
const program = require("commander");
const Joi = require("@hapi/joi");
const { Spinner } = require("cli-spinner");
const _ = require("lodash");

faker.seed(54321);

//fns for parsing cmdline args
const getInt = value => parseInt(value);
const getBool = value => value.toLowerCase().startsWith("t");
const timer = (ms = 1000) => new Promise(resolve => setTimeout(resolve, ms));

//setup cmdline args
program
    .description("db seed script, for one-time use")
    .option("-u --users <users>", "number of users to insert", getInt, 3)
    .option(
        "-a --accounts <accounts>",
        "number of accounts per user to insert",
        getInt,
        3
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
        1
    )
    .option(
        "-n --num <num>",
        "if non-random, value for each transfer",
        getInt,
        20
    );

//for validation of cmd line args
const validateCmdArgs = args => {
    const numSchema = Joi.number()
        .integer()
        .min(1)
        .required();
    const users = numSchema.validate(args.users);
    const accounts = numSchema.validate(args.accounts);
    const transfers = numSchema.validate(args.transfers);
    const upper = numSchema.validate(args.upper);
    const lower = numSchema.validate(args.lower);
    const num = numSchema.validate(args.num);
    const err = [users, accounts, transfers, upper, lower, num].find(
        obj => obj.error
    );
    if (err) {
        throw err.error;
    }
    return Object.freeze({
        users: users.value,
        accountsPerUser: accounts.value,
        transfersPerAccount: transfers.value,
        useRandom: !args.constant,
        upper: upper.value,
        lower: lower.value,
        constAmount: num.value
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

//dummy fns, to be replaced by controllers
const createUser = async opts => {
    return faker.random.number();
};

const createAccount = async userID => {
    return faker.random.number();
};

const makeSingleTransfer = (sender, receiver, amount) => {
    return faker.random.number();
};

//given the number of accounts to create a user plus userID
//creates transfer accounts for user
const createAccountsForUserFn = accountNums => async userID => {
    const acctNums = await Promise.all(
        Array.from({ length: accountNums }).map(() => createAccount(userID))
    );
    return acctNums;
};

//generate fake user data
const genRandomUser = () => {
    const user = {
        firstName: faker.name.firstName(),
        lastName: faker.name.lastName(),
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
const makeTransfers = async (sender, receiverFn, amountFn, numTransfers) => {
    const transfers = Array.from({ length: numTransfers }).map(() =>
        makeSingleTransfer(sender, receiverFn(), amountFn())
    );
    await Promise.all(transfers);
};

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
        userInsertions.push(createUser(userDetails));
    }
    const userIDs = await Promise.all(userInsertions);
    await timer(5000);
    spinner.stop(true);

    //create accounts
    spinner.setSpinnerTitle("adding transfer accounts for each user ...");
    spinner.start();
    const createAccounts = createAccountsForUserFn(params.accountsPerUser);
    const accountInsertions = [];
    userIDs.forEach(id => {
        accountInsertions.push(createAccounts(id));
    });
    const acctNumsNested = await Promise.all(accountInsertions);
    const acctNums = _(acctNumsNested)
        .flatten()
        .shuffle()
        .value();
    await timer(5000);
    spinner.stop(true);

    //adding transfers
    spinner.setSpinnerTitle("generating transfers for each account ...");
    spinner.start();
    const transferInsertions = [];
    const genAmount = amountFn(params);
    acctNums.forEach((acct, index) => {
        const acctTransfers = makeTransfers(
            acct,
            cycle(acctNums, index),
            genAmount,
            params.transfersPerAccount
        );
        transferInsertions.push(acctTransfers);
    });
    await Promise.all(transferInsertions);
    await timer(5000);
    spinner.stop(true);
    console.log("done");
};

//startingPt
const main = async () => {
    program.parse(process.argv);

    const params = validateCmdArgs(program);
    logParams(params);

    try {
        await seed(params);
    } catch (err) {
        console.error(err);
    } finally {
    }
};

main().catch(err => console.error(err));
