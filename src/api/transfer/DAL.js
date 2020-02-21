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

const cancelTransfer = ({ transferID }) =>
    makeSerializableTx(async tx => {
        const res = await tx.query("select cancel_transfer($1)", [transferID]);
        return { cancelled: res.rows[0].cancel_transfer };
    });

const confirmTransfer = ({ transferID }) =>
    makeSerializableTx(async tx => {
        const res = await tx.query("select confirm_transfer($1)", [transferID]);
        return { confirmed: res.rows[0].confirm_transfer };
    });

module.exports = {
    requestTransfer,
    cancelTransfer,
    confirmTransfer
};
