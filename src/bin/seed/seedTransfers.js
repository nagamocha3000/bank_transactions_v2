const { logTransferParams, getCmdParams } = require("./utils/cmd");
const { amountFn, timer } = require("./utils/genTools");
const db = require("../../lib/db");
const {
    requestTransfer,
    finalizeTransfer
} = require("../../api/transfer").transferControllers;

async function* accounts() {
    const client = await db.getClient();

    try {
        await client.query("begin isolation level read committed;");
        await client.query(
            "declare acct_cur cursor for select account_id from account order by random();"
        );
        while (true) {
            const { rows } = await client.query("fetch 100 from acct_cur;");
            if (rows.length < 1) break;
            yield rows.map(({ account_id }) => account_id);
        }
    } catch (err) {
        throw err;
    } finally {
        await client.query("rollback");
        client.release();
    }
}

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
    const res = await finalizeTransfer({ transferID, action: "confirm" });
    return { transferID, confirmed: res && res.confirmed };
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
    const tfsRes = {
        sender,
        sucessfulTransfers: transfers.filter(tf => tf.confirmed).length,
        failed: transfers
            .filter(tf => tf.confirmed !== true)
            .map(tf => tf.transferID)
    };
    if (tfsRes.sucessfulTransfers < numTransfers) {
        console.log(tfsRes.failed);
    }
    //return tfsRes;
};

const seedTransfers = async (transfersPerAccount, genTransferAmount) => {
    for await (const acctNums of accounts()) {
        const transferInsertions = [];

        acctNums.forEach((acct, index) => {
            const transfers = makeMultipleTransfers(
                acct,
                cycle(acctNums, index),
                genTransferAmount,
                transfersPerAccount
            );
            transferInsertions.push(transfers);
        });
        await Promise.all(transferInsertions);
    }
};

const main = async () => {
    const params = getCmdParams();
    const { transfersPerAccount } = params;
    logTransferParams(params);
    const genTransferAmount = amountFn(params);
    await seedTransfers(transfersPerAccount, genTransferAmount);
    //await makeTransfers();
};

main().catch(err => {
    console.error(err);
});
