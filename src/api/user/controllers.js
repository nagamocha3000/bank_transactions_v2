const DAL = require("./DAL");
const { userSchema } = require("./inputSchemas");
const { controller, makeValidator } = require("../utils");
const { hashPassword } = require("./utils");

const createNewUser = controller(
    makeValidator(userSchema).then(user => {
        user.password = hashPassword(user.password);
        return user;
    }),
    DAL.createNewUser
);

module.exports = { createNewUser };
