const program = require("commander");
const Joi = require("@hapi/joi");

//fns for parsing cmdline args
const getInt = value => parseInt(value);
const getBool = value => value.toLowerCase().startsWith("t");
const timer = (ms = 1000) => new Promise(resolve => setTimeout(resolve, ms));

//setup cmdline args
const setupCMD = () => {
    program
        .description("db seed script, for one-time use")
        .option("-u --users <users>", "number of users to insert", getInt, 2)
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

const logTransferParams = p => {
    const params = {
        transfersPerAccount: p.transfersPerAccount,
        useRandom: p.useRandom
    };
    if (p.useRandom) {
        params.upper = p.upper;
        params.lower = p.lower;
    } else {
        params.constAmount = p.constAmount;
    }
    logParams(params);
};

const getCmdParams = () => validateCmdArgs(setupCMD());

module.exports = {
    logParams,
    logTransferParams,
    getCmdParams
};
