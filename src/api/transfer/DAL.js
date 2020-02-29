const db = require("../../lib/db");

const requestTransfer = async ({ from, to, amount }) => {
    const res = await db.query(
        "select request_transfer($1, $2, $3) as transfer_id",
        [from, to, amount]
    );
    const transferID = res.rows[0].transfer_id;
    return { transferID };
};

const makeSerializableTx = async doSQL => {
    let serializationErrOccured = false;
    do {
        const client = await db.getClient();
        try {
            await client.query("begin isolation level serializable");
            const res = await doSQL(client);
            await client.query("commit");
            return res;
        } catch (err) {
            await client.query("rollback");
            serializationErrOccured = err.code === "40001";
            if (serializationErrOccured === false) {
                console.log(err);
                throw err;
            }
            //else console.log("serialization error occured")
        } finally {
            client.release();
        }
    } while (serializationErrOccured);
};

const finalizeTransfer = (() => {
    const cancelTransfer = transferID =>
        makeSerializableTx(async tx => {
            const res = await tx.query("select cancel_transfer($1)", [
                transferID
            ]);
            return { cancelled: res.rows[0].cancel_transfer };
        });

    const confirmTransfer = transferID =>
        makeSerializableTx(async tx => {
            const res = await tx.query("select confirm_transfer($1)", [
                transferID
            ]);
            return { confirmed: res.rows[0].confirm_transfer };
        });

    return ({ transferID, action }) => {
        switch (action) {
            case "cancel":
                return cancelTransfer(transferID);
            case "confirm":
                return confirmTransfer(transferID);
            default:
                throw new Error(
                    `Invalid action for finalize transfer: ${action}`
                );
        }
    };
})();

const getPendingTransfers = async ({ accountID }) => {
    const res = await db.query(
        `select transfer_log_id as "transferID", to_account as to, amount, created_at
        from transfer_log where transfer_status = 'pending' and from_account = $1`,
        [accountID]
    );
    return res.rows;
};

module.exports = {
    requestTransfer,
    finalizeTransfer,
    getPendingTransfers
};
