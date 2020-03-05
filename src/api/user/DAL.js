const db = require("../../lib/db");
const { ClientError } = require("../utils");

const createNewUser = async ({ firstname, lastname, password, email }) => {
    try {
        const values = [email, firstname, lastname, password];
        const res = await db.query(
            "insert into users(email, firstname, lastname, password) values ($1, $2, $3, $4) returning user_id",
            values
        );
        return { userID: res.rows[0].user_id };
    } catch (err) {
        if (err.code === "23505")
            throw new ClientError(`emailAlreadyExists: ${email}`);
        else throw err;
    }
};

module.exports = {
    createNewUser
};
