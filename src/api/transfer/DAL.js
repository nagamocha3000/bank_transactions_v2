const db = require("../../lib/db");

const requestTransfer = async ({ from, to, amount }) => {
    const res = await db.query(
        "select request_transfer($1, $2, $3) as transfer_id",
        [from, to, amount]
    );
    const transferID = res.rows[0].transfer_id;
    return { transferID };
};

module.exports = {
    requestTransfer
};
