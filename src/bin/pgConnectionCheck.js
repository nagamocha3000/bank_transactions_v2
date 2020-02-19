require("dotenv").config();
const { exec } = require("child_process");

const pg_isready_error_message = {
    1: "server rejecting connections",
    2: "no response to the connection attempt",
    3: "unable to make attempt"
};

const pingPG = ({ host, port }) =>
    new Promise((resolve, reject) => {
        const cmd = `pg_isready -h ${host} -p ${port} -t 0`;
        exec(cmd, err => {
            if (err) {
                const pgErr = new Error(
                    pg_isready_error_message[err.code] || "pg_isready error"
                );
                pgErr.code = err.code;
                reject(pgErr);
            } else resolve({ code: 0 });
        });
    });

const main = async () => {
    try {
        const host = process.env.PGHOST;
        const port = process.env.PGPORT;
        const res = await pingPG({ host, port });
        console.log(res);
    } catch (err) {
        console.log(err);
    }
};
main().catch(err => console.error(err));
