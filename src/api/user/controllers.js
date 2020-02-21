const DAL = require("./DAL");
const { userSchema } = require("./inputSchemas");
const { controller, makeValidator } = require("../utils");
const { hashPassword } = require("./utils");

const createNewUser = controller(
    (validate => async _user => {
        let user = await validate(_user);
        user.password = hashPassword(user.password);
        return user;
    })(makeValidator(userSchema)),
    DAL.createNewUser
);

module.exports = { createNewUser };
